import { z } from 'zod';
import { IEvent } from '../../../types/event.js';
import { IFetch } from '../../../types/fetch.js';
import * as fetcherUtils from '../utils/fetcher.util.js';
import { isIssueInStatus, ProjectIssue } from '../utils/projectItems.util.js';
import { getPeriodStartDateFromAnchorDateAndPeriod } from '../utils/window.util.js';

export const EV_GITHUB_COMMITS: IEvent = {
    id: 'EV_GITHUB_COMMITS',
    moreInfo: {
        title: 'Number of Commits by Team',
        description: 'Total number of commits made to a specific repository by the entire team.',
        example:
            'If the team made 50 commits to the repository in the last month, the metric value would be 50.',
    },
    fetcherConfigSchemas: [
        {
            fetcherId: 'FT_REST_GITHUB_COMMITS',
            fetcherConfigSchema: z.object({
                tag: z.string(),
                branch: z.string().optional(),
            }),
        },
    ],
    processConfigSchema: z.object({
        owner: z.string(),
        repository: z.string(),
    }),
    process(_date, _window, fetchs, _processConfig): Record<string, unknown>[] {
        const commitsFetch: IFetch = fetcherUtils.getFetchByFetcherId(
            'FT_REST_GITHUB_COMMITS',
            fetchs,
        );

        return commitsFetch.data as Record<string, unknown>[];
    },
};

export const EV_GITHUB_INPROGRESS_ISSUES: IEvent = {
    id: 'EV_GITHUB_INPROGRESS_ISSUES',
    moreInfo: {
        title: 'Number of In Progress Issues by Team',
        description:
            'Total number of issues currently in the "In progress" column of the GitHub ProjectV2 associated with the repository.',
        example:
            'If the team has 5 issues in the "In progress" column, the metric value would be 5.',
    },
    fetcherConfigSchemas: [
        {
            fetcherId: 'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetcherConfigSchema: z.object({
                owner: z.string(),
                repository: z.string(),
                token: z.string(),
            }),
        },
    ],
    processConfigSchema: z.object({}),
    process(_date, _window, fetchs, _processConfig): Record<string, unknown>[] {
        // Obtenemos datos del fetcher
        const issuesFetch: IFetch = fetcherUtils.getFetchByFetcherId(
            'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetchs,
        );

        const issues = issuesFetch.data as ProjectIssue[];

        return issues.filter((issue) => isIssueInStatus(issue, ['In progress'])) as Record<
            string,
            unknown
        >[];
    },
};

export const EV_GITHUB_INREVIEW_ISSUES: IEvent = {
    id: 'EV_GITHUB_INREVIEW_ISSUES',
    moreInfo: {
        title: 'Number of In Review Issues by Team',
        description:
            'Total number of issues currently in the "In review" column of the GitHub ProjectV2 associated with the repository.',
        example: 'If the team has 5 issues in the "In review" column, the metric value would be 5.',
    },
    fetcherConfigSchemas: [
        {
            fetcherId: 'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetcherConfigSchema: z.object({
                owner: z.string(),
                repository: z.string(),
                token: z.string(),
            }),
        },
    ],
    processConfigSchema: z.object({}),
    process(_date, _window, fetchs, _processConfig): Record<string, unknown>[] {
        // Obtenemos datos del fetcher
        const issuesFetch: IFetch = fetcherUtils.getFetchByFetcherId(
            'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetchs,
        );

        const issues = issuesFetch.data as ProjectIssue[];

        return issues.filter((issue) => isIssueInStatus(issue, ['In review'])) as Record<
            string,
            unknown
        >[];
    },
};

export const EV_GITHUB_DONE_ISSUES: IEvent = {
    id: 'EV_GITHUB_DONE_ISSUES',
    moreInfo: {
        title: 'Number of Done Issues by Team',
        description:
            'Total number of issues currently in the "Done" or "Closed" columns of the GitHub ProjectV2 associated with the repository.',
        example:
            'If the team has 7 issues across the "Done" and "Closed" columns, the metric value would be 7.',
    },
    fetcherConfigSchemas: [
        {
            fetcherId: 'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetcherConfigSchema: z.object({
                owner: z.string(),
                repository: z.string(),
                token: z.string(),
            }),
        },
    ],
    processConfigSchema: z.object({}),
    process(_date, _window, fetchs, _processConfig): Record<string, unknown>[] {
        // Obtenemos datos del fetcher
        const issuesFetch: IFetch = fetcherUtils.getFetchByFetcherId(
            'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetchs,
        );

        const issues = issuesFetch.data as ProjectIssue[];

        return issues.filter((issue) => isIssueInStatus(issue, ['Done', 'Closed'])) as Record<
            string,
            unknown
        >[];
    },
};

