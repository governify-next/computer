export type ProjectIssue = {
    fieldValues: { nodes: { name?: string; field?: { name?: string } }[] };
    content: {
        __typename: string;
        updatedAt: string;
        assignees: { nodes: { login: string }[] };
        linkedBranches: { nodes: { ref: { name: string } }[] };
        closedByPullRequestsReferences: { nodes: { state: 'OPEN' | 'CLOSED' | 'MERGED' }[] };
    };
};

export type PullRequest = {
    state: 'OPEN' | 'CLOSED' | 'MERGED';
    createdAt: string;
    mergedAt: string | null;
    author: { login: string };
    mergedBy: { login: string } | null;
    comments: { nodes: { author: { login: string }; createdAt: string }[] };
    reviews: {
        nodes: { state: string; bodyText: string; createdAt: string; author: { login: string } }[];
    };
};
