import { z } from 'zod';

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

export type TimelineEvent = IssueEvent | AssigneeEvent | TypeEvent;

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
