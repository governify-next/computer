import * as stateRepository from '../repositories/state.repository.js';
import { IState } from '../models/state.model.js';
import { Types } from 'mongoose';
import { StateStatus } from '../types/stateStatus.js';
import { StateType } from '../types/stateType.js';

export const createState = async (data: Partial<IState>) => {
    return stateRepository.createState({
        ...data,
        signatureId: new Types.ObjectId(data.signatureId),
        computationStartDate: new Date(),
        computationEndDate: null,
        stateType: StateType.EVOLUTION,
        status: StateStatus.IN_PROGRESS,
        compliant: null,
        numericExpressionValue: null,
        indeterminate: null,
        processedMetrics: null,
    });
};
