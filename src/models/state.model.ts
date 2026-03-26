import mongoose, { Schema, Document, Types } from 'mongoose';
import { StateStatus } from '../types/stateStatus.js';

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
    status: StateStatus;
    compliant: boolean | null;
    numericExpressionValue: number | null;
    processedMetrics:
        | {
              metricId: Types.ObjectId;
              fetchResultIds: Types.ObjectId[];
              value: number;
              evidences: Record<string, unknown>[];
          }[]
        | null;
}

const stateSchema = new Schema<IState>({
    signatureId: { type: Types.ObjectId, required: true },
    computationStartDate: { type: Date, required: true },
    computationEndDate: { type: Date, required: true },
    stateDate: { type: Date, required: true },
    status: { type: String, enum: Object.values(StateStatus), required: true },
    compliant: { type: Boolean, required: true },
    numericExpressionValue: { type: Number, required: true },
    processedMetrics: [processedMetricSchema],
});

const State = mongoose.model<IState>('State', stateSchema);

export default State;
