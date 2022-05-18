import { Server } from '../model/server';
import { Endpoint } from '../model/endpoint';
import { createAuthorizationHeader, fetchData } from './fetch';
import {
  AdministrationService,
  CloudToken,
  OpenAPI,
} from '@solace-iot-team/apim-connector-openapi-node';

interface NamedItem {
  name: string;
}

const endpointCache: Map<string, Endpoint> = new Map<string, Endpoint>();

/**
 * Returns the Solace PubSub+ cloud endpoint for an organization.
 * 
 * @param server The API Management Connector configuration.
 * @param organizationName The name of the organization.
 * 
 * @returns The Solace PubSub+ cloud endpoint.
 */
const getCloudEndpoint = async (server: Server, organizationName: string): Promise<Server> => {

  OpenAPI.BASE = server.baseUrl;
  OpenAPI.USERNAME = server.username;
  OpenAPI.PASSWORD = server.password;

  const response = await AdministrationService.getOrganization({ organizationName });

  let cloudEndpoint: Server;
  if (typeof response['cloud-token'] == 'string') {
    cloudEndpoint = { baseUrl: 'https://api.solace.cloud/api/v0', token: response['cloud-token'] };
  } else {
    const cloudToken = response['cloud-token'] as CloudToken;
    cloudEndpoint = { baseUrl: cloudToken.cloud.baseUrl, token: cloudToken.cloud.token };
  }

  return cloudEndpoint;
}

/**
 * Retrieves endpoint information for the SEMPv2 Monitor API for a Solace PubSub+ cloud service.
 * 
 * @param server
 *                The API Management Connector configuration.
 * @param organizationName
 *                The name of the organization.
 * @param serviceId 
 *                The PubSub+ cloud service ID.
 * 
 * @returns The endpoint information for the SEMPv2 Monitor API.
 */
export const getSempV2MonitorEndpoint = async (server: Server, organizationName: string, serviceId: string): Promise<Endpoint> => {

  const cacheKey = `${organizationName}_${serviceId}_SEMPv2MonitorEndpoint`;

  if (!endpointCache.has(cacheKey)) {

    const cloudEndpoint: Server = await getCloudEndpoint(server, organizationName);

    const url = `${cloudEndpoint.baseUrl}/services/${serviceId}`;
    const response = await fetchData(url, createAuthorizationHeader(cloudEndpoint));

    const protocol = response.data?.managementProtocols?.find((i: NamedItem) => i.name === 'SEMP');
    if (!protocol) {
      throw new Error(`SEMP protocol is not supported for "${serviceId}"`);
    }

    const endpoint = protocol.endPoints?.find((j: NamedItem) => j.name === 'Secured SEMP Config')?.uris[0];
    if (!endpoint) {
      throw new Error(`SEMP endpoint not found for service "${serviceId}"`);
    }

    endpointCache.set(cacheKey, {
      uri: endpoint.replace('/SEMP/v2/config', '/SEMP/v2/__private_monitor__'),
      username: protocol.username,
      password: protocol.password,
    });
  }

  return endpointCache.get(cacheKey)!;
}
