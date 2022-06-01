import { Server } from '../../../model/server';
import { Developer } from '../../../model/developer';
import { createAuthorizationHeader, fetchData } from '../../../utils/fetch';

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
export const getDevelopers = async (server: Server, organization: string): Promise<Developer[]> => {

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
