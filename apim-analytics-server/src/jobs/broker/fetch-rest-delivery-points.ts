import { parentPort, workerData } from 'node:worker_threads';
import config from '../../common/config';
import { Server } from '../../model/server';
import { Application } from '../../model/application';
import { Environment } from '../../model/environment';
import { RestDeliveryPoint } from '../../model/rest-delivery-point';
import { createAuthorizationHeader, fetchData } from '../../utils/fetch';
import { getSempV2MonitorEndpoint } from '../../utils/solace-cloud-api';

/** The list of RDP client properties to retrieve from the server. */
const clientProperties = [
  'clientName',
  'clientUsername',
  'restHttpRequestTxByteCount',
  'restHttpRequestTxMsgCount',
  'restHttpResponseErrorRxMsgCount',
  'restHttpResponseRxByteCount',
  'restHttpResponseRxMsgCount',
  'restHttpResponseSuccessRxMsgCount',
  'restHttpResponseTimeoutRxMsgCount',
]

/**
 * Retrieves rest delivery points (RDPs) for a list of applications.
 * 
 * @param server
 *                The API Management Connector configuration.
 * @param environment 
 *                The target environment.
 * @param applications 
 *                The applications.
 * 
 * @returns The rest delivery points.
 */
const getRestDeliveryPoints = async (server: Server, environment: Environment, applications: Application[]): Promise<RestDeliveryPoint[]> => {

  const restDeliveryPoints: RestDeliveryPoint[] = [];

  const endpoint = await getSempV2MonitorEndpoint(server, environment.meta.organization, environment.serviceId);
  const headers = createAuthorizationHeader(endpoint);

  const vpnName = environment.msgVpnName;

  let nextPageUri = `${endpoint.uri}/msgVpns/${vpnName}/clients?count=100&select=${clientProperties.join(',')}`;
  while (nextPageUri) {

    const response = await fetchData(nextPageUri, headers);
    nextPageUri = response?.meta?.paging?.nextPageUri;

    for (const client of response.data) {

      const application = applications.find(application => {
        return (client.clientUsername === `#rdp/${application.internalName}`);
      });

      if (application) {

        const restDeliveryPointName = application.internalName;

        const url = `${endpoint.uri}/msgVpns/${vpnName}/restDeliveryPoints?where=restDeliveryPointName==${restDeliveryPointName}`;
        const rdp = await fetchData(url, headers);

        restDeliveryPoints.push({
          restDeliveryPointName: restDeliveryPointName,
          data: {
            restHttpRequestTxByteCount: client.restHttpRequestTxByteCount,
            restHttpRequestTxMsgCount: client.restHttpRequestTxMsgCount,
            restHttpResponseErrorRxMsgCount: client.restHttpResponseErrorRxMsgCount,
            restHttpResponseRxByteCount: client.restHttpResponseRxByteCount,
            restHttpResponseRxMsgCount: client.restHttpResponseRxMsgCount,
            restHttpResponseSuccessRxMsgCount: client.restHttpResponseSuccessRxMsgCount,
            restHttpResponseTimeoutRxMsgCount: client.restHttpResponseTimeoutRxMsgCount,
            up: rdp.up,
          },
          meta: {
            organization: application.meta.organization,
            environment: environment.name,
            application: application.name,
          },
        });
      }
    }

  } // while (nextPageUri)

  return restDeliveryPoints;
}

// MAIN

(async () => {

  const restDeliveryPoints: RestDeliveryPoint[] = [];

  const server: Server = config.connectorServer;
  if (!server) throw new Error('API Management Connector is not configured');

  const environments: Environment[] = workerData.environments || [];
  const applications: Application[] = workerData.applications || [];

  for (const environment of environments) {
    const organization = environment.meta.organization;
    const apps = applications.filter(application => application.meta.organization == organization);
    if (apps.length > 0) {
      const _rdps = await getRestDeliveryPoints(server, environment, apps);
      restDeliveryPoints.push(..._rdps);
    }
  }

  parentPort?.postMessage(restDeliveryPoints);
  parentPort?.postMessage('done');

})();
