import { IFetch } from '../../../types/fetch.js';
import { IFetcherConfig } from '../../../types/fetcherConfig.js';
import * as fetcherIntegration from '../../../integrations/fetcher.integration.js';

export const fetchDataForEvent = async (
    date: Date,
    fetcherConfigs: IFetcherConfig[],
): Promise<IFetch[]> => {
    const fetchs: IFetch[] = await Promise.all(
        fetcherConfigs.map(async (fetcherConfig) => {
            const fetchResult = await fetcherIntegration.generateFetchResult(
                fetcherConfig.fetcherId,
                date,
                fetcherConfig.fetcherConfig,
            );
            return {
                fetcherId: fetcherConfig.fetcherId,
                fetcherConfig: fetcherConfig.fetcherConfig,
                fetchResultId: fetchResult._id,
                status: fetchResult.status,
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
