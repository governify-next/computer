import { bootEnv } from '../config/bootConfig.js';

const collectorServiceUrl = bootEnv.COLLECTOR_SERVICE_URL;

export const validateFetcher = async (
    fetcherId: string,
    fetcherConfig: Record<string, unknown>,
) => {
    const response = await fetch(`${collectorServiceUrl}/api/v1/fetchers/${fetcherId}/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fetcherConfig: fetcherConfig,
        }),
    });
    const data = await response.json();
    return data;
};

export const generateFetchResult = async (
    fetcherId: string,
    date: Date,
    fetcherConfig: Record<string, unknown>,
) => {
    const response = await fetch(
        `${collectorServiceUrl}/api/v1/fetchers/${fetcherId}/fetchResults/generate`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                date,
                fetcherConfig: fetcherConfig,
            }),
        },
    );
    const data = await response.json();
    return data;
};
