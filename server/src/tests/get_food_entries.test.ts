
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { foodEntriesTable } from '../db/schema';
import { getFoodEntries } from '../handlers/get_food_entries';

describe('getFoodEntries', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no entries exist', async () => {
    const result = await getFoodEntries();
    expect(result).toEqual([]);
  });

  it('should return all food entries', async () => {
    // Create test entries
    await db.insert(foodEntriesTable)
      .values([
        {
          name: 'Apple',
          calories: '95.50',
          consumed_at: new Date('2024-01-15T10:00:00Z')
        },
        {
          name: 'Banana',
          calories: '105.25',
          consumed_at: new Date('2024-01-15T12:00:00Z')
        }
      ])
      .execute();

    const result = await getFoodEntries();

    expect(result).toHaveLength(2);
    
    // Verify first entry
    expect(result[0].name).toEqual('Banana'); // Most recent first due to ordering
    expect(result[0].calories).toEqual(105.25);
    expect(typeof result[0].calories).toBe('number');
    expect(result[0].consumed_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second entry
    expect(result[1].name).toEqual('Apple');
    expect(result[1].calories).toEqual(95.5);
    expect(typeof result[1].calories).toBe('number');
  });

  it('should return entries ordered by consumed_at descending', async () => {
    // Create entries with different consumed_at times
    await db.insert(foodEntriesTable)
      .values([
        {
          name: 'Breakfast',
          calories: '300.00',
          consumed_at: new Date('2024-01-15T08:00:00Z')
        },
        {
          name: 'Lunch',
          calories: '450.00',
          consumed_at: new Date('2024-01-15T12:00:00Z')
        },
        {
          name: 'Dinner',
          calories: '600.00',
          consumed_at: new Date('2024-01-15T18:00:00Z')
        }
      ])
      .execute();

    const result = await getFoodEntries();

    expect(result).toHaveLength(3);
    
    // Verify descending order by consumed_at
    expect(result[0].name).toEqual('Dinner'); // Most recent (18:00)
    expect(result[1].name).toEqual('Lunch');  // Middle (12:00)
    expect(result[2].name).toEqual('Breakfast'); // Earliest (08:00)

    // Verify timestamps are in descending order
    expect(result[0].consumed_at >= result[1].consumed_at).toBe(true);
    expect(result[1].consumed_at >= result[2].consumed_at).toBe(true);
  });

  it('should handle entries with same consumed_at time', async () => {
    const sameTime = new Date('2024-01-15T12:00:00Z');
    
    await db.insert(foodEntriesTable)
      .values([
        {
          name: 'Food A',
          calories: '100.00',
          consumed_at: sameTime
        },
        {
          name: 'Food B',
          calories: '200.00',
          consumed_at: sameTime
        }
      ])
      .execute();

    const result = await getFoodEntries();

    expect(result).toHaveLength(2);
    expect(result[0].consumed_at).toEqual(sameTime);
    expect(result[1].consumed_at).toEqual(sameTime);
  });
});
