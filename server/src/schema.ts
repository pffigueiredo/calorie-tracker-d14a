
import { z } from 'zod';

// Food entry schema
export const foodEntrySchema = z.object({
  id: z.number(),
  name: z.string(),
  calories: z.number(),
  consumed_at: z.coerce.date(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type FoodEntry = z.infer<typeof foodEntrySchema>;

// Input schema for creating food entries
export const createFoodEntryInputSchema = z.object({
  name: z.string().min(1, "Food name is required"),
  calories: z.number().positive("Calories must be positive"),
  consumed_at: z.coerce.date()
});

export type CreateFoodEntryInput = z.infer<typeof createFoodEntryInputSchema>;

// Input schema for updating food entries
export const updateFoodEntryInputSchema = z.object({
  id: z.number(),
  name: z.string().min(1, "Food name is required").optional(),
  calories: z.number().positive("Calories must be positive").optional(),
  consumed_at: z.coerce.date().optional()
});

export type UpdateFoodEntryInput = z.infer<typeof updateFoodEntryInputSchema>;

// Schema for daily summary
export const dailySummarySchema = z.object({
  date: z.string(), // Format: YYYY-MM-DD
  total_calories: z.number(),
  entry_count: z.number().int()
});

export type DailySummary = z.infer<typeof dailySummarySchema>;

// Input schema for getting entries by date range
export const dateRangeInputSchema = z.object({
  start_date: z.coerce.date(),
  end_date: z.coerce.date()
});

export type DateRangeInput = z.infer<typeof dateRangeInputSchema>;

// Input schema for getting daily summary
export const dailySummaryInputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
});

export type DailySummaryInput = z.infer<typeof dailySummaryInputSchema>;
