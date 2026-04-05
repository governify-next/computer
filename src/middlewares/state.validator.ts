import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import * as stateService from '../services/state.service.js';

// ─── Express-validator ─────────────────────────────

const collectValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new ValidationError('Validation failed', errors.array()));
    }
    next();
};

// ─── Custom validators ─────────────────────────────

export const validateStateId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const state = await stateService.getStateById(id);
        if (!state) {
            return next(new NotFoundError(`State ${id} not found`));
        }
        next();
    } catch (err) {
        next(err);
    }
};

export const validateSignatureId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { signatureId } = req.params;
        const states = await stateService.getStatesBySignatureId(signatureId);
        if (!states || states.length === 0) {
            return next(new NotFoundError(`States for signature ${signatureId} not found`));
        }
        next();
    } catch (err) {
        next(err);
    }
};

const buildGuaranteeValidation = (prefix = '') => {
    const p = (field: string) => (prefix ? `${prefix}.${field}` : field);
    return [
        body(p('guarantee.name'))
            .exists({ checkNull: true })
            .withMessage('guarantee.name is required')
            .isString()
            .withMessage('guarantee.name must be a string'),
        body(p('guarantee.numericExpression'))
            .exists({ checkNull: true })
            .withMessage('guarantee.numericExpression is required')
            .isString()
            .withMessage('guarantee.numericExpression must be a string'),
        body(p('guarantee.comparator'))
            .exists({ checkNull: true })
            .withMessage('guarantee.comparator is required')
            .isString()
            .withMessage('guarantee.comparator must be a string'),
        body(p('guarantee.threshold'))
            .exists({ checkNull: true })
            .withMessage('guarantee.threshold is required')
            .isNumeric()
            .withMessage('guarantee.threshold must be a number'),
        body(p('guarantee.window'))
            .exists({ checkNull: true })
            .withMessage('window is required')
            .isObject()
            .withMessage('window must be an object'),
        body(p('guarantee.window.anchorDate'))
            .exists({ checkNull: true })
            .withMessage('window.anchorDate is required')
            .isISO8601()
            .withMessage('window.anchorDate must be a valid ISO 8601 date string')
            .isAfter('2000-01-01T00:00:00.000Z')
            .isBefore('2100-01-01T00:00:00.000Z')
            .withMessage('window.anchorDate must be between 2000-01-01 and 2100-01-01'),
        body(p('guarantee.window.period'))
            .exists({ checkNull: true })
            .withMessage('window.period is required')
            .isArray({ min: 1 })
            .withMessage('window.period must be an array with at least one entry'),
        body(p('guarantee.window.period.*'))
            .exists({ checkNull: true })
            .withMessage('window.period.* is required')
            .isObject()
            .withMessage('window.period.* must be an object'),
        body(p('guarantee.window.period.*.unit'))
            .exists({ checkNull: true })
            .withMessage('window.period.*.unit is required')
            .isIn(['millisecond', 'second', 'minute', 'hour', 'day', 'week'])
            .withMessage(
                'Period unit must be one of: millisecond, second, minute, hour, day, week',
            ),
        body(p('guarantee.window.period.*.value'))
            .exists({ checkNull: true })
            .withMessage('window.period.*.value is required')
            .isInt({ min: 1 })
            .withMessage('window.period.*.value must be a positive integer'),
        body(p('guarantee.metricConfigs'))
            .exists({ checkNull: true })
            .withMessage('guarantee.metricConfigs is required')
            .isArray({ min: 1 })
            .withMessage('guarantee.metricConfigs must be an array with at least one entry'),
        body(p('guarantee.metricConfigs.*'))
            .exists({ checkNull: true })
            .withMessage('guarantee.metricConfigs.* is required')
            .isObject()
            .withMessage('guarantee.metricConfigs.* must be an object'),
        body(p('guarantee.metricConfigs.*.name'))
            .exists({ checkNull: true })
            .withMessage('guarantee.metricConfigs.*.name is required')
            .isString()
            .withMessage('guarantee.metricConfigs.*.name must be a string'),
        body(p('guarantee.metricConfigs.*.metricConfig'))
            .exists({ checkNull: true })
            .withMessage('guarantee.metricConfigs.*.metricConfig is required')
            .isObject()
            .withMessage('guarantee.metricConfigs.*.metricConfig must be an object'),
    ];
};

export const validateSearchStates = [
    body('filters').optional().isObject().withMessage('filters must be an object'),
    body('pagination').optional().isObject().withMessage('pagination must be an object'),
    body('pagination.limit')
        .optional()
        .isInt({ gt: 0 })
        .withMessage('pagination.limit must be a positive integer'),
    body('pagination.skip')
        .optional()
        .isInt({ min: 0 })
        .withMessage('pagination.skip must be a non-negative integer'),
    body('sort').optional().isObject().withMessage('sort must be an object'),
    collectValidationErrors,
];

export const validateStateGeneration = [
    body('stateDate')
        .exists({ checkNull: true })
        .withMessage('stateDate is required')
        .isISO8601()
        .withMessage('stateDate must be a valid ISO 8601 date'),
    body('signatureId')
        .exists({ checkNull: true })
        .withMessage('signatureId is required')
        .isString()
        .withMessage('signatureId must be a string'),
    body('auditConfig')
        .exists({ checkNull: true })
        .withMessage('auditConfig is required')
        .isObject()
        .withMessage('auditConfig must be an object'),
    body('guarantee')
        .exists({ checkNull: true })
        .withMessage('guarantee is required')
        .isObject()
        .withMessage('guarantee must be an object'),
    ...buildGuaranteeValidation(),
    collectValidationErrors,
];

export const validateStatesGeneration = [
    body('stateDate')
        .exists({ checkNull: true })
        .withMessage('stateDate is required')
        .isISO8601()
        .withMessage('stateDate must be a valid ISO 8601 date string'),
    body('signatures')
        .exists({ checkNull: true })
        .withMessage('signatures is required')
        .isArray({ min: 1 })
        .withMessage('signatures must be an array with at least one entry'),
    body('signatures.*')
        .exists({ checkNull: true })
        .withMessage('signatures.* is required')
        .isObject()
        .withMessage('signatures.* must be an object'),
    body('signatures.*.signatureId')
        .exists({ checkNull: true })
        .withMessage('signatures.*.signatureId is required')
        .isString()
        .withMessage('signatures.*.signatureId must be a string'),
    body('signatures.*.auditConfig')
        .exists({ checkNull: true })
        .withMessage('signatures.*.auditConfig is required')
        .isObject()
        .withMessage('signatures.*.auditConfig must be an object'),
    body('signatures.*.guarantee')
        .exists({ checkNull: true })
        .withMessage('signatures.*.guarantee is required')
        .isObject()
        .withMessage('signatures.*.guarantee must be an object'),
    ...buildGuaranteeValidation('signatures.*'),
    collectValidationErrors,
];
