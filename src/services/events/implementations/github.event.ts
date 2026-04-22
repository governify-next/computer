import { z } from 'zod';
import { IEvent } from '../../../types/event.js';
import { IFetch } from '../../../types/fetch.js';
import {
    getProjectIssues,
    getPullRequests,
    isIssueAtAnyStatus,
} from '../utils/github.event.util.js';
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
    fetcherIds: ['FT_REST_GITHUB_COMMITS'],
    processConfigSchema: z.object({
        owner: z.string(),
        repository: z.string(),
    }),
    process(_date, _window, fetchs, _processConfig): Record<string, unknown>[] {
        const commitsFetch: IFetch = getFetchByFetcherId('FT_REST_GITHUB_COMMITS', fetchs);
        return commitsFetch.data as Record<string, unknown>[];
    },
};

// Uso de tpa: COUNT_INPROGRESS_ISSUES, COUNT_INREVIEW_ISSUES, COUNT_DONE_ISSUES
export const EV_GITHUB_ISSUES_BY_COLUMN: IEvent = {
    id: 'EV_GITHUB_ISSUES_BY_COLUMN',
    moreInfo: {
        title: 'Issues by Status',
        description:
            'Number of issues in the specified status columns of the GitHub ProjectV2 associated with the repository.',
        example:
            'If columns is ["In Progress"] and there are 5 issues in that column, the metric value would be 5.',
    },
    fetcherIds: ['FT_GQL_GITHUB_PROJECTV2_ITEMS'],
    processConfigSchema: z.object({
        columns: z.array(
            z.enum(['In Progress', 'In progress', 'In Review', 'In review', 'Done', 'Closed']),
        ),
    }),
    process(_date, _window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns } = processConfig as { columns: string[] }; // por usar unknown en event. Podría eliminarse con any pero salta lint
        const issues = getProjectIssues(fetchs);
        return issues.filter((issue) => isIssueAtAnyStatus(issue, columns));
    },
};

