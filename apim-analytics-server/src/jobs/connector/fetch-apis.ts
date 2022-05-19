import { parentPort } from 'node:worker_threads';
import config from '../../common/config';
import OrganizationService from '../../api/services/organizations/service';
import { Server } from '../../model/server';
import { Api } from '../../model/api';
import { createAuthorizationHeader, fetchData } from '../../utils/fetch';
import Organization = Components.Schemas.Organization;

/**
 * Retrieves the APIs for an organization.
 * 
 * @param server
 *                The API Management Connector configuration.
 * @param organization
 *                The name of the organization.
 * 
 * @return The API list.
 */
const getApis = async (server: Server, organization: string): Promise<Api[]> => {

  const url = `${server.baseUrl}/${organization}/apis`;
  const response = await fetchData(url, createAuthorizationHeader(server));

  if (!Array.isArray(response)) {
    throw new Error(`response is invalid: ${JSON.stringify(response)}`);
  }

  const apis = response.map((api: any) => ({
    organization: organization,
    name: api.name,
  }));

  return apis;
}

// MAIN

(async (): Promise<void> => {

  const apis: Api[] = [];

  const server: Server = config.connectorServer;
  if (!server) throw new Error('API Management Connector is not configured');

  const organizations: Organization[] = await OrganizationService.all();
  for (const organization of organizations) {
    if (organization.enabled) {
      const a = await getApis(server, organization.name);
      apis.push(...a);
    }
  }

  parentPort?.postMessage(apis);
  parentPort?.postMessage('done');

})();
