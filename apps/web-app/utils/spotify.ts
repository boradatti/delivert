import { DB } from '@deliverdaniel/db';
import { SpotifyClient } from '@deliverdaniel/spotify';
import { Kysely } from 'kysely';

type SpotifyTokens = {
  access_token: string;
  expires_at: number;
  refresh_token: string;
};

type Options = {
  userId: string;
  db: Kysely<DB>;
  spotify: SpotifyTokens;
};

export async function refreshTokenIfExpired(options: Options) {
  const updatedTokens: SpotifyTokens = { ...options.spotify };

  if (Date.now() > options.spotify.expires_at! * 1000) {
    console.log('REFRESHING TOKENS');

    const newTokens = await SpotifyClient.refreshAccessToken({
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
      refresh_token: options.spotify.refresh_token!,
    });

    console.log('NEW TOKENS:', newTokens);
    console.log(options.db);

    await options.db
      .updateTable('account')
      .set({
        access_token: newTokens.access_token,
        expires_at: newTokens.expires_in + Math.round(Date.now() / 1000),
        refresh_token: newTokens.refresh_token,
      })
      .where('userId', '=', options.userId)
      .where('provider', '=', 'spotify')
      .execute();

    console.log('UPDATED!');

    updatedTokens.access_token = newTokens.access_token;
    updatedTokens.expires_at =
      newTokens.expires_in + Math.round(Date.now() / 1000);
    updatedTokens.refresh_token =
      newTokens.refresh_token ?? updatedTokens.refresh_token;
  }

  return updatedTokens;
}
