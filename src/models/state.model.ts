import mongoose, { Schema, Document, Types } from 'mongoose';
import { StateStatus } from '../types/stateStatus.js';
import { StateType } from '../types/stateType.js';

const processedMetricSchema = new Schema(
    {
        metricId: { type: Types.ObjectId, required: true },
        fetchResultIds: [{ type: Types.ObjectId, required: true }],
        value: { type: Number, required: true },
        evidences: [{ type: Schema.Types.Mixed, required: true }],
    },
    { _id: false },
);

export interface IState extends Document {
    signatureId: Types.ObjectId;
    computationStartDate: Date;
    computationEndDate: Date | null;
    stateDate: Date;
    stateType: StateType;
    status: StateStatus;
    compliant: boolean | null;
    numericExpressionValue: number | null;
    indeterminate: boolean | null;
    processedMetrics:
        | {
              metricId: Types.ObjectId;
              fetchResultIds: Types.ObjectId[];
              value: number;
              evidences: Record<string, unknown>[];
          }[]
        | null;
}

const stateSchema = new Schema<IState>(
    {
        signatureId: { type: Types.ObjectId, required: true },
        computationStartDate: { type: Date, required: true },
        computationEndDate: { type: Date, default: null },
        stateDate: { type: Date, required: true },
        stateType: { type: String, enum: Object.values(StateType), required: true },
        status: { type: String, enum: Object.values(StateStatus), required: true },
        compliant: { type: Boolean, default: null },
        numericExpressionValue: { type: Number, default: null },
        indeterminate: { type: Boolean, default: null },
        processedMetrics: { type: [processedMetricSchema], default: null },
    },
    { timestamps: true },
);

const State = mongoose.model<IState>('State', stateSchema);

export default State;
