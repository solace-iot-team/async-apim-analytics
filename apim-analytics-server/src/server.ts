
import path from 'path';
import http from 'http';
import net from 'net';
import { URL } from 'url';
import express, { NextFunction, Request, Response } from 'express';
import { createTerminus } from '@godaddy/terminus';
import audit from 'express-requests-logger';
import config from './common/config';
import { Logger as L } from './common/logger';
import passport from './api/middleware/authentication';
import metricsRouter from './api/controllers/metrics/router';

const app = express();

// HELPER

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

/** Check if the Solace PubSub+ Cloud can be reached */
const checkSolacePubSubCloud = async (): Promise<boolean> => {

  const q = new URL(config.pubSubCloudServer.baseUrl);
  const hostname = q.hostname;
  const port = q.port ? parseInt(q.port) : (q.protocol === 'https' ? 443 : 80);

  return new Promise(resolve => {
    const client = new net.Socket();
    client.connect({ host: hostname, port: port }, () => { resolve(true); });
    client.on('error', () => { resolve(false); });
  });
}

/** Middleware to authenticate a request if a security is enabled. */
const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  if (config.serverUser) {
    passport.authenticate('basic', { session: false })(req, res, next);
  } else {
    next();
  }
}

// define ROUTES

const root = path.normalize(__dirname + '/..');

app.use(express.static(`${root}/public`));
app.use(audit({
  logger: class {
    // The type definition for the audit options is not correct and mapping statusCodes
    // to log levels doesn't work. As a workaround, map everything to debug level.
    static info = (data: any, message: string): void => { L.debug('Audit', message, data); }
  },
  excludeURLs: ['/v1/metrics'],
}));

const router = express.Router();

router.use('/metrics', authenticate, metricsRouter);
app.use('/v1', router);

// create SERVER (with readiness/liveness checks)

const server = http.createServer(app);

const onShutdown = async (): Promise<any> => {
  L.info('Server', 'Server is shutting down');
}

const onHealthCheck = async (): Promise<any> => {

  let isConnectorAvailable = false, isPubSubCloudAvailable = false;

  await Promise.all([
    checkApiManagementConnector().then(value => isConnectorAvailable = value),
    checkSolacePubSubCloud().then(value => isPubSubCloudAvailable = value),
  ]).catch(error => console.log(error));

  const backends = {
    'apim-connector': isConnectorAvailable ? 'ok' : 'failed',
    'solace-pubsub-cloud': isPubSubCloudAvailable ? 'ok' : 'failed',
  }

  if (isConnectorAvailable && isPubSubCloudAvailable) {
    return Promise.resolve();
  } else {
    return Promise.reject({ backends: backends });
  }
}

createTerminus(server, {
  healthChecks: {
    '/health': onHealthCheck,
    verbatim: true,
  },
  onShutdown: onShutdown,
});

// start SERVER

const port = config.serverPort;
server.listen(port, () => {
  L.info('Server', `Server started to listen on port ${port}`, config.asLogData());
});

export default server;
