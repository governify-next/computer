import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as metricService from '../services/metrics/metric.service.js';

export const processMetric = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { date, window, events, aggregation } = req.body;

        const result = await metricService.processMetric(
            date,
            window,
            events.type,
            events.fetcherConfigs,
            events.processConfig,
            aggregation,
        );
        return sendSuccess(res, { data: result, message: 'Metric processed' });
    } catch (err) {
        next(err);
    }
};

export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const metrics = await metricService.getEvents();
        return sendSuccess(res, { data: metrics, message: 'Metrics retrieved' });
    } catch (err) {
        next(err);
    }
};

export const getMetricByName = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { metricName } = req.params;
        const metric = await metricService.getEventById(metricName);
        return sendSuccess(res, { data: metric, message: 'Metric retrieved' });
    } catch (err) {
        next(err);
    }
};

export const validateMetric = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { metricName } = req.params;
        const { fetcherConfigs, processConfig } = req.body;

        const result = await metricService.validateEvent(metricName, fetcherConfigs, processConfig);
        if (!result.valid) {
            return sendSuccess(res, {
                data: result,
                message: 'Metric validation failed',
                httpStatus: 400,
                appCode: 'VALIDATION_ERROR',
            });
        }
        return sendSuccess(res, { data: result, message: 'Metric validated' });
    } catch (err) {
        next(err);
    }
};
