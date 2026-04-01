import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/standardResponse.js';
import * as stateService from '../services/state.service.js';
import { IState } from '../models/state.model.js';

export const generateState = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { stateDate, auditConfig, guarantee } = req.body;
        const isAsync = req.query.isAsync === 'true';
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
            isAsync,
            partialState,
            guarantee.metricConfigs,
            stateDate,
            guarantee.window,
            auditConfig,
            guarantee.numericExpression,
            guarantee.comparator,
            guarantee.threshold,
        );
        return sendSuccess(res, {
            data: state,
            message: isAsync ? 'State created' : 'State created and generated',
        });
    } catch (err) {
        next(err);
    }
};

export const generateStates = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { stateDate, signatures } = req.body;
        const isAsync = req.query.isAsync === 'true';
        const states: unknown[] = [];
        for (const signature of signatures) {
            const partialState: Partial<IState> = {
                signatureId: signature.signatureId,
                stateDate: stateDate,
                numericExpression: signature.guarantee.numericExpression,
                comparator: signature.guarantee.comparator,
                threshold: signature.guarantee.threshold,
                window: signature.guarantee.window,
                auditConfig: signature.auditConfig,
            };
            const state = await stateService.generateState(
                isAsync,
                partialState,
                signature.guarantee.metricConfigs,
                stateDate,
                signature.guarantee.window,
                signature.auditConfig,
                signature.guarantee.numericExpression,
                signature.guarantee.comparator,
                signature.guarantee.threshold,
            );
            states.push(state);
        }
        return sendSuccess(res, {
            data: states,
            message: isAsync ? 'States created' : 'States created and generated',
        });
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

export const getStateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const state = await stateService.getStateById(id);
        return sendSuccess(res, { data: state, message: 'State retrieved' });
    } catch (err) {
        next(err);
    }
};

export const updateState = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const updatedState = await stateService.updateStateById(id, req.body);
        return sendSuccess(res, { data: updatedState, message: 'State updated' });
    } catch (err) {
        next(err);
    }
};

export const deleteStateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const deletedState = await stateService.deleteStateById(id);
        return sendSuccess(res, { data: deletedState, message: 'State deleted' });
    } catch (err) {
        next(err);
    }
};

export const getStatesBySignatureId = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { signatureId } = req.params;
        const states = await stateService.getStatesBySignatureId(signatureId);
        return sendSuccess(res, { data: states, message: 'States retrieved' });
    } catch (err) {
        next(err);
    }
};

export const deleteStatesBySignatureId = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const { signatureId } = req.params;
        const deletedStates = await stateService.deleteStatesBySignatureId(signatureId);
        return sendSuccess(res, { data: deletedStates, message: 'States deleted' });
    } catch (err) {
        next(err);
    }
};
