import { IAggregation } from './aggregation.js';
import { IFetch } from './fetch.js';

export enum ComputedMetricStatus {
    COMPUTED = 'COMPUTED',
    UNAVAILABLE = 'UNAVAILABLE',
    FAILED = 'FAILED',
}

export interface IComputedMetric {
    status: ComputedMetricStatus;
    value: number | null;
    evidences: Record<string, unknown>[];
    metricConfig: {
        event: {
            eventId: string;
            fetcherConfigs: {
                fetcherId: string;
                fetcherConfig: Record<string, unknown>;
                fetchResult: {
                    id: string;
                    status: IFetch['status'];
                    unavailableReason: string | null;
                };
            }[];
            processConfig: Record<string, unknown>;
        };
        aggregation: IAggregation;
    };
}
