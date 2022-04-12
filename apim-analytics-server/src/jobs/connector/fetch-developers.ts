import { parentPort, workerData } from 'node:worker_threads';
import { Server } from '../../models/server';
import { Developer } from '../../models/developer';
import { createAuthorizationHeader, fetchData } from '../../utils/fetch';

/**
 * Retrieves the developers for an organization.
 * 
 * @param server
 *                The server configuration.
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

  const server: Server = workerData.server;
  if (!server) throw new Error('server configuration is not set');

  const organizations: string = workerData.organizations || [];
  for (const organization of organizations) {
    const d = await getDevelopers(server, organization);
    developers.push(...d);
  }

  parentPort?.postMessage(developers);
  parentPort?.postMessage('done');

})();
