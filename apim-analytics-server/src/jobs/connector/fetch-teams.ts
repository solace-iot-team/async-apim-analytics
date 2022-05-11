import { parentPort, workerData } from 'node:worker_threads';
import { Server } from '../../model/server';
import { Team } from '../../model/team';
import { createAuthorizationHeader, fetchData } from '../../utils/fetch';

/**
 * Retrieves the teams for an organization.
 * 
 * @param server
 *                The server configuration.
 * @param organization
 *                The name of the organization.
 * 
 * @return The list of teams.
 */
const getTeams = async (server: Server, organization: string): Promise<Team[]> => {

  const url = `${server.baseUrl}/${organization}/teams`
  const response = await fetchData(url, createAuthorizationHeader(server));

  if (!Array.isArray(response)) {
    throw new Error(`response is invalid: ${JSON.stringify(response)}`);
  }

  const teams = response.map((team: any) => ({
    name: team.name,
    meta: {
      organization: organization,
    },
  }));

  return teams;
}

// MAIN

(async (): Promise<void> => {

  const teams: Team[] = [];

  const server: Server = workerData.server;
  if (!server) throw new Error('server configuration is not set');

  const organizations: string = workerData.organizations || [];
  for (const organization of organizations) {
    const t = await getTeams(server, organization);
    teams.push(...t);
  }

  parentPort?.postMessage(teams);
  parentPort?.postMessage('done');

})();
