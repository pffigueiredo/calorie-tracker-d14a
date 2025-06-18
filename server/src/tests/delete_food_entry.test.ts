
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type CreateFoodEntryInput } from '../schema';
import { deleteFoodEntry } from '../handlers/delete_food_entry';
import { eq } from 'drizzle-orm';

// Helper function to create a test food entry
const createTestFoodEntry = async (input: CreateFoodEntryInput) => {
  const result = await db.insert(foodEntriesTable)
    .values({
      name: input.name,
      calories: input.calories.toString(),
      consumed_at: input.consumed_at
    })
    .returning()
    .execute();

  return {
    ...result[0],
    calories: parseFloat(result[0].calories)
  };
};

const testInput: CreateFoodEntryInput = {
  name: 'Test Food',
  calories: 250.5,
  consumed_at: new Date('2024-01-15T12:00:00Z')
};

describe('deleteFoodEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete a food entry and return it', async () => {
    // Create a test food entry first
    const createdEntry = await createTestFoodEntry(testInput);

    // Delete the entry
    const result = await deleteFoodEntry(createdEntry.id);

    // Verify the returned data matches the deleted entry
    expect(result.id).toEqual(createdEntry.id);
    expect(result.name).toEqual('Test Food');
    expect(result.calories).toEqual(250.5);
    expect(typeof result.calories).toBe('number');
    expect(result.consumed_at).toEqual(testInput.consumed_at);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should remove food entry from database', async () => {
    // Create a test food entry first
    const createdEntry = await createTestFoodEntry(testInput);

    // Delete the entry
    await deleteFoodEntry(createdEntry.id);

    // Verify the entry no longer exists in the database
    const entries = await db.select()
      .from(foodEntriesTable)
      .where(eq(foodEntriesTable.id, createdEntry.id))
      .execute();

    expect(entries).toHaveLength(0);
  });

  it('should throw error when food entry does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteFoodEntry(nonExistentId)).rejects.toThrow(/not found/i);
  });

  it('should handle numeric conversion correctly', async () => {
    // Create entry with decimal calories
    const testInputWithDecimals: CreateFoodEntryInput = {
      name: 'Decimal Test',
      calories: 123.45,
      consumed_at: new Date()
    };

    const createdEntry = await createTestFoodEntry(testInputWithDecimals);
    const result = await deleteFoodEntry(createdEntry.id);

    // Verify numeric conversion is handled properly
    expect(result.calories).toEqual(123.45);
    expect(typeof result.calories).toBe('number');
  });
});
