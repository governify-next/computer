export type LinkedBranch = { ref: { name: string } };
export type ClosingPR = { number: number; title: string; state: 'OPEN' | 'CLOSED' | 'MERGED' };
export type Assignee = { login: string };

export type ProjectIssue = {
    fieldValues: { nodes: { name?: string; field?: { name?: string } }[] };
    content: {
        __typename: string;
        number: number;
        title: string;
        updatedAt: string;
        assignees: { nodes: Assignee[] };
        linkedBranches: { nodes: LinkedBranch[] };
        closedByPullRequestsReferences: { nodes: ClosingPR[] };
    };
};

export const isIssueInStatus = (issue: ProjectIssue, statuses: string[]): boolean => {
    const status = issue.fieldValues.nodes.find((node) => node.field?.name === 'Status')?.name;
    return status != null && statuses.includes(status);
};
