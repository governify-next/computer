import { Router } from 'express';
import * as metricController from '../controllers/metric.controller.js';
import {
    validateComputeMetricValidation,
    validateEventId,
    validateProvidedFetcherConfigs,
    validateFetcherConfigs,
    validateProcessConfig,
    validateAggregatorType,
    validateAggregatorConfig,
} from '../middlewares/metric.validator.js';
import { validateFetcherHealth } from '../middlewares/fetcher.validator.js';
import { anyOf } from '../middlewares/anyof.validator.js';
import { SystemRole } from '../types/systemRole.js';
import {
    hasSystemRole,
    checkUserAuthentication,
    checkServiceAuthentication,
    isService,
} from '../middlewares/authenticator.validator.js';

export const metricRoutes = Router();

metricRoutes.post(
    '/metric/compute',
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    anyOf(hasSystemRole(SystemRole.SUPERADMIN), isService),
    validateFetcherHealth,
    validateComputeMetricValidation,
    validateEventId,
    validateProvidedFetcherConfigs,
    validateFetcherConfigs,
    validateProcessConfig,
    validateAggregatorType,
    validateAggregatorConfig,
    metricController.computeMetric,
);
