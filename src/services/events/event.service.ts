import { ZodError } from 'zod';
import { IEvent } from '../../types/event.js';
import { IWindow } from '../../types/window.js';
import { IFetch } from '../../types/fetch.js';
import { IFetcherConfig } from '../../types/fetcherConfig.js';
import { IProcessedEvent } from '../../types/processedEvent.js';
import * as fetcherUtils from './utils/fetcher.util.js';
import * as fetcherIntegrations from '../../integrations/fetcher.integration.js';
import { ITemporalContext } from '../../types/temporal.js';

import {
    EV_GITHUB_ISSUES_BY_COLUMN,
    EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_BRANCHES,
    EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_PULL_REQUESTS_BY_STATUS,
    EV_GITHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN,
    EV_GITHUB_ISSUES_BY_COLUMN_FILTERED_BY_UPDATED_AT_DATE_ASSOCIATED_TO_MEMBER,
    EV_GITHUB_PR_MERGED,
    EV_GITHUB_MERGED_PR_BY_REVIEW_STATE,
    EV_GITHUB_PRS_FROM_OTHERS,
    EV_GITHUB_PRS_WITH_COMMENT_OR_REVIEW_BY_MEMBER,
} from './implementations/github.event.js';
import {
    EV_BLUEJAY_LOGS_BY_NUMBER,
    EV_BLUEJAY_LOGS_BY_LEVEL,
} from './implementations/bluejay.event.js';
import {
    EV_ZENHUB_ISSUES_BY_COLUMN,
    EV_ZENHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_BRANCHES,
    EV_ZENHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_PULL_REQUESTS_BY_STATUS,
    EV_ZENHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN,
    EV_ZENHUB_ISSUES_BY_COLUMN_FILTERED_BY_UPDATED_AT_DATE_ASSOCIATED_TO_MEMBER,
} from './implementations/zenhub.event.js';

export const events: Record<string, IEvent> = {
    EV_GITHUB_ISSUES_BY_COLUMN,
    EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_BRANCHES,
    EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_PULL_REQUESTS_BY_STATUS,
    EV_GITHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN,
    EV_GITHUB_ISSUES_BY_COLUMN_FILTERED_BY_UPDATED_AT_DATE_ASSOCIATED_TO_MEMBER,
    EV_GITHUB_PR_MERGED,
    EV_GITHUB_MERGED_PR_BY_REVIEW_STATE,
    EV_GITHUB_PRS_FROM_OTHERS,
    EV_GITHUB_PRS_WITH_COMMENT_OR_REVIEW_BY_MEMBER,
    EV_BLUEJAY_LOGS_BY_LEVEL,
    EV_BLUEJAY_LOGS_BY_NUMBER,
    EV_ZENHUB_ISSUES_BY_COLUMN,
    EV_ZENHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_BRANCHES,
    EV_ZENHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_PULL_REQUESTS_BY_STATUS,
    EV_ZENHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN,
    EV_ZENHUB_ISSUES_BY_COLUMN_FILTERED_BY_UPDATED_AT_DATE_ASSOCIATED_TO_MEMBER,
};

export const processEvent = async (
    eventId: string,
    temporalContext: ITemporalContext,
    window: IWindow,
    fetcherConfigs: IFetcherConfig[],
    processConfig: Record<string, unknown>,
): Promise<IProcessedEvent> => {
    // Step 1: Fetch raw data from fetcher using the provided fetcher configurations
    const fetchs: IFetch[] = await fetcherUtils.fetchDataForEvent(temporalContext, fetcherConfigs);

    const event = getEventById(eventId);

    // Step 2: Process the fetched data (if available) using the event's process function to compute the events
    const events = hasFailedFetch(fetchs)
        ? null
        : event.process(temporalContext.effectiveAt, window, fetchs, processConfig);

    // Step 3: Return the computed events along with the fetch results for evidence
    return {
        events,
        eventId,
        date: temporalContext.effectiveAt,
        window,
        fetchs,
        processConfig,
    };
};

