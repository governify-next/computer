import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as aggregatorService from '../services/aggregators/aggregator.service.js';

export const getAggregators = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const aggegators = await aggregatorService.getAggregators();
        return sendSuccess(res, { data: aggegators, message: 'Aggregators retrieved' });
    } catch (err) {
        next(err);
    }
};

export const getAggregatorById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { aggregatorType } = req.params;
        const aggregator = await aggregatorService.getAggregatorByType(aggregatorType);
        return sendSuccess(res, { data: aggregator, message: 'Aggregator retrieved' });
    } catch (err) {
        next(err);
    }
};

export const validateAggregator = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { aggregatorType } = req.params;
        const { aggregatorConfig } = req.body;

        const result = await aggregatorService.validateAggregator(aggregatorType, aggregatorConfig);
        if (!result.valid) {
            return sendSuccess(res, {
                data: result,
                message: 'Aggregator validation failed',
            });
        }
        return sendSuccess(res, { data: result, message: 'Aggregator validation passed' });
    } catch (err) {
        next(err);
    }
};
