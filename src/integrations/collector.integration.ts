import jwt from 'jsonwebtoken';
import { bootEnv } from '../config/bootConfig.js';

const collectorServiceUrl = bootEnv.COLLECTOR_SERVICE_URL;
const collectorAuthToken = jwt.sign(
    { service: bootEnv.GOV_SERVICE_NAME, type: 'service-token' },
    bootEnv.JWT_SECRET,
);

export const checkHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${collectorServiceUrl}/health`, {
            method: 'GET',
        });
        const data = await response.json();
        return data;
    } catch (error) {
        return false;
    }
};

export const validateFetcher = async (
    fetcherId: string,
    fetcherConfig: Record<string, unknown>,
) => {
    const response = await fetch(`${collectorServiceUrl}/api/v1/fetchers/${fetcherId}/validate`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${collectorAuthToken}`,
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
                Authorization: `Bearer ${collectorAuthToken}`,
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
