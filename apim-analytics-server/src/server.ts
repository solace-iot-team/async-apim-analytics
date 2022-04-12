
import express, { NextFunction, Request, Response } from 'express';
import audit from 'express-requests-logger';
import config from './common/config';
import { Logger as L } from './common/logger';
import passport from './api/middleware/authentication';
import metricsRouter from './api/controllers/metrics/router';

const app = express();

/** Middleware to authenticate a request if a security is enabled. */
const authenticate = function (req: Request, res: Response, next: NextFunction) {
  if (config.serverUser) {
    passport.authenticate('basic', { session: false })(req, res, next);
  } else {
    next();
  }
}

// define ROUTES

const router = express.Router();

//router.use('/about', aboutRouter);
router.use('/metrics', authenticate, metricsRouter);

app.use(audit({
  logger: class {
    // The type definition for the audit options is not correct and mapping statusCodes
    // to log levels doesn't work. As a workaround, map everything to debug level.
    static info = (data: any, message: string): void => { L.debug('Audit', message, data); }
  },
  excludeURLs: ['/v1/metrics'],
}));

app.use('/v1', router);

// start SERVER

const port = config.serverPort;
app.listen(port, () => {
  L.info('Server', `Server started to listen on port ${port}`, config.asLogData());
});
