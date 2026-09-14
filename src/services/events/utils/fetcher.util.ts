import { IFetch } from '../../../types/fetch.js';
import { IFetcherConfig } from '../../../types/fetcherConfig.js';
import * as fetcherIntegration from '../../../integrations/fetcher.integration.js';
import { ITemporalContext } from '../../../types/temporal.js';

export const fetchDataForEvent = async (
    temporalContext: ITemporalContext,
    fetcherConfigs: IFetcherConfig[],
): Promise<IFetch[]> => {
    const fetchs: IFetch[] = await Promise.all(
        fetcherConfigs.map(async (fetcherConfig) => {
            const fetchResult = await fetcherIntegration.generateFetchResult(
                fetcherConfig.fetcherId,
                temporalContext,
                fetcherConfig.fetcherConfig,
            );
            return {
                fetcherId: fetcherConfig.fetcherId,
                fetcherConfig: fetcherConfig.fetcherConfig,
                fetchResultId: fetchResult._id,
                status: fetchResult.status,
                unavailableReason: fetchResult.unavailableReason ?? null,
                data: fetchResult.data,
            };
        }),
    );
    return fetchs;
};

export const getFetchByFetcherId = (fetcherId: string, fetchs: IFetch[]): IFetch => {
    const fetch = fetchs.find((f) => f.fetcherId === fetcherId)!;
    return fetch;
};
