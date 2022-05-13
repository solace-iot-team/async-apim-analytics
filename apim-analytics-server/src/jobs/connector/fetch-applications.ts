import { parentPort, workerData } from 'node:worker_threads';
import config from '../../common/config';
import { Server } from '../../model/server';
import { Team } from '../../model/team';
import { Developer } from '../../model/developer';
import { Application } from '../../model/application';
import { createAuthorizationHeader, fetchData } from '../../utils/fetch';

/**
 * Retrieves the applications for a team.
 * 
 * @param server
 *                The API Management Connector configuration.
 * @param team
 *                The team.
 * 
 * @return The list of team applications.
 */
const getTeamApplications = async (server: Server, team: Team): Promise<Application[]> => {

  const url = `${server.baseUrl}/${team.meta.organization}/teams/${team.name}/apps`;
  const response = await fetchData(url, createAuthorizationHeader(server));

  if (!Array.isArray(response)) {
    throw new Error(`response is invalid: ${JSON.stringify(response)}`);
  }

  const applications: Application[] = response.map((application: any) => ({
    name: application.name,
    internalName: application.internalName,
    apiProducts: application.apiProducts,
    credentials: {
      username: application.credentials.secret.consumerKey,
    },
    meta: {
      organization: team.meta.organization,
      type: 'team',
      owner: team.name,
    }
  }));

  return applications;
}

/**
 * Retrieves the applications for a developer.
 * 
 * @param server
 *                The server configuration.
 * @param developer
 *                The developer.
 * 
 * @return The list of developer applications.
 */
const getDeveloperApplications = async (server: Server, developer: Developer): Promise<Application[]> => {

  const url = `${server.baseUrl}/${developer.meta.organization}/developers/${developer.userName}/apps`
  const response = await fetchData(url, createAuthorizationHeader(server));

  if (!Array.isArray(response)) {
    throw new Error(`response is invalid: ${JSON.stringify(response)}`);
  }

  const applications: Application[] = response.map((application: any) => ({
    name: application.name,
    internalName: application.internalName,
    apiProducts: application.apiProducts,
    credentials: {
      username: application.credentials.secret.consumerKey,
    },
    meta: {
      organization: developer.meta.organization,
      type: 'developer',
      owner: developer.userName,
    }
  }));

  return applications;
}

(async (): Promise<void> => {

  const applications: Application[] = [];

  const server: Server = config.connectorServer;
  if (!server) throw new Error('API Management Connector is not configured');

  const teams: Team[] = workerData.teams || [];
  for (const team of teams) {
    const apps = await getTeamApplications(server, team);
    applications.push(...apps);
  }

  const developers: Developer[] = workerData.developers || [];
  for (const developer of developers) {
    const apps = await getDeveloperApplications(server, developer);
    applications.push(...apps);
  }

  parentPort?.postMessage(applications);
  parentPort?.postMessage('done');

})();
