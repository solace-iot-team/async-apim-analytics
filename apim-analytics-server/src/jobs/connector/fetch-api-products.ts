import { parentPort, workerData } from 'node:worker_threads';
import { Server } from '../../model/server';
import { ApiProduct } from '../../model/api-product';
import { createAuthorizationHeader, fetchData } from '../../utils/fetch';

/**
 * Retrieves all API products for an organization.
 * 
 * @param server
 *                The server configuration.
 * @param organization
 *                The name of the organization.
 * 
 * @return The list of API products.
 */
const getApiProducts = async (server: Server, organization: string): Promise<ApiProduct[]> => {

  const url = `${server.baseUrl}/${organization}/apiProducts`;
  const response = await fetchData(url, createAuthorizationHeader(server));

  if (!Array.isArray(response)) {
    throw new Error(`response is invalid: ${JSON.stringify(response)}`);
  }

  const apiProducts = response.map((apiProduct: any) => ({
    organization: organization,
    name: apiProduct.name,
  }));

  return apiProducts;
}

// MAIN

(async (): Promise<void> => {

  const apiProducts: ApiProduct[] = [];

  const server: Server = workerData.server;
  if (!server) throw new Error('server configuration is not set');

  const organizations: string = workerData.organizations || [];
  for (const organization of organizations) {
    const a = await getApiProducts(server, organization);
    apiProducts.push(...a);
  }

  parentPort?.postMessage(apiProducts);
  parentPort?.postMessage('done');

})();
