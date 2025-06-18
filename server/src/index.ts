
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

import { 
  createFoodEntryInputSchema, 
  updateFoodEntryInputSchema,
  dateRangeInputSchema,
  dailySummaryInputSchema
} from './schema';
import { createFoodEntry } from './handlers/create_food_entry';
import { getFoodEntries } from './handlers/get_food_entries';
import { getFoodEntriesByDateRange } from './handlers/get_food_entries_by_date_range';
import { updateFoodEntry } from './handlers/update_food_entry';
import { deleteFoodEntry } from './handlers/delete_food_entry';
import { getDailySummary } from './handlers/get_daily_summary';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // Create a new food entry
  createFoodEntry: publicProcedure
    .input(createFoodEntryInputSchema)
    .mutation(({ input }) => createFoodEntry(input)),
    
  // Get all food entries
  getFoodEntries: publicProcedure
    .query(() => getFoodEntries()),
    
  // Get food entries by date range
  getFoodEntriesByDateRange: publicProcedure
    .input(dateRangeInputSchema)
    .query(({ input }) => getFoodEntriesByDateRange(input)),
    
  // Update a food entry
  updateFoodEntry: publicProcedure
    .input(updateFoodEntryInputSchema)
    .mutation(({ input }) => updateFoodEntry(input)),
    
  // Delete a food entry
  deleteFoodEntry: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteFoodEntry(input)),
    
  // Get daily calorie summary
  getDailySummary: publicProcedure
    .input(dailySummaryInputSchema)
    .query(({ input }) => getDailySummary(input))
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Calorie Tracking TRPC server listening at port: ${port}`);
}

start();
