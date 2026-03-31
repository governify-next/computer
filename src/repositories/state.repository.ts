import State, { IState } from '../models/state.model.js';
import { ISearchParams } from '../types/searchParams.js';

export const getStates = async () => {
    return await State.find();
};

export const getStateById = async (id: string) => {
    return await State.findById(id);
};

export const createState = async (data: Partial<IState>) => {
    const state = new State(data);
    return await state.save();
};

export const updateState = async (id: string, data: Partial<IState>) => {
    return await State.findByIdAndUpdate(id, data, { new: true });
};

export const deleteState = async (id: string) => {
    return await State.findByIdAndDelete(id);
};

export const getStatesBySignatureId = async (signatureId: string) => {
    return await State.find({ signatureId });
};

export const search = async ({ query = {}, pagination = {}, sort = {} }: ISearchParams) => {
    return State.find({
        ...query,
    })
        .limit(pagination.limit ?? 50)
        .skip(pagination.skip ?? 0)
        .sort(sort);
};
