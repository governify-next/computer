import { IFetch } from '../../types/fetch.js';
import { IFetcherConfig } from '../../types/fetcherConfig.js';

export const fetchDataForEvent = async (fetcherConfigs: IFetcherConfig[]): Promise<IFetch[]> => {
    const fetchs: IFetch[] = fetcherConfigs.map((fetcherConfig) => ({
        fetcherId: fetcherConfig.fetcherId,
        fetcherConfig: fetcherConfig.fetcherConfig,
        data: undefined,
    }));

    fetchs.forEach((fetch) => {
        fetch.data = [{ issue: 'example issue data' }];
    });
    return fetchs;
};

export const getFetchByFetcherId = (fetchs: IFetch[], fetcherId: string): IFetch => {
    const fetch = fetchs.find((f) => f.fetcherId === fetcherId)!;
    return fetch;
};
