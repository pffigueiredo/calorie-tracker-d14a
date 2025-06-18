
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type UpdateFoodEntryInput, type FoodEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const updateFoodEntry = async (input: UpdateFoodEntryInput): Promise<FoodEntry> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.calories !== undefined) {
      updateData.calories = input.calories.toString(); // Convert number to string for numeric column
    }

    if (input.consumed_at !== undefined) {
      updateData.consumed_at = input.consumed_at;
    }

    // Update the food entry
    const result = await db.update(foodEntriesTable)
      .set(updateData)
      .where(eq(foodEntriesTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Food entry with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const foodEntry = result[0];
    return {
      ...foodEntry,
      calories: parseFloat(foodEntry.calories) // Convert string back to number
    };
  } catch (error) {
    console.error('Food entry update failed:', error);
    throw error;
  }
};
