// --- ProjectV2 Items ---

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

// --- Pull Requests ---

export type PRComment = {
    author: { login: string };
    bodyText: string;
    createdAt: string;
};

export type PRReview = {
    state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
    createdAt: string;
    bodyText: string;
    author: { login: string };
};

export type PullRequest = {
    id: string;
    number: number;
    title: string;
    body: string;
    bodyText: string;
    state: 'OPEN' | 'CLOSED' | 'MERGED';
    baseRefName: string;
    headRefName: string;
    createdAt: string;
    mergedAt: string | null;
    author: { login: string };
    mergedBy: { login: string } | null;
    comments: { nodes: PRComment[] };
    reviews: { nodes: PRReview[] };
};
