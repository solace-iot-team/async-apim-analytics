import * as mongodb from 'mongodb';
import { Mutex } from 'async-mutex';
import config from '../common/config';
import { Logger as L } from '../common/logger';

/** mutex for shared database client */
const mutex = new Mutex();

/**
 * Utility class for a MongoDB database.
 */
export class MongoDatabase {

  /** The shared database client. */
  static #client: mongodb.MongoClient;

  /** hidden constructor */
  private constructor() { /* hidden */ }

  /**
   * Creates a new database instance.
   * 
   * @param name The name of the database to use.
   * 
   * @returns The created database instance.
   */
  static async createInstance(name: string): Promise<mongodb.Db> {

    await mutex.runExclusive(async () => {

      if (MongoDatabase.#client === undefined) {

        const client = new mongodb.MongoClient(config.database.url, {
          appName: 'apim-analytics-server',
          minPoolSize: 4,
          w: 'majority',
        });

        await client.connect();

        MongoDatabase.#client = client;
        L.info('MongoDatabase.createInstance', `Created database client for '${config.database.url}'`);
      }
    });

    return MongoDatabase.#client.db(name);
  }

} // class MongoDatabase
