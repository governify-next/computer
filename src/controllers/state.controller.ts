import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as stateService from '../services/state.service.js';

export const getStatesBySignatureId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { signatureId } = req.params;
        const states = await stateService.getStatesBySignatureId(signatureId);
        return sendSuccess(res, { data: states, message: 'States retrieved' });
    } catch (err) {
        next(err);
    }
};

export const searchStates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { filters, pagination, sort } = req.body;
        const states = await stateService.searchStates({
            filters,
            pagination,
            sort,
        });

        return sendSuccess(res, { data: states, message: 'States retrieved' });
    } catch (err) {
        next(err);
    }
};

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
