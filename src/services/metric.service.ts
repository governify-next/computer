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
    // Step 1: Fetch and process the event. If any fetch result failed, events will be null.
    const processedEvent: IProcessedEvent = await eventService.processEvent(
        eventId,
        date,
        window,
        fetcherConfigs,
        processConfig,
    );

    const mainEvents: Record<string, unknown>[] | null = processedEvent.events;
    const fetchs: IFetch[] = processedEvent.fetchs;

    // Step 2: Aggregate the main events using the specified aggregation method to compute the final metric value. Null agregation means some fetch data is missing.
    const aggregationResult = getAggregationResult(mainEvents, aggregation);

    // Step 3: Return the computed metric value along with evidences and the metric configuration. If fetch data is missing, value will be null and evidences an empty array.
    return {
        value: aggregationResult?.value ?? null,
        evidences: aggregationResult?.evidences ?? [],
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

const getAggregationResult = (
    mainEvents: Record<string, unknown>[] | null,
    aggregation: IAggregation,
): IAggregationResult | null => {
    if (mainEvents === null) return null;

    return aggregatorService.aggregateEvents(mainEvents, aggregation);
};
