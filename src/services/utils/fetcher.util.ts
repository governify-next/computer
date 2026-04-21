import { IFetch } from '../../types/fetch.js';
import { IFetcherConfig } from '../../types/fetcherConfig.js';
import { bootEnv } from '../../config/bootConfig.js';

export const fetchDataForEvent = async (
    date: Date,
    fetcherConfigs: IFetcherConfig[],
): Promise<IFetch[]> => {
    const fetchs: IFetch[] = await Promise.all(
        fetcherConfigs.map(async (fetcherConfig) => {
            const response = await fetch(
                `${bootEnv.COLLECTOR_SERVICE_URL}/api/v1/fetchers/${fetcherConfig.fetcherId}/fetchResults/generate`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        date,
                        fetcherConfig: fetcherConfig.fetcherConfig,
                    }),
                },
            );
            const data = await response.json();
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

export const getFetchByFetcherId = (fetchs: IFetch[], fetcherId: string): IFetch => {
    const fetch = fetchs.find((f) => f.fetcherId === fetcherId)!;
    return fetch;
};
