
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type FoodEntry } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteFoodEntry = async (id: number): Promise<FoodEntry> => {
  try {
    // Delete the food entry and return the deleted record
    const result = await db.delete(foodEntriesTable)
      .where(eq(foodEntriesTable.id, id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Food entry with id ${id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const deletedEntry = result[0];
    return {
      ...deletedEntry,
      calories: parseFloat(deletedEntry.calories) // Convert string back to number
    };
  } catch (error) {
    console.error('Food entry deletion failed:', error);
    throw error;
  }
};
