
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type DailySummaryInput, type DailySummary } from '../schema';
import { sql } from 'drizzle-orm';

export const getDailySummary = async (input: DailySummaryInput): Promise<DailySummary> => {
  try {
    // Parse the input date to create start and end of day boundaries
    const targetDate = new Date(input.date + 'T00:00:00.000Z');
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Query to get total calories and count for the specific date
    const result = await db
      .select({
        total_calories: sql<string>`COALESCE(SUM(${foodEntriesTable.calories}), 0)`,
        entry_count: sql<string>`COUNT(*)`
      })
      .from(foodEntriesTable)
      .where(
        sql`${foodEntriesTable.consumed_at} >= ${targetDate} AND ${foodEntriesTable.consumed_at} < ${nextDay}`
      )
      .execute();

    const summary = result[0];
    
    return {
      date: input.date,
      total_calories: parseFloat(summary.total_calories),
      entry_count: parseInt(summary.entry_count)
    };
  } catch (error) {
    console.error('Daily summary fetch failed:', error);
    throw error;
  }
};