// This function indicates whether any of the fetchResults returned are FAILED
const hasFailedFetch = (fetchs: IFetch[]) => {
    return fetchs.some((fetch) => fetch.status !== 'COMPLETED');
};

// This function injects the stringified version of the process function into each event for documentation purposes
const injectProcessScriptStringToEvent = (
    events: Record<string, IEvent>,
): Record<string, IEvent> => {
    Object.values(events).forEach((event) => {
        event.processScript = event.process.toString();
    });
    return events;
};
injectProcessScriptStringToEvent(events);

export const getEventById = (eventId: string): IEvent => {
    return events[eventId];
};

export const getEvents = (): IEvent[] => {
    return Object.values(events);
};

export const validateEvent = async (
    eventId: string,
    fetcherConfigs?: IFetcherConfig[],
    processConfig?: Record<string, unknown>,
): Promise<EventValidationResponse> => {
    const event = getEventById(eventId);
    if (!event) {
        return {
            valid: false,
            error: `Event ${eventId} not found`,
        };
    }
    const fetcherConfigIssues: FetcherConfigIssue[] = [];
    let processConfigIssues: ZodError['issues'] = [];
    if (fetcherConfigs) {
        const fetcherIdsNotFound: string[] = [];
        event.fetcherIds.forEach((fetcherId) => {
            const fetcherConfig = fetcherConfigs.find((fc) => fc.fetcherId === fetcherId);
            if (!fetcherConfig) {
                fetcherIdsNotFound.push(fetcherId);
            }
        });
        if (fetcherIdsNotFound.length > 0) {
            return {
                valid: false,
                error: `Missing fetcherConfig for fetcherIds: ${fetcherIdsNotFound.join(', ')}`,
            };
        }
        for (const fetcherId of event.fetcherIds) {
            const fetcherConfig = fetcherConfigs.find((fc) => fc.fetcherId === fetcherId)!;
            try {
                const validationResponse = await fetcherIntegrations.validateFetcher(
                    fetcherConfig.fetcherId,
                    fetcherConfig.fetcherConfig,
                );
                if (!validationResponse.data.valid) {
                    const issues = Array.isArray(validationResponse.data.issues)
                        ? (validationResponse.data.issues as ZodError['issues'])
                        : [];
                    fetcherConfigIssues.push(
                        ...issues.map((issue) => ({ issue, fetcherId: fetcherConfig.fetcherId })),
                    );
                }
            } catch (error) {
                if (error instanceof ZodError) {
                    fetcherConfigIssues.push(
                        ...error.issues.map((issue) => ({
                            issue,
                            fetcherId: fetcherConfig.fetcherId,
                        })),
                    );
                } else {
                    throw error;
                }
            }
        }
    }
    if (processConfig) {
        try {
            event.processConfigSchema.parse(processConfig);
        } catch (error) {
            if (error instanceof ZodError) {
                processConfigIssues = error.issues;
            } else {
                throw error;
            }
        }
    }
    if (fetcherConfigIssues.length || processConfigIssues.length) {
        let errorMessage = '';

        if (fetcherConfigIssues.length && processConfigIssues.length) {
            errorMessage = 'Invalid fetcherConfig and processConfig';
        } else if (fetcherConfigIssues.length) {
            errorMessage = 'Invalid fetcherConfig';
        } else {
            errorMessage = 'Invalid processConfig';
        }
        return {
            valid: false,
            error: errorMessage,
            issues: [
                ...fetcherConfigIssues.map(({ issue, fetcherId }) => ({
                    ...issue,
                    source: 'fetcherConfig',
                    fetcherId,
                })),
                ...processConfigIssues.map((i) => ({ ...i, source: 'processConfig' })),
            ],
        };
    }

    return { valid: true };
};

type EventValidationResponse =
    | { valid: true }
    | { valid: false; error: string; issues?: ValidationIssue[] };

type FetcherConfigIssue = {
    issue: ZodError['issues'][number];
    fetcherId: string;
};

type ValidationIssue = (ZodError['issues'][number] & { source: string }) & {
    fetcherId?: string;
};
