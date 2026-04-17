import { Router } from 'express';
import * as eventController from '../controllers/event.controller.js';
import { validateEventId, validateEventValidation } from '../middlewares/event.validator.js';

export const eventRoutes = Router();

eventRoutes.get('/events', eventController.getEvents);
eventRoutes.get('/events/:eventId', validateEventId, eventController.getEventById);
eventRoutes.post(
    '/events/:eventId/validate',
    validateEventId,
    validateEventValidation,
    eventController.validateEvent,
);
