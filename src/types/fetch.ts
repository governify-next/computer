export interface IFetch {
    fetcherId: string;
    fetcherConfig: Record<string, unknown>;
    fetchResultId: string;
    data: unknown;
}
