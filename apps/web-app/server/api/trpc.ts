/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * tl;dr - This is where all the tRPC server stuff is created and plugged in.
 * The pieces you will need to use are documented accordingly near the end.
 */

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the
 * database, the session, etc.
 */
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { type Session } from 'next-auth';

import { getServerAuthSession } from '../auth/session';
import { db } from '@deliverdaniel/db';
import { SpotifyClient } from '@deliverdaniel/spotify';

import { OpenApiMeta } from 'trpc-openapi';

import { v4 as generateId } from 'uuid';

import { verifySignature } from '../../utils/upstash';

import type { NonNullableProperties } from '@deliverdaniel/types';

type CreateContextOptions = {
  session: Session | null;
  qStash: {
    valid: boolean;
    message: string;
  };
};

/**
 * This helper generates the "internals" for a tRPC context. If you need to use
 * it, you can export it from here.
 *
 * Examples of things you may need it for:
 * - testing, so we don't have to mock Next.js' req/res
 * - tRPC's `createSSGHelpers`, where we don't have req/res
 *
 * @see https://create.t3.gg/en/usage/trpc#-servertrpccontextts
 */
const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    db,
    dbUtils: {
      generateId,
    },
    qStash: opts.qStash,
  };
};

/**
 * This is the actual context you will use in your router. It will be used to
 * process every request that goes through your tRPC endpoint.
 *
 * @see https://trpc.io/docs/context
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  // Get the session from the server using the getServerSession wrapper function
  const session = await getServerAuthSession({ req, res });

  let qStash = {
    valid: false,
    message: 'no signature provided',
  };

  // console.log('body:', JSON.stringify(req.body, null, 1));
  // console.log('query:', JSON.stringify(req.query, null, 1));
  // console.log('headers:', JSON.stringify(req.headers, null, 1));

  if (!session && req.headers['upstash-signature']) {
    console.log('FOUND SIGNATURE HEADER');
    const { valid, message } = await verifySignature({
      signature: req.headers['upstash-signature'] as string,
      body: req.body,
    });
    qStash.valid = valid;
    qStash.message = message;
  }

  return createInnerTRPCContext({
    session,
    qStash,
  });
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and
 * transformer.
 */
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { refreshTokenIfExpired } from 'apps/web-app/utils/spotify';

const t = initTRPC
  .meta<OpenApiMeta>()
  .context<typeof createTRPCContext>()
  .create({
    transformer: superjson,
    errorFormatter({ shape }) {
      return shape;
    },
  });

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these
 * a lot in the "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your
 * tRPC API. It does not guarantee that a user querying is authorized, but you
 * can still access user session data if they are logged in.
 */
export const publicProcedure = t.procedure;

/**
 * Reusable middleware that enforces users are logged in before running the
 * procedure.
 */
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * Protected (authenticated) procedure
 *
 * If you want a query or mutation to ONLY be accessible to logged in users, use
 * this. It verifies the session is valid and guarantees `ctx.session.user` is
 * not null.
 *
 * @see https://trpc.io/docs/procedures
 */
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

const enforceCorrectSpotifyTokens = t.middleware(async ({ ctx, next }) => {
  // console.log('--- SPOTIFY MIDDLEWARE ---');

  const spotifyTokens = await ctx.db
    .selectFrom('user')
    .innerJoin('account', 'user.id', 'account.userId')
    .where('user.id', '=', ctx.session!.user.id)
    .where('account.provider', '=', 'spotify')
    .select([
      'account.access_token',
      'account.refresh_token',
      'account.expires_at',
    ])
    .executeTakeFirstOrThrow();

  const { access_token, refresh_token } = await refreshTokenIfExpired({
    db: ctx.db,
    userId: ctx.session!.user.id,
    spotify: spotifyTokens as NonNullableProperties<typeof spotifyTokens>,
  });

  return next({
    ctx: {
      session: { ...ctx.session },
      spotify: new SpotifyClient({
        accessToken: access_token,
        refreshToken: refresh_token,
      }),
    },
  });
});

export const spotifyProcedure = t.procedure
  .use(enforceUserIsAuthed)
  .use(enforceCorrectSpotifyTokens);

const enforceIsQStash = t.middleware(
  async ({ ctx, next, input, rawInput, meta, path, type }) => {
    // console.log('type:', type);
    // console.log('ctx:', ctx);
    // console.log('input:', input);
    // console.log('raw input:', rawInput);
    // console.log('meta:', meta);
    // console.log('path:', path);
    // console.log('---');
    if (!ctx.qStash.valid)
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: ctx.qStash.message,
      });
    return next({ ctx });
  }
);

export const cronProcedure = t.procedure.use(enforceIsQStash);
