import { IProcessedMetric } from '../models/state.model.js';

export const evaluateNumericExpression = (
    expression: string,
    metrics: Record<string, IProcessedMetric>,
): number | null => {
    const metricValues: Record<string, number> = {};
    for (const [name, metric] of Object.entries(metrics)) {
        metricValues[name] = metric.value;
    }
    const func = new Function(...Object.keys(metricValues), `return ${expression};`);
    const result = func(...Object.values(metricValues));

    if (result === null || result === undefined || !isFinite(result)) {
        return null;
    }

    return result;
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

export const replaceExpressionWithValues = (
    expression: string,
    metrics: Record<string, IProcessedMetric>,
): string => {
    let replacedExpression = expression;
    for (const [name, metric] of Object.entries(metrics)) {
        const regex = new RegExp(`\\b${name}\\b`, 'g');
        replacedExpression = replacedExpression.replace(regex, metric.value.toString());
    }
    return replacedExpression;
};
