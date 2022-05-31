import * as mongodb from 'mongodb';
import config from '../common/config';
import { Logger as L } from '../common/logger';

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

    if (MongoDatabase.#client === undefined) {

      const client = new mongodb.MongoClient(config.database.url, {
        appName: 'apim-analytics-server',
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 5000,
        minPoolSize: 5,
      });

      await client.connect();
      MongoDatabase.#client = client;
      L.info('MongoDatabase.createInstance', `Created database connection for '${config.database.url}'`);
    }

    return MongoDatabase.#client.db(name);
  }

} // class MongoDatabase
