import { Router } from 'express';
import * as metricController from '../controllers/metric.controller.js';
import { validateComputeMetricValidation } from '../middlewares/metric.validator.js';

export const metricRoutes = Router();

metricRoutes.post('/metric/compute', metricController.computeMetric);
