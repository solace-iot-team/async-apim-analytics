import { parentPort, workerData } from 'node:worker_threads';
import { Server } from '../../model/server';
import { Api } from '../../model/api';
import { createAuthorizationHeader, fetchData } from '../../utils/fetch';

/**
 * Retrieves the APIs for an organization.
 * 
 * @param server
 *                The server configuration.
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

  const server: Server = workerData.server;
  if (!server) throw new Error('server configuration is not set');

  const organizations: string = workerData.organizations || [];
  for (const organization of organizations) {
    const a = await getApis(server, organization);
    apis.push(...a);
  }

  parentPort?.postMessage(apis);
  parentPort?.postMessage('done');

})();
