import { bootEnv } from '../config/bootConfig.js';
import { FetchError, ExternalServiceError } from '../utils/customErrors.js';
import { getServiceHeaders } from '../utils/serviceAuthentication.js';
import { ITemporalContext } from '../types/temporal.js';

const FETCHER_SERVICE_URL = bootEnv.FETCHER_SERVICE_URL;

// Function to check health of fetcher service --------------------------------
export const checkHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${FETCHER_SERVICE_URL}/health`, {
            method: 'GET',
        });
        return response.ok;
    } catch {
        return false;
    }
};

// Function to validate fetcher configuration -----------------------------------
export const validateFetcher = async (
    fetcherId: string,
    fetcherConfig: Record<string, unknown>,
) => {
    const response = await fetch(`${FETCHER_SERVICE_URL}/api/v1/fetchers/${fetcherId}/validate`, {
        method: 'POST',
        headers: getServiceHeaders(),
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
        `${FETCHER_SERVICE_URL}/api/v1/fetchers/${fetcherId}/fetchResults/${fetchResultId}`,
        {
            method: 'GET',
            headers: getServiceHeaders(),
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
    temporalContext: ITemporalContext,
    fetcherConfig: Record<string, unknown>,
) => {
    try {
        const response = await fetch(
            `${FETCHER_SERVICE_URL}/api/v1/fetchers/${fetcherId}/fetchResults/generate?isAsync=true`,
            {
                method: 'POST',
                headers: getServiceHeaders(),
                body: JSON.stringify({
                    temporalContext,
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
            `Fetcher failed to generate fetch result for fetcher ${fetcherId}`,
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
        status: 'IN_PROGRESS' | 'COMPLETED' | 'UNAVAILABLE' | 'FAILED';
        unavailableReason: string | null;
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
        if (
            pollResponse.data.status === 'COMPLETED' ||
            pollResponse.data.status === 'UNAVAILABLE' ||
            pollResponse.data.status === 'FAILED'
        )
            return pollResponse.data;
        if (attempt === fetchResultPollingConfig.maxAttempts) {
            throw new Error(
                `Fetch result generation for fetcher ${fetcherId} did not complete within expected time`,
            );
        }
    }
};
