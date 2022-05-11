import fetch, { HeaderInit } from 'node-fetch';

import { Server } from '../model/server';
import { Endpoint } from '../model/endpoint';

/**
 * Creates the authorization header for a server.
 * 
 * @param server 
 *                The server configuration.
 * 
 * @returns The authorization header.
 */
export function createAuthorizationHeader(server: Server): HeaderInit | undefined;

/**
* Creates the authorization header for an endpoint.
* 
* @param endpoint 
*                The endpoint configuration.
* 
* @returns The authorization header for the endpoint.
*/
export function createAuthorizationHeader(endpoint: Endpoint): HeaderInit | undefined;

/** implementation */
export function createAuthorizationHeader(target: Server | Endpoint): HeaderInit | undefined {

  let headers: HeaderInit | undefined;

  if (target.username && target.password) {
    const upw = Buffer.from(`${target.username}:${target.password}`);
    headers = { Authorization: `Basic ${upw.toString('base64')}` };
  } else if (target.hasOwnProperty('token')) {
    headers = { Authorization: `Bearer ${(target as Server).token}` };
  }

  return headers;
}

/**
 * Fetches a JSON resource.
 * 
 * @param uri
 *               The URI of the JSON resource.
 * @param headers
 *               The headers.
 *
 * @returns The fetched JSON data.
 */
export const fetchData = async (uri: string, headers?: HeaderInit): Promise<any> => {

  const response = await fetch(uri, {
    method: "GET",
    headers: {
      ...headers,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`failed to retrieve data; status=${response.status}`);
  }

  return response.json();
}
