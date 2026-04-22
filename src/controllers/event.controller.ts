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

export const processEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { eventId } = req.params;
        const { date, window, fetcherConfigs, processConfig } = req.body;

        const result = await eventService.processEvent(
            eventId,
            date,
            window,
            fetcherConfigs,
            processConfig,
        );

        const expand = req.query.expand === 'true';
        if (expand) {
            return sendSuccess(res, { data: result, message: 'Event processed' });
        } else {
            const fetchs = result.fetchs.map((fetch) => {
                const { data, ...rest } = fetch;
                return rest;
            });
            return sendSuccess(res, {
                data: {
                    ...result,
                    fetchs,
                },
                message: 'Event processed',
            });
        }
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
            });
        }
        return sendSuccess(res, { data: result, message: 'Event validation passed' });
    } catch (err) {
        next(err);
    }
};
