import { z } from 'zod';
import { IWindow } from './window.js';
import { IMetricResult } from './metricResult.js';

export interface IMetric {
    name: string;
    moreInfo: {
        title: string;
        description: string;
        example: string;
    };
    fetcher: string;
    metricConfigSchema: z.ZodTypeAny;
    auditConfigSchema: z.ZodTypeAny;
    process(
        date: Date,
        window: IWindow,
        metricConfig: Record<string, unknown>,
        auditConfig: Record<string, unknown>,
    ): Promise<IMetricResult>;
    script?: string;
}
