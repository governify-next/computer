import { Router } from 'express';
import * as metricController from '../controllers/metric.controller.js';
import { validateProcessMetricValidation } from '../middlewares/metric.validator.js';

export const metricRoutes = Router();

metricRoutes.post(
    '/metrics/process',
    validateProcessMetricValidation,
    metricController.processMetric,
);
