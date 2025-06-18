
import { serial, text, pgTable, timestamp, numeric, integer } from 'drizzle-orm/pg-core';

export const foodEntriesTable = pgTable('food_entries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  calories: numeric('calories', { precision: 8, scale: 2 }).notNull(),
  consumed_at: timestamp('consumed_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// TypeScript types for the table schema
export type FoodEntry = typeof foodEntriesTable.$inferSelect;
export type NewFoodEntry = typeof foodEntriesTable.$inferInsert;

// Export all tables for proper query building
export const tables = { foodEntries: foodEntriesTable };
