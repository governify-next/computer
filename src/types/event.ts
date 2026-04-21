import { z } from 'zod';
import { IWindow } from './window.js';
import { IFetch } from './fetch.js';

export interface IEvent {
    id: string;
    moreInfo: {
        title: string;
        description: string;
        example: string;
    };
    fetcherConfigSchemas: {
        fetcherId: string;
        fetcherConfigSchema: z.ZodTypeAny;
    }[];
    processConfigSchema: z.ZodTypeAny;
    process(
        date: Date,
        window: IWindow,
        fetchs: IFetch[],
        processConfig: Record<string, unknown>,
    ): Record<string, unknown>[];
    processScript?: string;
}
