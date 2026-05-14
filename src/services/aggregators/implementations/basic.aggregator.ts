import { z } from 'zod';
import { IAggregator } from '../../../types/aggregator.js';
import * as pathResolverUtil from '../utils/pathResolver.util.js';

export const count: IAggregator = {
    type: 'count',
    moreInfo: {
        title: 'Count',
        description: 'Counts the number of main events.',
        example: 'If there are 5 main events, the value will be 5.',
    },
    aggregatorConfigSchema: z.object(),
    aggregate(events, aggregatorConfig) {
        void aggregatorConfig;
        return { value: events.length, evidences: events };
    },
};

export const average: IAggregator = {
    type: 'average',
    moreInfo: {
        title: 'Average',
        description: 'Calculates the average of a specified numeric field from the events.',
        example:
            'If the events have values 10, 20, and 30 for the specified field, the average will be 20.',
    },
    aggregatorConfigSchema: z.object({
        numericFieldPath: z.string().describe('Example: event.comments.number'),
    }),
    aggregate(events, aggregatorConfig) {
        const numericFieldPath = aggregatorConfig.numericFieldPath as string;
        const pathParts = numericFieldPath.split('.').filter(Boolean);
        const values: number[] = [];
        const validEvents: Record<string, unknown>[] = [];
        events.forEach((event) => {
            const value = pathResolverUtil.getValueByPath(event, pathParts);
            if (typeof value === 'number') {
                values.push(value);
                validEvents.push(event);
            }
        });
        const sum = values.reduce((acc, val) => acc + val, 0);
        const averageValue = values.length > 0 ? sum / values.length : null;
        return { value: averageValue, evidences: validEvents };
    },
};

export const sum: IAggregator = {
    type: 'sum',
    moreInfo: {
        title: 'Sum',
        description: 'Calculates the sum of a specified numeric field from the events.',
        example:
            'If the events have values 10, 20, and 30 for the specified field, the sum will be 60.',
    },
    aggregatorConfigSchema: z.object({
        numericFieldPath: z.string().describe('Example: event.comments.number'),
    }),
    aggregate(events, aggregatorConfig) {
        const numericFieldPath = aggregatorConfig.numericFieldPath as string;
        const pathParts = numericFieldPath.split('.').filter(Boolean);
        const values: number[] = [];
        const validEvents: Record<string, unknown>[] = [];
        events.forEach((event) => {
            const value = pathResolverUtil.getValueByPath(event, pathParts);
            if (typeof value === 'number') {
                values.push(value);
                validEvents.push(event);
            }
        });
        const sumValue = values.reduce((acc, val) => acc + val, 0);
        return { value: sumValue, evidences: validEvents };
    },
};

export const max: IAggregator = {
    type: 'max',
    moreInfo: {
        title: 'Max',
        description: 'Finds the maximum value of a specified numeric field from the events.',
        example:
            'If the events have values 10, 20, and 30 for the specified field, the maximum will be 30.',
    },
    aggregatorConfigSchema: z.object({
        numericFieldPath: z.string().describe('Example: event.comments.number'),
    }),
    aggregate(events, aggregatorConfig) {
        const numericFieldPath = aggregatorConfig.numericFieldPath as string;
        const pathParts = numericFieldPath.split('.').filter(Boolean);
        const values: number[] = [];
        const validEvents: Record<string, unknown>[] = [];
        events.forEach((event) => {
            const value = pathResolverUtil.getValueByPath(event, pathParts);
            if (typeof value === 'number') {
                values.push(value);
                validEvents.push(event);
            }
        });
        const maxValue = values.length > 0 ? Math.max(...values) : null;
        return { value: maxValue, evidences: validEvents };
    },
};

export const min: IAggregator = {
    type: 'min',
    moreInfo: {
        title: 'Min',
        description: 'Finds the minimum value of a specified numeric field from the events.',
        example:
            'If the events have values 10, 20, and 30 for the specified field, the minimum will be 10.',
    },
    aggregatorConfigSchema: z.object({
        numericFieldPath: z.string().describe('Example: event.comments.number'),
    }),
    aggregate(events, aggregatorConfig) {
        const numericFieldPath = aggregatorConfig.numericFieldPath as string;
        const pathParts = numericFieldPath.split('.').filter(Boolean);
        const values: number[] = [];
        const validEvents: Record<string, unknown>[] = [];
        events.forEach((event) => {
            const value = pathResolverUtil.getValueByPath(event, pathParts);
            if (typeof value === 'number') {
                values.push(value);
                validEvents.push(event);
            }
        });
        const minValue = values.length > 0 ? Math.min(...values) : null;
        return { value: minValue, evidences: validEvents };
    },
};

export const median: IAggregator = {
    type: 'median',
    moreInfo: {
        title: 'Median',
        description: 'Calculates the median of a specified numeric field from the events.',
        example:
            'If the events have values 10, 20, and 30 for the specified field, the median will be 20.',
    },
    aggregatorConfigSchema: z.object({
        numericFieldPath: z.string().describe('Example: event.comments.number'),
    }),
    aggregate(events, aggregatorConfig) {
        const numericFieldPath = aggregatorConfig.numericFieldPath as string;
        const pathParts = numericFieldPath.split('.').filter(Boolean);
        const values: number[] = [];
        const validEvents: Record<string, unknown>[] = [];
        events.forEach((event) => {
            const value = pathResolverUtil.getValueByPath(event, pathParts);
            if (typeof value === 'number') {
                values.push(value);
                validEvents.push(event);
            }
        });
        values.sort((a, b) => a - b);
        let medianValue: number | null = null;
        const len = values.length;
        if (len > 0) {
            if (len % 2 === 1) {
                medianValue = values[Math.floor(len / 2)];
            } else {
                medianValue = (values[len / 2 - 1] + values[len / 2]) / 2;
            }
        }
        return { value: medianValue, evidences: validEvents };
    },
};
