import { IWindowPeriod, WindowUnit } from '../../../types/window.js';

export const getPeriodStartDateFromAnchorAndPeriod = (
    date: Date,
    anchorDate: Date,
    period: IWindowPeriod[],
): Date => {
    const periodInMilliseconds = fromPeriodToMilliseconds(period);
    const timeDifference = new Date(date).getTime() - new Date(anchorDate).getTime();
    const currentPeriodIndex = Math.floor((timeDifference - 1) / periodInMilliseconds);
    return new Date(new Date(anchorDate).getTime() + periodInMilliseconds * currentPeriodIndex);
};

export const getDateFromPeriod = (date: Date, period: IWindowPeriod[]): Date => {
    const periodInMilliseconds = fromPeriodToMilliseconds(period);
    return new Date(date.getTime() - periodInMilliseconds);
};

const fromPeriodToMilliseconds = (period: IWindowPeriod[]): number => {
    const unitToMilliseconds: Record<WindowUnit, number> = {
        millisecond: 1,
        milisecond: 1,
        second: 1000,
        minute: 1000 * 60,
        hour: 1000 * 60 * 60,
        day: 1000 * 60 * 60 * 24,
        week: 1000 * 60 * 60 * 24 * 7,
    };

    return period.reduce((totalMilliseconds, { unit, value }) => {
        const milliseconds = unitToMilliseconds[unit] ?? 0;
        return totalMilliseconds + milliseconds * value;
    }, 0);
};
