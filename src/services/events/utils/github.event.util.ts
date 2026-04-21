import { IFetch } from '../../../types/fetch.js';
import { ProjectIssue, PullRequest } from '../../../types/github.event.js';
import * as fetcherUtils from '../utils/fetcher.util.js';

export function getProjectIssues(fetchs: IFetch[]): ProjectIssue[] {
    const items = fetcherUtils.getFetchByFetcherId('FT_GQL_GITHUB_PROJECTV2_ITEMS', fetchs)
        .data as ProjectIssue[];
    return items.filter((item) => item.content?.__typename === 'Issue');
}

export function getPullRequests(fetchs: IFetch[]): PullRequest[] {
    return fetcherUtils.getFetchByFetcherId('FT_GQL_GITHUB_PULL_REQUESTS', fetchs)
        .data as PullRequest[];
}

export const isIssueAtAnyStatus = (issue: ProjectIssue, statuses: string[]): boolean => {
    const status = issue.fieldValues.nodes.find((node) => node.field?.name === 'Status')?.name;
    return status != null && statuses.includes(status);
};
