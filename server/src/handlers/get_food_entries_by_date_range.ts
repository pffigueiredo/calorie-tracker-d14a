
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type DateRangeInput, type FoodEntry } from '../schema';
import { and, gte, lte } from 'drizzle-orm';

export const getFoodEntriesByDateRange = async (input: DateRangeInput): Promise<FoodEntry[]> => {
  try {
    // Query food entries within the date range
    const results = await db.select()
      .from(foodEntriesTable)
      .where(
        and(
          gte(foodEntriesTable.consumed_at, input.start_date),
          lte(foodEntriesTable.consumed_at, input.end_date)
        )
      )
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(entry => ({
      ...entry,
      calories: parseFloat(entry.calories) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to get food entries by date range:', error);
    throw error;
  }
};
