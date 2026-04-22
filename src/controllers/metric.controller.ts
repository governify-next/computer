import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as metricService from '../services/metric.service.js';

export const computeMetric = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { event, aggregation } = req.body;

        const result = await metricService.computeMetric(
            event.eventId,
            event.date,
            event.window,
            event.fetcherConfigs,
            event.processConfig,
            aggregation,
        );
        return sendSuccess(res, { data: result, message: 'Metric computed' });
    } catch (err) {
        next(err);
    }
};
