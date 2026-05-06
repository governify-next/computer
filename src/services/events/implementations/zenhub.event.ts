import { z } from 'zod';
import { IEvent } from '../../../types/event.js';
import { IFetch } from '../../../types/fetch.js';
import { getFetchByFetcherId } from '../utils/fetcher.util.js';
import { getPeriodStartDateFromAnchorDateAndPeriod } from '../utils/window.util.js';
import { GithubIssue, ZenhubData, ZenhubIssue } from '../../../types/zenhub.event.js';

const zenhubColumnsSchema = z.array(z.enum(['In Progress', 'In Review', 'Done', 'Closed']));

const getZenhubData = (fetchs: IFetch[]): ZenhubData => {
    return getFetchByFetcherId('FT_GQL_ZENHUB_ISSUES', fetchs).data as ZenhubData;
};

const getGithubIssues = (fetchs: IFetch[]): GithubIssue[] => {
    return getFetchByFetcherId('FT_GQL_GITHUB_ISSUES', fetchs).data as GithubIssue[];
};

const getZenhubIssuesByColumns = (zenhubData: ZenhubData, columns: string[]): ZenhubIssue[] => {
    return columns.flatMap((column) => {
        if (column === 'Closed') return zenhubData.closedIssues;

        const pipeline = zenhubData.pipelines.find((p) => p.name === column);
        return pipeline?.issues ?? [];
    });
};

const getGithubIssuesMatchingZenhubIssues = (
    githubIssues: GithubIssue[],
    zenhubIssues: ZenhubIssue[],
): GithubIssue[] => {
    const zenhubIssueNumbers = new Set(zenhubIssues.map((issue) => issue.number));
    return githubIssues.filter((issue) => zenhubIssueNumbers.has(issue.number));
};

export const EV_ZENHUB_ISSUES_BY_COLUMN: IEvent = {
    id: 'EV_ZENHUB_ISSUES_BY_COLUMN',
    moreInfo: {
        title: 'ZenHub Issues by Column',
        description:
            'Number of issues in the specified ZenHub columns. Supports filtering by creation date and optionally by assignee.',
        example:
            'If columns is ["In Progress"] and there are 5 issues in that columns, the metric value would be 5.',
    },
    fetcherIds: ['FT_GQL_ZENHUB_ISSUES'],
    processConfigSchema: z.object({
        columns: zenhubColumnsSchema,
        afterCreatedAt: z.iso.datetime().optional(),
        username: z.string().optional(),
    }),
    process(_date, _window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns, afterCreatedAt, username } = processConfig as {
            columns: string[];
            afterCreatedAt?: string;
            username?: string;
        };
        const zenhubData = getZenhubData(fetchs);
        const issues = getZenhubIssuesByColumns(zenhubData, columns);
        const afterDate = afterCreatedAt ? new Date(afterCreatedAt) : null;
        return issues.filter(
            (issue) =>
                (!afterDate || new Date(issue.createdAt) >= afterDate) &&
                (!username || issue.assignees.nodes.some((user) => user.login === username)),
        );
    },
};

export const EV_ZENHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_BRANCHES: IEvent = {
    id: 'EV_ZENHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_BRANCHES',
    moreInfo: {
        title: 'ZenHub Issues by Column with Associated Branches',
        description:
            'Number of ZenHub issues in the specified columns that have at least one branch linked in GitHub.',
        example:
            'If columns is ["In Progress"], 5 issues are in that pipeline and 3 have an associated branch in GitHub, the metric value would be 3.',
    },
    fetcherIds: ['FT_GQL_ZENHUB_ISSUES', 'FT_GQL_GITHUB_ISSUES'],
    processConfigSchema: z.object({
        columns: zenhubColumnsSchema,
    }),
    process(_date, _window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns } = processConfig as { columns: string[] };
        const zenhubData = getZenhubData(fetchs);
        const githubIssues = getGithubIssues(fetchs);
        const zenhubIssues = getZenhubIssuesByColumns(zenhubData, columns);
        const matchedGithubIssues = getGithubIssuesMatchingZenhubIssues(githubIssues, zenhubIssues);
        return matchedGithubIssues.filter((issue) => issue.linkedBranches.nodes.length > 0);
    },
};

