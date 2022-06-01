import { Server } from '../../../model/server';
import { Environment } from '../../../model/environment';
import { Application } from '../../../model/application';
import { RestDeliveryPoint } from '../../../model/rest-delivery-point';
import { createAuthorizationHeader, fetchData } from '../../../utils/fetch';
import { getSempV2MonitorEndpoint } from '../../../utils/solace-cloud-api';

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
export const getRestDeliveryPoints = async (server: Server, environment: Environment, applications: Application[]): Promise<RestDeliveryPoint[]> => {

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
