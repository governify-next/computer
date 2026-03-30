import { IAuditConfig } from '../../../types/auditConfig.js';
import { IMetric } from '../../../types/metric.js';
import { IMetricConfig } from '../../../types/metricConfig.js';
import { IWindow } from '../../../types/window.js';

export const MT_ELEMENT_xx_GITHUB_xx_COUNT_COMMITS: IMetric = {
    name: 'MT_ELEMENT_xx_GITHUB_xx_COUNT_COMMITS',
    moreInfo: {
        title: 'Number of Commits by Team',
        description: 'Total number of commits made to a specific repository by the entire team.',
        example:
            'If the team made 50 commits to the repository in the last month, the metric value would be 50.',
    },
    collection: 'FT_ELEMENT_xx_REST_GITHUB_xx_COMMITS',
    async process(
        _date: Date,
        _window: IWindow,
        _metricConfig: IMetricConfig,
        _auditConfig: IAuditConfig,
    ) {
        const result: Array<{ value: number; evidences: unknown[] }> = [];
        if (result.length === 0) {
            return { value: 0, evidences: [] };
        }

        return {
            value: result[0].value,
            evidences: result[0].evidences,
        };
    },
};
