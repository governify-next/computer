import { z } from 'zod';

export const PULL_REQUEST_TYPES = ['OPEN', 'CLOSED', 'MERGED'] as const;
export type PullRequestType = (typeof PULL_REQUEST_TYPES)[number];

export const columnsSchema = z.array(z.string().trim().min(1)).min(1);
export const typeSchema = z.string().trim().min(1).optional();
export const usernameSchema = z.string().trim().min(1);
export const usernamesSchema = z.array(usernameSchema).min(1);
export const pullRequestStatusSchema = z.enum(PULL_REQUEST_TYPES);
