import { z } from 'zod';
import { IWindow } from './window.js';

export interface IEvent {
    id: string;
    moreInfo: {
        title: string;
        description: string;
        example: string;
    };
    fetcherConfigSchemas: {
        id: string;
        fetcherConfigSchema: z.ZodTypeAny;
    }[];
    processConfigSchema: z.ZodTypeAny;
    process(
        date: Date,
        window: IWindow,
        fetcherConfigs: Record<string, unknown>[],
        processConfig: Record<string, unknown>,
    ): Promise<Record<string, unknown>[]>;
    processScript?: string;
}
