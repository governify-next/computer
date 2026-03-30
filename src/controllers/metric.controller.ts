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
