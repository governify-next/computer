import { tr } from 'zod/locales';
import { IProcessedMetric } from '../models/state.model.js';

export const evaluateNumericExpression = (
    expression: string,
    metrics: Record<string, IProcessedMetric>,
): number => {
    try {
        const metricValues: Record<string, number> = {};
        for (const [name, metric] of Object.entries(metrics)) {
            metricValues[name] = metric.value;
        }
        const func = new Function(...Object.keys(metricValues), `return ${expression};`);
        return func(...Object.values(metricValues));
    } catch (error) {
        return NaN;
    }
};

export const evaluateCompliance = (
    expressionValue: number,
    comparator: string,
    threshold: number,
): boolean | null => {
    switch (comparator) {
        case '>':
            return expressionValue > threshold;
        case '>=':
            return expressionValue >= threshold;
        case '<':
            return expressionValue < threshold;
        case '<=':
            return expressionValue <= threshold;
        case '==':
            return expressionValue === threshold;
        case '!=':
            return expressionValue !== threshold;
        default:
            return null;
    }
};
