import jwt from 'jsonwebtoken';
import { bootEnv } from '../config/bootConfig.js';

const collectorServiceUrl = bootEnv.COLLECTOR_SERVICE_URL;
const collectorAuthToken = jwt.sign(
    { service: bootEnv.GOV_SERVICE_NAME, type: 'service-token' },
    bootEnv.JWT_SECRET,
);
const collectorAuthHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${collectorAuthToken}`,
};

// Function to validate fetcher configuration -----------------------------------
export const validateFetcher = async (
    fetcherId: string,
    fetcherConfig: Record<string, unknown>,
) => {
    const response = await fetch(`${collectorServiceUrl}/api/v1/fetchers/${fetcherId}/validate`, {
        method: 'POST',
        headers: collectorAuthHeaders,
        body: JSON.stringify({
            fetcherConfig: fetcherConfig,
        }),
    });
    const data = await response.json();
    return data;
};

// Function to get fetch result by ID -------------------------------------------
const getFetchResultByFetcherIdAndFetchResultId = async (
    fetcherId: string,
    fetchResultId: string,
) => {
    const response = await fetch(
        `${collectorServiceUrl}/api/v1/fetchers/${fetcherId}/fetchResults/${fetchResultId}`,
        {
            method: 'GET',
            headers: collectorAuthHeaders,
        },
    );
    return parseCollectorResponse(response);
};

// Function to generate fetch result and poll for completion -------------------
export const generateFetchResult = async (
    fetcherId: string,
    date: Date,
    fetcherConfig: Record<string, unknown>,
) => {
    const response = await fetch(
        `${collectorServiceUrl}/api/v1/fetchers/${fetcherId}/fetchResults/generate?isAsync=true`,
        {
            method: 'POST',
            headers: collectorAuthHeaders,
            body: JSON.stringify({
                date,
                fetcherConfig: fetcherConfig,
            }),
        },
    );
    const data = await parseCollectorResponse(response);
    if (data.data.status === 'IN_PROGRESS') return waitForFetchResultCompletion(fetcherId, data);
    return data;
};

const fetchResultPollingConfig = {
    maxAttempts: bootEnv.FETCH_RESULT_POLLING_MAX_ATTEMPTS,
    intervalMs: bootEnv.FETCH_RESULT_POLLING_INTERVAL_MS,
};

interface FetchResultResponse {
    data: {
        _id: string;
        status: 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
        data: unknown;
    };
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const parseCollectorResponse = async (response: Response) => {
    const data = await response.json();
    return data;
};

const waitForFetchResultCompletion = async (
    fetcherId: string,
    initialResponse: FetchResultResponse,
) => {
    const fetchResultId = initialResponse.data._id;
    for (let attempt = 1; attempt <= fetchResultPollingConfig.maxAttempts; attempt++) {
        await delay(fetchResultPollingConfig.intervalMs);
        const pollResponse = await getFetchResultByFetcherIdAndFetchResultId(
            fetcherId,
            fetchResultId,
        );
        if (pollResponse.data.status === 'COMPLETED' || pollResponse.data.status === 'FAILED')
            return pollResponse;
    }
};

export const checkHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${collectorServiceUrl}/health`, {
            method: 'GET',
        });
        const data = await response.json();
        return data;
    } catch {
        return false;
    }
};
