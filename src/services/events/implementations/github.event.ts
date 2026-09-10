import { z } from 'zod';
import { IEvent } from '../../../types/event.js';
import { IFetch } from '../../../types/fetch.js';
import { getFetchByFetcherId } from '../utils/fetcher.util.js';
import { getPeriodStartDateFromAnchorDateAndPeriod } from '../utils/window.util.js';
import {
    AssigneeEvent,
    BasicProjectIssue,
    IssueEvent,
    ProjectIssue,
    PULL_REQUEST_TYPES,
    PullRequest,
    PullRequestConnectionEvent,
    PullRequestType,
    TimelineEvent,
    TypeEvent,
} from '../../../types/github.event.js';

const getBasicProjectIssues = (fetchs: IFetch[]): BasicProjectIssue[] => {
    const items = getFetchByFetcherId('FT_GQL_GITHUB_PROJECTV2_ITEMS_BASIC', fetchs)
        .data as BasicProjectIssue[];
    return items.filter((item) => item.content?.__typename === 'Issue');
};

const getProjectIssues = (fetchs: IFetch[]): ProjectIssue[] => {
    const items = getFetchByFetcherId('FT_GQL_GITHUB_PROJECTV2_ITEMS', fetchs)
        .data as ProjectIssue[];
    return items.filter((item) => item.content?.__typename === 'Issue');
};

const getPullRequests = (fetchs: IFetch[]): PullRequest[] => {
    return getFetchByFetcherId('FT_GQL_GITHUB_PULL_REQUESTS', fetchs).data as PullRequest[];
};

const getLastEventByDate = (events: TimelineEvent[], date: Date, from?: Date) => {
    return events
        .filter(
            (event) =>
                new Date(event.createdAt) <= date && (!from || new Date(event.createdAt) >= from),
        )
        .at(-1);
};

const isIssueAtAnyStatus = (issue: BasicProjectIssue, statuses: string[]): boolean => {
    const status = issue.fieldValueByName?.status;
    return status != null && statuses.includes(status);
};

const isIssueAtAnyStatusTimeline = (
    issue: ProjectIssue,
    statuses: string[],
    date: Date,
    from?: Date,
): boolean => {
    const timelineItems = issue.content.timelineItems.nodes.filter(
        (item): item is IssueEvent => item.__typename === 'ProjectV2ItemStatusChangedEvent',
    );
    const statusInThatMoment = getLastEventByDate(timelineItems, date, from) as
        | IssueEvent
        | undefined;
    return statusInThatMoment != null && statuses.includes(statusInThatMoment.status);
};

const isIssueAtType = (issue: BasicProjectIssue, type: string) => {
    return issue.content.issueType.name === type;
};

const isIssueAtTypeTimeline = (issue: ProjectIssue, type: string, date: Date) => {
    const typeEvents = issue.content.timelineItems.nodes.filter(
        (item): item is TypeEvent =>
            item.__typename === 'IssueTypeAddedEvent' ||
            item.__typename === 'IssueTypeRemovedEvent' ||
            item.__typename === 'IssueTypeChangedEvent',
    );

    const typeInThatMoment = getLastEventByDate(typeEvents, date) as TypeEvent | undefined;
    return (
        typeInThatMoment != null &&
        typeInThatMoment.__typename !== 'IssueTypeRemovedEvent' &&
        type === typeInThatMoment.issueType.name
    );
};

const isIssueAssignedToUsernamesTimeline = (
    issue: ProjectIssue,
    usernames: string[],
    date: Date,
) => {
    const assignees = new Set<string>();
    const assigneeEvents = issue.content.timelineItems.nodes.filter(
        (item): item is AssigneeEvent =>
            new Date(item.createdAt) <= date &&
            (item.__typename === 'AssignedEvent' || item.__typename === 'UnassignedEvent') &&
            item.assignee.__typename === 'User',
    );
    for (const event of assigneeEvents) {
        if (event.__typename === 'AssignedEvent') {
            assignees.add(event.assignee.login);
        } else {
            assignees.delete(event.assignee.login);
        }
    }

    return usernames.every((username) => assignees.has(username));
};

