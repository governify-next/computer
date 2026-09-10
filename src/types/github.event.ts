export const PULL_REQUEST_TYPES = ['OPEN', 'CLOSED', 'MERGED'] as const;
export type PullRequestType = (typeof PULL_REQUEST_TYPES)[number];

export type IssueEvent = {
    __typename: 'ProjectV2ItemStatusChangedEvent';
    createdAt: string;
    previousStatus: string;
    status: string;
};

export type AssigneeEvent = {
    __typename: 'AssignedEvent' | 'UnassignedEvent';
    createdAt: string;
    assignee: { __typename: 'User'; login: string };
};

export type TypeEvent = {
    __typename: 'IssueTypeAddedEvent' | 'IssueTypeRemovedEvent' | 'IssueTypeChangedEvent';
    createdAt: string;
    issueType: { name: string };
};

export type PullRequestConnectionEvent = {
    __typename: 'ConnectedEvent' | 'DisconnectedEvent';
    createdAt: string;
    subject: {
        __typename: 'PullRequest';
        number: number;
        closedAt: string | null;
        mergedAt: string | null;
    };
};

export type TimelineEvent = IssueEvent | AssigneeEvent | TypeEvent | PullRequestConnectionEvent;

export type ProjectIssue = {
    content: {
        __typename: string;
        number: number;
        url: string;
        title: string;
        timelineItems: { nodes: TimelineEvent[] };
    };
};

export type BasicProjectIssue = {
    fieldValueByName: { status: string | null } | null;
    content: {
        __typename: string;
        updatedAt: string;
        assignees: { nodes: { login: string }[] };
        issueType: { name: string };
        linkedBranches: { nodes: { ref: { name: string } }[] };
        closedByPullRequestsReferences: { nodes: { state: 'OPEN' | 'CLOSED' | 'MERGED' }[] };
    };
};

export type PullRequest = {
    state: PullRequestType;
    createdAt: string;
    mergedAt: string | null;
    closedAt: string | null;
    author: { login: string };
    mergedBy: { login: string } | null;
    comments: { nodes: { author: { login: string }; createdAt: string }[] };
    reviews: {
        nodes: { state: string; bodyText: string; createdAt: string; author: { login: string } }[];
    };
};
