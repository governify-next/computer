export type ZenhubIssue = {
    number: number;
    createdAt: string;
    updatedAt: string;
    assignees: { nodes: Array<{ login: string }> };
};

export type ZenhubData = {
    pipelines: Array<{ name: string; issues: ZenhubIssue[] }>;
    closedIssues: ZenhubIssue[];
};

export type GithubIssue = {
    number: number;
    createdAt: string;
    linkedBranches: { nodes: Array<{ ref: { name: string } }> };
    closedByPullRequestsReferences: {
        nodes: Array<{ state: 'OPEN' | 'CLOSED' | 'MERGED' }>;
    };
};
