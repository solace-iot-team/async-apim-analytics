import { NextFunction, Request, Response } from 'express';
import MetricsService from '../../services/metrics/service';

class Controller {

  all(_req: Request, res: Response, next: NextFunction): void {

    MetricsService.all().then((metrics: string) => {
      res.contentType('text/plain').end(metrics);
    }).catch((error: any) => {
      next(error);
    });
  }
}

export default new Controller();
