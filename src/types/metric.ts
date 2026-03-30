import { IAuditConfig } from './auditConfig.js';
import { IMetricConfig } from './metricConfig.js';
import { IWindow } from './window.js';
import { IMetricResult } from './metricResult.js';

export interface IMetric {
    name: string;
    moreInfo: {
        title: string;
        description: string;
        example: string;
    };
    collection: string;
    process: (
        date: Date,
        window: IWindow,
        metricConfig: IMetricConfig,
        auditConfig: IAuditConfig,
    ) => Promise<IMetricResult>;
}
