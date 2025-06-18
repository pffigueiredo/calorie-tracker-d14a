
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type FoodEntry } from '../schema';
import { desc } from 'drizzle-orm';

export const getFoodEntries = async (): Promise<FoodEntry[]> => {
  try {
    const results = await db.select()
      .from(foodEntriesTable)
      .orderBy(desc(foodEntriesTable.consumed_at))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(entry => ({
      ...entry,
      calories: parseFloat(entry.calories) // Convert string back to number
    }));
  } catch (error) {
    console.error('Failed to fetch food entries:', error);
    throw error;
  }
};
