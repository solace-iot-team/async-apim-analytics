import { Server } from '../../../model/server';
import { Team } from '../../../model/team';
import { createAuthorizationHeader, fetchData } from '../../../utils/fetch';

/**
 * Retrieves the teams for an organization.
 * 
 * @param server
 *                The API Management Connector configuration.
 * @param organizationName
 *                The name of the organization.
 * 
 * @return The list of teams.
 */
export const getTeams = async (server: Server, organizationName: string): Promise<Team[]> => {

  const url = `${server.baseUrl}/${organizationName}/teams`
  const response = await fetchData(url, createAuthorizationHeader(server));

  if (!Array.isArray(response)) {
    throw new Error(`response is invalid: ${JSON.stringify(response)}`);
  }

  const teams = response.map((team: any) => ({
    name: team.name,
    meta: {
      organization: organizationName,
    },
  }));

  return teams;
}
