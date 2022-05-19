import { NextFunction, Request, Response } from 'express';
import { BadRequest, UnsupportedMediaType } from 'express-openapi-validator/dist/framework/types';

export class ServerError extends Error {
  status: number;
  details?: any;
  constructor(status: number, message: string, details?: any) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export default function errorHandler(error: any, req: Request, res: Response, _next: NextFunction) {

  if (error instanceof UnsupportedMediaType) {
    const contentType = req.headers['content-type'];
    res.status(415).json({ message: `The media type '${contentType}' is not supported` });
  } else if (error instanceof BadRequest) {
    res.status(400).json({ message: 'The request is invalid', details: error.errors });
  } else if (error instanceof ServerError) {
    res.status(error.status).json({ message: error.message, details: error.details });
  } else {
    res.status(error.status || 500).json({ message: error.message });
  }
}
