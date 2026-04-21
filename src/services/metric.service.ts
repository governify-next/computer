import { IWindow } from '../types/window.js';
import { IFetcherConfig } from '../types/fetcherConfig.js';
import { IFetch } from '../types/fetch.js';
import { IEvent } from '../types/event.js';
import { IAggregationResult } from '../types/aggregationResult.js';
import { IAggregation } from '../types/aggregationConfig.js';
import * as fetcherUtils from './utils/fetcher.util.js';
import * as aggregationUtils from './utils/aggregation.util.js';
import * as eventService from './events/event.service.js';

export const processMetric = async (
    date: Date,
    window: IWindow,
    eventId: string,
    fetcherConfigs: IFetcherConfig[],
    processConfig: Record<string, unknown>,
    aggregation: IAggregation,
): Promise<IAggregationResult> => {
    const fetchs: IFetch[] = await fetcherUtils.fetchDataForEvent(fetcherConfigs);

    const event: IEvent = eventService.getEventById(eventId);
    const mainEvents: Record<string, unknown>[] = event.process(
        date,
        window,
        fetchs,
        processConfig,
    );

    const aggregationResult: IAggregationResult = aggregationUtils.aggregateMainEvents(
        mainEvents,
        aggregation,
    );
    return aggregationResult;
};
