import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import {
    validateEventId,
    validateProcessEventBody,
    validateProvidedFetcherConfigs,
    validateFetcherConfigs,
    validateProcessConfig,
    validateEventValidation,
} from '../middlewares/event.validator.js';
import { validateCollectorHealth } from '../middlewares/collector.validator.js';

export const eventRoutes = Router();

eventRoutes.get('/events', eventController.getEvents);
eventRoutes.get('/events/:eventId', validateEventId, eventController.getEventById);
eventRoutes.post(
    '/events/:eventId/process',
    validateCollectorHealth,
    validateEventId,
    validateProcessEventBody,
    validateProvidedFetcherConfigs,
    validateFetcherConfigs,
    validateProcessConfig,
    eventController.processEvent,
);
eventRoutes.post(
    '/events/:eventId/validate',
    validateCollectorHealth,
    validateEventValidation,
    eventController.validateEvent,
);
