import { Server } from '../../../model/server';
import { Team } from '../../../model/team';
import { Developer } from '../../../model/developer';
import { Application } from '../../../model/application';
import { createAuthorizationHeader, fetchData } from '../../../utils/fetch';

/**
 * Extracts the names of API products.
 * 
 * @param apiProducts The API products.
 * 
 * @returns The API product names.
 */
const getApiProductNames = (apiProducts: any[]): string[] => {

  const result: string[] = [];
  apiProducts.forEach(item => {
    if (typeof item === 'string') {
      result.push(item);
    } else if (typeof item.apiproduct === 'string') {
      result.push(item.apiproduct);
    }
  });

  return result;
}

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
export const getTeamApplications = async (server: Server, team: Team): Promise<Application[]> => {

  const url = `${server.baseUrl}/${team.meta.organization}/teams/${team.name}/apps`;
  const response = await fetchData(url, createAuthorizationHeader(server));

  if (!Array.isArray(response)) {
    throw new Error(`response is invalid: ${JSON.stringify(response)}`);
  }

  const applications: Application[] = response.map((application: any) => ({
    name: application.name,
    internalName: application.internalName,
    apiProducts: getApiProductNames(application.apiProducts),
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
export const getDeveloperApplications = async (server: Server, developer: Developer): Promise<Application[]> => {

  const url = `${server.baseUrl}/${developer.meta.organization}/developers/${developer.userName}/apps`
  const response = await fetchData(url, createAuthorizationHeader(server));

  if (!Array.isArray(response)) {
    throw new Error(`response is invalid: ${JSON.stringify(response)}`);
  }

  const applications: Application[] = response.map((application: any) => ({
    name: application.name,
    internalName: application.internalName,
    apiProducts: getApiProductNames(application.apiProducts),
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
