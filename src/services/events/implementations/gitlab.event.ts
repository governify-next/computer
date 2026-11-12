import { z } from 'zod';
import { IEvent } from '../../../types/event.js';
import { IFetch } from '../../../types/fetch.js';
import { getFetchByFetcherId } from '../utils/fetcher.util.js';
import { getPeriodStartDateFromAnchorDateAndPeriod } from '../utils/window.util.js';
import { ICommitGitlab, IItemGitlab, IMergeRequestGitlab } from '../../../types/gitlab.event.js';
import { usernameSchema } from '../../../types/schema.js';

const getCommits = (fetchs: IFetch[]): ICommitGitlab[] => {
    return getFetchByFetcherId('FT_REST_GITLAB_COMMITS', fetchs).data as ICommitGitlab[];
};

const getMergeRequests = (fetchs: IFetch[]): IMergeRequestGitlab[] => {
    return getFetchByFetcherId('FT_GQL_GITLAB_MERGE_REQUESTS', fetchs)
        .data as IMergeRequestGitlab[];
};

const getItems = (fetchs: IFetch[]): IItemGitlab[] => {
    return getFetchByFetcherId('FT_REST_GITLAB_ITEMS', fetchs).data as IItemGitlab[];
};

export const EV_GITLAB_COMMITS: IEvent = {
    id: 'EV_GITLAB_COMMITS',
    moreInfo: {
        title: 'GitLab Commits',
        description:
            'Non-merge commits authored within the current period window, on any branch. Optionally filtered by username.',
        example:
            'If username is "alice" and she authored 5 commits this week, 1 of them a merge commit, the metric value would be 4.',
    },
    fetcherIds: ['FT_REST_GITLAB_COMMITS'],
    processConfigSchema: z.object({
        username: usernameSchema.optional(),
    }),
    process(date, window, fetchs, processConfig): Record<string, unknown>[] {
        const commits = getCommits(fetchs);
        const from = getPeriodStartDateFromAnchorDateAndPeriod(
            date,
            window.anchorDate,
            window.period,
        );
        const to = new Date(date);
        return commits.filter((commit) => {
            const authoredDate = new Date(commit.authored_date);
            return (
                commit.parent_ids.length <= 1 && // 0: initial commit; 1: normal commit; 2: merge commit
                authoredDate >= from &&
                authoredDate <= to &&
                (!processConfig.username || commit.username === processConfig.username)
            );
        });
    },
};

export const EV_GITLAB_MRS_OPENED: IEvent = {
    id: 'EV_GITLAB_MRS_OPENED',
    moreInfo: {
        title: 'GitLab Opened Merge Requests',
        description:
            'Merge requests created within the current period window. Optionally filtered by the merge request author.',
        example:
            'If username is "alice" and she created 3 merge requests this week, 1 of them already merged and 1 closed without merging, the metric value would be 3.',
    },
    fetcherIds: ['FT_GQL_GITLAB_MERGE_REQUESTS'],
    processConfigSchema: z.object({
        username: usernameSchema.optional(),
    }),
    process(date, window, fetchs, processConfig): Record<string, unknown>[] {
        const mergeRequests = getMergeRequests(fetchs);
        const from = getPeriodStartDateFromAnchorDateAndPeriod(
            date,
            window.anchorDate,
            window.period,
        );
        const to = new Date(date);
        return mergeRequests.filter((mr) => {
            const createdAt = new Date(mr.createdAt);
            return (
                createdAt >= from &&
                createdAt <= to &&
                (!processConfig.username || mr.author?.username === processConfig.username)
            );
        });
    },
};

export const EV_GITLAB_MRS_MERGED: IEvent = {
    id: 'EV_GITLAB_MRS_MERGED',
    moreInfo: {
        title: 'GitLab Merged Merge Requests',
        description:
            'Merge requests merged within the current period window. Optionally filtered by the merge request author.',
        example:
            'If username is "alice" and 2 of her merge requests were merged this week, 1 of them by bob, the metric value would be 2.',
    },
    fetcherIds: ['FT_GQL_GITLAB_MERGE_REQUESTS'],
    processConfigSchema: z.object({
        username: usernameSchema.optional(),
    }),
    process(date, window, fetchs, processConfig): Record<string, unknown>[] {
        const mergeRequests = getMergeRequests(fetchs);
        const from = getPeriodStartDateFromAnchorDateAndPeriod(
            date,
            window.anchorDate,
            window.period,
        );
        const to = new Date(date);
        return mergeRequests.filter((mr) => {
            if (!mr.mergedAt) return false;
            const mergedAt = new Date(mr.mergedAt);
            return (
                mergedAt >= from &&
                mergedAt <= to &&
                (!processConfig.username || mr.author?.username === processConfig.username)
            );
        });
    },
};

