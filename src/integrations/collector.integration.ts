import { bootEnv } from '../config/bootConfig.js';
import { serviceHeaders } from '../utils/serviceAuth.js';
import { FetchError, ExternalServiceError } from '../utils/customErrors.js';

const COLLECTOR_SERVICE_URL = bootEnv.COLLECTOR_SERVICE_URL;

// Function to check health of collector service --------------------------------
export const checkHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${COLLECTOR_SERVICE_URL}/health`, {
            method: 'GET',
        });
        const result = await response.json();
        return result;
    } catch {
        return false;
    }
};

// Function to validate fetcher configuration -----------------------------------
export const validateFetcher = async (
    fetcherId: string,
    fetcherConfig: Record<string, unknown>,
) => {
    const response = await fetch(`${COLLECTOR_SERVICE_URL}/api/v1/fetchers/${fetcherId}/validate`, {
        method: 'POST',
        headers: serviceHeaders,
        body: JSON.stringify({
            fetcherConfig: fetcherConfig,
        }),
    });
    const result = await response.json();

    if (!result.success) throw new ExternalServiceError(`Fetcher configuration validation failed`);

    return result;
};

// Function to get fetch result by ID -------------------------------------------
const getFetchResultByFetcherIdAndFetchResultId = async (
    fetcherId: string,
    fetchResultId: string,
) => {
    const response = await fetch(
        `${COLLECTOR_SERVICE_URL}/api/v1/fetchers/${fetcherId}/fetchResults/${fetchResultId}`,
        {
            method: 'GET',
            headers: serviceHeaders,
        },
    );
    const result = await response.json();

    if (!result.success)
        throw new FetchError(
            `Failed to fetch fetch result with ID ${fetchResultId} for fetcher ${fetcherId}`,
        );

    return result;
};

// Function to generate fetch result and poll for completion -------------------
export const generateFetchResult = async (
    fetcherId: string,
    date: Date,
    fetcherConfig: Record<string, unknown>,
) => {
    try {
        const response = await fetch(
            `${COLLECTOR_SERVICE_URL}/api/v1/fetchers/${fetcherId}/fetchResults/generate?isAsync=true`,
            {
                method: 'POST',
                headers: serviceHeaders,
                body: JSON.stringify({
                    date,
                    fetcherConfig: fetcherConfig,
                }),
            },
        );
        const result = await response.json();

        if (!result.success)
            throw new Error(`Failed to initiate fetch result generation for fetcher ${fetcherId}`);

        if (result.data.status === 'IN_PROGRESS')
            return waitForFetchResultCompletion(fetcherId, result);

        return result.data;
    } catch (error) {
        throw new ExternalServiceError(
            `Collector failed to generate fetch result for fetcher ${fetcherId}`,
            error instanceof Error ? { message: error.message } : error,
        );
    }
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
            return pollResponse.data;
        if (attempt === fetchResultPollingConfig.maxAttempts) {
            throw new Error(
                `Fetch result generation for fetcher ${fetcherId} did not complete within expected time`,
            );
        }
    }
};
