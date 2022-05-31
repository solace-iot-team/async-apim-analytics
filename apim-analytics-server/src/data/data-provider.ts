import { Logger as L } from '../common/logger';
import config from '../common/config';
import { Server } from '../model/server';
import { ApiProduct } from '../model/api-product';
import { Environment } from '../model/environment';
import { Developer } from '../model/developer';
import { Team } from '../model/team';
import { Application } from '../model/application';
import { Client } from '../model/client';
import { Queue } from '../model/queue';
import { RestDeliveryPoint } from '../model/rest-delivery-point';
import OrganizationService from '../api/services/organizations/service'
import { getEnvironments } from './collectors/connector/environments';
import { getApiProducts } from './collectors/connector/api-products';
import { getTeams } from './collectors/connector/teams';
import { getDevelopers } from './collectors/connector/developers';
import { getDeveloperApplications, getTeamApplications } from './collectors/connector/applications';
import { getClients } from './collectors/broker/clients';
import { getQueues } from './collectors/broker/queues';
import { getRestDeliveryPoints } from './collectors/broker/rest-delivery-points';


const ENVIRONMENTS_UPDATE_INTERVAL = 240;
const API_PRODUCTS_UPDATE_INTERVAL = 120;
const TEAMS_UPDATE_INTERVAL = 120;
const DEVELOPERS_UPDATE_INTERVAL = 120;
const APPLICATIONS_UPDATE_INTERVAL = 60;

const CLIENTS_UPDATE_INTERVAL = 60;
const QUEUES_UPDATE_INTERVAL = 60;
const REST_DELIVERY_POINTS_UPDATE_INTERVAL = 60;

/**
 * The data provider.
 */
class DataProvider {

  /** The API Management Connector configuration. */
  #connector: Server;

  /** The list of environments. */
  #environments: Environment[] = [];

  /** The list of API products. */
  #apiProducts: ApiProduct[] = [];

  /** The list of teams. */
  #teams: Team[] = [];

  /** The list of developers. */
  #developers: Developer[] = [];

  /** The list of applications. */
  #applications: Application[] = [];

  /** The list of clients. */
  #clients: Client[] = [];

  /** The list of queues. */
  #queues: Queue[] = [];

  /** The list of clients. */
  #restDeliveryPoints: RestDeliveryPoint[] = [];

