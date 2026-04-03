export interface IWindow {
    period: {
        unit: 'milisecond' | 'second' | 'minute' | 'hour' | 'day' | 'week';
        value: number;
    };
    anchorDate: Date;
}
