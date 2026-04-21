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
