import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as stateService from '../services/state.service.js';
import { IState } from '../models/state.model.js';

export const getStateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const state = await stateService.getStateById(id);
        return sendSuccess(res, { data: state, message: 'State retrieved' });
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
        const { stateDate, auditConfig, guarantee } = req.body;
        const partialState: Partial<IState> = {
            signatureId: req.body.signatureId,
            stateDate,
            numericExpression: guarantee.numericExpression,
            comparator: guarantee.comparator,
            threshold: guarantee.threshold,
            window: guarantee.window,
            auditConfig,
        };
        const state = await stateService.generateState(
            req.query.isAsync === 'true',
            partialState,
            guarantee.metricConfigs,
            stateDate,
            guarantee.window,
            auditConfig,
            guarantee.numericExpression,
            guarantee.comparator,
            guarantee.threshold,
        );
        return sendSuccess(res, { data: state, message: 'State created' });
    } catch (err) {
        next(err);
    }
};