  constructor() {

    this.#connector = config.connectorServer;
    if (!this.#connector) throw new Error('API Management Connector is not configured');

    this.#initialize();
  }

  get environments(): Environment[] {
    return this.#environments;
  }

  get apiProducts(): ApiProduct[] {
    return this.#apiProducts;
  }

  get teams(): Team[] {
    return this.#teams;
  }

  get developers(): Developer[] {
    return this.#developers;
  }

  get applications(): Application[] {
    return this.#applications;
  }

  get clients(): Client[] {
    return this.#clients;
  }

  get queues(): Queue[] {
    return this.#queues;
  }

  get restDeliveryPoints(): RestDeliveryPoint[] {
    return this.#restDeliveryPoints;
  }

  /**
   * Initialize the data provider.
   * 
   * During initialization, the data provider:
   *  1. Updates the entire data.
   *  2. Creates timers to periodically update the data.
   *  3. Register listeners to update the entire data each time when an organization is created, updated or deleted.
   */
  async #initialize(): Promise<void> {

    await this.#update();

    setInterval(this.#updateEnvironments.bind(this), ENVIRONMENTS_UPDATE_INTERVAL * 1000);
    setInterval(this.#updateApiProducts.bind(this), API_PRODUCTS_UPDATE_INTERVAL * 1000);
    setInterval(this.#updateTeams.bind(this), TEAMS_UPDATE_INTERVAL * 1000);
    setInterval(this.#updateDevelopers.bind(this), DEVELOPERS_UPDATE_INTERVAL * 1000);
    setInterval(this.#updateApplications.bind(this), APPLICATIONS_UPDATE_INTERVAL * 1000);
    setInterval(this.#updateClients.bind(this), CLIENTS_UPDATE_INTERVAL * 1000);
    setInterval(this.#updateQueues.bind(this), QUEUES_UPDATE_INTERVAL * 1000);
    setInterval(this.#updateRestDeliveryPoints.bind(this), REST_DELIVERY_POINTS_UPDATE_INTERVAL * 1000);

    OrganizationService.on('created', this.#update.bind(this));
    OrganizationService.on('updated', this.#update.bind(this));
    OrganizationService.on('deleted', this.#update.bind(this));
  }

  /** Update the entire data. */
  async #update(): Promise<void> {

    await Promise.all([
      this.#updateEnvironments(),
      this.#updateApiProducts(),
      this.#updateTeams(),
      this.#updateDevelopers(),
    ]);

    await this.#updateApplications();

    await Promise.all([
      this.#updateClients(),
      this.#updateQueues(),
      this.#updateRestDeliveryPoints(),
    ]);
  }

  /** Update the list of environments. */
  async #updateEnvironments(): Promise<void> {

    try {

      const environments: Environment[] = [];
      const start = new Date().getTime();

      const organizations = await OrganizationService.all();
      for (const organization of organizations) {
        if (organization.enabled) {
          const e = await getEnvironments(this.#connector, organization.name);
          environments.push(...e);
        }
      }

      this.#environments.length = 0;
      this.#environments.push(...environments);

      const duration = new Date().getTime() - start;
      L.info('DataProvider.updateEnvironments', `Updated data in ${duration} ms`);

    } catch (error: any) {
      L.warn('DataProvider.updateEnvironments', `Failed to update data; error=${error.message}`);
    }
  }

  /** Update the list of API products. */
  async #updateApiProducts(): Promise<void> {

    try {

      const apiProducts: ApiProduct[] = [];
      const start = new Date().getTime();

      const organizations = await OrganizationService.all();
      for (const organization of organizations) {
        if (organization.enabled) {
          const a = await getApiProducts(this.#connector, organization.name);
          apiProducts.push(...a);
        }
      }

      this.#apiProducts.length = 0;
      this.#apiProducts.push(...apiProducts);

      const duration = new Date().getTime() - start;
      L.info('DataProvider.updateApiProducts', `Updated data in ${duration} ms`);

    } catch (error: any) {
      L.warn('DataProvider.updateApiProducts', `Failed to update data; error=${error.message}`);
    }
  }

  /** Update the list of teams. */
  async #updateTeams(): Promise<void> {

    try {

      const teams: Team[] = [];
      const start = new Date().getTime();

      const organizations = await OrganizationService.all();
      for (const organization of organizations) {
        if (organization.enabled) {
          const t = await getTeams(this.#connector, organization.name);
          teams.push(...t);
        }
      }

      this.#teams.length = 0;
      this.#teams.push(...teams);

      const duration = new Date().getTime() - start;
      L.info('DataProvider.updateTeams', `Updated data in ${duration} ms`);

    } catch (error: any) {
      L.warn('DataProvider.updateTeams', `Failed to update data; error=${error.message}`);
    }
  }

  /** Update the list of developers. */
  async #updateDevelopers(): Promise<void> {

    try {

      const developers: Developer[] = [];
      const start = new Date().getTime();

      const organizations = await OrganizationService.all();
      for (const organization of organizations) {
        if (organization.enabled) {
          const d = await getDevelopers(this.#connector, organization.name);
          developers.push(...d);
        }
      }

      this.#developers.length = 0;
      this.#developers.push(...developers);

      const duration = new Date().getTime() - start;
      L.info('DataProvider.updateDevelopers', `Updated data in ${duration} ms`);

    } catch (error: any) {
      L.warn('DataProvider.updateDevelopers', `Failed to update data; error=${error.message}`);
    }
  }

  /** Update the list of team and developer applications. */
  async #updateApplications(): Promise<void> {

    try {

      const applications: Application[] = [];
      const start = new Date().getTime();

      for (const team of this.#teams) {
        const a = await getTeamApplications(this.#connector, team);
        applications.push(...a);
      }

      for (const developer of this.#developers) {
        const a = await getDeveloperApplications(this.#connector, developer);
        applications.push(...a);
      }

      this.#applications.length = 0;
      this.#applications.push(...applications);

      const duration = new Date().getTime() - start;
      L.info('DataProvider.updateApplications', `Updated data in ${duration} ms`);

    } catch (error: any) {
      L.warn('DataProvider.updateApplications', `Failed to update data; error=${error.message}`);
    }
  }

  /** Update the list of clients. */
  async #updateClients(): Promise<void> {

    try {

      const clients: Client[] = [];
      const start = new Date().getTime();

      for (const environment of this.#environments) {
        const organization = environment.meta.organization;
        const apps = this.#applications.filter(application => application.meta.organization == organization);
        if (apps.length > 0) {
          const c = await getClients(this.#connector, environment, apps);
          clients.push(...c);
        }
      }

      this.#clients.length = 0;
      this.#clients.push(...clients);

      const duration = new Date().getTime() - start;
      L.info('DataProvider.updateClients', `Updated data in ${duration} ms`);

    } catch (error: any) {
      L.warn('DataProvider.updateClients', `Failed to update data; error=${error.message}`);
    }
  }

  /** Update the list of queues. */
  async #updateQueues(): Promise<void> {

    try {

      const queues: Queue[] = [];
      const start = new Date().getTime();

      for (const environment of this.#environments) {
        const organization = environment.meta.organization;
        const apps = this.#applications.filter(application => application.meta.organization == organization);
        if (apps.length > 0) {
          const q = await getQueues(this.#connector, environment, apps);
          queues.push(...q);
        }
      }

      this.#queues.length = 0;
      this.#queues.push(...queues);

      const duration = new Date().getTime() - start;
      L.info('DataProvider.updateQueues', `Updated data in ${duration} ms`);

    } catch (error: any) {
      L.warn('DataProvider.updateQueues', `Failed to update data; error=${error.message}`);
    }
  }

  /** Update the list of rest delivery points. */
  async #updateRestDeliveryPoints(): Promise<void> {

    try {

      const restDeliveryPoints: RestDeliveryPoint[] = [];
      const start = new Date().getTime();

      for (const environment of this.#environments) {
        const organization = environment.meta.organization;
        const apps = this.#applications.filter(application => application.meta.organization == organization);
        if (apps.length > 0) {
          const r = await getRestDeliveryPoints(this.#connector, environment, apps);
          restDeliveryPoints.push(...r);
        }
      }

      this.#restDeliveryPoints.length = 0;
      this.#restDeliveryPoints.push(...restDeliveryPoints);

      const duration = new Date().getTime() - start;
      L.info('DataProvider.updateRestDeliveryPoints', `Updated data in ${duration} ms`);

    } catch (error: any) {
      L.warn('DataProvider.updateRestDeliveryPoints', `Failed to update data; error=${error.message}`);
    }
  }

}

export default new DataProvider();
