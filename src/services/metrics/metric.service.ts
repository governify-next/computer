import { IAuditConfig } from '../../types/auditConfig.js';
import { IMetric } from '../../types/metric.js';
import { IMetricConfig } from '../../types/metricConfig.js';
import { IMetricResult } from '../../types/metricResult.js';
import { IWindow } from '../../types/window.js';
import { MT_ELEMENT_xx_GITHUB_xx_COUNT_COMMITS } from './implementations/github.metric.js';

export const metrics: Record<string, IMetric> = {
    MT_ELEMENT_xx_GITHUB_xx_COUNT_COMMITS,
};

export const getMetricByName = (name: string): IMetric => {
    const metric = metrics[name];
    return metric;
};

export const processMetric = async (
    metricName: string,
    date: Date,
    window: IWindow,
    metricConfig: IMetricConfig,
    auditConfig: IAuditConfig,
): Promise<IMetricResult> => {
    const metric = getMetricByName(metricName);
    return await metric.process(date, window, metricConfig, auditConfig);
};
