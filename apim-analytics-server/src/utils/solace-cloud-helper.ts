import { Server } from '../models/server';
import { Endpoint } from '../models/endpoint';
import { createAuthorizationHeader, fetchData } from './fetch';

interface NamedItem {
  name: string;
}

/**
 * Retrieves endpoint information for the SEMPv2 Monitor API of a PubSub+ service.
 * 
 * @param server 
 *                The PubSub+ server.
 * @param serviceId 
 *                The PubSub+ service ID.
 * 
 * @returns The endpoint information for the SEMPv2 Monitor API.
 */
export const getSempV2MonitorEndpoint = async (server: Server, serviceId: string): Promise<Endpoint> => {

  const url = `${server.baseUrl}/services/${serviceId}`;
  const response = await fetchData(url, createAuthorizationHeader(server));

  const protocol = response.data?.managementProtocols?.find((i: NamedItem) => i.name === 'SEMP');
  if (!protocol) {
    throw new Error(`SEMP protocol is not supported for "${serviceId}"`);
  }

  const endpoint = protocol.endPoints?.find((j: NamedItem) => j.name === 'Secured SEMP Config')?.uris[0];
  if (!endpoint) {
    throw new Error(`SEMP endpoint not found for service "${serviceId}"`);
  }

  return {
    uri: endpoint.replace('/SEMP/v2/config', '/SEMP/v2/__private_monitor__'),
    username: protocol.username,
    password: protocol.password,
  }
}
