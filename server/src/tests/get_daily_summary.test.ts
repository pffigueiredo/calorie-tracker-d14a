
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type DailySummaryInput, type CreateFoodEntryInput } from '../schema';
import { getDailySummary } from '../handlers/get_daily_summary';

// Test helper to create food entries directly with database
const createTestFoodEntry = async (input: CreateFoodEntryInput) => {
  return await db.insert(foodEntriesTable)
    .values({
      name: input.name,
      calories: input.calories.toString(),
      consumed_at: input.consumed_at
    })
    .returning()
    .execute();
};

describe('getDailySummary', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero summary for date with no entries', async () => {
    const input: DailySummaryInput = {
      date: '2024-01-15'
    };

    const result = await getDailySummary(input);

    expect(result.date).toEqual('2024-01-15');
    expect(result.total_calories).toEqual(0);
    expect(result.entry_count).toEqual(0);
  });

  it('should calculate summary for single food entry', async () => {
    // Create a food entry for the target date
    await createTestFoodEntry({
      name: 'Apple',
      calories: 95,
      consumed_at: new Date('2024-01-15T10:30:00Z')
    });

    const input: DailySummaryInput = {
      date: '2024-01-15'
    };

    const result = await getDailySummary(input);

    expect(result.date).toEqual('2024-01-15');
    expect(result.total_calories).toEqual(95);
    expect(result.entry_count).toEqual(1);
  });

  it('should calculate summary for multiple food entries on same date', async () => {
    const targetDate = '2024-01-15';

    // Create multiple entries for the same date
    await createTestFoodEntry({
      name: 'Breakfast',
      calories: 400,
      consumed_at: new Date('2024-01-15T08:00:00Z')
    });

    await createTestFoodEntry({
      name: 'Lunch',
      calories: 650,
      consumed_at: new Date('2024-01-15T12:30:00Z')
    });

    await createTestFoodEntry({
      name: 'Dinner',
      calories: 800,
      consumed_at: new Date('2024-01-15T19:15:00Z')
    });

    const input: DailySummaryInput = {
      date: targetDate
    };

    const result = await getDailySummary(input);

    expect(result.date).toEqual(targetDate);
    expect(result.total_calories).toEqual(1850);
    expect(result.entry_count).toEqual(3);
  });

  it('should only include entries from the specified date', async () => {
    // Create entries for different dates
    await createTestFoodEntry({
      name: 'Yesterday Food',
      calories: 300,
      consumed_at: new Date('2024-01-14T20:00:00Z')
    });

    await createTestFoodEntry({
      name: 'Target Date Food',
      calories: 500,
      consumed_at: new Date('2024-01-15T12:00:00Z')
    });

    await createTestFoodEntry({
      name: 'Tomorrow Food',
      calories: 400,
      consumed_at: new Date('2024-01-16T08:00:00Z')
    });

    const input: DailySummaryInput = {
      date: '2024-01-15'
    };

    const result = await getDailySummary(input);

    expect(result.date).toEqual('2024-01-15');
    expect(result.total_calories).toEqual(500);
    expect(result.entry_count).toEqual(1);
  });

  it('should handle date boundaries correctly', async () => {
    // Create entry at very start of day
    await createTestFoodEntry({
      name: 'Midnight Snack',
      calories: 100,
      consumed_at: new Date('2024-01-15T00:00:00Z')
    });

    // Create entry at very end of day (should still be included)
    await createTestFoodEntry({
      name: 'Late Night Food',
      calories: 200,
      consumed_at: new Date('2024-01-15T23:59:59Z')
    });

    // Create entry at start of next day (should not be included)
    await createTestFoodEntry({
      name: 'Next Day Food',
      calories: 150,
      consumed_at: new Date('2024-01-16T00:00:00Z')
    });

    const input: DailySummaryInput = {
      date: '2024-01-15'
    };

    const result = await getDailySummary(input);

    expect(result.date).toEqual('2024-01-15');
    expect(result.total_calories).toEqual(300);
    expect(result.entry_count).toEqual(2);
  });

  it('should handle decimal calories correctly', async () => {
    await createTestFoodEntry({
      name: 'Fractional Calories',
      calories: 123.45,
      consumed_at: new Date('2024-01-15T12:00:00Z')
    });

    await createTestFoodEntry({
      name: 'More Fractional',
      calories: 67.89,
      consumed_at: new Date('2024-01-15T15:00:00Z')
    });

    const input: DailySummaryInput = {
      date: '2024-01-15'
    };

    const result = await getDailySummary(input);

    expect(result.date).toEqual('2024-01-15');
    expect(result.total_calories).toEqual(191.34);
    expect(result.entry_count).toEqual(2);
    expect(typeof result.total_calories).toBe('number');
  });
});
