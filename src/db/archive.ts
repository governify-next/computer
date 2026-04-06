import mongoose from 'mongoose';

export const getFetchResultsWithPipeline = async (
    pipeline: Record<string, unknown>[],
): Promise<Record<string, unknown>[]> => {
    const db = mongoose.connection.db;
    if (!db) {
        throw new Error('MongoDB connection is not initialized');
    }

    return await db.collection('fetchresults').aggregate(pipeline).toArray();
};
