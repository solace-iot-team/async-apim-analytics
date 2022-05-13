import { parentPort } from 'node:worker_threads';
import config from '../../common/config';
import OrganizationService from '../../api/services/organizations/service';
import { Server } from '../../model/server';
import { ApiProduct } from '../../model/api-product';
import { createAuthorizationHeader, fetchData } from '../../utils/fetch';
import Organization = Components.Schemas.Organization;

/**
 * Retrieves all API products for an organization.
 * 
 * @param server
 *                The API Management Connector configuration.
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

  const server: Server = config.connectorServer;
  if (!server) throw new Error('API Management Connector is not configured');

  const organizations: Organization[] = await OrganizationService.all();
  for (const organization of organizations) {
    if (organization.enabled) {
      const a = await getApiProducts(server, organization.name);
      apiProducts.push(...a);
    }
  }

  parentPort?.postMessage(apiProducts);
  parentPort?.postMessage('done');

})();
