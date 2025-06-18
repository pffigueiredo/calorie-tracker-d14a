
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type CreateFoodEntryInput, type FoodEntry } from '../schema';

export const createFoodEntry = async (input: CreateFoodEntryInput): Promise<FoodEntry> => {
  try {
    // Insert food entry record
    const result = await db.insert(foodEntriesTable)
      .values({
        name: input.name,
        calories: input.calories.toString(), // Convert number to string for numeric column
        consumed_at: input.consumed_at
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const foodEntry = result[0];
    return {
      ...foodEntry,
      calories: parseFloat(foodEntry.calories) // Convert string back to number
    };
  } catch (error) {
    console.error('Food entry creation failed:', error);
    throw error;
  }
};
