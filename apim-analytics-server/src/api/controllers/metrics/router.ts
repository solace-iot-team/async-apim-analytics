import express from 'express';
import MetricsController from './controller';

export default express
  .Router()
  .get('/', MetricsController.all);
