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

const metricConfigOptionalValidation = body('metricConfig')
    .optional()
    .isObject()
    .withMessage('metricConfig must be an object');

const metricConfigRequiredValidation = body('metricConfig')
    .exists({ checkNull: true })
    .withMessage('metricConfig is required')
    .isObject()
    .withMessage('metricConfig must be an object');

const auditConfigOptionalValidation = body('auditConfig')
    .optional()
    .isObject()
    .withMessage('auditConfig must be an object');

const auditConfigRequiredValidation = body('auditConfig')
    .exists({ checkNull: true })
    .withMessage('auditConfig is required')
    .isObject()
    .withMessage('auditConfig must be an object');

const dateValidation = body('date')
    .exists({ checkNull: true })
    .withMessage('date is required')
    .isISO8601()
    .withMessage('date must be a valid ISO 8601 date string');

const windowValidation = [
    body('window')
        .exists({ checkNull: true })
        .withMessage('window is required')
        .isObject()
        .withMessage('window must be an object'),
    body('window.anchorDate')
        .exists({ checkNull: true })
        .withMessage('window.anchorDate is required')
        .isISO8601()
        .withMessage('window.anchorDate must be a valid ISO 8601 date string')
        .isAfter('2000-01-01T00:00:00.000Z')
        .isBefore('2100-01-01T00:00:00.000Z')
        .withMessage('window.anchorDate must be between 2000-01-01 and 2100-01-01'),
    body('window.period')
        .exists({ checkNull: true })
        .withMessage('window.period is required')
        .isArray({ min: 1 })
        .withMessage('window.period must be an array with at least one entry'),
    body('window.period.*.unit')
        .exists({ checkNull: true })
        .withMessage('window.period.*.unit is required')
        .isIn(['millisecond', 'second', 'minute', 'hour', 'day', 'week'])
        .withMessage('Period unit must be one of: millisecond, second, minute, hour, day, week'),
    body('window.period.*.value')
        .exists({ checkNull: true })
        .withMessage('window.period.*.value is required')
        .isInt({ min: 1 })
        .withMessage('Period value must be a positive integer strictly greater than 0'),
];

export const validateMetricValidation = [
    metricConfigOptionalValidation,
    auditConfigOptionalValidation,
    collectValidationErrors,
];

export const validateProcessMetricValidation = [
    metricConfigRequiredValidation,
    auditConfigRequiredValidation,
    dateValidation,
    ...windowValidation,
    collectValidationErrors,
];
