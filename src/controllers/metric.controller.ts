import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as metricService from '../services/metrics/metric.service.js';

export const processMetric = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { metricName } = req.params;
        const { date, window, metricConfig, auditConfig } = req.body;

        const result = await metricService.processMetric(
            metricName,
            date,
            window,
            metricConfig,
            auditConfig,
        );
        return sendSuccess(res, { data: result, message: 'Metric processed' });
    } catch (err) {
        next(err);
    }
};

export const getMetrics = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const metrics = await metricService.getMetrics();
        return sendSuccess(res, { data: metrics, message: 'Metrics retrieved' });
    } catch (err) {
        next(err);
    }
};

export const getMetricByName = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { metricName } = req.params;
        const metric = await metricService.getMetricByName(metricName);
        return sendSuccess(res, { data: metric, message: 'Metric retrieved' });
    } catch (err) {
        next(err);
    }
};

export const validateMetric = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { metricName } = req.params;
        const { metricConfig, auditConfig } = req.body;

        const result = await metricService.validateMetric(metricName, metricConfig, auditConfig);
        return sendSuccess(res, { data: result, message: 'Metric validated' });
    } catch (err) {
        next(err);
    }
};
