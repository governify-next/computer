import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as metricService from '../services/metric.service.js';

export const processMetric = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { date, window, event, aggregation } = req.body;

        const result = await metricService.processMetric(
            date,
            window,
            event.eventId,
            event.fetcherConfigs,
            event.processConfig,
            aggregation,
        );
        return sendSuccess(res, { data: result, message: 'Metric processed' });
    } catch (err) {
        next(err);
    }
};