export const EV_GITLAB_MR_COMMENTS: IEvent = {
    id: 'EV_GITLAB_MR_COMMENTS',
    moreInfo: {
        title: 'GitLab Merge Request Comments',
        description:
            'Comments posted on merge requests within the current period window. Optionally filtered by the comment author.',
        example:
            'If username is "alice" and she posted 3 comments this week, 2 of them on the same merge request and 1 on her own merge request, the metric value would be 3.',
    },
    fetcherIds: ['FT_GQL_GITLAB_MERGE_REQUESTS'],
    processConfigSchema: z.object({
        username: usernameSchema.optional(),
    }),
    process(date, window, fetchs, processConfig): Record<string, unknown>[] {
        const mergeRequests = getMergeRequests(fetchs);
        const from = getPeriodStartDateFromAnchorDateAndPeriod(
            date,
            window.anchorDate,
            window.period,
        );
        const to = new Date(date);
        return mergeRequests.flatMap((mr) =>
            mr.notes.nodes
                .filter((note) => {
                    const createdAt = new Date(note.createdAt);
                    return (
                        !note.system &&
                        createdAt >= from &&
                        createdAt <= to &&
                        (!processConfig.username ||
                            note.author?.username === processConfig.username)
                    );
                })
                .map((note) => ({ ...mr, notes: { nodes: [note] } })),
        );
    },
};

export const EV_GITLAB_MR_APPROVALS: IEvent = {
    id: 'EV_GITLAB_MR_APPROVALS',
    moreInfo: {
        title: 'GitLab Merge Request Approvals',
        description:
            'Approvals submitted on merge requests within the current period window. Optionally filtered by the approver.',
        example:
            'If username is "alice" and she approved 2 merge requests this week, then revoked 1 of the approvals, the metric value would be 2.',
    },
    fetcherIds: ['FT_GQL_GITLAB_MERGE_REQUESTS'],
    processConfigSchema: z.object({
        username: usernameSchema.optional(),
    }),
    process(date, window, fetchs, processConfig): Record<string, unknown>[] {
        const mergeRequests = getMergeRequests(fetchs);
        const from = getPeriodStartDateFromAnchorDateAndPeriod(
            date,
            window.anchorDate,
            window.period,
        );
        const to = new Date(date);
        return mergeRequests.flatMap((mr) =>
            mr.notes.nodes
                .filter((note) => {
                    const createdAt = new Date(note.createdAt);
                    return (
                        note.system &&
                        note.systemNoteMetadata?.action === 'approved' &&
                        createdAt >= from &&
                        createdAt <= to &&
                        (!processConfig.username ||
                            note.author?.username === processConfig.username)
                    );
                })
                .map((note) => ({ ...mr, notes: { nodes: [note] } })),
        );
    },
};

export const EV_GITLAB_ITEMS_CLOSED: IEvent = {
    id: 'EV_GITLAB_ITEMS_CLOSED',
    moreInfo: {
        title: 'GitLab Closed Work Items',
        description:
            'Work items of any type (issue, task, incident, test case) closed within the current period window. Optionally filtered by assignee.',
        example:
            'If username is "alice" and 3 work items assigned to her were closed this week, 1 of them by bob, the metric value would be 3.',
    },
    fetcherIds: ['FT_REST_GITLAB_ITEMS'],
    processConfigSchema: z.object({
        username: usernameSchema.optional(),
    }),
    process(date, window, fetchs, processConfig): Record<string, unknown>[] {
        const items = getItems(fetchs);
        const from = getPeriodStartDateFromAnchorDateAndPeriod(
            date,
            window.anchorDate,
            window.period,
        );
        const to = new Date(date);
        return items.filter((item) => {
            if (!item.closed_at) return false;
            const closedAt = new Date(item.closed_at);
            return (
                closedAt >= from &&
                closedAt <= to &&
                (!processConfig.username ||
                    item.assignees.some((assignee) => assignee.username === processConfig.username))
            );
        });
    },
};
