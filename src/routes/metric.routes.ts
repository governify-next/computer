import { Router } from 'express';
import * as metricController from '../controllers/metric.controller.js';
import {
    validateComputeMetricValidation,
    validateEventId,
    validateProvidedFetcherConfigs,
    validateFetcherConfigs,
    validateProcessConfig,
} from '../middlewares/metric.validator.js';

export const metricRoutes = Router();

metricRoutes.post(
    '/metric/compute',
    validateComputeMetricValidation,
    validateEventId,
    validateProvidedFetcherConfigs,
    validateFetcherConfigs,
    validateProcessConfig,
    metricController.computeMetric,
);
