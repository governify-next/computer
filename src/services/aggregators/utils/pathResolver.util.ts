export const getValueByPath = (object: unknown, path: string[]) => {
    for (const key of path) {
        if (object == null || typeof object !== 'object') return undefined;
        object = (object as Record<string, unknown>)[key];
    }
    return object;
};
