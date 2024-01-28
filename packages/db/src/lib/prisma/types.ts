import type { ColumnType } from 'kysely';
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;
export type CollectionMode = 'DAILY' | 'WEEKLY' | 'MONTHLY';
export const CollectionMode = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
};
export type account = {
  id: string;
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token: string | null;
  refresh_token_expires_in: number | null;
  access_token: string | null;
  expires_at: number | null;
  token_type: string | null;
  scope: string | null;
  id_token: string | null;
  session_state: string | null;
};
export type collection = {
  id: string;
  spotify_id: string | null;
  playlist_id: string;
  owner_id: string;
  collecting: Generated<number>;
  count: Generated<number>;
  mode: CollectionMode;
  added: Generated<Timestamp>;
};
export type playlist = {
  id: string;
  name: string;
  cover: string;
};
export type session = {
  id: string;
  sessionToken: string;
  expires: Timestamp;
  userId: string;
};
export type track = {
  id: string;
  collection_id: string;
};
export type user = {
  id: string;
  name: string | null;
  email: string | null;
  emailVerified: Timestamp | null;
  image: string | null;
};
export type verification_token = {
  identifier: string;
  token: string;
  expires: Timestamp;
};
export type DB = {
  account: account;
  collection: collection;
  playlist: playlist;
  session: session;
  track: track;
  user: user;
  verification_token: verification_token;
};
