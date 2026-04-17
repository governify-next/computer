import { ZodError } from 'zod';
import { IWindow } from '../types/window.js';
import { ValidationError } from '../utils/customErrors.js';
import * as eventService from './events/event.service.js';

export const processMetric = async (
    date: Date,
    window: IWindow,
    eventType: string,
    fetcherConfigs: Record<string, unknown>[],
    processConfig: Record<string, unknown>,
    aggregation: Record<string, unknown>,
): Promise<{ value: number; evidences: Record<string, unknown>[] }> => {
    const event = eventService.getEventById(eventType);
    try {
        event.fetcherConfigSchemas.forEach((fetcherConfigSchema) => {
            const fetcherConfig = fetcherConfigs.find((fc) => fc.id === fetcherConfigSchema.id);
            fetcherConfigSchema.schema.parse(fetcherConfig?.config);
        });
        event.processConfigSchema.parse(processConfig);

        const mainEvents: Record<string, unknown>[] = await event.process(
            date,
            window,
            fetcherConfigs,
            processConfig,
        );

        // value calculation logic
        let value: number = 0;
        let evidences: Record<string, unknown>[] = [];

        if (aggregation.operation === 'count') {
            value = mainEvents.length;
            evidences = mainEvents;
        }

        return { value, evidences };
    } catch (error) {
        if (error instanceof ZodError) {
            throw new ValidationError('Invalid fetcher or process configuration', {
                issues: error.issues,
            });
        }
        throw error;
    }
};

/*export const processMetrics = async (
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
            fetcher: getEventById(metricName).fetcher,
            fetchResultIds: [],
            metricConfig: metricConfig.metricConfig,
            value: processedMetric.value,
            evidences: processedMetric.evidences,
        };
    }
    return processedMetrics;
};*/
