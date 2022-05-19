import { parentPort } from 'node:worker_threads';
import OrganizationService from '../../api/services/organizations/service';
import config from '../../common/config';
import { Environment } from '../../model/environment';
import { Server } from '../../model/server';
import { createAuthorizationHeader, fetchData } from '../../utils/fetch';
import Organization = Components.Schemas.Organization;

/**
 * Retrieves environment information for an organization.
 * 
 * @param server
 *                The API Management Connector configuration.
 * @param organizationName
 *                The name of the organization.
 * 
 * @return The environment information.
 */
const getEnvironments = async (server: Server, organizationName: string): Promise<Environment[]> => {

  const url = `${server.baseUrl}/${organizationName}/environments`;
  const headers = createAuthorizationHeader(server);

  const response = await fetchData(url, headers);

  if (!Array.isArray(response)) {
    throw new Error(`response is invalid: ${JSON.stringify(response)}`);
  }

  const environments: Environment[] = await Promise.all(response.map(async (item: any) => {

    const url = `${server.baseUrl}/${organizationName}/environments/${item.name}`;
    const environment = await fetchData(url, headers);

    return {
      name: environment.name,
      vpnName: environment.msgVpnName,
      serviceId: environment.serviceId,
      meta: {
        organization: organizationName,
      },
    };

  }));

  return environments;
}

// MAIN

(async (): Promise<void> => {

  const environments: Environment[] = [];

  const server: Server = config.connectorServer;
  if (!server) throw new Error('API Management Connector is not configured');

  const organizations: Organization[] = await OrganizationService.all();
  for (const organization of organizations) {
    if (organization.enabled) {
      const e = await getEnvironments(server, organization.name);
      environments.push(...e);
    }
  }

  parentPort?.postMessage(environments);
  parentPort?.postMessage('done');

})();
