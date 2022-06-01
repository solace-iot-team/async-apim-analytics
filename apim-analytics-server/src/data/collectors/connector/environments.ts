import { Environment } from '../../../model/environment';
import { Server } from '../../../model/server';
import { createAuthorizationHeader, fetchData } from '../../../utils/fetch';

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
export const getEnvironments = async (server: Server, organizationName: string): Promise<Environment[]> => {

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
      msgVpnName: environment.msgVpnName,
      serviceId: environment.serviceId,
      datacenterId: environment.datacenterId,
      meta: {
        organization: organizationName,
      },
    };

  }));

  return environments;
}
