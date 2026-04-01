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
import { ISearchStatesInput } from '../types/searchParams.js';
import { buildMongoQuery } from '../utils/mongoQueryBuilder.js';

export const getStateById = async (id: string) => {
    return await stateRepository.getStateById(id);
};

export const searchStates = async ({
    filters = {},
    pagination = {},
    sort = {},
}: ISearchStatesInput) => {
    const mongoQuery = buildMongoQuery(filters);
    return stateRepository.search({
        query: mongoQuery,
        pagination,
        sort,
    });
};

export const generateState = async (
    isAsync: boolean,
    partialState: Partial<IState>,
    metricConfigs: IMetricConfig[],
    stateDate: Date,
    window: IWindow,
    auditConfig: Record<string, unknown>,
    numericExpression: string,
    comparator: string,
    threshold: number,
) => {
    const state = await createInitialState(partialState);
    const processAndEvaluateState = async () => {
        try {
            const processedMetrics = await metricService.processMetrics(
                metricConfigs,
                stateDate,
                window,
                auditConfig,
            );
            return await evaluateState(
                state._id.toString(),
                processedMetrics,
                numericExpression,
                comparator,
                threshold,
            );
        } catch (error) {
            await stateRepository.updateState(state._id.toString(), {
                computationEndDate: new Date(),
                status: StateStatus.ABORTED,
            });
            throw error;
        }
    };
    if (isAsync) {
        // Async
        void processAndEvaluateState();
        return state;
    }
    return await processAndEvaluateState(); // Sync
};

export const createInitialState = async (data: Partial<IState>) => {
    console.log('Creating initial state with data:', data);
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
        replacedNumericExpression: null,
        numericExpressionValue: null,
        compliant: null,
        indeterminate: null,
        window: data.window,
        auditConfig: data.auditConfig,
        processedMetrics: null,
    });
};

export const evaluateState = async (
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
        replacedNumericExpression: evaluatorService.replaceExpressionWithValues(
            numericExpression,
            processedMetrics,
        ),
        numericExpressionValue: numericExpressionValue,
        compliant:
            numericExpressionValue === null
                ? null
                : evaluatorService.evaluateCompliance(
                      numericExpressionValue,
                      comparator,
                      threshold,
                  ),
        indeterminate: numericExpressionValue === null ? true : false,
        processedMetrics: Object.values(processedMetrics),
    });
};
