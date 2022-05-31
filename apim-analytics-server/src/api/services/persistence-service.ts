import * as mongodb from 'mongodb';
import { Constants } from '../../common/constants';
import { Logger as L } from '../../common/logger';
import { MongoDatabase } from '../../utils/database';
import { ServerError } from '../middleware/error-handler';

/**
 * A persistence service for document-based collections.
 */
export class PersistenceService<T> {

  /** A reference to a MongoDB collection. */
  #collection: mongodb.Collection;

  /** hidden constructor */
  private constructor(collection: mongodb.Collection) {
    this.#collection = collection;
  }

  /**
   * Creates an service instance for a document-based collection.
   * 
   * If the collection does not exist, it will be created with a full-text index.
   * 
   * @param name The name of the collection.
   * 
   * @return The created service instance.
   */
  static async createInstance<T>(name: string): Promise<PersistenceService<T>> {

    let database: mongodb.Db;

    try {
      database = await MongoDatabase.createInstance(Constants.SERVER_DATABASE_NAME);
      const info = await database.listCollections({ name: name }).toArray();
      if (info.length == 0) {
        await database.createCollection(name);
        L.info('PersistenceService.createInstance', `Created collection '${name}'`);
        const indexName = `idx_text_${database.databaseName}_${name}`;
        await database.collection(name).createIndex({ '$**': 'text' }, { name: indexName });
        L.info('PersistenceService.createInstance', `Created full-text index '${indexName}'`);
      }
    } catch (error: any) {
      L.error('PersistenceService.createInstance', error.message);
      throw PersistenceService.#createServerError(error);
    }

    return new PersistenceService(database.collection(name));
  }

  /**
   * Returns all documents in the collection.
   * 
   * @returns All documents in the collection.
   */
  async all(): Promise<T[]> {

    let documents: mongodb.OptionalId<mongodb.Document>[];

    try {
      documents = await this.#collection.find({}).toArray();
    } catch (error: any) {
      L.error('PersistenceService.all', error.message);
      throw PersistenceService.#createServerError(error);
    }

    documents.forEach(document => { delete document._id; });
    return documents as T[];
  }

  /**
   * Returns a document by ID.
   * 
   * @param id The document ID.
   * 
   * @returns The document.
   */
  async byId(id: string): Promise<T> {

    let document: mongodb.OptionalId<mongodb.Document> | null;

    try {
      document = await this.#collection.findOne({ _id: id });
    } catch (error: any) {
      L.error('PersistenceService.byId', error.message);
      throw PersistenceService.#createServerError(error);
    }

    if (document == null) {
      throw new ServerError(404, 'The document was not found');
    }

    delete document._id;
    return document as T;
  }

  /**
   * Creates a new document.
   * 
   * @param id The document ID.
   * @param document The document.
   * 
   * @returns The created document.
   */
  async create(id: string, document: T): Promise<T> {

    const options: mongodb.InsertOneOptions = {
      writeConcern: {
        w: 1,
        j: true,
      },
    }

    try {
      await this.#collection.insertOne({ ...document, _id: id as any }, options)
    } catch (error: any) {
      L.error('PersistenceService.insert', error.message);
      if (error.code == 11000) {
        throw new ServerError(422, 'The document ID is already used');
      }
      throw PersistenceService.#createServerError(error);
    }

    return this.byId(id);
  }

  /**
   * Updates an existing document.
   * 
   * @param id The document IDt.
   * @param document The part of the document that should be updated.
   * 
   * @returns The updated document.
   */
  async update(id: string, document: Partial<T>): Promise<T> {

    let updateResult: mongodb.UpdateResult;

    const options: mongodb.UpdateOptions = {
      writeConcern: {
        w: 1,
        j: true,
      },
    }

    try {
      updateResult = await this.#collection.updateOne({ _id: id as any }, { $set: document }, options);
    } catch (error: any) {
      L.error('PersistenceService.update', error.message);
      throw PersistenceService.#createServerError(error);
    }

    if (updateResult.matchedCount == 0) {
      throw new ServerError(404, 'The document was not found');
    }

    return this.byId(id);
  }

  /**
   * Deletes an existing document.
   * 
   * @param id The document ID.
    */
  async delete(id: string): Promise<void> {

    let deleteResult: mongodb.DeleteResult;
    try {
      deleteResult = await this.#collection.deleteOne({ _id: id as any });
    } catch (error: any) {
      L.error('PersistenceService.delete', error.message);
      throw PersistenceService.#createServerError(error);
    }

    if (deleteResult.deletedCount != 1) {
      throw new ServerError(404, 'The document was not found');
    }
  }

  /**
   * Creates a `ServerError` from a generic error.
   * 
   * @param error The original error.
   * 
   * @return The created server error.
   */
  static #createServerError(error: Error): ServerError {

    let serverError: ServerError;

    if (error instanceof mongodb.MongoError) {
      const errorCode = `E${error.code}`;
      const message = error.message.replace(errorCode, '');
      serverError = new ServerError(500, 'A database error occurred', { message: message, code: error.code });
    } else {
      serverError = new ServerError(500, 'An internal error occurred');
    }

    return serverError;
  }

} // class PersistenceService<T>
