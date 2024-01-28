import { NextAuthOptions } from 'next-auth';

import { db } from '@deliverdaniel/db';
import { v4 as generateId } from 'uuid';

import SpotifyProvider from 'next-auth/providers/spotify';
import { SPOTIFY_SCOPES, SPOTIFY_LOGIN_URL } from '@deliverdaniel/spotify';

import { KyselyAdapter } from './adapter';

import { SpotifyClient } from '@deliverdaniel/spotify';

export const authOptions: NextAuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      authorization: {
        url: SPOTIFY_LOGIN_URL,
        params: {
          scope: SPOTIFY_SCOPES.join(' '),
        },
      },
    }),
  ],
  adapter: KyselyAdapter(db, { generateId }),
  secret: process.env.NEXTAUTH_SECRET!,
  events: {
    createUser({ user }) {
      // console.log('-- USER CREATED --');
      // console.log('user:', user);
    },
    updateUser({ user }) {
      // console.log('-- USER UPDATED --');
      // console.log('user:', user);
    },
    async linkAccount({ user, account }) {
      // console.log('-- ACCOUNT LINKED --');
      // console.log('user:', user);
      // console.log('account:', account);
      // add two playlists
      // console.log('adding playlists')
      const spotify = new SpotifyClient({
        accessToken: account.access_token!,
        refreshToken: account.refresh_token!,
      });
      const initialPlaylists = await spotify.getInitialPlaylists();
      // console.log('initial playlists:', initialPlaylists);
      for (const playlist of initialPlaylists) {
        const found = await db
          .selectFrom('playlist')
          .where('id', '=', playlist.id)
          .select('id')
          .executeTakeFirst();
        if (!found) {
          await db.insertInto('playlist').values(playlist).execute();
        }
        await db
          .insertInto('collection')
          .values({
            id: generateId(),
            mode: 'WEEKLY',
            owner_id: user.id,
            playlist_id: playlist.id,
          })
          .execute();
      }
    },
    // async session({ session }) {
    //   // console.log('-- SESSION ACTIVE --');
    //   // console.log('session:', session);
    //   // const { id } = await db.selectFrom('user').where('email', '=', session.user.email!).select('id').executeTakeFirstOrThrow();
    //   // try {
    //   //   await db.insertInto('user').values({
    //   //     id,
    //   //     name: session.user.name,
    //   //     email: session.user.email,
    //   //     image: session.user.image,
    //   //   }).execute();
    //   // } catch (err) {
    //     // console.log(err)
    //     // console.log(JSON.stringify(err, null, 2))
    //   // }
    // },
  },
  callbacks: {
    async signIn({ account, user, profile, email, credentials }) {
      // console.log('--- SIGN IN CALLBACK ---');
      // console.log('account:', account);
      // console.log('user:', user);
      // console.log('profile:', profile);
      // console.log('email:', email);
      // console.log('credentials:', credentials);
      await db
        .updateTable('account')
        .where('account.providerAccountId', '=', account!.providerAccountId)
        .set({
          access_token: account?.access_token,
          refresh_token: account?.refresh_token,
        })
        .execute();
      return true;
    },
    async jwt({ token, account, user, session }) {
      // console.log('--- JWT CALLBACK ---');
      // console.log('token:', token);
      // console.log('account:', account);
      // console.log('user:', user);
      // console.log('session:', session);
      return token;
    },
    session({ session, token, newSession, trigger, user }) {
      // console.log('--- SESSION CALLBACK ---');
      // console.log('sesssion:', session);
      // console.log('token:', token);
      // console.log('newSession:', newSession);
      // console.log('trigger:', trigger);
      // console.log('user:', user);
      // setting user id
      session.user.id = user.id;
      return session;
    },
  },
};

// async function cleanEverything() {
//   // console.log('DELETING EVERYTHING')
//   await db.deleteFrom('collection').execute();
//   await db.deleteFrom('playlist').execute();
//   await db.deleteFrom('track').execute();
//   await db.deleteFrom('session').execute();
//   await db.deleteFrom('account').execute();
//   await db.deleteFrom('user').execute();
// }

// cleanEverything();
