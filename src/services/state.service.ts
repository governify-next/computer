import * as stateRepository from '../repositories/state.repository.js';
import * as metricService from './metrics/metric.service.js';
import * as evaluatorService from './evaluator.service.js';
import { IState } from '../models/state.model.js';
import { Types } from 'mongoose';
import { StateStatus } from '../types/stateStatus.js';
import { StateType } from '../types/stateType.js';
import { IProcessedMetric } from '../models/state.model.js';
import { IMetricConfig } from '../types/metricConfig.js';
import { IWindow } from '../types/window.js';

export const generateState = async (
    data: Partial<IState>,
    metricConfigs: IMetricConfig[],
    date: Date,
    window: IWindow,
    auditConfig: Record<string, unknown>,
    numericExpression: string,
    comparator: string,
    threshold: number,
) => {
    const state = await createState(data);
    const processedMetrics = await metricService.processMetrics(
        metricConfigs,
        date,
        window,
        auditConfig,
    );
    const updatedState = await updateState(
        state._id.toString(),
        processedMetrics,
        numericExpression,
        comparator,
        threshold,
    );
    return updatedState;
};

export const createState = async (data: Partial<IState>) => {
    return stateRepository.createState({
        signatureId: new Types.ObjectId(data.signatureId),
        computationStartDate: new Date(),
        computationEndDate: null,
        stateDate: data.stateDate,
        stateType: StateType.EVOLUTION,
        status: StateStatus.IN_PROGRESS,
        numericExpression: data.numericExpression,
        comparator: data.comparator,
        threshold: data.threshold,
        numericExpressionValue: null,
        compliant: null,
        indeterminate: null,
        window: data.window,
        auditConfig: data.auditConfig,
        processedMetrics: null,
    });
};

export const updateState = async (
    id: string,
    processedMetrics: Record<string, IProcessedMetric>,
    numericExpression: string,
    comparator: string,
    threshold: number,
) => {
    const numericExpressionValue = evaluatorService.evaluateNumericExpression(
        numericExpression,
        processedMetrics,
    );
    return stateRepository.updateState(id, {
        computationEndDate: new Date(),
        status: StateStatus.COMPLETED,
        numericExpressionValue: numericExpressionValue,
        compliant: isNaN(numericExpressionValue)
            ? null
            : evaluatorService.evaluateCompliance(numericExpressionValue, comparator, threshold),
        indeterminate: isNaN(numericExpressionValue) ? true : false,
        processedMetrics: Object.values(processedMetrics),
    });
};
