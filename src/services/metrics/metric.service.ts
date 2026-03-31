import { ZodError } from 'zod';
import { IMetric } from '../../types/metric.js';
import { IMetricResult } from '../../types/metricResult.js';
import { IWindow } from '../../types/window.js';
import { IMetricConfig } from '../../types/metricConfig.js';
import { ValidationError } from '../../utils/customErrors.js';
import { IProcessedMetric } from '../../models/state.model.js';

import { MT_ELEMENT_xx_GITHUB_xx_COUNT_COMMITS } from './implementations/github.metric.js';

export const metrics: Record<string, IMetric> = {
    MT_ELEMENT_xx_GITHUB_xx_COUNT_COMMITS,
};

// This function injects the stringified version of the process function into each metric for documentation purposes
const injectScriptStringToMetric = (metrics: Record<string, IMetric>): Record<string, IMetric> => {
    Object.values(metrics).forEach((metric) => {
        metric.script = metric.process.toString();
    });
    return metrics;
};
injectScriptStringToMetric(metrics);

export type MetricName = keyof typeof metrics;
export const getMetricByName = (name: string): IMetric => {
    const metric = metrics[name as MetricName];
    return metric;
};

export const getMetrics = (): IMetric[] => {
    return Object.values(metrics);
};

export const processMetric = async (
    metricName: string,
    date: Date,
    window: IWindow,
    metricConfig: Record<string, unknown>,
    auditConfig: Record<string, unknown>,
): Promise<IMetricResult> => {
    const metric = getMetricByName(metricName);
    try {
        metric.metricConfigSchema.parse(metricConfig);
        metric.auditConfigSchema.parse(auditConfig);
        return await metric.process(date, window, metricConfig, auditConfig);
    } catch (error) {
        if (error instanceof ZodError) {
            throw new ValidationError('Invalid metric or audit configuration', {
                issues: error.issues,
            });
        }
        throw error;
    }
};

export const processMetrics = async (
    metricConfigs: IMetricConfig[],
    date: Date,
    window: IWindow,
    auditConfig: Record<string, unknown>,
): Promise<Record<string, IProcessedMetric>> => {
    const processedMetrics: Record<string, IProcessedMetric> = {};
    for (const metricConfig of metricConfigs) {
        const metricName = metricConfig.name;
        const processedMetric = await processMetric(
            metricName,
            date,
            window,
            metricConfig.metricConfig,
            auditConfig,
        );
        processedMetrics[metricName] = {
            name: metricName,
            collection: getMetricByName(metricName).collection,
            fetchResultIds: [],
            metricConfig: metricConfig.metricConfig,
            value: processedMetric.value,
            evidences: processedMetric.evidences,
        };
    }
    return processedMetrics;
};
