import { IWindow } from '../types/window.js';
import { IFetcherConfig } from '../types/fetcherConfig.js';
import { IFetch } from '../types/fetch.js';
import { IAggregationResult } from '../types/aggregationResult.js';
import { IAggregation } from '../types/aggregation.js';
import { IComputedMetric } from '../types/computedMetric.js';
import { IProcessedEvent } from '../types/processedEvent.js';
import * as aggregatorService from './aggregators/aggregator.service.js';
import * as eventService from './events/event.service.js';

export const computeMetric = async (
    eventId: string,
    date: Date,
    window: IWindow,
    fetcherConfigs: IFetcherConfig[],
    processConfig: Record<string, unknown>,
    aggregation: IAggregation,
): Promise<IComputedMetric> => {
    // Step 1: Process the event to get the main events
    const processedEvent: IProcessedEvent = await eventService.processEvent(
        eventId,
        date,
        window,
        fetcherConfigs,
        processConfig,
    );
    const mainEvents: Record<string, unknown>[] = processedEvent.events;
    const fetchs: IFetch[] = processedEvent.fetchs;

    // Step 2: Aggregate the main events using the specified aggregation method to compute the final metric value
    const aggregationResult: IAggregationResult = aggregatorService.aggregateEvents(
        mainEvents,
        aggregation,
    );

    // Step 3: Return the computed metric value along with evidences and the metric configuration
    return {
        value: aggregationResult.value,
        evidences: aggregationResult.evidences,
        metricConfig: {
            event: {
                eventId,
                fetcherConfigs: fetcherConfigs.map((fetcherConfig) => ({
                    fetcherId: fetcherConfig.fetcherId,
                    fetcherConfig: fetcherConfig.fetcherConfig,
                    fetchResultId: fetchs.find((f) => f.fetcherId === fetcherConfig.fetcherId)!
                        .fetchResultId,
                })),
                processConfig,
            },
            aggregation,
        },
    };
};