export const EV_GITHUB_INPROGRESS_ISSUES_WITH_ASSOCIATED_BRANCHES: IEvent = {
    id: 'EV_GITHUB_INPROGRESS_ISSUES_WITH_ASSOCIATED_BRANCHES',
    moreInfo: {
        title: 'Number of In Progress Issues with Associated Branches by Team',
        description:
            'Total number of issues currently in the "In progress" column of the GitHub ProjectV2 that have at least one branch linked to them.',
        example:
            'If 5 issues are "In progress" and 3 of them have an associated branch, the metric value would be 3.',
    },
    fetcherConfigSchemas: [
        {
            fetcherId: 'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetcherConfigSchema: z.object({
                owner: z.string(),
                repository: z.string(),
                token: z.string(),
            }),
        },
    ],
    processConfigSchema: z.object({}),
    process(_date, _window, fetchs, _processConfig): Record<string, unknown>[] {
        // Obtenemos datos del fetcher
        const issuesFetch: IFetch = fetcherUtils.getFetchByFetcherId(
            'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetchs,
        );

        const issues = issuesFetch.data as ProjectIssue[];
        return issues.filter(
            (issue) =>
                isIssueInStatus(issue, ['In progress']) &&
                issue.content.linkedBranches.nodes.length > 0,
        ) as Record<string, unknown>[];
    },
};

export const EV_GITHUB_INREVIEW_ISSUES_WITH_ASSOCIATED_OPEN_PR: IEvent = {
    id: 'EV_GITHUB_INREVIEW_ISSUES_WITH_ASSOCIATED_OPEN_PR',
    moreInfo: {
        title: 'Number of In Review Issues with an Associated Open Pull Request by Team',
        description:
            'Total number of issues currently in the "In review" column of the GitHub ProjectV2 that have at least one associated pull request still in the OPEN state.',
        example:
            'If 4 issues are "In review" and 3 of them have an associated OPEN pull request, the metric value would be 3.',
    },
    fetcherConfigSchemas: [
        {
            fetcherId: 'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetcherConfigSchema: z.object({
                owner: z.string(),
                repository: z.string(),
                token: z.string(),
            }),
        },
    ],
    processConfigSchema: z.object({}),
    process(_date, _window, fetchs, _processConfig): Record<string, unknown>[] {
        // Obtenemos datos del fetcher
        const issuesFetch: IFetch = fetcherUtils.getFetchByFetcherId(
            'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetchs,
        );

        const issues = issuesFetch.data as ProjectIssue[];

        return issues.filter(
            (issue) =>
                isIssueInStatus(issue, ['In review']) &&
                issue.content.closedByPullRequestsReferences.nodes.some(
                    (pr) => pr.state === 'OPEN',
                ),
        ) as Record<string, unknown>[];
    },
};

export const EV_GITHUB_DONE_ISSUES_WITH_ASSOCIATED_CLOSED_PR: IEvent = {
    id: 'EV_GITHUB_DONE_ISSUES_WITH_ASSOCIATED_CLOSED_PR',
    moreInfo: {
        title: 'Number of Done Issues with an Associated Merged Pull Request by Team',
        description:
            'Total number of issues currently in the "Done" or "Closed" columns of the GitHub ProjectV2 that have at least one associated pull request in the MERGED state.',
        example:
            'If 5 issues are "Done" or "Closed" and 4 of them have an associated MERGED pull request, the metric value would be 4.',
    },
    fetcherConfigSchemas: [
        {
            fetcherId: 'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetcherConfigSchema: z.object({
                owner: z.string(),
                repository: z.string(),
                token: z.string(),
            }),
        },
    ],
    processConfigSchema: z.object({}),
    process(_date, _window, fetchs, _processConfig): Record<string, unknown>[] {
        // Obtenemos datos del fetcher
        const issuesFetch: IFetch = fetcherUtils.getFetchByFetcherId(
            'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetchs,
        );

        const issues = issuesFetch.data as ProjectIssue[];

        return issues.filter(
            (issue) =>
                isIssueInStatus(issue, ['Done', 'Closed']) &&
                issue.content.closedByPullRequestsReferences.nodes.some(
                    (pr) => pr.state === 'MERGED',
                ),
        ) as Record<string, unknown>[];
    },
};

