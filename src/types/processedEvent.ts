import { IFetch } from './fetch.js';
import { IWindow } from './window.js';

export interface IProcessedEvent {
    events: Record<string, unknown>[];
    eventId: string;
    date: Date;
    window: IWindow;
    fetchs: IFetch[];
    processConfig: Record<string, unknown>;
}
