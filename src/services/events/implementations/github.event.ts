import { z } from 'zod';
import { IEvent } from '../../../types/event.js';
import { IFetch } from '../../../types/fetch.js';
import * as fetcherUtils from '../utils/fetcher.util.js';

export const EV_GITHUB_COMMITS: IEvent = {
    id: 'EV_GITHUB_COMMITS',
    moreInfo: {
        title: 'Number of Commits by Team',
        description: 'Total number of commits made to a specific repository by the entire team.',
        example:
            'If the team made 50 commits to the repository in the last month, the metric value would be 50.',
    },
    fetcherConfigSchemas: [
        {
            fetcherId: 'FT_REST_GITHUB_COMMITS',
            fetcherConfigSchema: z.object({
                tag: z.string(),
                branch: z.string().optional(),
            }),
        },
    ],
    processConfigSchema: z.object({
        owner: z.string(),
        repository: z.string(),
    }),
    process(_date, _window, _fetchs, _processConfig): Record<string, unknown>[] {
        const commitsFetch: IFetch = fetcherUtils.getFetchByFetcherId(
            _fetchs,
            'FT_REST_GITHUB_COMMITS',
        );

        return commitsFetch.data as Record<string, unknown>[];
    },
};
