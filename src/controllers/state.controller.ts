import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as stateService from '../services/state.service.js';

export const generateState = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            metricConfigs,
            date,
            window,
            auditConfig,
            numericExpression,
            comparator,
            threshold,
        } = req.body;
        const state = await stateService.generateState(
            req.body,
            metricConfigs,
            date,
            window,
            auditConfig,
            numericExpression,
            comparator,
            threshold,
        );
        return sendSuccess(res, { data: state, message: 'State created' });
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
