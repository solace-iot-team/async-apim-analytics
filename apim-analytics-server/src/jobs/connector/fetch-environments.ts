import { parentPort, workerData } from 'node:worker_threads';
import { Server } from '../../model/server';
import { Environment } from '../../model/environment';
import { createAuthorizationHeader, fetchData } from '../../utils/fetch';

/**
 * Retrieves environment information for an organization.
 * 
 * @param server
 *                The server configuration.
 * @param organization
 *                The name of the organization.
 * 
 * @return The environment information.
 */
const getEnvironments = async (server: Server, organization: string): Promise<Environment[]> => {

  const url = `${server.baseUrl}/${organization}/environments`;
  const headers = createAuthorizationHeader(server);

  const response = await fetchData(url, headers);

  if (!Array.isArray(response)) {
    throw new Error(`response is invalid: ${JSON.stringify(response)}`);
  }

  const environments: Environment[] = await Promise.all(response.map(async (item: any) => {

    const url = `${server.baseUrl}/${organization}/environments/${item.name}`;
    const environment = await fetchData(url, headers);

    return {
      name: environment.name,
      vpnName: environment.msgVpnName,
      serviceId: environment.serviceId,
      meta: {
        organization: organization,
      },
    };

  }));

  return environments;
}

// MAIN

(async (): Promise<void> => {

  const environments: Environment[] = [];

  const server: Server = workerData.server;
  if (!server) throw new Error('server configuration is not set');

  const organizations: string = workerData.organizations || [];
  for (const organization of organizations) {
    const e = await getEnvironments(server, organization);
    environments.push(...e);
  }

  parentPort?.postMessage(environments);
  parentPort?.postMessage('done');

})();