export const EV_ZENHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_PULL_REQUESTS_BY_STATUS: IEvent = {
    id: 'EV_ZENHUB_ISSUES_BY_COLUMN_WITH_ASSOCIATED_PULL_REQUESTS_BY_STATUS',
    moreInfo: {
        title: 'ZenHub Issues by Column with Associated Pull Requests by Status',
        description:
            'Number of ZenHub issues in the specified columns that have at least one associated pull request in the specified PR state.',
        example:
            'If columns is ["In Review"], 4 issues are in that column and 3 have an OPEN PR associated, the metric value would be 3.',
    },
    fetcherIds: ['FT_GQL_ZENHUB_ISSUES', 'FT_GQL_GITHUB_ISSUES'],
    processConfigSchema: z.object({
        columns: zenhubColumnsSchema,
        status: z.enum(['OPEN', 'CLOSED', 'MERGED']),
        afterCreatedAt: z.iso.datetime().optional(),
    }),
    process(_date, _window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns, afterCreatedAt } = processConfig as {
            columns: string[];
            afterCreatedAt?: string;
        };
        const zenhubData = getZenhubData(fetchs);
        const githubIssues = getGithubIssues(fetchs);
        const zenhubIssues = getZenhubIssuesByColumns(zenhubData, columns);
        const matchedGithubIssues = getGithubIssuesMatchingZenhubIssues(githubIssues, zenhubIssues);
        let filteredIssues = matchedGithubIssues.filter((issue) =>
            issue.closedByPullRequestsReferences.nodes.some(
                (pr) => pr.state === processConfig.status,
            ),
        );
        if (afterCreatedAt) {
            const afterDate = new Date(afterCreatedAt);
            filteredIssues = filteredIssues.filter(
                (issue) => new Date(issue.createdAt) >= afterDate,
            );
        }
        return filteredIssues;
    },
};

// TODO: el sistema actual (legacy del antiguo) puede no funcionar bien para algún caso límite
// Ej: is1->[a,b], is2->[a], devuelve 1, aunque podrían ser 2 si se coge primero is2
// Esto se puede resolver con algoritmos como maximum matching.
export const EV_ZENHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN: IEvent = {
    id: 'EV_ZENHUB_ISSUES_WITH_DIFFERENT_BRANCHES_BY_COLUMN',
    moreInfo: {
        title: 'ZenHub Issues with Different Branches',
        description:
            'Number of ZenHub issues in the specified columns that contribute at least one branch not already seen in previous matching issues.',
        example:
            'If columns is ["In Progress"] with issues is1->[a], is2->[b], the metric value would be 2.',
    },
    fetcherIds: ['FT_GQL_ZENHUB_ISSUES', 'FT_GQL_GITHUB_ISSUES'],
    processConfigSchema: z.object({
        columns: zenhubColumnsSchema,
    }),
    process(_date, _window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns } = processConfig as { columns: string[] };
        const zenhubData = getZenhubData(fetchs);
        const githubIssues = getGithubIssues(fetchs);
        const zenhubIssues = getZenhubIssuesByColumns(zenhubData, columns);
        const matchedGithubIssues = getGithubIssuesMatchingZenhubIssues(githubIssues, zenhubIssues);
        const knownBranches = new Set<string>();
        const issuesWithDifferentBranches: GithubIssue[] = [];

        for (const issue of matchedGithubIssues) {
            let issueAdded = false;

            for (const branch of issue.linkedBranches.nodes) {
                if (knownBranches.has(branch.ref.name)) continue;

                knownBranches.add(branch.ref.name);
                if (!issueAdded) {
                    issuesWithDifferentBranches.push(issue);
                    issueAdded = true;
                }
            }
        }

        return issuesWithDifferentBranches;
    },
};

export const EV_ZENHUB_ISSUES_BY_COLUMN_FILTERED_BY_UPDATED_AT_DATE_ASSOCIATED_TO_MEMBER: IEvent = {
    id: 'EV_ZENHUB_ISSUES_BY_COLUMN_FILTERED_BY_UPDATED_AT_DATE_ASSOCIATED_TO_MEMBER',
    moreInfo: {
        title: 'ZenHub Issues by Column Assigned to Member Filtered by Update Date',
        description:
            'Number of ZenHub issues in the specified columns assigned to a specific member whose updatedAt timestamp falls within the current period window.',
        example:
            'If columns is ["Closed", "Done"] and the member updated 3 issues during the current week, the metric value would be 3.',
    },
    fetcherIds: ['FT_GQL_ZENHUB_ISSUES'],
    processConfigSchema: z.object({
        columns: zenhubColumnsSchema,
        username: z.string(),
    }),
    process(date, window, fetchs, processConfig): Record<string, unknown>[] {
        const { columns, username } = processConfig as { columns: string[]; username: string };
        const zenhubData = getZenhubData(fetchs);
        const issues = getZenhubIssuesByColumns(zenhubData, columns);

        const from = getPeriodStartDateFromAnchorDateAndPeriod(
            date,
            window.anchorDate,
            window.period,
        );
        const to = new Date(date);

        return issues.filter((issue) => {
            const updatedAt = new Date(issue.updatedAt);
            return (
                updatedAt >= from &&
                updatedAt <= to &&
                issue.assignees.nodes.some((user) => user.login === username)
            );
        });
    },
};