const isPrInStatusTimeline = (
    closedAt: string | null,
    mergedAt: string | null,
    status: PullRequestType,
    date: Date,
) => {
    const closed = closedAt != null && new Date(closedAt) <= date;
    const merged = mergedAt != null && new Date(mergedAt) <= date;
    if (status === 'OPEN') return !closed && !merged;
    if (status === 'MERGED') return merged;
    return closed && !merged; // CLOSED status
};

const isIssueAssociatedToPullRequestByStatusTimeline = (
    issue: ProjectIssue,
    status: PullRequestType,
    date: Date,
) => {
    // 1. Get associated pull requests in that moment
    const lastEventByPr = new Map<number, PullRequestConnectionEvent>();
    // Add PRs to map by number
    for (const item of issue.content.timelineItems.nodes) {
        if (
            (item.__typename !== 'ConnectedEvent' && item.__typename !== 'DisconnectedEvent') ||
            item.subject.__typename !== 'PullRequest' ||
            new Date(item.createdAt) > date
        ) {
            continue;
        } else {
            lastEventByPr.set(item.subject.number, item);
        }
    }
    for (const lastEvent of lastEventByPr.values()) {
        if (lastEvent.__typename !== 'ConnectedEvent') continue;
        // 2. Check if any of the associated Prs is in the specified status
        const { closedAt, mergedAt } = lastEvent.subject;
        if (isPrInStatusTimeline(closedAt, mergedAt, status, date)) {
            return true;
        }
    }
    return false;
};

// Uso de tpa: COUNT_INPROGRESS_ISSUES, COUNT_INREVIEW_ISSUES, COUNT_DONE_ISSUES, COUNT_INPROGRESSISSUES_MEMBER
export const EV_GITHUB_ISSUES_BY_COLUMN: IEvent = {
    id: 'EV_GITHUB_ISSUES_BY_COLUMN',
    moreInfo: {
        title: 'Issues by Status',
        description:
            'Number of issues in the specified status columns of the GitHub ProjectV2 boards associated with the repository. Optionally filtered by assigned usernames and issue type.',
        example:
            'If columns is ["In Progress"] and usernames contains ["alice"], only issues in that column assigned to alice are counted.',
    },
    fetcherIds: ['FT_GQL_GITHUB_PROJECTV2_ITEMS'],
    processConfigSchema: z.object({
        columns: z.array(
            z.enum(['In Progress', 'In progress', 'In Review', 'In review', 'Done', 'Closed']),
        ),
        usernames: z.array(z.string()).optional(),
        type: z.string().optional(),
    }),
    process(date, _window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns, usernames, type } = processConfig as {
            columns: string[];
            usernames?: string[];
            type?: string;
        };
        const issues = getProjectIssues(fetchs);

        return issues.filter(
            (issue) =>
                isIssueAtAnyStatusTimeline(issue, columns, date) &&
                (!usernames || isIssueAssignedToUsernamesTimeline(issue, usernames, date)) &&
                (!type || isIssueAtTypeTimeline(issue, type, date)),
        );
    },
};

// Uso de tpa: COUNT_INPROGRESS_ISSUES_WITH_ASSOCIATED_BRANCHES
export const EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_BRANCHES: IEvent = {
    id: 'EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_BRANCHES',
    moreInfo: {
        title: 'Issues by Status with Associated Branches',
        description:
            'Number of issues in the specified status columns of the GitHub ProjectV2 that have at least one branch linked to them. Optionally filtered by issue type.',
        example:
            'If columns is ["In Progress"], 5 issues are in that column and 3 have an associated branch, the metric value would be 3.',
    },
    fetcherIds: ['FT_GQL_GITHUB_PROJECTV2_ITEMS_BASIC'],
    processConfigSchema: z.object({
        columns: z.array(
            z.enum(['In Progress', 'In progress', 'In Review', 'In review', 'Done', 'Closed']),
        ),
        type: z.string().optional(),
    }),
    process(_date, _window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns, type } = processConfig as { columns: string[]; type?: string };
        const issues = getBasicProjectIssues(fetchs);
        return issues.filter(
            (issue) =>
                isIssueAtAnyStatus(issue, columns) &&
                (!type || isIssueAtType(issue, type)) &&
                issue.content.linkedBranches.nodes.length > 0,
        );
    },
};

