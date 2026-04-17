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
    body('aggregation.operation')
        .exists({ checkNull: true })
        .withMessage('aggregation.operation is required')
        .isIn(['count'])
        .withMessage('aggregation.operation must be one of: count'),
];

export const validateProcessMetricValidation = [
    dateValidation,
    ...windowValidation,
    ...eventsValidation,
    ...aggregationValidation,
    collectValidationErrors,
];
