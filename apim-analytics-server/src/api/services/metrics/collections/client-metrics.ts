import * as prometheus from 'prom-client';
import dataProvider from '../../../../data/data-provider';
import { Client } from '../../../../model/client';

const CLIENT_UPTIME = 'client_uptime_seconds_total';
const CLIENT_MESSAGES_SENT = 'client_messages_sent_total';
const CLIENT_MESSAGES_RECEIVED = 'client_messages_received_total';
const CLIENT_MESSAGES_DISCARDED = 'client_messages_discarded_total';
const CLIENT_DATA_SENT = 'client_messages_sent_bytes_total';
const CLIENT_DATA_RECEIVED = 'client_messages_received_bytes_total';

/** The client metrics options. */
export interface ClientMetricsOptions {
  prefix?: string;
  register?: prometheus.Registry;
}

/**
 * Registers the client metrics.
 * 
 * @param options The client metrics options.
 */
export const collectClientMetrics = (options?: ClientMetricsOptions) => {

  const registry = options?.register ?? prometheus.register;
  const namePrefix = options?.prefix ?? '';

  registerUpTimeMetric(registry, namePrefix);
  registerMessagesSentMetric(registry, namePrefix);
  registerMessagesReceivedMetric(registry, namePrefix);
  registerMessagesDiscardedMetric(registry, namePrefix);
  registerDataSentMetric(registry, namePrefix);
  registerDataReceivedMetric(registry, namePrefix);
}

/**
 * Registers a metric for the up-time of a client.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerUpTimeMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'client_id'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.clients.forEach((client) => {
      this.inc({ ...client.meta, client_id: client.clientName }, client.data.uptime);
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + CLIENT_UPTIME,
    help: 'The amount of time in seconds since the client connected.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the number of data messages transmitted from a client.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerMessagesSentMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'client_id'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.clients.forEach(client => {
      const uptime = client.data.uptime ?? 0;
      if (uptime < 60) {
        this.inc({ ...client.meta, client_id: client.clientName }, 0);
      } else {
        this.inc({ ...client.meta, client_id: client.clientName }, client.data.dataRxMsgCount);
      }
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + CLIENT_MESSAGES_SENT,
    help: 'The number of client data messages sent from the client.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the number of data messages received by a client.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerMessagesReceivedMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'client_id'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.clients.forEach(client => {
      const uptime = client.data.uptime ?? 0;
      if (uptime < 60) {
        this.inc({ ...client.meta, client_id: client.clientName }, 0);
      } else {
        this.inc({ ...client.meta, client_id: client.clientName }, client.data.dataTxMsgCount);
      }
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + CLIENT_MESSAGES_RECEIVED,
    help: 'The number of client data messages received by the client.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the number of data messages discarded.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerMessagesDiscardedMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'client_id', 'type', 'reason'] as const;
  type Label = typeof allLabelNames[number];

  const reasonToDataPropertyMap: Record<string, keyof Client.Data> = {
    noSubscriptionMatch: 'noSubscriptionMatchRxDiscardedMsgCount',
    topicParseError: 'topicParseErrorRxDiscardedMsgCount',
    webParseError: 'webParseErrorRxDiscardedMsgCount',
    publishTopicAcl: 'publishTopicAclRxDiscardedMsgCount',
    msgSpoolCongestion: 'msgSpoolCongestionRxDiscardedMsgCount',
    msgSpoolDiscards: 'msgSpoolRxDiscardedMsgCount',
  }

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.clients.forEach(client => {
      const uptime = client.data.uptime ?? 0;
      if (uptime < 60) {
        for (const reason in reasonToDataPropertyMap) {
          this.inc({ ...client.meta, client_id: client.clientName, type: 'incoming', reason }, 0);
        }
        this.inc({ ...client.meta, client_id: client.clientName, type: 'outgoing' }, 0);
      } else {
        for (const reason in reasonToDataPropertyMap) {
          const value = client.data[reasonToDataPropertyMap[reason]] || 0;
          this.inc({ ...client.meta, client_id: client.clientName, type: 'incoming', reason }, value);
        }
        const outgoing = client.data.txDiscardedMsgCount || 0;
        this.inc({ ...client.meta, client_id: client.clientName, type: 'outgoing' }, outgoing);
      }
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + CLIENT_MESSAGES_DISCARDED,
    help: 'The number of client data messages discarded.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the amount of data messages transmitted from the client.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerDataSentMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'client_id'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.clients.forEach(client => {
      const uptime = client.data.uptime ?? 0;
      if (uptime < 60) {
        this.inc({ ...client.meta, client_id: client.clientName }, 0);
      } else {
        this.inc({ ...client.meta, client_id: client.clientName }, client.data.dataRxByteCount);
      }
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + CLIENT_DATA_SENT,
    help: 'The amount of client data messages sent from the client, in bytes (B)',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the amount of data messages received by the client.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerDataReceivedMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'client_id'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.clients.forEach(client => {
      const uptime = client.data.uptime ?? 0;
      if (uptime < 60) {
        this.inc({ ...client.meta, client_id: client.clientName }, 0);
      } else {
        this.inc({ ...client.meta, client_id: client.clientName }, client.data.dataTxByteCount);
      }
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + CLIENT_DATA_RECEIVED,
    help: 'The amount of client data messages received by the client, in bytes (B).',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}
