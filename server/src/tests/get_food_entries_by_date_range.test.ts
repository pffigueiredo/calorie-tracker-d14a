
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { type DateRangeInput, type CreateFoodEntryInput } from '../schema';
import { getFoodEntriesByDateRange } from '../handlers/get_food_entries_by_date_range';

describe('getFoodEntriesByDateRange', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return food entries within date range', async () => {
    // Create test entries with different consumed_at dates
    const baseDate = new Date('2024-01-15T12:00:00Z');
    const earlyDate = new Date('2024-01-10T12:00:00Z');
    const lateDate = new Date('2024-01-20T12:00:00Z');

    // Insert test entries
    await db.insert(foodEntriesTable)
      .values([
        {
          name: 'Early Food',
          calories: '150.50',
          consumed_at: earlyDate
        },
        {
          name: 'In Range Food 1',
          calories: '200.75',
          consumed_at: baseDate
        },
        {
          name: 'In Range Food 2',
          calories: '300.25',
          consumed_at: new Date('2024-01-16T15:30:00Z')
        },
        {
          name: 'Late Food',
          calories: '100.00',
          consumed_at: lateDate
        }
      ])
      .execute();

    // Query for entries between Jan 14 and Jan 17
    const input: DateRangeInput = {
      start_date: new Date('2024-01-14T00:00:00Z'),
      end_date: new Date('2024-01-17T23:59:59Z')
    };

    const results = await getFoodEntriesByDateRange(input);

    // Should return only the 2 entries within range
    expect(results).toHaveLength(2);
    expect(results.map(r => r.name)).toContain('In Range Food 1');
    expect(results.map(r => r.name)).toContain('In Range Food 2');
    expect(results.map(r => r.name)).not.toContain('Early Food');
    expect(results.map(r => r.name)).not.toContain('Late Food');

    // Verify numeric conversion
    results.forEach(entry => {
      expect(typeof entry.calories).toBe('number');
      expect(entry.calories).toBeGreaterThan(0);
    });
  });

  it('should return empty array when no entries in range', async () => {
    // Insert entry outside the query range
    await db.insert(foodEntriesTable)
      .values({
        name: 'Outside Range',
        calories: '150.00',
        consumed_at: new Date('2024-01-01T12:00:00Z')
      })
      .execute();

    // Query for different date range
    const input: DateRangeInput = {
      start_date: new Date('2024-02-01T00:00:00Z'),
      end_date: new Date('2024-02-28T23:59:59Z')
    };

    const results = await getFoodEntriesByDateRange(input);

    expect(results).toHaveLength(0);
  });

  it('should handle same start and end date', async () => {
    const targetDate = new Date('2024-01-15T12:00:00Z');
    
    // Insert entries on the same day and different days
    await db.insert(foodEntriesTable)
      .values([
        {
          name: 'Same Day Food',
          calories: '250.00',
          consumed_at: targetDate
        },
        {
          name: 'Different Day Food',
          calories: '300.00',
          consumed_at: new Date('2024-01-16T12:00:00Z')
        }
      ])
      .execute();

    // Query for just the target date
    const input: DateRangeInput = {
      start_date: new Date('2024-01-15T00:00:00Z'),
      end_date: new Date('2024-01-15T23:59:59Z')
    };

    const results = await getFoodEntriesByDateRange(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('Same Day Food');
    expect(results[0].calories).toBe(250);
  });

  it('should include boundary dates correctly', async () => {
    const startBoundary = new Date('2024-01-15T00:00:00Z');
    const endBoundary = new Date('2024-01-17T23:59:59Z');

    // Insert entries exactly on boundaries
    await db.insert(foodEntriesTable)
      .values([
        {
          name: 'Start Boundary',
          calories: '100.00',
          consumed_at: startBoundary
        },
        {
          name: 'End Boundary',
          calories: '200.00',
          consumed_at: endBoundary
        },
        {
          name: 'Before Start',
          calories: '150.00',
          consumed_at: new Date('2024-01-14T23:59:59Z')
        },
        {
          name: 'After End',
          calories: '250.00',
          consumed_at: new Date('2024-01-18T00:00:01Z')
        }
      ])
      .execute();

    const input: DateRangeInput = {
      start_date: startBoundary,
      end_date: endBoundary
    };

    const results = await getFoodEntriesByDateRange(input);

    expect(results).toHaveLength(2);
    expect(results.map(r => r.name)).toContain('Start Boundary');
    expect(results.map(r => r.name)).toContain('End Boundary');
    expect(results.map(r => r.name)).not.toContain('Before Start');
    expect(results.map(r => r.name)).not.toContain('After End');
  });
});