// Uso de tpa: COUNT_INPROGRESS_ISSUES_WITH_ASSOCIATED_BRANCHES
export const EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_BRANCHES: IEvent = {
    id: 'EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_BRANCHES',
    moreInfo: {
        title: 'Issues by Status with Associated Branches',
        description:
            'Number of issues in the specified status columns of the GitHub ProjectV2 that have at least one branch linked to them.',
        example:
            'If columns is ["In Progress"], 5 issues are in that column and 3 have an associated branch, the metric value would be 3.',
    },
    fetcherIds: ['FT_GQL_GITHUB_PROJECTV2_ITEMS'],
    processConfigSchema: z.object({
        columns: z.array(
            z.enum(['In Progress', 'In progress', 'In Review', 'In review', 'Done', 'Closed']),
        ),
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

// Uso de tpa: COUNT_INREVIEW_ISSUES_WITH_ASSOCIATED_OPEN_PR, COUNT_DONE_ISSUES_WITH_ASSOCIATED_CLOSED_PR
export const EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_PULL_REQUESTS_BY_STATUS: IEvent = {
    id: 'EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_PULL_REQUESTS_BY_STATUS',
    moreInfo: {
        title: 'Issues by Status with Associated Pull Requests by PR State',
        description:
            'Number of issues in the specified status columns of the GitHub ProjectV2 that have at least one associated pull request in the specified PR state.',
        example:
            'If columns is ["In Review"], status is "OPEN", 4 issues are in that column and 3 have an OPEN PR, the metric value would be 3.',
    },
    fetcherIds: ['FT_GQL_GITHUB_PROJECTV2_ITEMS'],
    processConfigSchema: z.object({
        columns: z.array(
            z.enum(['In Progress', 'In progress', 'In Review', 'In review', 'Done', 'Closed']),
        ),
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

// Uso de tpa: COUNT_BRANCHES_ASSOCIATED_TO_INPROGRESS_ISSUES
export const EV_GITHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN: IEvent = {
    id: 'EV_GITHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN',
    moreInfo: {
        title: 'Distinct Branches by Status',
        description:
            'Number of distinct branch names linked to issues in the specified status columns of the GitHub ProjectV2. Branches shared across multiple issues are counted once.',
        example:
            'If columns is ["In Progress"] and 3 issues link to [feat/a, feat/b], [feat/a] and [feat/c], the metric value would be 3 (feat/a, feat/b, feat/c).',
    },
    fetcherIds: ['FT_GQL_GITHUB_PROJECTV2_ITEMS'],
    processConfigSchema: z.object({
        columns: z.array(
            z.enum(['In Progress', 'In progress', 'In Review', 'In review', 'Done', 'Closed']),
        ),
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

// Uso de tpa: COUNT_INPROGRESSISSUES_MEMBER
export const EV_GITHUB_ISSUES_BY_COLUMN_ASSOCIATED_TO_MEMBER: IEvent = {
    id: 'EV_GITHUB_ISSUES_BY_COLUMN_ASSOCIATED_TO_MEMBER',
    moreInfo: {
        title: 'Issues by Status Assigned to Member',
        description:
            'Number of issues in the specified status columns of the GitHub ProjectV2 that are assigned to a specific member.',
        example:
            'If columns is ["In Progress"] and the member has 2 issues assigned in that column, the metric value would be 2.',
    },
    fetcherIds: ['FT_GQL_GITHUB_PROJECTV2_ITEMS'],
    processConfigSchema: z.object({
        columns: z.array(
            z.enum(['In Progress', 'In progress', 'In Review', 'In review', 'Done', 'Closed']),
        ),
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

// Uso de tpa: COUNT_DONEISSUES_MEMBER
export const EV_GITHUB_ISSUES_BY_COLUMN_FILTERED_BY_UPDATED_AT_DATE_ASSOCIATED_TO_MEMBER: IEvent = {
    id: 'EV_GITHUB_ISSUES_BY_COLUMN_FILTERED_BY_UPDATED_AT_DATE_ASSOCIATED_TO_MEMBER',
    moreInfo: {
        title: 'Issues by Status Assigned to Member Filtered by Update Date',
        description:
            'Number of issues in the specified status columns of the GitHub ProjectV2 assigned to a specific member whose updatedAt timestamp falls within the current period window.',
        example:
            'If columns is ["Done", "Closed"] and the member updated 3 issues during the current week, the metric value would be 3.',
    },
    fetcherIds: ['FT_GQL_GITHUB_PROJECTV2_ITEMS'],
    processConfigSchema: z.object({
        columns: z.array(
            z.enum(['In Progress', 'In progress', 'In Review', 'In review', 'Done', 'Closed']),
        ),
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
        const to = new Date(date);
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

// Uso del tpa: COUNT_PR_MERGED_TEAM, COUNT_PR_MERGED_MEMBER
export const EV_GITHUB_PR_MERGED: IEvent = {
    id: 'EV_GITHUB_PR_MERGED',
    moreInfo: {
        title: 'Merged Pull Requests',
        description:
            'Number of pull requests merged within the current period window. Optionally filtered by the user who performed the merge.',
        example:
            'If 10 PRs were merged this week and username is "alice", only the PRs merged by alice are counted.',
    },
    fetcherIds: ['FT_GQL_GITHUB_PULL_REQUESTS'],
    processConfigSchema: z.object({
        username: z.string().optional(),
    }),
    process(date, window, fetchs, processConfig): Record<string, unknown>[] {
        const pullRequests = getPullRequests(fetchs);
        const from = getPeriodStartDateFromAnchorDateAndPeriod(
            date,
            window.anchorDate,
            window.period,
        );
        const to = new Date(date);
        return pullRequests.filter((pr) => {
            if (!pr.mergedAt) return false;
            const mergedAt = new Date(pr.mergedAt);
            return (
                mergedAt >= from &&
                mergedAt <= to &&
                (!processConfig.username || pr.mergedBy?.login === processConfig.username)
            );
        });
    },
};

// Uso del tpa: COUNT_MERGED_PR_WITH_POSITIVE_REVIEWS_TEAM, COUNT_MERGED_PR_WITH_POSITIVE_REVIEWS_MEMBER
// Necesidad de separar de la anterior por uso compartido en una garantía
export const EV_GITHUB_MERGED_PR_BY_REVIEW_STATE: IEvent = {
    id: 'EV_GITHUB_MERGED_PR_BY_REVIEW_STATE',
    moreInfo: {
        title: 'Merged Pull Requests by Review State',
        description:
            'Number of pull requests merged within the current period window that have at least one review in the specified state. Optionally filtered by the user who performed the merge.',
        example:
            'If 10 PRs were merged this week, reviewState is "APPROVED" and username is "alice", only the PRs merged by alice with at least one approved review are counted.',
    },
    fetcherIds: ['FT_GQL_GITHUB_PULL_REQUESTS'],
    processConfigSchema: z.object({
        username: z.string().optional(),
        reviewState: z.enum(['APPROVED', 'CHANGES_REQUESTED', 'COMMENTED', 'DISMISSED', 'PENDING']),
    }),
    process(date, window, fetchs, processConfig): Record<string, unknown>[] {
        const pullRequests = getPullRequests(fetchs);
        const from = getPeriodStartDateFromAnchorDateAndPeriod(
            date,
            window.anchorDate,
            window.period,
        );
        const to = new Date(date);
        return pullRequests.filter((pr) => {
            if (!pr.mergedAt) return false;
            const mergedAt = new Date(pr.mergedAt);
            return (
                mergedAt >= from &&
                mergedAt <= to &&
                (!processConfig.username || pr.mergedBy?.login === processConfig.username) &&
                pr.reviews.nodes.some((r) => r.state === processConfig.reviewState)
            );
        });
    },
};

// Uso del tpa: COUNT_PR
export const EV_GITHUB_PRS_FROM_OTHERS: IEvent = {
    id: 'EV_GITHUB_PRS_FROM_OTHERS',
    moreInfo: {
        title: 'Reviewable Pull Requests from Others',
        description:
            'Number of pull requests authored by other team members that were reviewable during the current period window: either currently OPEN, or MERGED with a lifetime overlapping the window.',
        example:
            'If username is "alice", the window is this week, and there are 8 PRs by others, 3 OPEN and 5 MERGED of which 4 overlapped the window, the metric value would be 7.',
    },
    fetcherIds: ['FT_GQL_GITHUB_PULL_REQUESTS'],
    processConfigSchema: z.object({
        username: z.string(),
    }),
    process(date, window, fetchs, processConfig): Record<string, unknown>[] {
        const pullRequests = getPullRequests(fetchs);
        const from = getPeriodStartDateFromAnchorDateAndPeriod(
            date,
            window.anchorDate,
            window.period,
        );
        const to = new Date(date);
        return pullRequests.filter((pr) => {
            if (pr.author.login === processConfig.username) return false;
            if (pr.state === 'OPEN') return true;
            if (pr.state === 'MERGED' && pr.mergedAt) {
                const createdAt = new Date(pr.createdAt);
                const mergedAt = new Date(pr.mergedAt);
                return (
                    Math.max(from.getTime(), createdAt.getTime()) <=
                    Math.min(to.getTime(), mergedAt.getTime())
                );
            }
            return false;
        });
    },
};

// Uso del tpa: COUNT_PRS_WITH_AT_LEAST_ONE_COMMENT_OR_ONE_REVIEW_COMMENT_BY_MEMBER
// Necesidad de separar de la anterior por uso compartido en una garantía
export const EV_GITHUB_PRS_WITH_COMMENT_OR_REVIEW_BY_MEMBER: IEvent = {
    id: 'EV_GITHUB_PRS_WITH_COMMENT_OR_REVIEW_BY_MEMBER',
    moreInfo: {
        title: 'Pull Requests from Others with Participation by Member',
        description:
            'Number of pull requests authored by other team members, reviewable during the current period window, where the specified member left at least one comment or one review with text during the window.',
        example:
            'If username is "alice", there are 7 reviewable PRs from others, and alice commented on 3 of them during the window, the metric value would be 3.',
    },
    fetcherIds: ['FT_GQL_GITHUB_PULL_REQUESTS'],
    processConfigSchema: z.object({
        username: z.string(),
    }),
    process(date, window, fetchs, processConfig): Record<string, unknown>[] {
        const pullRequests = getPullRequests(fetchs);
        const from = getPeriodStartDateFromAnchorDateAndPeriod(
            date,
            window.anchorDate,
            window.period,
        );
        const to = new Date(date);
        return pullRequests.filter((pr) => {
            if (pr.author.login === processConfig.username) return false;

            const isReviewable =
                pr.state === 'OPEN' ||
                (pr.state === 'MERGED' &&
                    pr.mergedAt &&
                    Math.max(from.getTime(), new Date(pr.createdAt).getTime()) <=
                        Math.min(to.getTime(), new Date(pr.mergedAt).getTime()));
            if (!isReviewable) return false;

            const hasComment = pr.comments.nodes.some((c) => {
                const commentDate = new Date(c.createdAt);
                return (
                    c.author.login === processConfig.username &&
                    commentDate >= from &&
                    commentDate <= to
                );
            });
            if (hasComment) return true;

            return pr.reviews.nodes.some((r) => {
                const reviewDate = new Date(r.createdAt);
                return (
                    r.bodyText.length > 0 &&
                    r.author.login === processConfig.username &&
                    reviewDate >= from &&
                    reviewDate <= to
                );
            });
        });
    },
};