export const EV_GITHUB_BRANCHES_ASSOCIATED_TO_INPROGRESS_ISSUES: IEvent = {
    id: 'EV_GITHUB_BRANCHES_ASSOCIATED_TO_INPROGRESS_ISSUES',
    moreInfo: {
        title: 'Number of Distinct Branches Associated with In Progress Issues by Team',
        description:
            'Total number of distinct branch names linked to issues currently in the "In progress" column of the GitHub ProjectV2. Branches shared across multiple issues are counted once.',
        example:
            'If 3 "In progress" issues link to [feat/a, feat/b], [feat/a] and [feat/c] respectively, the metric value would be 3 (feat/a, feat/b, feat/c).',
    },
    fetcherConfigSchemas: [
        {
            fetcherId: 'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetcherConfigSchema: z.object({
                owner: z.string(),
                repository: z.string(),
                token: z.string(),
            }),
        },
    ],
    processConfigSchema: z.object({}),
    process(_date, _window, fetchs, _processConfig): Record<string, unknown>[] {
        // Obtenemos datos del fetcher
        const issuesFetch: IFetch = fetcherUtils.getFetchByFetcherId(
            'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetchs,
        );

        const issues = issuesFetch.data as ProjectIssue[];
        const uniqueBranches = new Set(
            issues
                .filter((issue) => isIssueInStatus(issue, ['In progress']))
                .flatMap(
                    // flatmap aplana un nivel
                    (issue) => issue.content.linkedBranches.nodes.map((branch) => branch.ref.name),
                ),
        );

        return [...uniqueBranches].map((name) => ({ branch: name }));
    },
};

export const EV_GITHUB_INPROGRESSISSUES_MEMBER: IEvent = {
    id: 'EV_GITHUB_INPROGRESSISSUES_MEMBER',
    moreInfo: {
        title: 'Number of In Progress Issues by Member',
        description:
            'Total number of issues currently in the "In progress" column of the GitHub ProjectV2 that are assigned to a specific member.',
        example:
            'If the member has 2 issues assigned in the "In progress" column, the metric value would be 2.',
    },
    fetcherConfigSchemas: [
        {
            fetcherId: 'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetcherConfigSchema: z.object({
                owner: z.string(),
                repository: z.string(),
                token: z.string(),
            }),
        },
    ],
    processConfigSchema: z.object({
        username: z.string(),
    }),
    process(_date, _window, fetchs, processConfig): Record<string, unknown>[] {
        // Obtenemos datos del fetcher
        const issuesFetch: IFetch = fetcherUtils.getFetchByFetcherId(
            'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetchs,
        );

        const issues = issuesFetch.data as ProjectIssue[];

        return issues.filter(
            (issue) =>
                isIssueInStatus(issue, ['In progress']) &&
                issue.content.assignees.nodes.some((user) => user.login === processConfig.username),
        ) as Record<string, unknown>[];
    },
};

export const EV_GITHUB_DONEISSUES_MEMBER: IEvent = {
    id: 'EV_GITHUB_DONEISSUES_MEMBER',
    moreInfo: {
        title: 'Number of Done Issues by Member within the Current Period',
        description:
            'Total number of issues in the "Done" or "Closed" columns of the GitHub ProjectV2 assigned to a specific member whose "updatedAt" timestamp falls within the current period window.',
        example:
            'If the member closed 3 issues during the current week, the metric value would be 3.',
    },
    fetcherConfigSchemas: [
        {
            fetcherId: 'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetcherConfigSchema: z.object({
                owner: z.string(),
                repository: z.string(),
                token: z.string(),
            }),
        },
    ],
    processConfigSchema: z.object({
        username: z.string(),
    }),
    process(date, window, fetchs, processConfig): Record<string, unknown>[] {
        // Obtenemos datos del fetcher
        const issuesFetch: IFetch = fetcherUtils.getFetchByFetcherId(
            'FT_GQL_GITHUB_PROJECTV2_ITEMS',
            fetchs,
        );

        const from = getPeriodStartDateFromAnchorDateAndPeriod(
            date,
            window.anchorDate,
            window.period,
        );
        const to = date;

        const issues = issuesFetch.data as ProjectIssue[];

        return issues.filter((issue) => {
            const updatedAt = new Date(issue.content.updatedAt);
            return (
                isIssueInStatus(issue, ['Done', 'Closed']) &&
                issue.content.assignees.nodes.some(
                    (user) => user.login === processConfig.username,
                ) &&
                updatedAt >= from &&
                updatedAt <= to
            );
        }) as Record<string, unknown>[];
    },
};
