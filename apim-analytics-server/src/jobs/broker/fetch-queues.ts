import { parentPort, workerData } from 'node:worker_threads';
import { Server } from '../../models/server';
import { Application } from '../../models/application';
import { Environment } from '../../models/environment';
import { Queue } from '../../models/queue';
import { createAuthorizationHeader, fetchData } from '../../utils/fetch';
import { getSempV2MonitorEndpoint } from '../../utils/solace-cloud-helper';

/** The list of queue properties to retrieve from the server. */
const queueProperties = [
  'bindCount',
  'clientProfileDeniedDiscardedMsgCount',
  'deletedMsgCount',
  'destinationGroupErrorDiscardedMsgCount',
  'disabledDiscardedMsgCount',
  'lowPriorityMsgCongestionDiscardedMsgCount',
  'maxMsgSizeExceededDiscardedMsgCount',
  'maxMsgSpoolUsage',
  'maxMsgSpoolUsageExceededDiscardedMsgCount',
  'maxRedeliveryExceededDiscardedMsgCount',
  'maxRedeliveryExceededToDmqFailedMsgCount',
  'maxRedeliveryExceededToDmqMsgCount',
  'maxTtl',
  'maxTtlExceededDiscardedMsgCount',
  'maxTtlExpiredDiscardedMsgCount',
  'maxTtlExpiredToDmqFailedMsgCount',
  'maxTtlExpiredToDmqMsgCount',
  'msgs.count',
  'msgSpoolUsage',
  'msgSpoolPeakUsage',
  'noLocalDeliveryDiscardedMsgCount',
  'owner',
  'queueName',
  'redeliveredMsgCount',
  'spooledMsgCount',
  'transportRetransmitMsgCount',
] as const;

/**
 * Retrieves the queues for guaranteed messaging for a list of applications.
 * 
 * This function returns information for message queues created for guaranteed messaging for any of the
 * specified applications.
 * 
 * This function doesn't return information for message queues created for web hooks
 * 
 * @param server 
 *                The PubSub+ server.
 * @param environment 
 *                The target environment.
 * @param applications 
 *                The applications.
 * 
 * @returns The queues for guaranteed messaging.
 */
const getQueues = async (server: Server, environment: Environment, applications: Application[]): Promise<Queue[]> => {

  const queues: Queue[] = [];

  const endpoint = await getSempV2MonitorEndpoint(server, environment.serviceId);
  const headers = createAuthorizationHeader(endpoint);

  const vpnName = environment.vpnName;

  let nextPageUri = `${endpoint.uri}/msgVpns/${vpnName}/queues?count=100&where=owner!=""&select=${queueProperties.join(',')}`;
  while (nextPageUri) {

    let json = await fetchData(nextPageUri, headers);
    nextPageUri = json?.meta?.paging?.nextPageUri;

    json.data.forEach((queue: any, index: number) => {

      const application = applications.find(application => {
        // the name of a queue for guaranteed messaging starts with the internal
        // name of the application, followed by the name of the API product
        return queue.queueName.startsWith(`${application.internalName}-`);
      });

      if (application) {

        queues.push({
          queueName: queue.queueName,
          data: {
            bindCount: queue.bindCount,
            clientProfileDeniedDiscardedMsgCount: queue.clientProfileDeniedDiscardedMsgCount,
            deletedMsgCount: queue.deletedMsgCount,
            destinationGroupErrorDiscardedMsgCount: queue.destinationGroupErrorDiscardedMsgCount,
            disabledDiscardedMsgCount: queue.disabledDiscardedMsgCount,
            lowPriorityMsgCongestionDiscardedMsgCount: queue.lowPriorityMsgCongestionDiscardedMsgCount,
            maxMsgSizeExceededDiscardedMsgCount: queue.maxMsgSizeExceededDiscardedMsgCount,
            maxMsgSpoolUsageExceededDiscardedMsgCount: queue.maxMsgSpoolUsageExceededDiscardedMsgCount,
            maxRedeliveryExceededDiscardedMsgCount: queue.maxRedeliveryExceededDiscardedMsgCount,
            maxRedeliveryExceededToDmqFailedMsgCount: queue.maxRedeliveryExceededToDmqFailedMsgCount,
            maxRedeliveryExceededToDmqMsgCount: queue.maxRedeliveryExceededToDmqMsgCount,
            maxTtl: queue.maxTtl,
            maxTtlExceededDiscardedMsgCount: queue.maxTtlExceededDiscardedMsgCount,
            maxTtlExpiredDiscardedMsgCount: queue.maxTtlExpiredDiscardedMsgCount,
            maxTtlExpiredToDmqFailedMsgCount: queue.maxTtlExpiredToDmqFailedMsgCount,
            maxTtlExpiredToDmqMsgCount: queue.maxTtlExpiredToDmqMsgCount,
            msgCount: json.collections[index]?.msgs.count,
            msgSpoolUsage: queue.msgSpoolUsage,
            msgSpoolPeakUsage: queue.msgSpoolPeakUsage,
            noLocalDeliveryDiscardedMsgCount: queue.noLocalDeliveryDiscardedMsgCount,
            redeliveredMsgCount: queue.redeliveredMsgCount,
            spooledMsgCount: queue.spooledMsgCount,
            transportRetransmitMsgCount: queue.transportRetransmitMsgCount,
          },
          meta: {
            organization: application.meta.organization,
            environment: environment.name,
            application: application.name,
          },
        });
      }
    });

  } // (nextPageUri)

  return queues;
}

(async () => {

  const queues: Queue[] = [];

  const server: Server = workerData.server;
  if (!server) throw new Error('server configuration is not set');

  const environments: Environment[] = workerData.environments || [];
  const applications: Application[] = workerData.applications || [];

  for (const environment of environments) {
    const organization = environment.meta.organization;
    const apps = applications.filter(application => application.meta.organization == organization);
    if (apps.length > 0) {
      const _queues = await getQueues(server, environment, apps);
      queues.push(..._queues);
    }
  }

  parentPort?.postMessage(queues);
  parentPort?.postMessage('done');

})();
