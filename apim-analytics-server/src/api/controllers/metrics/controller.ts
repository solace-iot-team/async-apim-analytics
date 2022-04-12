import { NextFunction, Request, Response } from 'express';
import { Logger as L } from '../../../common/logger';
import MetricsService from '../../services/metrics/service';

class MetricsController {

  all(_req: Request, res: Response, next: NextFunction): void {

    MetricsService.all().then((metrics: string) => {
      res.contentType('text/plain').end(metrics);
    }).catch((error: any) => {
      L.error('MetricsController.all', error);
      next(error);
    });
  }
}

export default new MetricsController();