// Uso de tpa: COUNT_INREVIEW_ISSUES_WITH_ASSOCIATED_OPEN_PR, COUNT_DONE_ISSUES_WITH_ASSOCIATED_CLOSED_PR
export const EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_PULL_REQUESTS_BY_STATUS: IEvent = {
    id: 'EV_GITHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_PULL_REQUESTS_BY_STATUS',
    moreInfo: {
        title: 'Issues by Status with Associated Pull Requests by PR State',
        description:
            'Number of issues in the specified status columns of the GitHub ProjectV2 that have at least one associated pull request in the specified PR state. Optionally filtered by issue type.',
        example:
            'If columns is ["In Review"], status is "OPEN", 4 issues are in that column and 3 have an OPEN PR, the metric value would be 3.',
    },
    fetcherIds: ['FT_GQL_GITHUB_PROJECTV2_ITEMS'],
    processConfigSchema: z.object({
        columns: z.array(
            z.enum(['In Progress', 'In progress', 'In Review', 'In review', 'Done', 'Closed']),
        ),
        status: z.enum(PULL_REQUEST_TYPES),
        type: z.string().optional(),
    }),
    process(date, _window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns, status, type } = processConfig as {
            columns: string[];
            status: PullRequestType;
            type?: string;
        };
        const issues = getProjectIssues(fetchs);
        return issues.filter(
            (issue) =>
                isIssueAtAnyStatusTimeline(issue, columns, date) &&
                (!type || isIssueAtTypeTimeline(issue, type, date)) &&
                isIssueAssociatedToPullRequestByStatusTimeline(issue, status, date),
        );
    },
};

// Uso de tpa: COUNT_BRANCHES_ASSOCIATED_TO_INPROGRESS_ISSUES
export const EV_GITHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN: IEvent = {
    id: 'EV_GITHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN',
    moreInfo: {
        title: 'Distinct Branches by Status',
        description:
            'Number of issues in the specified status columns of the GitHub ProjectV2 that contribute at least one branch not already seen in previous matching issues. Optionally filtered by issue type.',
        example:
            'If columns is ["In Progress"] with issues is1->[feat/a], is2->[feat/a] and is3->[feat/b], the metric value would be 2.',
    },
    fetcherIds: ['FT_GQL_GITHUB_PROJECTV2_ITEMS_BASIC'],
    processConfigSchema: z.object({
        columns: z.array(
            z.enum(['In Progress', 'In progress', 'In Review', 'In review', 'Done', 'Closed']),
        ),
        type: z.string().optional(),
    }),
    process(_date, _window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns, type } = processConfig as { columns: string[]; type?: string };
        const issues = getBasicProjectIssues(fetchs);
        const knownBranches = new Set<string>();
        const issuesWithDifferentBranches: BasicProjectIssue[] = [];
        // TODO: se puede integrar con el evento de zenhub que comparte lógica interna
        for (const issue of issues.filter(
            (issue) => isIssueAtAnyStatus(issue, columns) && (!type || isIssueAtType(issue, type)),
        )) {
            let issueAdded = false;

            for (const branch of issue.content.linkedBranches.nodes) {
                const branchName = branch.ref?.name;
                if (!branchName || knownBranches.has(branchName)) continue;

                knownBranches.add(branchName);
                if (!issueAdded) {
                    issuesWithDifferentBranches.push(issue);
                    issueAdded = true;
                }
            }
        }

        return issuesWithDifferentBranches;
    },
};

