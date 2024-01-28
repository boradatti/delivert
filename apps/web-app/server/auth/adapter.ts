import type {
  Adapter,
  AdapterSession,
  AdapterUser,
  AdapterAccount,
} from 'next-auth/adapters';

import type { Kysely } from 'kysely';
import type { DB } from '@deliverdaniel/db';

type AdapterOptions = {
  generateId: <T extends keyof DB>(
    t: T
  ) => DB[T] extends { id: infer I } ? I : never;
};

export function KyselyAdapter(
  db: Kysely<DB>,
  options: AdapterOptions
): Adapter {
  return {
    async createUser(user) {
      // console.log('--- CREATING USER ---');
      // console.log(JSON.stringify(user, null, 1));
      const userId = options.generateId('user');
      await db
        .insertInto('user')
        .values({
          id: userId,
          ...user,
        })
        // .returningAll()
        .$castTo<AdapterUser>()
        .executeTakeFirstOrThrow();
      return {
        id: userId,
        email: user.email as string,
        emailVerified: user.emailVerified,
      };
    },
    async getUser(id) {
      // console.log('--- GETTING USER ---');
      // console.log(JSON.stringify(id, null, 1));
      const user = await db
        .selectFrom('user')
        .selectAll()
        .where('id', '=', id)
        .$castTo<AdapterUser>()
        .executeTakeFirst();
      if (!user) {
        // console.log('NO USER FOUND');
        return null;
      }
      return user;
    },
    async getUserByEmail(email) {
      // console.log('--- GETTING USER BY EMAIL ---');
      // console.log(JSON.stringify(email, null, 1));
      const user = await db
        .selectFrom('user')
        .selectAll()
        .where('email', '=', email)
        .$castTo<AdapterUser>()
        .executeTakeFirst();
      if (!user) {
        // console.log('NO USER FOUND');
        return null;
      }
      return user;
    },
    async getUserByAccount(account) {
      // console.log('--- GETTING USER BY ACCOUNT ---');
      // console.log(JSON.stringify(account, null, 1));
      const user = await db
        .selectFrom('account')
        .innerJoin('user', 'account.userId', 'user.id')
        .select([
          'user.id as id',
          'user.email as email',
          'user.emailVerified as emailVerified',
        ])
        .$castTo<AdapterUser>()
        .where('providerAccountId', '=', account.providerAccountId)
        .executeTakeFirst();
      if (!user) {
        // console.log('NO USER FOUND');
        return null;
      }
      return user;
    },
    async updateUser(user) {
      // console.log('--- UPDATING USER ---');
      // console.log(JSON.stringify(user, null, 1));
      await db
        .updateTable('user')
        .where('id', '=', user.id)
        .set(user)
        .executeTakeFirstOrThrow();
      return user as ReturnType<Adapter['updateUser']>;
    },
    async deleteUser(userId) {
      // console.log('--- DELETING USER ---');
      // console.log(JSON.stringify(userId, null, 1));
      const userToDelete = await db
        .selectFrom('user')
        .selectAll()
        .where('id', '=', userId)
        .$castTo<AdapterUser>()
        .executeTakeFirst();
      if (!userToDelete) {
        // console.log('NO USER FOUND');
        return;
      }
      await db
        .deleteFrom('user')
        .where('id', '=', userId)
        .executeTakeFirstOrThrow();
      return userToDelete;
    },
    async linkAccount(account) {
      // console.log('--- LINKING ACCOUNT ---');
      // console.log(JSON.stringify(account, null, 1));
      await db
        .insertInto('account')
        .values({ id: options.generateId('account'), ...account })
        .executeTakeFirstOrThrow();
      return account;
    },
    async unlinkAccount(account) {
      // console.log('--- UNLINKING ACCOUNT ---');
      // console.log(JSON.stringify(account, null, 1));
      const accountToDelete = await db
        .selectFrom('account')
        .selectAll()
        .where('providerAccountId', '=', account.providerAccountId)
        .$castTo<AdapterAccount>()
        .executeTakeFirst();
      if (!accountToDelete) {
        // console.log('NO ACCOUNT FOUND');
        return;
      }
      await db
        .deleteFrom('account')
        .where('providerAccountId', '=', account.providerAccountId)
        .executeTakeFirstOrThrow();
      return accountToDelete;
    },
    async createSession(session) {
      // console.log('--- CREATING SESSION ---');
      // console.log(JSON.stringify(session, null, 1));
      const id = options.generateId('session');
      const newSession = { id, ...session };
      await db
        .insertInto('session')
        .values(newSession)
        .executeTakeFirstOrThrow();
      return newSession;
    },
    async getSessionAndUser(sessionToken) {
      // console.log('--- GETTING SESSION AND USER ---');
      // console.log(JSON.stringify(sessionToken, null, 1));
      const query = await db
        .selectFrom('session')
        .innerJoin('user', 'session.userId', 'user.id')
        .select([
          'session.id as sessionId',
          'session.userId',
          'session.expires',
          'user.id',
          'user.email',
          'user.emailVerified',
          'user.name',
          'user.image',
        ])
        .where('session.sessionToken', '=', sessionToken)
        .executeTakeFirst();
      if (!query) {
        // console.log('NO SESSION FOUND');
        return null;
      }
      return {
        session: {
          id: query.sessionId,
          sessionToken: sessionToken,
          userId: query.userId,
          expires: query.expires,
        },
        user: {
          id: query.userId,
          image: query.image,
          email: query.email as string,
          emailVerified: query.emailVerified,
          name: query.name,
          // ! could pass more here?
          test: 'param',
        },
      };
    },
    async updateSession(session) {
      // console.log('--- UPDATING SESSION ---');
      // console.log(JSON.stringify(session, null, 1));
      await db
        .updateTable('session')
        .where('sessionToken', '=', session.sessionToken)
        .set(session)
        // .returning(['id', 'sessionToken', 'userId', 'expires'])
        .executeTakeFirstOrThrow();
      const updatedSession = await db
        .selectFrom('session')
        .select(['userId', 'sessionToken', 'expires'])
        .where('sessionToken', '=', session.sessionToken)
        .executeTakeFirstOrThrow();
      return updatedSession;
    },
    async deleteSession(sessionToken) {
      // console.log('--- DELETING SESSION ---');
      // console.log(JSON.stringify(sessionToken, null, 1));
      const sessionToDelete = await db
        .selectFrom('session')
        .selectAll()
        .where('sessionToken', '=', sessionToken)
        .$castTo<AdapterSession>()
        .executeTakeFirst();
      if (!sessionToDelete) {
        // console.log('NO SESSION FOUND');
        return;
      }
      await db
        .deleteFrom('session')
        .where('sessionToken', '=', sessionToken)
        .executeTakeFirstOrThrow();
      return;
    },
    async createVerificationToken(token) {
      // console.log('--- CREATING VERIFICATION TOKEN ---');
      // console.log(JSON.stringify(token, null, 1));
      await db
        .insertInto('verification_token')
        .values(token)
        .executeTakeFirstOrThrow();
      return token;
    },
    async useVerificationToken({ identifier, token }) {
      // console.log('--- USING VERIFICATION TOKEN ---');
      // console.log(JSON.stringify({ identifier, token }, null, 1));
      try {
        const { expires } = await db
          .selectFrom('verification_token')
          .select(['expires'])
          .where('identifier', '=', identifier)
          .where('token', '=', token)
          .executeTakeFirstOrThrow();
        await db
          .deleteFrom('verification_token')
          .where('identifier', '=', identifier)
          .where('token', '=', token)
          .executeTakeFirstOrThrow();
        return {
          token,
          identifier,
          expires,
        };
      } catch (err) {
        // console.log('ERROR: ', err);
        return null;
      }
    },
  };
}
