export type ICommitGitlab = {
    id: string;
    title: string;
    web_url: string;
    parent_ids: string[];
    author_name: string;
    author_email: string;
    authored_date: string;
    committed_date: string;
    stats: { additions: number; deletions: number };
    username: string;
};

export type IMergeRequestGitlab = {
    iid: string;
    title: string;
    webUrl: string;
    createdAt: string;
    mergedAt: string | null;
    closedAt: string | null;
    author: { username: string } | null;
    notes: {
        nodes: {
            body: string;
            createdAt: string;
            system: boolean;
            author: { username: string } | null;
            systemNoteMetadata: { action: string | null } | null;
        }[];
    };
};

export type IItemGitlab = {
    iid: number;
    title: string;
    web_url: string;
    issue_type: string;
    created_at: string;
    closed_at: string | null;
    author: { username: string };
    assignees: { username: string }[];
    closed_by: { username: string } | null;
};
