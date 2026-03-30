import { z } from 'zod';
import { IMetric } from '../../../types/metric.js';

export const MT_ELEMENT_xx_GITHUB_xx_COUNT_COMMITS: IMetric = {
    name: 'MT_ELEMENT_xx_GITHUB_xx_COUNT_COMMITS',
    moreInfo: {
        title: 'Number of Commits by Team',
        description: 'Total number of commits made to a specific repository by the entire team.',
        example:
            'If the team made 50 commits to the repository in the last month, the metric value would be 50.',
    },
    collection: 'FT_ELEMENT_xx_REST_GITHUB_xx_COMMITS',
    metricConfigSchema: z.object({
        team: z.string(),
        branch: z.string().optional(),
    }),
    auditConfigSchema: z.object({
        repo: z.string(),
    }),
    async process(_date, _window, _metricConfig, _auditConfig) {
        const evidences: unknown[] = [];

        return { name: this.name, value: 0, evidences };
    },
};
