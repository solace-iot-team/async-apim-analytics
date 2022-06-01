import { Application } from '../../../model/application';
import { Environment } from '../../../model/environment';
import { Client } from '../../../model/client';
import { Server } from '../../../model/server';
import { createAuthorizationHeader, fetchData } from '../../../utils/fetch';
import { getSempV2MonitorEndpoint } from '../../../utils/solace-cloud-api';

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
 *                The API Management Connector configuration.
 * @param environment 
 *                The target environment.
 * @param applications 
 *                The applications.
 * 
 * @returns The external clients.
 */
export const getClients = async (server: Server, environment: Environment, applications: Application[]): Promise<Client[]> => {

  const clients: Client[] = [];

  const endpoint = await getSempV2MonitorEndpoint(server, environment.meta.organization, environment.serviceId);
  const headers = createAuthorizationHeader(endpoint);

  const vpnName = environment.msgVpnName;

  let nextPageUri = `${endpoint.uri}/msgVpns/${vpnName}/clients?count=100&select=${clientProperties.join(',')}`;
  while (nextPageUri) {

    const response = await fetchData(nextPageUri, headers);
    nextPageUri = response?.meta?.paging?.nextPageUri;

    response.data.forEach((client: any) => {

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
