import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import * as eventService from '../services/events/event.service.js';

// ─── Express-validator ─────────────────────────────

const collectValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationError('Validation failed', errors.array()));
    next();
};

export const validateEventId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { eventId } = req.params;
        const event = eventService.getEventById(eventId);
        if (!event) {
            return next(new NotFoundError(`Event ${eventId} not found`));
        }
        next();
    } catch (err) {
        next(err);
    }
};

const fetcherConfigsOptionalValidation = [
    body('fetcherConfigs')
        .optional()
        .isArray()
        .withMessage('events.fetcherConfigs must be an array'),
    body('fetcherConfigs.*.id')
        .exists({ checkNull: true })
        .withMessage('events.fetcherConfigs.*.id is required')
        .isString()
        .withMessage('events.fetcherConfigs.*.id must be a string'),
    body('fetcherConfigs.*.config')
        .exists({ checkNull: true })
        .withMessage('events.fetcherConfigs.*.config is required')
        .isObject()
        .withMessage('events.fetcherConfigs.*.config must be an object'),
];

const processConfigOptionalValidation = body('processConfig')
    .optional()
    .isObject()
    .withMessage('processConfig must be an object');

export const validateEventValidation = [
    ...fetcherConfigsOptionalValidation,
    processConfigOptionalValidation,
    collectValidationErrors,
];
