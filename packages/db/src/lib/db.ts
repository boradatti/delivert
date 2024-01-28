import { Kysely } from 'kysely';
import { PlanetScaleDialect } from 'kysely-planetscale';
import { DB } from './prisma/types';

type DBConfig = {
  url: string;
};

class Database {
  private static instance: Database;
  private db: Kysely<DB>;

  private constructor(config: DBConfig) {
    this.db = new Kysely<DB>({
      dialect: new PlanetScaleDialect(config),
    });
  }

  public static getInstance(config: DBConfig): Database {
    if (!Database.instance) {
      Database.instance = new Database(config);
    }

    return Database.instance;
  }

  public getDB(): Kysely<DB> {
    return this.db;
  }
}

export const db = Database.getInstance({
  url: process.env['DATABASE_URL']!,
}).getDB();
