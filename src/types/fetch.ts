export interface IFetch {
    fetcherId: string;
    fetcherConfig: Record<string, unknown>;
    fetchResultId: string;
    status: 'IN_PROGRESS' | 'COMPLETED' | 'UNAVAILABLE' | 'FAILED';
    unavailableReason: string | null;
    data: unknown;
}
