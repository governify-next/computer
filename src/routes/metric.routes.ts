import { Router } from 'express';
import * as metricController from '../controllers/metric.controller.js';
import {
    validateMetricName,
    validateMetricValidation,
    validateProcessMetricValidation,
} from '../middlewares/metric.validator.js';

export const metricRoutes = Router();

metricRoutes.get('/metrics', metricController.getMetrics);
metricRoutes.get('/metrics/:metricName', validateMetricName, metricController.getMetricByName);
metricRoutes.post('/metrics/process', metricController.processMetric);
metricRoutes.post(
    '/metrics/:metricName/validate',
    validateMetricValidation,
    metricController.validateMetric,
);
