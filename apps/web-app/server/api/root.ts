import { createTRPCRouter } from './trpc';
import { spotifyRouter } from './routers/spotify';
import { cronRouter } from './routers/cron';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here
 */
export const appRouter = createTRPCRouter({
  spotify: spotifyRouter,
  cron: cronRouter
});

// export type definition of API
export type AppRouter = typeof appRouter;
