import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as stateService from '../services/state.service.js';
import * as metricService from '../services/metrics/metric.service.js';

export const generateState = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const state = await stateService.createState(req.body);
        const processedMetrics = await metricService.processMetrics(
            req.body.metricConfigs,
            req.body.stateDate,
            req.body.window,
            req.body.auditConfig,
        );

        return sendSuccess(res, { data: processedMetrics, message: 'State created' });
    } catch (err) {
        next(err);
    }
};

/*export const createStates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const states = await stateService.createStates(req.body);
        return sendSuccess(res, { data: states, message: 'States created' });
    } catch (err) {
        next(err);
    }
};
*/
