
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type CreateFoodEntryInput, type UpdateFoodEntryInput } from '../schema';
import { updateFoodEntry } from '../handlers/update_food_entry';
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

describe('updateFoodEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update all fields of a food entry', async () => {
    // Create initial food entry
    const initialEntry = await createTestFoodEntry({
      name: 'Original Food',
      calories: 100,
      consumed_at: new Date('2024-01-01T12:00:00Z')
    });

    const updateInput: UpdateFoodEntryInput = {
      id: initialEntry.id,
      name: 'Updated Food',
      calories: 250,
      consumed_at: new Date('2024-01-02T14:00:00Z')
    };

    const result = await updateFoodEntry(updateInput);

    expect(result.id).toEqual(initialEntry.id);
    expect(result.name).toEqual('Updated Food');
    expect(result.calories).toEqual(250);
    expect(typeof result.calories).toBe('number');
    expect(result.consumed_at).toEqual(new Date('2024-01-02T14:00:00Z'));
    expect(result.created_at).toEqual(initialEntry.created_at);
    expect(result.updated_at).not.toEqual(initialEntry.updated_at);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update only provided fields', async () => {
    // Create initial food entry
    const initialEntry = await createTestFoodEntry({
      name: 'Original Food',
      calories: 100,
      consumed_at: new Date('2024-01-01T12:00:00Z')
    });

    const updateInput: UpdateFoodEntryInput = {
      id: initialEntry.id,
      name: 'Updated Name Only'
    };

    const result = await updateFoodEntry(updateInput);

    expect(result.id).toEqual(initialEntry.id);
    expect(result.name).toEqual('Updated Name Only');
    expect(result.calories).toEqual(100); // Should remain unchanged
    expect(result.consumed_at).toEqual(initialEntry.consumed_at); // Should remain unchanged
    expect(result.created_at).toEqual(initialEntry.created_at);
    expect(result.updated_at).not.toEqual(initialEntry.updated_at);
  });

  it('should update calories only', async () => {
    // Create initial food entry
    const initialEntry = await createTestFoodEntry({
      name: 'Test Food',
      calories: 100,
      consumed_at: new Date('2024-01-01T12:00:00Z')
    });

    const updateInput: UpdateFoodEntryInput = {
      id: initialEntry.id,
      calories: 300
    };

    const result = await updateFoodEntry(updateInput);

    expect(result.id).toEqual(initialEntry.id);
    expect(result.name).toEqual('Test Food'); // Should remain unchanged
    expect(result.calories).toEqual(300);
    expect(typeof result.calories).toBe('number');
    expect(result.consumed_at).toEqual(initialEntry.consumed_at); // Should remain unchanged
    expect(result.updated_at).not.toEqual(initialEntry.updated_at);
  });

  it('should save updated entry to database', async () => {
    // Create initial food entry
    const initialEntry = await createTestFoodEntry({
      name: 'Original Food',
      calories: 100,
      consumed_at: new Date('2024-01-01T12:00:00Z')
    });

    const updateInput: UpdateFoodEntryInput = {
      id: initialEntry.id,
      name: 'Database Updated Food',
      calories: 400
    };

    await updateFoodEntry(updateInput);

    // Verify database was updated
    const dbEntries = await db.select()
      .from(foodEntriesTable)
      .where(eq(foodEntriesTable.id, initialEntry.id))
      .execute();

    expect(dbEntries).toHaveLength(1);
    expect(dbEntries[0].name).toEqual('Database Updated Food');
    expect(parseFloat(dbEntries[0].calories)).toEqual(400);
    expect(dbEntries[0].updated_at).not.toEqual(initialEntry.updated_at);
  });

  it('should throw error for non-existent food entry', async () => {
    const updateInput: UpdateFoodEntryInput = {
      id: 999999, // Non-existent ID
      name: 'Should Fail'
    };

    await expect(updateFoodEntry(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should always update the updated_at timestamp', async () => {
    // Create initial food entry
    const initialEntry = await createTestFoodEntry({
      name: 'Test Food',
      calories: 100,
      consumed_at: new Date('2024-01-01T12:00:00Z')
    });

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateFoodEntryInput = {
      id: initialEntry.id,
      name: 'Same Name Test' // Even minimal update should change timestamp
    };

    const result = await updateFoodEntry(updateInput);

    expect(result.updated_at).not.toEqual(initialEntry.updated_at);
    expect(result.updated_at.getTime()).toBeGreaterThan(initialEntry.updated_at.getTime());
  });
});
