import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as eventService from '../services/events/event.service.js';

export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const events = await eventService.getEvents();
        return sendSuccess(res, { data: events, message: 'Events retrieved' });
    } catch (err) {
        next(err);
    }
};

export const getEventById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { eventId } = req.params;
        const event = await eventService.getEventById(eventId);
        return sendSuccess(res, { data: event, message: 'Event retrieved' });
    } catch (err) {
        next(err);
    }
};

export const validateEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { eventId } = req.params;
        const { fetcherConfigs, processConfig } = req.body;

        const result = await eventService.validateEvent(eventId, fetcherConfigs, processConfig);
        if (!result.valid) {
            return sendSuccess(res, {
                data: result,
                message: 'Event validation failed',
                httpStatus: 400,
                appCode: 'VALIDATION_ERROR',
            });
        }
        return sendSuccess(res, { data: result, message: 'Event validated' });
    } catch (err) {
        next(err);
    }
};
