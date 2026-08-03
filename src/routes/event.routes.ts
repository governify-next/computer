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
import { validateFetcherHealth } from '../middlewares/fetcher.validator.js';
import { anyOf } from '../middlewares/anyof.validator.js';
import { SystemRole } from '../types/systemRole.js';
import {
    hasSystemRole,
    checkUserAuthentication,
    checkServiceAuthentication,
    isService,
} from '../middlewares/authenticator.validator.js';

export const eventRoutes = Router();

eventRoutes.get(
    '/events',
    checkUserAuthentication,
    hasSystemRole(SystemRole.ADMIN),
    eventController.getEvents,
);
eventRoutes.get(
    '/events/:eventId',
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    validateEventId,
    eventController.getEventById,
);
eventRoutes.post(
    '/events/:eventId/process',
    checkUserAuthentication,
    hasSystemRole(SystemRole.SUPERADMIN),
    validateFetcherHealth,
    validateEventId,
    validateProcessEventBody,
    validateProvidedFetcherConfigs,
    validateFetcherConfigs,
    validateProcessConfig,
    eventController.processEvent,
);
eventRoutes.post(
    '/events/:eventId/validate',
    anyOf(checkUserAuthentication, checkServiceAuthentication),
    anyOf(hasSystemRole(SystemRole.SUPERADMIN), isService),
    validateFetcherHealth,
    validateEventValidation,
    eventController.validateEvent,
);
