
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type CreateFoodEntryInput } from '../schema';
import { createFoodEntry } from '../handlers/create_food_entry';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateFoodEntryInput = {
  name: 'Apple',
  calories: 95.5,
  consumed_at: new Date('2024-01-15T10:30:00Z')
};

describe('createFoodEntry', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a food entry', async () => {
    const result = await createFoodEntry(testInput);

    // Basic field validation
    expect(result.name).toEqual('Apple');
    expect(result.calories).toEqual(95.5);
    expect(typeof result.calories).toBe('number');
    expect(result.consumed_at).toEqual(testInput.consumed_at);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save food entry to database', async () => {
    const result = await createFoodEntry(testInput);

    // Query using proper drizzle syntax
    const foodEntries = await db.select()
      .from(foodEntriesTable)
      .where(eq(foodEntriesTable.id, result.id))
      .execute();

    expect(foodEntries).toHaveLength(1);
    expect(foodEntries[0].name).toEqual('Apple');
    expect(parseFloat(foodEntries[0].calories)).toEqual(95.5);
    expect(foodEntries[0].consumed_at).toEqual(testInput.consumed_at);
    expect(foodEntries[0].created_at).toBeInstanceOf(Date);
    expect(foodEntries[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle integer calories', async () => {
    const integerCaloriesInput: CreateFoodEntryInput = {
      name: 'Banana',
      calories: 105,
      consumed_at: new Date('2024-01-15T14:00:00Z')
    };

    const result = await createFoodEntry(integerCaloriesInput);

    expect(result.calories).toEqual(105);
    expect(typeof result.calories).toBe('number');
  });

  it('should handle different consumed_at timestamps', async () => {
    const differentTimeInput: CreateFoodEntryInput = {
      name: 'Sandwich',
      calories: 350.75,
      consumed_at: new Date('2024-02-20T18:45:30Z')
    };

    const result = await createFoodEntry(differentTimeInput);

    expect(result.consumed_at).toEqual(differentTimeInput.consumed_at);
    expect(result.name).toEqual('Sandwich');
    expect(result.calories).toEqual(350.75);
  });
});
