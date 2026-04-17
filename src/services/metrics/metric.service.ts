import { ZodError } from 'zod';
import { IEvent } from '../../types/event.js';
import { IWindow } from '../../types/window.js';
import { ValidationError } from '../../utils/customErrors.js';

import { EV_GITHUB_COMMITS } from './events/github.event.js';
import { EV_BLUEJAY_LOGS_BY_NUMBER, EV_BLUEJAY_LOGS_BY_LEVEL } from './events/bluejay.event.js';

export const events: Record<string, IEvent> = {
    EV_GITHUB_COMMITS,
    EV_BLUEJAY_LOGS_BY_LEVEL,
    EV_BLUEJAY_LOGS_BY_NUMBER,
};

// This function injects the stringified version of the process function into each metric for documentation purposes
const injectProcessScriptStringToEvent = (
    events: Record<string, IEvent>,
): Record<string, IEvent> => {
    Object.values(events).forEach((event) => {
        event.processScript = event.process.toString();
    });
    return events;
};
injectProcessScriptStringToEvent(events);

export type EventId = keyof typeof events;
export const getEventById = (name: string): IEvent => {
    const event = events[name as EventId];
    return event;
};

export const getEvents = (): IEvent[] => {
    return Object.values(events);
};

export const processMetric = async (
    date: Date,
    window: IWindow,
    eventType: string,
    fetcherConfigs: Record<string, unknown>[],
    processConfig: Record<string, unknown>,
    aggregation: Record<string, unknown>,
): Promise<{ value: number; evidences: Record<string, unknown>[] }> => {
    const event = getEventById(eventType);
    try {
        for (const fetcherConfigSchema of event.fetcherConfigSchemas) {
            const fetcherConfig = fetcherConfigs.find((fc) => fc.id === fetcherConfigSchema.id);
            fetcherConfigSchema.fetcherConfigSchema.parse(fetcherConfig?.fetcherConfig);
        }
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

export const validateEvent = async (
    eventId: string,
    fetcherConfigs: Record<string, unknown>[],
    processConfig: Record<string, unknown>,
): Promise<EventValidationResponse> => {
    const event = getEventById(eventId);
    if (!event) {
        return {
            valid: false,
            error: `Event "${eventId}" not found`,
        };
    }
    let fetcherConfigIssues: ZodError['issues'] = [];
    let processConfigIssues: ZodError['issues'] = [];
    if (fetcherConfigs) {
        try {
            event.fetcherConfigSchemas.forEach((fetcherConfigSchema) => {
                const fetcherConfig = fetcherConfigs.find((fc) => fc.id === fetcherConfigSchema.id);
                fetcherConfigSchema.fetcherConfigSchema.parse(fetcherConfig?.fetcherConfig);
            });
        } catch (error) {
            if (error instanceof ZodError) {
                fetcherConfigIssues = error.issues;
            } else {
                throw error;
            }
        }
    }
    if (processConfig) {
        try {
            event.processConfigSchema.parse(processConfig);
        } catch (error) {
            if (error instanceof ZodError) {
                processConfigIssues = error.issues;
            } else {
                throw error;
            }
        }
    }
    if (fetcherConfigIssues.length || processConfigIssues.length) {
        let errorMessage = '';

        if (fetcherConfigIssues.length && processConfigIssues.length) {
            errorMessage = 'Invalid fetcherConfig and processConfig';
        } else if (fetcherConfigIssues.length) {
            errorMessage = 'Invalid fetcherConfig';
        } else {
            errorMessage = 'Invalid processConfig';
        }
        return {
            valid: false,
            error: errorMessage,
            issues: [
                ...fetcherConfigIssues.map((i) => ({ ...i, source: 'fetcherConfig' })),
                ...processConfigIssues.map((i) => ({ ...i, source: 'processConfig' })),
            ],
        };
    }

    return { valid: true };
};

type EventValidationResponse =
    | { valid: true }
    | { valid: false; error: string; issues?: ZodError['issues'] };
