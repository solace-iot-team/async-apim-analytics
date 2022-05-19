import { parentPort } from 'node:worker_threads';
import OrganizationService from '../../api/services/organizations/service';
import config from '../../common/config';
import { Server } from '../../model/server';
import { Team } from '../../model/team';
import { createAuthorizationHeader, fetchData } from '../../utils/fetch';
import Organization = Components.Schemas.Organization;

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
const getTeams = async (server: Server, organizationName: string): Promise<Team[]> => {

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

// MAIN

(async (): Promise<void> => {

  const teams: Team[] = [];

  const server: Server = config.connectorServer;
  if (!server) throw new Error('API Management Connector is not configured');

  const organizations: Organization[] = await OrganizationService.all();
  for (const organization of organizations) {
    if (organization.enabled) {
      const t = await getTeams(server, organization.name);
      teams.push(...t);
    }
  }

  parentPort?.postMessage(teams);
  parentPort?.postMessage('done');

})();
