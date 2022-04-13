import path from 'node:path';
import Bree from 'bree';
import * as prometheus from 'prom-client';
import { Logger as L } from '../../common/logger';
import { AbstractCollector } from '../abstract-collector';
import { Client } from '../../models/client';
import { Server } from '../../models/server';
import { Application } from '../../models/application';
import { Environment } from '../../models/environment';

const OFFSET = '30s';
const INTERVAL = '60s';

/** The metadata for the collector. */
type CollectorMetadata = {
  server?: Server;
  applications?: Application[];
  environments?: Environment[];
}

/** The events emitted by the collector. */
interface Events {
  update: (clients: Client[]) => void;
}

/**
 * A collector for client metrics.
 */
export class ClientMetricsCollector extends AbstractCollector<Events> {

  /** The metadata. */
  #metadata: CollectorMetadata = {};

  /** The collected data. */
  #clients: Client[] = [];

  /**
   * Constructor for a collector for client metrics.
   * 
   * @param namePrefix
   *              The name prefix for any metrics.
   * @param server
   *              The server configuration for the Solace PubSub+ Cloud.
   * @param applications
   *              The applications for which to collect metrics.
   * @param environments
   *              The environments for which to collect metrics.
   */
  constructor(namePrefix: string, server: Server, applications?: Application[], environments?: Environment[]) {

    super('ClientMetricsCollector', path.join(__dirname, '../../jobs/broker'));

    this.server = server;
    if (applications) {
      this.applications = applications;
    }
    if (environments) {
      this.environments = environments;
    }

    this.#registerMetrics(namePrefix);
    this.#createJobs();
  }

  /** Setter for server configuration. */
  set server(server: Server) {
    this.#metadata.server = server;
  }

  /** Setter for applications metadata. */
  set applications(applications: Application[]) {
    this.#metadata.applications = applications;
  }

  /** Setter for environments metadata. */
  set environments(environments: Environment[]) {
    this.#metadata.environments = environments;
  }

  /**
   * Registers all metrics in the metrics registry.
   * 
   * @param namePrefix
   *              The name prefix for any metrics.
   */
  #registerMetrics(namePrefix: string): void {

    this.#createUptimeMetric(namePrefix);

    this.#createDataMsgsTxMsgCountMetric(namePrefix);
    this.#createDataMsgsRxMsgCountMetric(namePrefix);
    this.#createMsgsDiscardedMsgCountMetric(namePrefix);

