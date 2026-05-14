import { ZodError } from 'zod';
import { IAggregationResult } from '../../types/aggregationResult.js';
import { IAggregation } from '../../types/aggregation.js';
import { IAggregator } from '../../types/aggregator.js';

import { count, average, sum, median, max, min } from './implementations/basic.aggregator.js';

const aggregators: Record<string, IAggregator> = {
    count,
    average,
    sum,
    max,
    min,
    median,
};

export const aggregateEvents = (
    mainEvents: Record<string, unknown>[],
    aggregation: IAggregation,
): IAggregationResult => {
    const selectedAggregation = aggregators[aggregation.aggregatorType];
    const aggregationResult = selectedAggregation.aggregate(
        mainEvents,
        aggregation.aggregatorConfig,
    );
    return aggregationResult;
};

// This function injects the stringified version of the process function into each event for documentation purposes
const injectAggregateScriptStringToAggregator = (
    aggregators: Record<string, IAggregator>,
): Record<string, IAggregator> => {
    Object.values(aggregators).forEach((aggregator) => {
        aggregator.aggregateScript = aggregator.aggregate.toString();
    });
    return aggregators;
};
injectAggregateScriptStringToAggregator(aggregators);

export const getAggregatorByType = (type: string) => {
    return aggregators[type];
};

export const getAggregators = () => {
    return Object.values(aggregators);
};

export const validateAggregator = async (
    aggregatorType: string,
    aggregatorConfig: Record<string, unknown>,
): Promise<AggregatorValidationResponse> => {
    const aggregator = getAggregatorByType(aggregatorType);
    if (!aggregator) {
        return {
            valid: false,
            error: `Aggregator ${aggregatorType} not found`,
        };
    }
    let aggregatorIssues: ZodError['issues'] = [];
    if (aggregatorConfig) {
        try {
            aggregator.aggregatorConfigSchema.parse(aggregatorConfig);
        } catch (error) {
            if (error instanceof ZodError) {
                aggregatorIssues = error.issues;
            }
        }
    }
    if (aggregatorIssues.length > 0) {
        return {
            valid: false,
            error: 'Invalid aggregatorConfig',
            issues: aggregatorIssues,
        };
    }

    return { valid: true };
};

type AggregatorValidationResponse =
    | { valid: true }
    | { valid: false; error: string; issues?: ZodError['issues'] };
