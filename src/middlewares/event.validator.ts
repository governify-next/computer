import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { ZodError } from 'zod';
import * as eventService from '../services/events/event.service.js';
import * as collectorIntegration from '../integrations/collector.integration.js';

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

const fetcherConfigsValidation = [
    body('fetcherConfigs')
        .exists({ checkNull: true })
        .withMessage('fetcherConfigs is required')
        .isArray({ min: 1 })
        .withMessage('fetcherConfigs must be an array with at least one entry'),
    body('fetcherConfigs.*.fetcherId')
        .exists({ checkNull: true })
        .withMessage('fetcherConfigs.*.fetcherId is required')
        .isString()
        .withMessage('fetcherConfigs.*.fetcherId must be a string'),
    body('fetcherConfigs.*.fetcherConfig')
        .exists({ checkNull: true })
        .withMessage('fetcherConfigs.*.fetcherConfig is required')
        .isObject()
        .withMessage('fetcherConfigs.*.fetcherConfig must be an object'),
];

const processConfigValidation = body('processConfig')
    .exists({ checkNull: true })
    .withMessage('processConfig is required')
    .isObject()
    .withMessage('processConfig must be an object');

export const validateProvidedFetcherConfigs = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const eventId = req.params.eventId;
        const { fetcherConfigs } = req.body;
        const event = eventService.getEventById(eventId);
        for (const fetcherId of event.fetcherIds) {
            const fetcherConfig = fetcherConfigs.find(
                (fc: { fetcherId: string }) => fc.fetcherId === fetcherId,
            );
            if (!fetcherConfig) {
                return next(new ValidationError(`Fetcher config for ${fetcherId} is required`));
            }
        }
        next();
    } catch (err) {
        next(err);
    }
};

export const validateFetcherConfigs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validation logic for fetcherConfigs against collector API validation endpoint
        const { fetcherConfigs } = req.body;
        const issues: Record<string, unknown>[] = [];
        for (const fetcherConfig of fetcherConfigs) {
            const data = await collectorIntegration.validateFetcher(
                fetcherConfig.fetcherId,
                fetcherConfig.fetcherConfig,
            );
            if (!data.data.valid) {
                issues.push({
                    fetcherId: fetcherConfig.fetcherId,
                    error: data.data.error,
                    issues: data.data.issues ? data.data.issues : 'Fetcher not found',
                });
            }
        }
        if (issues.length > 0) {
            return next(
                new ValidationError(
                    `Validation failed for ${issues.length} fetcherConfigs`,
                    issues,
                ),
            );
        }
        next();
    } catch (err) {
        next(err);
    }
};

export const validateProcessConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const eventId = req.params.eventId;
        const { processConfig } = req.body;
        const event = eventService.getEventById(eventId);
        try {
            event.processConfigSchema.parse(processConfig);
        } catch (error) {
            if (error instanceof ZodError) {
                return next(new ValidationError('Invalid processConfig', { issues: error.issues }));
            } else {
                throw error;
            }
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
    body('fetcherConfigs.*.fetcherId')
        .exists({ checkNull: true })
        .withMessage('events.fetcherConfigs.*.fetcherId is required')
        .isString()
        .withMessage('events.fetcherConfigs.*.fetcherId must be a string'),
    body('fetcherConfigs.*.fetcherConfig')
        .exists({ checkNull: true })
        .withMessage('events.fetcherConfigs.*.fetcherConfig is required')
        .isObject()
        .withMessage('events.fetcherConfigs.*.fetcherConfig must be an object'),
];

const processConfigOptionalValidation = body('processConfig')
    .optional()
    .isObject()
    .withMessage('processConfig must be an object');

export const validateProcessEventBody = [
    dateValidation,
    ...windowValidation,
    ...fetcherConfigsValidation,
    processConfigValidation,
    collectValidationErrors,
];

export const validateEventValidation = [
    ...fetcherConfigsOptionalValidation,
    processConfigOptionalValidation,
    collectValidationErrors,
];
