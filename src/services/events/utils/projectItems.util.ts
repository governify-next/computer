import { IFetch } from '../../../types/fetch.js';
import { ProjectIssue } from '../../../types/projectItem.js';
import * as fetcherUtils from '../utils/fetcher.util.js';

export function getProjectIssues(fetchs: IFetch[]): ProjectIssue[] {
    return fetcherUtils.getFetchByFetcherId('FT_GQL_GITHUB_PROJECTV2_ITEMS', fetchs)
        .data as ProjectIssue[];
}

export const isIssueAtAnyStatus = (issue: ProjectIssue, statuses: string[]): boolean => {
    const status = issue.fieldValues.nodes.find((node) => node.field?.name === 'Status')?.name;
    return status != null && statuses.includes(status);
};