// Uso de tpa: COUNT_DONEISSUES_MEMBER
export const EV_GITHUB_ISSUES_BY_COLUMN_FILTERED_BY_PERIOD_ASSOCIATED_TO_MEMBER: IEvent = {
    id: 'EV_GITHUB_ISSUES_BY_COLUMN_FILTERED_BY_PERIOD_ASSOCIATED_TO_MEMBER',
    moreInfo: {
        title: 'Issues by Status Assigned to Member Filtered by Period',
        description:
            'Number of issues in the specified status columns of the GitHub ProjectV2 assigned to specific members whose status events timestamp falls within the current period window. Optionally filtered by issue type.',
        example:
            'If columns is ["Done", "Closed"] and the member updated 3 issues during the current week, the metric value would be 3.',
    },
    fetcherIds: ['FT_GQL_GITHUB_PROJECTV2_ITEMS'],
    processConfigSchema: z.object({
        columns: z.array(
            z.enum(['In Progress', 'In progress', 'In Review', 'In review', 'Done', 'Closed']),
        ),
        usernames: z.array(z.string()),
        type: z.string().optional(),
    }),
    process(date, window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns, usernames, type } = processConfig as {
            columns: string[];
            usernames: string[];
            type?: string;
        };
        const issues = getProjectIssues(fetchs);
        const from = getPeriodStartDateFromAnchorDateAndPeriod(
            date,
            window.anchorDate,
            window.period,
        );
        return issues.filter(
            (issue) =>
                isIssueAtAnyStatusTimeline(issue, columns, date, from) &&
                (!type || isIssueAtTypeTimeline(issue, type, date)) &&
                isIssueAssignedToUsernamesTimeline(issue, usernames, date),
        );
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
                pr.reviews.nodes.some(
                    (review) =>
                        review.state === processConfig.reviewState &&
                        new Date(review.createdAt) <= to,
                )
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
            if (
                new Date(pr.createdAt) <= to &&
                isPrInStatusTimeline(pr.closedAt, pr.mergedAt, 'OPEN', to)
            )
                return true;
            if (isPrInStatusTimeline(pr.closedAt, pr.mergedAt, 'MERGED', to) && pr.mergedAt) {
                const createdAt = new Date(pr.createdAt);
                const mergedAt = new Date(pr.mergedAt);
                return (
                    Math.max(from.getTime(), createdAt.getTime()) <=
                    Math.min(to.getTime(), mergedAt.getTime())
                );
            }
            if (isPrInStatusTimeline(pr.closedAt, pr.mergedAt, 'CLOSED', to) && pr.closedAt) {
                const createdAt = new Date(pr.createdAt);
                const closedAt = new Date(pr.closedAt);
                return (
                    Math.max(from.getTime(), createdAt.getTime()) <=
                    Math.min(to.getTime(), closedAt.getTime())
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
                // PR currently OPEN in the period
                (new Date(pr.createdAt) <= to &&
                    isPrInStatusTimeline(pr.closedAt, pr.mergedAt, 'OPEN', to)) ||
                // PR finalized MERGED in the period but had OPEN interval on it
                (isPrInStatusTimeline(pr.closedAt, pr.mergedAt, 'MERGED', to) &&
                    pr.mergedAt &&
                    Math.max(from.getTime(), new Date(pr.createdAt).getTime()) <=
                        Math.min(to.getTime(), new Date(pr.mergedAt).getTime())) ||
                // PR finalized CLOSED in the period but had OPEN interval on it
                (isPrInStatusTimeline(pr.closedAt, pr.mergedAt, 'CLOSED', to) &&
                    pr.closedAt &&
                    Math.max(from.getTime(), new Date(pr.createdAt).getTime()) <=
                        Math.min(to.getTime(), new Date(pr.closedAt).getTime()));
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
