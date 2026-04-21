import { z } from 'zod';
import { IEvent } from '../../../types/event.js';
import { IFetch } from '../../../types/fetch.js';
import { getProjectIssues, isIssueAtAnyStatus } from '../utils/projectItems.util.js';
import { getPeriodStartDateFromAnchorDateAndPeriod } from '../utils/window.util.js';
import { getFetchByFetcherId } from '../utils/fetcher.util.js';

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
        const commitsFetch: IFetch = getFetchByFetcherId('FT_REST_GITHUB_COMMITS', fetchs);
        return commitsFetch.data as Record<string, unknown>[];
    },
};

// Uso de tpa: EV_GITHUB_INPROGRESS_ISSUES, EV_GITHUB_INREVIEW_ISSUES, EV_GITHUB_DONE_ISSUES
export const EV_GITHUB_ISSUES_BY_COLUMN: IEvent = {
    id: 'EV_GITHUB_ISSUES_BY_COLUMN',
    moreInfo: {
        title: 'Issues by Status',
        description:
            'Number of issues in the specified status columns of the GitHub ProjectV2 associated with the repository.',
        example:
            'If columns is ["In progress"] and there are 5 issues in that column, the metric value would be 5.',
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
        columns: z.array(z.enum(['In progress', 'In review', 'Done', 'Closed'])),
    }),
    process(_date, _window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns } = processConfig as { columns: string[] }; // por usar unknown en event. Podría eliminarse con any pero salta lint
        const issues = getProjectIssues(fetchs);
        return issues.filter((issue) => isIssueAtAnyStatus(issue, columns));
    },
};

// Uso de tpa: INPROGRESS_ISSUES_WITH_ASSOCIATED_BRANCHES
export const EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_BRANCHES: IEvent = {
    id: 'EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_BRANCHES',
    moreInfo: {
        title: 'Issues by Status with Associated Branches',
        description:
            'Number of issues in the specified status columns of the GitHub ProjectV2 that have at least one branch linked to them.',
        example:
            'If columns is ["In progress"], 5 issues are in that column and 3 have an associated branch, the metric value would be 3.',
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
        columns: z.array(z.enum(['In progress', 'In review', 'Done', 'Closed'])),
    }),
    process(_date, _window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns } = processConfig as { columns: string[] };
        const issues = getProjectIssues(fetchs);
        return issues.filter(
            (issue) =>
                isIssueAtAnyStatus(issue, columns) && issue.content.linkedBranches.nodes.length > 0,
        );
    },
};

// Uso de tpa: EV_GITHUB_INREVIEW_ISSUES_WITH_ASSOCIATED_OPEN_PR, EV_GITHUB_DONE_ISSUES_WITH_ASSOCIATED_CLOSED_PR
export const EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_PULL_REQUESTS_BY_STATUS: IEvent = {
    id: 'EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_PULL_REQUESTS_BY_STATUS',
    moreInfo: {
        title: 'Issues by Status with Associated Pull Requests by PR State',
        description:
            'Number of issues in the specified status columns of the GitHub ProjectV2 that have at least one associated pull request in the specified PR state.',
        example:
            'If columns is ["In review"], status is "OPEN", 4 issues are in that column and 3 have an OPEN PR, the metric value would be 3.',
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
        columns: z.array(z.enum(['In progress', 'In review', 'Done', 'Closed'])),
        status: z.enum(['OPEN', 'CLOSED', 'MERGED']),
    }),
    process(_date, _window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns } = processConfig as { columns: string[] };
        const issues = getProjectIssues(fetchs);
        return issues.filter(
            (issue) =>
                isIssueAtAnyStatus(issue, columns) &&
                issue.content.closedByPullRequestsReferences.nodes.some(
                    (pr) => pr.state === processConfig.status, // con comparaciones no salta el uso de unknown
                ),
        );
    },
};

// Uso de tpa: EV_GITHUB_BRANCHES_ASSOCIATED_TO_INPROGRESS_ISSUES
export const EV_GITHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN: IEvent = {
    id: 'EV_GITHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN',
    moreInfo: {
        title: 'Distinct Branches by Status',
        description:
            'Number of distinct branch names linked to issues in the specified status columns of the GitHub ProjectV2. Branches shared across multiple issues are counted once.',
        example:
            'If columns is ["In progress"] and 3 issues link to [feat/a, feat/b], [feat/a] and [feat/c], the metric value would be 3 (feat/a, feat/b, feat/c).',
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
        columns: z.array(z.enum(['In progress', 'In review', 'Done', 'Closed'])),
    }),
    process(_date, _window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns } = processConfig as { columns: string[] };
        const issues = getProjectIssues(fetchs);
        const uniqueBranches = new Set(
            issues
                .filter((issue) => isIssueAtAnyStatus(issue, columns))
                .flatMap((issue) =>
                    issue.content.linkedBranches.nodes.map((branch) => branch.ref.name),
                ),
        );
        return [...uniqueBranches].map((name) => ({ branch: name }));
    },
};

// Uso de tpa: EV_GITHUB_INPROGRESSISSUES_MEMBER
export const EV_GITHUB_ISSUES_BY_COLUMN_ASSOCIATED_TO_MEMBER: IEvent = {
    id: 'EV_GITHUB_ISSUES_BY_COLUMN_ASSOCIATED_TO_MEMBER',
    moreInfo: {
        title: 'Issues by Status Assigned to Member',
        description:
            'Number of issues in the specified status columns of the GitHub ProjectV2 that are assigned to a specific member.',
        example:
            'If columns is ["In progress"] and the member has 2 issues assigned in that column, the metric value would be 2.',
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
        columns: z.array(z.enum(['In progress', 'In review', 'Done', 'Closed'])),
        username: z.string(),
    }),
    process(_date, _window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns } = processConfig as { columns: string[] };
        const issues = getProjectIssues(fetchs);
        return issues.filter(
            (issue) =>
                isIssueAtAnyStatus(issue, columns) &&
                issue.content.assignees.nodes.some((user) => user.login === processConfig.username),
        ) as Record<string, unknown>[];
    },
};

// Uso de tpa: EV_GITHUB_DONEISSUES_MEMBER
export const EV_GITHUB_ISSUES_BY_COLUMN_FILTERED_BY_UPDATED_AT_DATE_ASSOCIATED_TO_MEMBER: IEvent = {
    id: 'EV_GITHUB_ISSUES_BY_COLUMN_FILTERED_BY_UPDATED_AT_DATE_ASSOCIATED_TO_MEMBER',
    moreInfo: {
        title: 'Issues by Status Assigned to Member Filtered by Update Date',
        description:
            'Number of issues in the specified status columns of the GitHub ProjectV2 assigned to a specific member whose updatedAt timestamp falls within the current period window.',
        example:
            'If columns is ["Done", "Closed"] and the member updated 3 issues during the current week, the metric value would be 3.',
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
        columns: z.array(z.enum(['In progress', 'In review', 'Done', 'Closed'])),
        username: z.string(),
    }),
    process(date, window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns } = processConfig as { columns: string[] };
        const issues = getProjectIssues(fetchs);
        const from = getPeriodStartDateFromAnchorDateAndPeriod(
            date,
            window.anchorDate,
            window.period,
        );
        const to = date;
        return issues.filter((issue) => {
            const updatedAt = new Date(issue.content.updatedAt);
            return (
                isIssueAtAnyStatus(issue, columns) &&
                issue.content.assignees.nodes.some(
                    (user) => user.login === processConfig.username,
                ) &&
                updatedAt >= from &&
                updatedAt <= to
            );
        }) as Record<string, unknown>[];
    },
};
