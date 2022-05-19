import { NextFunction, Request, Response } from 'express';
import OrganizationService from '../../services/organizations/service';

class Controller {

  all(_req: Request, res: Response, next: NextFunction): void {
    OrganizationService.all().then((organizations) => {
      res.status(200).json(organizations);
    }).catch((error: any) => { next(error); });
  }

  byName(req: Request, res: Response, next: NextFunction): void {
    const name = req.params['name'];
    OrganizationService.byName(name).then((organization) => {
      if (organization) {
        res.status(200).json(organization);
      } else {
        res.status(404).json({ message: 'The organization does not exist' });
      }
    }).catch((error: any) => { next(error); });
  }

  create(req: Request, res: Response, next: NextFunction): void {
    const data = req.body;
    OrganizationService.create(data).then((organization) => {
      res.status(201).json(organization);
    }).catch((error: any) => { next(error); });
  }

  update(req: Request, res: Response, next: NextFunction): void {
    const name = req.params['name'];
    const data = req.body;
    OrganizationService.update(name, data).then((organization) => {
      res.status(200).json(organization);
    }).catch((error: any) => { next(error); });
  }

  delete(req: Request, res: Response, next: NextFunction): void {
    const name = req.params['name'];
    OrganizationService.delete(name).then(() => {
      res.status(204).end();
    }).catch((error: any) => { next(error); });
  }
}

export default new Controller();
