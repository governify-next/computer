import { Router } from 'express';
import * as aggregatorController from '../controllers/aggregator.controller.js';
import {
    validateAggregatorType,
    validateAggregatorValidation,
} from '../middlewares/aggregator.validator.js';
import { anyOf } from '../middlewares/anyof.validator.js';
import { SystemRole } from '../types/systemRole.js';
import {
    hasSystemRole,
    checkUserAuthentication,
    checkServiceAuthentication,
    isService,
} from '../middlewares/authenticator.validator.js';

export const aggregatorRoutes = Router();

aggregatorRoutes.get(
    '/aggregators',
    checkUserAuthentication,
    hasSystemRole(SystemRole.ADMIN),
    aggregatorController.getAggregators,
);
aggregatorRoutes.get(
    '/aggregators/:aggregatorType',
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    validateAggregatorType,
    aggregatorController.getAggregatorById,
);
aggregatorRoutes.post(
    '/aggregators/:aggregatorType/validate',
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    anyOf(hasSystemRole(SystemRole.SUPERADMIN), isService),
    validateAggregatorValidation,
    aggregatorController.validateAggregator,
);
