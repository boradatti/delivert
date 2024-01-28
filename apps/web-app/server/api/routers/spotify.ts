import { z } from 'zod';

import {
  createTRPCRouter,
  protectedProcedure,
  spotifyProcedure,
} from '../trpc';

export const spotifyRouter = createTRPCRouter({
  getCollectedPlaylists: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      return (
        await ctx.db
          .selectFrom('collection')
          .where('owner_id', '=', input.userId)
          .innerJoin('playlist', 'collection.playlist_id', 'playlist.id')
          .select([
            'collection.id',
            'playlist.name',
            'playlist.cover',
            'collection.mode',
            'collection.collecting',
            'collection.added',
          ])
          .orderBy('collection.added', 'desc')
          .execute()
      ).map((row) => ({ ...row, collecting: Boolean(row.collecting) }));
    }),

  toggleCollecting: protectedProcedure
    .input(z.object({ collectionId: z.string(), collecting: z.boolean() }))
    .mutation(({ input, ctx }) => {
      ctx.db
        .updateTable('collection')
        .where('id', '=', input.collectionId)
        .set({ collecting: input.collecting ? 1 : 0 })
        .execute();
      return !input.collecting;
    }),

  changeCollectionMode: protectedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        mode: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']),
      })
    )
    .mutation(({ input, ctx }) => {
      ctx.db
        .updateTable('collection')
        .where('id', '=', input.collectionId)
        .set({ mode: input.mode })
        .execute();
      return input.mode;
    }),

  removeCollection: spotifyProcedure
    .input(
      z.object({ collectionId: z.string(), unfollowPlaylist: z.boolean() })
    )
    .mutation(async ({ input, ctx }) => {
      if (!input.unfollowPlaylist) {
        await ctx.db
          .deleteFrom('collection')
          .where('id', '=', input.collectionId)
          .execute();
        return;
      }
      const { spotify_id } = await ctx.db
        .selectFrom('collection')
        .select('spotify_id')
        .where('id', '=', input.collectionId)
        .executeTakeFirstOrThrow();
      if (spotify_id) {
        await ctx.spotify.unfollowPlaylist(spotify_id);
      }
      await ctx.db
        .deleteFrom('collection')
        .where('id', '=', input.collectionId)
        .execute();
    }),

  addCollection: spotifyProcedure
    .input(z.object({ identifier: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const id = ctx.spotify.parseIdentifier(input.identifier);
      const p = await ctx.spotify.getPlaylistById(id);
      // i have no idea how to type this out
      // @ts-ignore
      if (p.error?.status === 404) {
        throw Error('Playlist not found');
      }
      const existingPlaylist = await ctx.db
        .selectFrom('playlist')
        .select('id')
        .where('id', '=', id)
        .executeTakeFirst();
      if (!existingPlaylist) {
        await ctx.db
          .insertInto('playlist')
          .values({
            id,
            name: p.name,
            cover: p.images[0].url,
          })
          .execute();
      }
      const existingCollection = await ctx.db
        .selectFrom('collection')
        .select('id')
        .where('playlist_id', '=', id)
        .where('owner_id', '=', ctx.session!.user!.id)
        .executeTakeFirst();
      if (existingCollection) {
        throw Error('Collection already exists');
      }
      await ctx.db
        .insertInto('collection')
        .values({
          id: ctx.dbUtils.generateId(),
          playlist_id: id,
          owner_id: ctx.session!.user!.id,
          mode: 'WEEKLY',
          collecting: 1,
        })
        .execute();
    }),
});