    this.#createDataMsgsTxByteCountMetric(namePrefix);
    this.#createDataMsgsRxByteCountMetric(namePrefix);
  }

  /**
   * Creates a metric for the uptime of a client.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createUptimeMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'client_id'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (client: Client): prometheus.LabelValues<Label> => {
      return { ...client.meta, client_id: client.clientName };
    }

    const clients = this.#clients;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      clients.forEach((client: Client) => {
        this.inc(createLabelValues(client), client.data.uptime);
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_client_uptime_seconds_total`,
      help: 'The amount of time in seconds since the client connected.',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the number of data messages transmitted from a client.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createDataMsgsTxMsgCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'client_id'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (client: Client): prometheus.LabelValues<Label> => {
      return { ...client.meta, client_id: client.clientName };
    }

    const clients = this.#clients;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      clients.forEach(client => {
        const uptime = client.data.uptime ?? 0;
        if (uptime < 60) {
          this.inc(createLabelValues(client), 0);
        } else {
          this.inc(createLabelValues(client), client.data.dataRxMsgCount);
        }
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_client_messages_sent_total`,
      help: 'The number of client data messages sent from the client.',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the number of data messages received by a client.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createDataMsgsRxMsgCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'client_id'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (client: Client): prometheus.LabelValues<Label> => {
      return { ...client.meta, client_id: client.clientName };
    }

    const clients = this.#clients;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      clients.forEach(client => {
        const uptime = client.data.uptime ?? 0;
        if (uptime < 60) {
          this.inc(createLabelValues(client), 0);
        } else {
          this.inc(createLabelValues(client), client.data.dataTxMsgCount);
        }
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_client_messages_received_total`,
      help: 'The number of client data messages received by the client.',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the number of messages discarded.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createMsgsDiscardedMsgCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'client_id', 'type', 'reason'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (client: Client, type: string, reason?: string): prometheus.LabelValues<Label> => {
      return { ...client.meta, client_id: client.clientName, type, reason };
    }

    const reasonToDataPropertyMap: Record<string, keyof Client.Data> = {
      noSubscriptionMatch: 'noSubscriptionMatchRxDiscardedMsgCount',
      topicParseError: 'topicParseErrorRxDiscardedMsgCount',
      webParseError: 'webParseErrorRxDiscardedMsgCount',
      publishTopicAcl: 'publishTopicAclRxDiscardedMsgCount',
      msgSpoolCongestion: 'msgSpoolCongestionRxDiscardedMsgCount',
      msgSpoolDiscards: 'msgSpoolRxDiscardedMsgCount',
    }

    const clients = this.#clients;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      clients.forEach(client => {
        const uptime = client.data.uptime ?? 0;
        if (uptime < 60) {
          for (const reason in reasonToDataPropertyMap) {
            this.inc(createLabelValues(client, 'incoming', reason), 0);
          }
          this.inc(createLabelValues(client, 'outgoing'), 0);
        } else {
          for (const reason in reasonToDataPropertyMap) {
            const value = client.data[reasonToDataPropertyMap[reason]] || 0;
            this.inc(createLabelValues(client, 'incoming', reason), value);
          }
          const outgoing = client.data.txDiscardedMsgCount || 0;
          this.inc(createLabelValues(client, 'outgoing'), outgoing);
        }
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_client_messages_discarded_total`,
      help: 'The number of client data messages discarded.',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the amount of data messages transmitted from the client.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createDataMsgsTxByteCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'client_id'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (client: Client): prometheus.LabelValues<Label> => {
      return { ...client.meta, client_id: client.clientName };
    }

    const clients = this.#clients;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      clients.forEach(client => {
        const uptime = client.data.uptime ?? 0;
        if (uptime < 60) {
          this.inc(createLabelValues(client), 0);
        } else {
          this.inc(createLabelValues(client), client.data.dataRxByteCount);
        }
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_client_messages_sent_bytes_total`,
      help: 'The amount of client data messages sent from the client, in bytes (B).',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the amount of data messages received by the client.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createDataMsgsRxByteCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'client_id'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (client: Client): prometheus.LabelValues<Label> => {
      return { ...client.meta, client_id: client.clientName };
    }

    const clients = this.#clients;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      clients.forEach(client => {
        const uptime = client.data.uptime ?? 0;
        if (uptime < 60) {
          this.inc(createLabelValues(client), 0);
        } else {
          this.inc(createLabelValues(client), client.data.dataTxByteCount);
        }
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_client_messages_received_bytes_total`,
      help: 'The amount of client data messages received by the client, in bytes (B).',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates the jobs for the job scheduler.
   */
  #createJobs(): void {

    const job: Bree.JobOptions = {
      name: 'fetch-clients',
      timeout: OFFSET,
      interval: INTERVAL,
      worker: {
        workerData: this.#metadata,
      }
    }

    this.registerJob(job);
    this.registerMessageHandler((message: any, _workerMetadata: any): void => {

      if (Array.isArray(message.message)) {

        this.#clients.length = 0;
        this.#clients.push(...message.message);

        if (L.isLevelEnabled('trace')) {
          L.trace(`${this.typeName}.messageHandler`, 'Updated clients', {
            clients: this.#clients.map(item => ({ name: item.clientName, meta: item.meta }))
          });
        } else {
          L.debug(`${this.typeName}.messageHandler`, 'Updated clients');
        }

        this.emit('update', this.#clients);
      }
    });
  }

} // class ClientMetricsCollector
