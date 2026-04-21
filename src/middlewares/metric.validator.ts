import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { ValidationError } from '../utils/customErrors.js';
import * as eventService from '../services/events/event.service.js';

// ─── Express-validator ─────────────────────────────

const collectValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationError('Validation failed', errors.array()));
    next();
};

const eventsValidation = [
    body('events')
        .exists({ checkNull: true })
        .withMessage('events is required')
        .isObject()
        .withMessage('events must be an object'),
    body('events.type')
        .exists({ checkNull: true })
        .withMessage('events.type is required')
        .isString()
        .withMessage('events.type must be a string')
        .custom((eventType) => {
            const event = eventService.getEventById(eventType as string);
            if (!event) {
                throw new Error(`Event ${eventType as string} not found`);
            }
            return true;
        }),
    body('events.fetcherConfigs')
        .exists({ checkNull: true })
        .withMessage('events.fetcherConfigs is required')
        .isArray({ min: 1 })
        .withMessage('events.fetcherConfigs must be an array with at least one entry'),
    body('events.fetcherConfigs.*.id')
        .exists({ checkNull: true })
        .withMessage('events.fetcherConfigs.*.id is required')
        .isString()
        .withMessage('events.fetcherConfigs.*.id must be a string'),
    body('events.fetcherConfigs.*.config')
        .exists({ checkNull: true })
        .withMessage('events.fetcherConfigs.*.config is required')
        .isObject()
        .withMessage('events.fetcherConfigs.*.config must be an object'),
    body('events.processConfig')
        .exists({ checkNull: true })
        .withMessage('events.processConfig is required')
        .isObject()
        .withMessage('events.processConfig must be an object'),
];

const aggregationValidation = [
    body('aggregation')
        .exists({ checkNull: true })
        .withMessage('aggregation is required')
        .isObject()
        .withMessage('aggregation must be an object'),
    body('aggregation.type')
        .exists({ checkNull: true })
        .withMessage('aggregation.type is required')
        .isIn(['count'])
        .withMessage('aggregation.type must be one of: count'),
];

export const validateComputeMetricValidation = [
    ...eventsValidation,
    ...aggregationValidation,
    collectValidationErrors,
];
