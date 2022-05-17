import path, { resolve } from 'path';
import http from 'http';
import net from 'net';
import { URL } from 'url';
import express, { NextFunction, Request, Response } from 'express';
import { createTerminus } from '@godaddy/terminus';
import * as OpenApiValidator from 'express-openapi-validator';
import audit from 'express-requests-logger';
import { Constants } from './common/constants';
import config from './common/config';
import { Logger as L } from './common/logger';
import passport from './api/middleware/authentication';
import errorHandler from './api/middleware/error-handler';
import organizationsRouter from './api/controllers/organizations/router';
import metricsRouter from './api/controllers/metrics/router';
import { MongoDatabase } from './utils/database';

const app = express();

// HELPER

/** Check if the server database is available */
const checkDatabase = async (): Promise<boolean> => {

  let isAvailable = false;
  try {
    const database = await MongoDatabase.createInstance(Constants.SERVER_DATABASE_NAME);
    await database.stats();
    isAvailable = true;
  } catch (error: any) {
    L.error('Server.checkDatabase', error.message);
  }
  return isAvailable;
}

/** Check if the API Management Connector can be reached */
const checkApiManagementConnector = async (): Promise<boolean> => {

  const q = new URL(config.connectorServer.baseUrl);
  const hostname = q.hostname;
  const port = q.port ? parseInt(q.port) : (q.protocol === 'https' ? 443 : 80);

  return new Promise(resolve => {
    const client = new net.Socket();
    client.connect({ host: hostname, port: port }, () => { resolve(true); });
    client.on('error', () => { resolve(false); });
  });
}

// configure MIDDLEWARE and define ROUTES

/** Middleware to authenticate a request if a security is enabled. */
const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  if (config.serverUser) {
    passport.authenticate('basic', { session: false })(req, res, next);
  } else {
    next();
  }
}

const root = path.normalize(__dirname + '/..');
const requestSizeLimit = process.env.REQUEST_LIMIT || '100kb';

app.use(express.json({ limit: requestSizeLimit }));
app.use(express.text({ limit: requestSizeLimit }));
app.use(express.urlencoded({ extended: true, limit: requestSizeLimit }));

app.use(express.static(`${root}/public`));

const apiSpec = path.join(__dirname + '/common/api.yml');
app.use('/v1/spec', express.static(apiSpec));

app.use(
  OpenApiValidator.middleware({
    apiSpec,
    validateRequests: true,
    validateResponses: true,
    ignorePaths: /.*\/spec(\/|$)/,
  })
);
app.use(audit({
  logger: class {
    // The type definition for the audit options is not correct and mapping statusCodes
    // to log levels doesn't work. As a workaround, map everything to debug level.
    static info = (data: any, message: string): void => { L.debug('Audit', message, data); }
  },
  excludeURLs: ['/v1/metrics'],
}));

const router = express.Router();

router.use('/organizations', authenticate, organizationsRouter);
router.use('/metrics', authenticate, metricsRouter);

app.use('/v1', router);

app.use(errorHandler);

// create SERVER

const server = http.createServer(app);

const onShutdown = async (): Promise<any> => {
  L.info('Server', 'Server is shutting down');
}

const onHealthCheck = async (): Promise<any> => {

  let isDatabaseAvailable = false, isConnectorAvailable = false;

  await Promise.all([
    checkDatabase().then(value => isDatabaseAvailable = value),
    checkApiManagementConnector().then(value => isConnectorAvailable = value),
  ]).catch(error => L.error('Server.onHealthCheck', error.message));

  if (isDatabaseAvailable && isConnectorAvailable) {
    return Promise.resolve();
  } else {
    return Promise.reject({});
  }
}

createTerminus(server, {
  healthChecks: {
    '/health': onHealthCheck,
    verbatim: false,
  },
  onShutdown: onShutdown,
});

// start SERVER

const port = config.serverPort;
server.listen(port, () => {
  L.info('Server', `Server started to listen on port ${port}`, config.asLogData());
});

export default server;
