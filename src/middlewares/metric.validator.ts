import { type Request, type Response, type NextFunction } from 'express';
import { NotFoundError } from '../utils/customErrors.js';
import { getMetricByName } from '../services/metrics/metric.service.js';

export const validateMetricName = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { metricName } = req.params;
        const metric = getMetricByName(metricName);
        if (!metric) {
            return next(new NotFoundError(`Metric ${metricName} not found`));
        }
        next();
    } catch (err) {
        next(err);
    }
};
