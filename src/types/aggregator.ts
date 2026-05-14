import { z } from 'zod';
import { IAggregationResult } from './aggregationResult.js';

export interface IAggregator {
    type: string;
    moreInfo: {
        title: string;
        description: string;
        example: string;
    };
    aggregatorConfigSchema: z.ZodTypeAny;
    aggregate(
        events: Record<string, unknown>[],
        aggregatorConfig: Record<string, unknown>,
    ): IAggregationResult;
    aggregateScript?: string;
}
