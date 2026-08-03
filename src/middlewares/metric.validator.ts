import { body, validationResult } from 'express-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { NotFoundError, ValidationError } from '../utils/customErrors.js';
import { ZodError } from 'zod';
import * as eventService from '../services/events/event.service.js';
import * as aggregatorService from '../services/aggregators/aggregator.service.js';
import * as fetcherIntegration from '../integrations/fetcher.integration.js';

// ─── Express-validator ─────────────────────────────
const collectValidationErrors = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return next(new ValidationError('Validation failed', errors.array()));
    next();
};

const eventValidation = [
    body('event')
        .exists({ checkNull: true })
        .withMessage('event is required')
        .isObject()
        .withMessage('event must be an object'),
    body('event.eventId')
        .exists({ checkNull: true })
        .withMessage('event.eventId is required')
        .isString()
        .withMessage('event.eventId must be a string'),
    body('event.date')
        .exists({ checkNull: true })
        .withMessage('date is required')
        .isISO8601()
        .withMessage('date must be a valid ISO 8601 date string'),
    body('event.window')
        .exists({ checkNull: true })
        .withMessage('window is required')
        .isObject()
        .withMessage('window must be an object'),
    body('event.window.anchorDate')
        .exists({ checkNull: true })
        .withMessage('window.anchorDate is required')
        .isISO8601()
        .withMessage('window.anchorDate must be a valid ISO 8601 date string')
        .isAfter('2000-01-01T00:00:00.000Z')
        .isBefore('2100-01-01T00:00:00.000Z')
        .withMessage('window.anchorDate must be between 2000-01-01 and 2100-01-01'),
    body('event.window.period')
        .exists({ checkNull: true })
        .withMessage('window.period is required')
        .isArray({ min: 1 })
        .withMessage('window.period must be an array with at least one entry'),
    body('event.window.period.*.unit')
        .exists({ checkNull: true })
        .withMessage('window.period.*.unit is required')
        .isIn(['millisecond', 'second', 'minute', 'hour', 'day', 'week'])
        .withMessage('Period unit must be one of: millisecond, second, minute, hour, day, week'),
    body('event.window.period.*.value')
        .exists({ checkNull: true })
        .withMessage('window.period.*.value is required')
        .isInt({ min: 1 })
        .withMessage('Period value must be a positive integer strictly greater than 0'),
    body('event.fetcherConfigs')
        .exists({ checkNull: true })
        .withMessage('event.fetcherConfigs is required')
        .isArray({ min: 1 })
        .withMessage('event.fetcherConfigs must be an array with at least one entry'),
    body('event.fetcherConfigs.*.fetcherId')
        .exists({ checkNull: true })
        .withMessage('event.fetcherConfigs.*.fetcherId is required')
        .isString()
        .withMessage('event.fetcherConfigs.*.fetcherId must be a string'),
    body('event.fetcherConfigs.*.fetcherConfig')
        .exists({ checkNull: true })
        .withMessage('event.fetcherConfigs.*.fetcherConfig is required')
        .isObject()
        .withMessage('event.fetcherConfigs.*.fetcherConfig must be an object'),
    body('event.processConfig')
        .exists({ checkNull: true })
        .withMessage('event.processConfig is required')
        .isObject()
        .withMessage('event.processConfig must be an object'),
];

const aggregationValidation = [
    body('aggregation')
        .exists({ checkNull: true })
        .withMessage('aggregation is required')
        .isObject()
        .withMessage('aggregation must be an object'),
    body('aggregation.aggregatorType')
        .exists({ checkNull: true })
        .withMessage('aggregation.aggregatorType is required')
        .isString()
        .withMessage('aggregation.aggregatorType must be a string'),
    body('aggregation.aggregatorConfig')
        .exists({ checkNull: true })
        .isObject()
        .withMessage('aggregation.aggregatorConfig must be an object'),
];

export const validateEventId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { eventId } = req.body.event;
        const event = eventService.getEventById(eventId);
        if (!event) {
            return next(new NotFoundError(`Event ${eventId} not found`));
        }
        next();
    } catch (err) {
        next(err);
    }
};

export const validateProvidedFetcherConfigs = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { eventId, fetcherConfigs } = req.body.event;
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
        // Validation logic for fetcherConfigs against fetcher API validation endpoint
        const { fetcherConfigs } = req.body.event;
        const issues: Record<string, unknown>[] = [];
        for (const fetcherConfig of fetcherConfigs) {
            const data = await fetcherIntegration.validateFetcher(
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
        const { eventId, processConfig } = req.body.event;
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

export const validateAggregatorType = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { aggregatorType } = req.body.aggregation;
        const aggregator = aggregatorService.getAggregatorByType(aggregatorType);
        if (!aggregator) {
            return next(new NotFoundError(`Aggregator ${aggregatorType} not found`));
        }
        next();
    } catch (err) {
        next(err);
    }
};

export const validateAggregatorConfig = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { aggregatorType, aggregatorConfig } = req.body.aggregation;
        const aggregator = aggregatorService.getAggregatorByType(aggregatorType);
        try {
            aggregator.aggregatorConfigSchema.parse(aggregatorConfig);
        } catch (error) {
            if (error instanceof ZodError) {
                return next(
                    new ValidationError('Invalid aggregatorConfig', { issues: error.issues }),
                );
            } else {
                throw error;
            }
        }
        next();
    } catch (err) {
        next(err);
    }
};

export const validateComputeMetricValidation = [
    ...eventValidation,
    ...aggregationValidation,
    collectValidationErrors,
];
