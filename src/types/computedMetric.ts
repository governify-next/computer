import { IAggregation } from './aggregation.js';

export interface IComputedMetric {
    value: number | null;
    evidences: Record<string, unknown>[];
    metricConfig: {
        event: {
            eventId: string;
            fetcherConfigs: {
                fetcherId: string;
                fetcherConfig: Record<string, unknown>;
                fetchResultId: string;
            }[];
            processConfig: Record<string, unknown>;
        };
        aggregation: IAggregation;
    };
}
