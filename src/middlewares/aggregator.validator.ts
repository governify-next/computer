import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import * as aggregatorService from '../services/aggregators/aggregator.service.js';

// ─── Express-validator ─────────────────────────────
const collectValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationError('Validation failed', errors.array()));
    next();
};

export const validateAggregatorType = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { aggregatorType } = req.params;
        const aggregator = aggregatorService.getAggregatorByType(aggregatorType);
        if (!aggregator) {
            return next(new NotFoundError(`Aggregator ${aggregatorType} not found`));
        }
        next();
    } catch (err) {
        next(err);
    }
};

const aggregatorConfigOptionalValidation = body('aggregatorConfig')
    .optional()
    .isObject()
    .withMessage('aggregatorConfig must be an object');

export const validateAggregatorValidation = [
    aggregatorConfigOptionalValidation,
    collectValidationErrors,
];
