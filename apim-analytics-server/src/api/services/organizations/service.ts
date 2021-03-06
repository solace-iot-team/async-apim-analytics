import { TypedEmitter } from 'tiny-typed-emitter';
import { Mutex } from 'async-mutex';
import { ServerError } from '../../middleware/error-handler';
import { PersistenceService } from '../persistence-service';
import Organization = Components.Schemas.Organization;
import OrganizationPatch = Components.Schemas.OrganizationPatch;

/** mutex for shared persistence service instance */
const mutex = new Mutex();

/** The events emitted by the organization service. */
interface Events {
  created: (name: string, organization: Organization) => void;
  updated: (name: string, organization: Organization) => void;
  deleted: (name: string) => void;
}

/**
 * The organizations service.
 */
class OrganizationsService extends TypedEmitter<Events> {

  /** The persistence service instance for organisations. */
  #persistenceService: PersistenceService<Organization>;

  /**
   * Returns a reference to the persistence service instance for organisations.
   * 
   * @returns The persistence service instance for organisations.
   */
  #getPersistenceService = async (): Promise<PersistenceService<Organization>> => {

    await mutex.runExclusive(async () => {
      if (this.#persistenceService === undefined) {
        this.#persistenceService = await PersistenceService.createInstance('organizations');
      }
    });

    return this.#persistenceService;
  }

  /**
   * Returns a list of all organizations.
   * 
   * @returns The list of organisations.
   */
  async all(): Promise<Organization[]> {

    let organizations: Organization[];

    try {
      const databaseService = await this.#getPersistenceService();
      organizations = await databaseService.all();
    } catch (error) {
      throw error;
    }

    return organizations;
  }

  /**
   * Returns an organizations by name.
   * 
   * @param name The name of the organization to return.
   * 
   * @returns The organization with the specified name.
   */
  async byName(name: string): Promise<Organization> {

    let organization: Organization;

    try {
      const databaseService = await this.#getPersistenceService();
      organization = await databaseService.byId(name);
    } catch (error: any) {
      if (error.status == 404) {
        throw new ServerError(404, 'The organization is unknown');
      }
      throw error;
    }

    return organization;
  }

  /**
   * Creates a new organizations.
   * 
   * @param organization The organization to create.
   * 
   * @returns The created organization.
   */
  async create(organization: Organization): Promise<Organization> {

    if (organization.enabled === undefined) {
      organization.enabled = true;
    }

    try {
      const databaseService = await this.#getPersistenceService();
      organization = await databaseService.create(organization.name, organization);
    } catch (error: any) {
      if (error.status == 422) {
        throw new ServerError(422, 'The organization already exists');
      }
      throw error;
    }

    this.emit('created', organization.name, organization);
    return organization;
  }

  /**
   * Updates an existing organizations.
   * 
   * @param organizationPatch The information that should be updated.
   * 
   * @returns The updated organization.
   */
  async update(name: string, organizationPatch: OrganizationPatch): Promise<Organization> {

    let organization: Organization;

    try {
      const databaseService = await this.#getPersistenceService();
      organization = await databaseService.update(name, organizationPatch);
    } catch (error: any) {
      if (error.status == 404) {
        throw new ServerError(404, 'The organization is unknown');
      }
      throw error;
    }

    this.emit('updated', name, organization);
    return organization;
  }

  /**
   * Deletes an existing organizations.
   * 
   * @param name The name of the organization to delete.
   */
  async delete(name: string): Promise<void> {

    try {
      const databaseService = await this.#getPersistenceService();
      await databaseService.delete(name);
    } catch (error: any) {
      if (error.status == 404) {
        throw new ServerError(404, 'The organization is unknown');
      }
      throw error;
    }

    this.emit('deleted', name);
  }

}

export default new OrganizationsService();
