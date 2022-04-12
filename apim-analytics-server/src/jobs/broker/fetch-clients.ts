import { parentPort, workerData } from 'node:worker_threads';
import { Application } from '../../models/application';
import { Environment } from '../../models/environment';
import { Client } from '../../models/client';
import { Server } from '../../models/server';
import { createAuthorizationHeader, fetchData } from '../../utils/fetch';
import { getSempV2MonitorEndpoint } from '../../utils/solace-cloud-helper';

/** The list of client properties to retrieve from the server. */
const clientProperties = [
  'clientName',
  'clientUsername',
  'dataRxMsgCount',
  'dataTxMsgCount',
  'dataRxByteCount',
  'dataTxByteCount',
  'msgSpoolCongestionRxDiscardedMsgCount',
  'msgSpoolRxDiscardedMsgCount',
  'noSubscriptionMatchRxDiscardedMsgCount',
  'topicParseErrorRxDiscardedMsgCount',
  'txDiscardedMsgCount',
  'rxDiscardedMsgCount',
  'publishTopicAclRxDiscardedMsgCount',
  'uptime',
  'webParseErrorRxDiscardedMsgCount',
]

/**
 * Retrieves the external clients for a list of applications.
 * 
 * This function returns information for all SMF, MQTT, REST and AMQP clients that are connected
 * with the credentials of any of the specified applications.
 * 
 * This function doesn't return information for RDP clients for web hooks.
 * 
 * @param server 
 *                The PubSub+ server.
 * @param environment 
 *                The target environment.
 * @param applications 
 *                The applications.
 * 
 * @returns The external clients.
 */
const getClients = async (server: Server, environment: Environment, applications: Application[]): Promise<Client[]> => {

  const clients: Client[] = [];

  const endpoint = await getSempV2MonitorEndpoint(server, environment.serviceId);
  const headers = createAuthorizationHeader(endpoint);

  const vpnName = environment.vpnName;

  let nextPageUri = `${endpoint.uri}/msgVpns/${vpnName}/clients?count=100&select=${clientProperties.join(',')}`;
  while (nextPageUri) {

    let json = await fetchData(nextPageUri, headers);
    nextPageUri = json?.meta?.paging?.nextPageUri;

    json.data.forEach((client: any) => {

      const application = applications.find(application => {
        // an RDP client connects with a '#rdp/xxxx' user and is ignored
        return (client.clientUsername === application.credentials.username);
      });

      if (application) {

        clients.push({
          clientName: client.clientName,
          data: {
            dataRxByteCount: client.dataRxByteCount,
            dataRxMsgCount: client.dataRxMsgCount,
            dataTxByteCount: client.dataTxByteCount,
            dataTxMsgCount: client.dataTxMsgCount,
            msgSpoolCongestionRxDiscardedMsgCount: client.msgSpoolCongestionRxDiscardedMsgCount,
            msgSpoolRxDiscardedMsgCount: client.msgSpoolRxDiscardedMsgCount,
            noSubscriptionMatchRxDiscardedMsgCount: client.noSubscriptionMatchRxDiscardedMsgCount,
            publishTopicAclRxDiscardedMsgCount: client.publishTopicAclRxDiscardedMsgCount,
            topicParseErrorRxDiscardedMsgCount: client.topicParseErrorRxDiscardedMsgCount,
            txDiscardedMsgCount: client.txDiscardedMsgCount,
            rxDiscardedMsgCount: client.rxDiscardedMsgCount,
            uptime: client.uptime,
            webParseErrorRxDiscardedMsgCount: client.webParseErrorRxDiscardedMsgCount,
          },
          meta: {
            organization: application.meta.organization,
            environment: environment.name,
            application: application.name,
          },
        });
      }
    });

  } // while (nextPageUri)

  return clients;
}

// MAIN

(async () => {

  const clients: Client[] = [];

  const server: Server = workerData.server;
  if (!server) throw new Error('server configuration is not set');

  const environments: Environment[] = workerData.environments || [];
  const applications: Application[] = workerData.applications || [];

  for (const environment of environments) {
    const organization = environment.meta.organization;
    const apps = applications.filter(application => application.meta.organization == organization);
    if (apps.length > 0) {
      const _clients = await getClients(server, environment, apps);
      clients.push(..._clients);
    }
  }

  parentPort?.postMessage(clients);
  parentPort?.postMessage('done');

})();
