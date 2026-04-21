import { IAggregationResult } from '../../types/aggregationResult.js';
import { IAggregation } from '../../types/aggregationConfig.js';

export const aggregateMainEvents = (
    mainEvents: Record<string, unknown>[],
    aggregation: IAggregation,
): IAggregationResult => {
    const selectedAggregation = aggregations[aggregation.type];
    const value = selectedAggregation(mainEvents);
    return {
        value,
        evidences: mainEvents,
    };
};

const count = (mainEvents: Record<string, unknown>[]): number | null => {
    return mainEvents.length;
};

const aggregations: Record<string, (events: Record<string, unknown>[]) => number | null> = {
    count,
};
