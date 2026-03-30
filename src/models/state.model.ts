import mongoose, { Schema, Document, Types } from 'mongoose';
import { StateStatus } from '../types/stateStatus.js';
import { StateType } from '../types/stateType.js';
import { IWindow } from '../types/window.js';

const processedMetricSchema = new Schema(
    {
        name: { type: String, required: true },
        collection: { type: String, required: true },
        fetchResultIds: [{ type: Types.ObjectId, required: true }],
        metricConfig: { type: Schema.Types.Mixed, required: true },
        value: { type: Number, required: true },
        evidences: [{ type: Schema.Types.Mixed, required: true }],
    },
    { _id: false },
);

export interface IProcessedMetric {
    name: string;
    collection: string;
    fetchResultIds: string[];
    metricConfig: Record<string, unknown>;
    value: number;
    evidences: Record<string, unknown>[];
}

export interface IState extends Document {
    signatureId: Types.ObjectId;
    computationStartDate: Date;
    computationEndDate: Date | null;
    stateDate: Date;
    stateType: StateType;
    status: StateStatus;
    numericExpression: string;
    comparator: string;
    threshold: number;
    numericExpressionValue: number | null;
    compliant: boolean | null;
    indeterminate: boolean | null;
    window: IWindow;
    auditConfig: Record<string, unknown>;
    processedMetrics: IProcessedMetric[] | null;
}

const stateSchema = new Schema<IState>(
    {
        signatureId: { type: Types.ObjectId, required: true },
        computationStartDate: { type: Date, required: true },
        computationEndDate: { type: Date, default: null },
        stateDate: { type: Date, required: true },
        stateType: { type: String, enum: Object.values(StateType), required: true },
        status: { type: String, enum: Object.values(StateStatus), required: true },
        numericExpression: { type: String, required: true },
        comparator: { type: String, required: true },
        threshold: { type: Number, required: true },
        numericExpressionValue: { type: Number, default: null },
        compliant: { type: Boolean, default: null },
        indeterminate: { type: Boolean, default: null },
        window: { type: Schema.Types.Mixed, required: true },
        auditConfig: { type: Schema.Types.Mixed, required: true },
        processedMetrics: { type: [processedMetricSchema], default: null },
    },
    { timestamps: true },
);

const State = mongoose.model<IState>('State', stateSchema);

export default State;
