export interface ISearchParams {
    query?: Record<string, unknown>;
    pagination?: {
        limit?: number;
        skip?: number;
    };
    sort?: Record<string, 1 | -1>;
}

export interface ISearchStatesInput {
    filters?: Record<string, unknown>;
    pagination?: {
        limit?: number;
        skip?: number;
    };
    sort?: Record<string, 1 | -1>;
}
