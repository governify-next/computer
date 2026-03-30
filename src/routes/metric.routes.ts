import { Router } from 'express';
import * as metricController from '../controllers/metric.controller.js';

export const metricRoutes = Router();

metricRoutes.post('/metrics/:metricName/process', metricController.processMetric);
