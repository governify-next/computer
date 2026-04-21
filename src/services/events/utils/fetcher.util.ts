import { IFetch } from '../../../types/fetch.js';
import { IFetcherConfig } from '../../../types/fetcherConfig.js';
import * as collectorIntegration from '../../../integrations/collector.integration.js';

export const fetchDataForEvent = async (
    date: Date,
    fetcherConfigs: IFetcherConfig[],
): Promise<IFetch[]> => {
    const fetchs: IFetch[] = await Promise.all(
        fetcherConfigs.map(async (fetcherConfig) => {
            const data = await collectorIntegration.generateFetchResult(
                fetcherConfig.fetcherId,
                date,
                fetcherConfig.fetcherConfig,
            );
            return {
                fetcherId: fetcherConfig.fetcherId,
                fetcherConfig: fetcherConfig.fetcherConfig,
                fetchResultId: data.data._id,
                data: data.data.data,
            };
        }),
    );
    return fetchs;
};

export const getFetchByFetcherId = (fetcherId: string, fetchs: IFetch[]): IFetch => {
    const fetch = fetchs.find((f) => f.fetcherId === fetcherId)!;
    return fetch;
};
