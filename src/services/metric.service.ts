import { IWindow } from '../types/window.js';
import { IFetcherConfig } from '../types/fetcherConfig.js';
import { IFetch } from '../types/fetch.js';
import { IAggregationResult } from '../types/aggregationResult.js';
import { IAggregation } from '../types/aggregation.js';
import { ComputedMetricStatus, IComputedMetric } from '../types/computedMetric.js';
import { IProcessedEvent } from '../types/processedEvent.js';
import * as aggregatorService from './aggregators/aggregator.service.js';
import * as eventService from './events/event.service.js';
import { ITemporalContext } from '../types/temporal.js';

export const computeMetric = async (
    eventId: string,
    temporalContext: ITemporalContext,
    window: IWindow,
    fetcherConfigs: IFetcherConfig[],
    processConfig: Record<string, unknown>,
    aggregation: IAggregation,
): Promise<IComputedMetric> => {
    // Step 1: Fetch and process the event. If any fetch result failed, events will be null.
    const processedEvent: IProcessedEvent = await eventService.processEvent(
        eventId,
        temporalContext,
        window,
        fetcherConfigs,
        processConfig,
    );

    const mainEvents: Record<string, unknown>[] | null = processedEvent.events;
    const fetchs: IFetch[] = processedEvent.fetchs;
    const unavailableFetches = fetchs.filter((fetch) => fetch.status === 'UNAVAILABLE');
    const hasFailedFetch = fetchs.some((fetch) => fetch.status === 'FAILED');

    // Step 2: Aggregate the main events using the specified aggregation method to compute the final metric value. Null agregation means some fetch data is missing.
    const aggregationResult = getAggregationResult(mainEvents, aggregation);
    const metricStatus = hasFailedFetch
        ? ComputedMetricStatus.FAILED
        : unavailableFetches.length > 0
          ? ComputedMetricStatus.UNAVAILABLE
          : aggregationResult === null || aggregationResult.value === null
            ? ComputedMetricStatus.FAILED
            : ComputedMetricStatus.COMPUTED;

    // Step 3: Return the computed metric value along with evidences and the metric configuration. If fetch data is missing, value will be null and evidences an empty array.
    return {
        status: metricStatus,
        value: aggregationResult?.value ?? null,
        evidences: aggregationResult?.evidences ?? [],
        metricConfig: {
            event: {
                eventId,
                fetcherConfigs: fetchs.map((fetch) => ({
                    fetcherId: fetch.fetcherId,
                    fetcherConfig: fetch.fetcherConfig,
                    fetchResult: {
                        id: fetch.fetchResultId,
                        status: fetch.status,
                        unavailableReason: fetch.unavailableReason,
                    },
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
