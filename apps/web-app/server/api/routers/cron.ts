import { z } from 'zod';
import { createTRPCRouter, cronProcedure, publicProcedure } from '../trpc';
import { SpotifyClient } from '@deliverdaniel/spotify';
import { refreshTokenIfExpired } from 'apps/web-app/utils/spotify';

export const cronRouter = createTRPCRouter({
  rescuePlaylists: cronProcedure
    .meta({ openapi: { method: 'POST', path: '/rescue-playlists/{mode}' } })
    .input(z.object({ mode: z.enum(['DAILY', 'WEEKLY', 'MONTHLY']) }))
    .output(z.any())
    .mutation(async ({ input, ctx }) => {
      const activeCollections = await ctx.db
        .selectFrom('collection')
        .innerJoin('account', 'account.userId', 'collection.owner_id')
        .innerJoin('playlist', 'playlist.id', 'collection.playlist_id')
        .select([
          'collection.id',
          'owner_id',
          'playlist_id',
          'account.providerAccountId',
          'spotify_id',
          'playlist.name',
          'playlist.cover',
          'account.access_token',
          'account.refresh_token',
          'account.expires_at',
        ])
        .where('collecting', '=', 1)
        .where('mode', '=', input.mode)
        .orderBy('providerAccountId')
        .execute();

      // const dataUrl = await getImageDataUrl('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTycpDiTo4TbhVeoBT3jPtrc4tiqtzIWOn-cA&usqp=CAU')

      // return dataUrl;

      console.log('activeCollections:', activeCollections);

      let curUserId;
      let curClient: SpotifyClient;
      for (const collection of activeCollections) {
        if (collection.providerAccountId !== curUserId) {
          curUserId = collection.providerAccountId;
          const { access_token, refresh_token } = await refreshTokenIfExpired({
            db: ctx.db,
            userId: collection.owner_id,
            spotify: {
              access_token: collection.access_token!,
              refresh_token: collection.refresh_token!,
              expires_at: collection.expires_at!,
            },
          });
          curClient = new SpotifyClient({
            accessToken: access_token,
            refreshToken: refresh_token,
          });
        }
        if (!curClient!) return;
        if (!collection.spotify_id) {
          const playlistId = await curClient.createPlaylist({
            name: `${collection.name} (rescued)`,
            description: `This playlist was Delivert™, Lort.`,
            user_id: collection.providerAccountId,
            cover: collection.cover,
          });
          console.log(playlistId);
          await ctx.db
            .updateTable('collection')
            .set({
              spotify_id: playlistId,
            })
            .where('id', '=', collection.id)
            .execute();
          collection.spotify_id = playlistId;
        }
        const tracks = await curClient.getAllPlaylistTracks(
          collection.playlist_id
        );
        const tracksToIgnore = await ctx.db
          .selectFrom('track')
          .where('collection_id', '=', collection.id)
          .where(
            'track.id',
            'in',
            tracks.map((t) => t.track.id)
          )
          .select('track.id')
          .execute();
        const filteredTracks = tracks.filter(
          (t) => !tracksToIgnore.find((tt) => tt.id === t.track.id)
        );
        curClient.addTracksToPlaylist({
          playlist_id: collection.spotify_id,
          track_ids: filteredTracks.map((t) => t.track.id),
        });
        await ctx.db
          .insertInto('track')
          .values(
            filteredTracks.map((track) => ({
              id: track.track.id,
              collection_id: collection.id,
            }))
          )
          .execute();
      }

      return {
        status: 'ok',
      }
    }),
});
