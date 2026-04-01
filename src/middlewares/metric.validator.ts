import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { getMetricByName } from '../services/metrics/metric.service.js';

// ─── Express-validator ─────────────────────────────

const collectValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationError('Validation failed', errors.array()));
    next();
};

export const validateMetricName = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { metricName } = req.params;
        const metric = getMetricByName(metricName);
        if (!metric) {
            return next(new NotFoundError(`Metric ${metricName} not found`));
        }
        next();
    } catch (err) {
        next(err);
    }
};

const metricConfigValidation = body('metricConfig')
    .optional()
    .isObject()
    .withMessage('metricConfig must be an object');

const auditConfigValidation = body('auditConfig')
    .optional()
    .isObject()
    .withMessage('auditConfig must be an object');

export const validateMetricValidation = [
    metricConfigValidation,
    auditConfigValidation,
    collectValidationErrors,
];
