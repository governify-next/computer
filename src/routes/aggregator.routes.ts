import { Router } from 'express';
import * as aggregatorController from '../controllers/aggregator.controller.js';
import {
    validateAggregatorType,
    validateAggregatorValidation,
} from '../middlewares/aggregator.validator.js';

export const aggregatorRoutes = Router();

aggregatorRoutes.get('/aggregators', aggregatorController.getAggregators);
aggregatorRoutes.get(
    '/aggregators/:aggregatorType',
    validateAggregatorType,
    aggregatorController.getAggregatorById,
);
aggregatorRoutes.post(
    '/aggregators/:aggregatorType/validate',
    validateAggregatorValidation,
    aggregatorController.validateAggregator,
);
