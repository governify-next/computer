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
    EV_SNAP_GQL_GITHUB_ISSUES_BY_COLUMN_ASSIGNED_TO_MEMBERS_BY_TYPE,
    EV_SNAP_GQL_GITHUB_ISSUES_WITH_BRANCHES_BY_COLUMN_BY_TYPE,
    EV_SNAP_GQL_GITHUB_ISSUES_WITH_PULL_REQUESTS_BY_STATUS_BY_COLUMN_BY_TYPE,
    EV_SNAP_GQL_GITHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN_BY_TYPE,
    EV_SNAP_GQL_GITHUB_ISSUES_UPDATED_IN_PERIOD_BY_COLUMN_ASSIGNED_TO_MEMBERS_BY_TYPE,
    EV_HIST_GQL_GITHUB_ISSUES_BY_COLUMN_ASSIGNED_TO_MEMBERS_BY_TYPE,
    EV_HIST_GQL_GITHUB_ISSUES_WITH_PULL_REQUESTS_BY_STATUS_BY_COLUMN_BY_TYPE,
    EV_HIST_GQL_GITHUB_ISSUES_MOVED_IN_PERIOD_BY_COLUMN_ASSIGNED_TO_MEMBERS_BY_TYPE,
    EV_HIST_GQL_GITHUB_MERGED_PULL_REQUESTS_MERGED_BY_MEMBER,
    EV_HIST_GQL_GITHUB_MERGED_PULL_REQUESTS_WITH_REVIEWS_BY_STATE_MERGED_BY_MEMBER,
    EV_HIST_GQL_GITHUB_REVIEWABLE_PULL_REQUESTS_NOT_AUTHORED_BY_MEMBER,
    EV_HIST_GQL_GITHUB_REVIEWABLE_PULL_REQUESTS_COMMENTED_OR_REVIEWED_BY_MEMBER,
} from './implementations/github.event.js';
import {
    EV_BLUEJAY_LOGS_BY_NUMBER,
    EV_BLUEJAY_LOGS_BY_LEVEL,
} from './implementations/bluejay.event.js';
import {
    EV_SNAP_GQL_ZENHUB_ISSUES_BY_COLUMN_CREATED_AFTER_DATE_ASSIGNED_TO_MEMBER,
    EV_SNAP_GQL_ZENHUB_SNAP_GQL_GITHUB_ISSUES_WITH_BRANCHES_BY_COLUMN,
    EV_SNAP_GQL_ZENHUB_SNAP_GQL_GITHUB_ISSUES_WITH_PULL_REQUESTS_BY_STATUS_BY_COLUMN_CREATED_AFTER_DATE,
    EV_SNAP_GQL_ZENHUB_SNAP_GQL_GITHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN,
    EV_SNAP_GQL_ZENHUB_ISSUES_UPDATED_IN_PERIOD_BY_COLUMN_ASSIGNED_TO_MEMBER,
} from './implementations/zenhub.event.js';
import {
    EV_HIST_REST_GITLAB_NON_MERGE_COMMITS_AUTHORED_BY_MEMBER,
    EV_HIST_GQL_GITLAB_OPENED_MERGE_REQUESTS_AUTHORED_BY_MEMBER,
    EV_HIST_GQL_GITLAB_MERGED_MERGE_REQUESTS_AUTHORED_BY_MEMBER,
    EV_HIST_GQL_GITLAB_MERGE_REQUEST_COMMENTS_AUTHORED_BY_MEMBER,
    EV_HIST_GQL_GITLAB_MERGE_REQUEST_APPROVALS_BY_MEMBER,
    EV_SNAP_REST_GITLAB_CLOSED_ISSUES_ASSIGNED_TO_MEMBER,
} from './implementations/gitlab.event.js';

export const events: Record<string, IEvent> = {
    EV_SNAP_GQL_GITHUB_ISSUES_BY_COLUMN_ASSIGNED_TO_MEMBERS_BY_TYPE,
    EV_SNAP_GQL_GITHUB_ISSUES_WITH_BRANCHES_BY_COLUMN_BY_TYPE,
    EV_SNAP_GQL_GITHUB_ISSUES_WITH_PULL_REQUESTS_BY_STATUS_BY_COLUMN_BY_TYPE,
    EV_SNAP_GQL_GITHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN_BY_TYPE,
    EV_SNAP_GQL_GITHUB_ISSUES_UPDATED_IN_PERIOD_BY_COLUMN_ASSIGNED_TO_MEMBERS_BY_TYPE,
    EV_HIST_GQL_GITHUB_ISSUES_BY_COLUMN_ASSIGNED_TO_MEMBERS_BY_TYPE,
    EV_HIST_GQL_GITHUB_ISSUES_WITH_PULL_REQUESTS_BY_STATUS_BY_COLUMN_BY_TYPE,
    EV_HIST_GQL_GITHUB_ISSUES_MOVED_IN_PERIOD_BY_COLUMN_ASSIGNED_TO_MEMBERS_BY_TYPE,
    EV_HIST_GQL_GITHUB_MERGED_PULL_REQUESTS_MERGED_BY_MEMBER,
    EV_HIST_GQL_GITHUB_MERGED_PULL_REQUESTS_WITH_REVIEWS_BY_STATE_MERGED_BY_MEMBER,
    EV_HIST_GQL_GITHUB_REVIEWABLE_PULL_REQUESTS_NOT_AUTHORED_BY_MEMBER,
    EV_HIST_GQL_GITHUB_REVIEWABLE_PULL_REQUESTS_COMMENTED_OR_REVIEWED_BY_MEMBER,
    EV_BLUEJAY_LOGS_BY_LEVEL,
    EV_BLUEJAY_LOGS_BY_NUMBER,
    EV_SNAP_GQL_ZENHUB_ISSUES_BY_COLUMN_CREATED_AFTER_DATE_ASSIGNED_TO_MEMBER,
    EV_SNAP_GQL_ZENHUB_SNAP_GQL_GITHUB_ISSUES_WITH_BRANCHES_BY_COLUMN,
    EV_SNAP_GQL_ZENHUB_SNAP_GQL_GITHUB_ISSUES_WITH_PULL_REQUESTS_BY_STATUS_BY_COLUMN_CREATED_AFTER_DATE,
    EV_SNAP_GQL_ZENHUB_SNAP_GQL_GITHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN,
    EV_SNAP_GQL_ZENHUB_ISSUES_UPDATED_IN_PERIOD_BY_COLUMN_ASSIGNED_TO_MEMBER,
    EV_HIST_REST_GITLAB_NON_MERGE_COMMITS_AUTHORED_BY_MEMBER,
    EV_HIST_GQL_GITLAB_OPENED_MERGE_REQUESTS_AUTHORED_BY_MEMBER,
    EV_HIST_GQL_GITLAB_MERGED_MERGE_REQUESTS_AUTHORED_BY_MEMBER,
    EV_HIST_GQL_GITLAB_MERGE_REQUEST_COMMENTS_AUTHORED_BY_MEMBER,
    EV_HIST_GQL_GITLAB_MERGE_REQUEST_APPROVALS_BY_MEMBER,
    EV_SNAP_REST_GITLAB_CLOSED_ISSUES_ASSIGNED_TO_MEMBER,
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
