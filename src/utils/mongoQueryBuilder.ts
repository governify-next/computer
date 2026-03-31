export const buildMongoQuery = (filters: Record<string, unknown>) => {
    const query: Record<string, unknown> = {};

    for (const [field, condition] of Object.entries(filters)) {
        if (!isFilterOperators(condition)) {
            query[field] = condition;
            continue;
        }

        const mongoOps: Record<string, unknown> = {};

        if (condition.eq !== undefined) mongoOps.$eq = condition.eq;
        if (condition.ne !== undefined) mongoOps.$ne = condition.ne;
        if (condition.gt !== undefined) mongoOps.$gt = condition.gt;
        if (condition.gte !== undefined) mongoOps.$gte = condition.gte;
        if (condition.lt !== undefined) mongoOps.$lt = condition.lt;
        if (condition.lte !== undefined) mongoOps.$lte = condition.lte;
        if (condition.in !== undefined) mongoOps.$in = condition.in;

        query[field] = mongoOps;
    }

    return query;
};

const isFilterOperators = (value: unknown): value is FilterOperators => {
    if (typeof value !== 'object' || value === null) return false;

    return (
        'eq' in value ||
        'ne' in value ||
        'gt' in value ||
        'gte' in value ||
        'lt' in value ||
        'lte' in value ||
        'in' in value
    );
};

type FilterOperators = {
    eq?: unknown;
    ne?: unknown;
    gt?: number;
    gte?: number;
    lt?: number;
    lte?: number;
    in?: unknown[];
};
