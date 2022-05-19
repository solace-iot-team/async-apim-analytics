import { parentPort } from 'node:worker_threads';
import config from '../../common/config';
import OrganizationService from '../../api/services/organizations/service';
import { Developer } from '../../model/developer';
import { Server } from '../../model/server';
import { createAuthorizationHeader, fetchData } from '../../utils/fetch';
import Organization = Components.Schemas.Organization;

/**
 * Retrieves the developers for an organization.
 * 
 * @param server
 *                The API Management Connector configuration.
 * @param organization
 *                The name of the organization.
 * 
 * @return The list of developers.
 */
const getDevelopers = async (server: Server, organization: string): Promise<Developer[]> => {

  const url = `${server.baseUrl}/${organization}/developers`
  const response = await fetchData(url, createAuthorizationHeader(server));

  if (!Array.isArray(response)) {
    throw new Error(`response is invalid: ${JSON.stringify(response)}`);
  }

  const developers = response.map((developer: any) => ({
    userName: developer.userName,
    meta: {
      organization: organization,
    }
  }));

  return developers;
}

// MAIN

(async (): Promise<void> => {

  const developers: Developer[] = [];

  const server: Server = config.connectorServer;
  if (!server) throw new Error('API Management Connector is not configured');

  const organizations: Organization[] = await OrganizationService.all();
  for (const organization of organizations) {
    if (organization.enabled) {
      const d = await getDevelopers(server, organization.name);
      developers.push(...d);
    }
  }

  parentPort?.postMessage(developers);
  parentPort?.postMessage('done');

})();
