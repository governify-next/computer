import { IMetric } from '../../types/metric.js';
import { IMetricResult } from '../../types/metricResult.js';
import { IWindow } from '../../types/window.js';

import { MT_ELEMENT_xx_GITHUB_xx_COUNT_COMMITS } from './implementations/github.metric.js';

export const metrics = {
    MT_ELEMENT_xx_GITHUB_xx_COUNT_COMMITS,
};

export type MetricName = keyof typeof metrics;

export const getMetricByName = (name: string): IMetric => {
    const metric = metrics[name as MetricName];
    return metric;
};

export const processMetric = async (
    metricName: string,
    date: Date,
    window: IWindow,
    metricConfig: Record<string, unknown>,
    auditConfig: Record<string, unknown>,
): Promise<IMetricResult> => {
    const metric = getMetricByName(metricName);
    metric.metricConfigSchema.parse(metricConfig);
    metric.auditConfigSchema.parse(auditConfig);
    return await metric.process(date, window, metricConfig, auditConfig);
};
