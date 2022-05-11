import path from 'node:path';
import Bree from 'bree';
import * as prometheus from 'prom-client';
import { Logger as L } from '../../common/logger';
import { AbstractCollector } from '../abstract-collector';
import { Server } from '../../model/server';
import { Application } from '../../model/application';
import { Environment } from '../../model/environment';
import { Queue } from '../../model/queue';

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
  update: (queues: Queue[]) => void;
}

/**
 * A collector for queue metrics.
 */
export class QueueMetricsCollector extends AbstractCollector<Events> {

  /** The metadata. */
  #metadata: CollectorMetadata = {};

  /** The collected data. */
  #queues: Queue[] = [];

  /**
   * Constructor for a collector for queue metrics.
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

    super('QueueMetricsCollector', path.join(__dirname, '../../jobs/broker'));

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

    this.#createConsumerCountMetric(namePrefix);
    this.#createMsgsQueuedMsgCountMetric(namePrefix);
    this.#createMsgSpoolUsageMetric(namePrefix);
    this.#createMsgSpoolPeakUsageMetric(namePrefix);
    this.#createMsgsSpooledMsgCountMetric(namePrefix);
    this.#createMsgsNotQueuedMsgCountMetric(namePrefix);
    this.#createMsgsRemovedMsgCountMetric(namePrefix);
  }

  /**
   * Creates a metric for the number of consumers for a queue.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createConsumerCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'queue_name'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (queue: Queue): prometheus.LabelValues<Label> => {
      return { ...queue.meta, queue_name: queue.queueName };
    }

    const queues = this.#queues;
    async function collect(this: prometheus.Gauge<Label>): Promise<void> {
      this.reset();
      queues.forEach(queue => {
        this.inc(createLabelValues(queue), queue.data.bindCount);
      });
    }

    this.registerMetric(new prometheus.Gauge<Label>({
      name: `${namePrefix}_queue_consumer_count`,
      help: 'The number of consumers for the queue.',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the number of messages in a queue.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createMsgsQueuedMsgCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'queue_name'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (queue: Queue): prometheus.LabelValues<Label> => {
      return { ...queue.meta, queue_name: queue.queueName };
    }

    const queues = this.#queues;
    async function collect(this: prometheus.Gauge<Label>): Promise<void> {
      this.reset();
      queues.forEach(queue => {
        this.inc(createLabelValues(queue), queue.data.msgCount);
      });
    }

    this.registerMetric(new prometheus.Gauge<Label>({
      name: `${namePrefix}_queue_messages_queued`,
      help: 'The number of messages in the queue.',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the message spool usage of a queue.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createMsgSpoolUsageMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'queue_name'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (queue: Queue): prometheus.LabelValues<Label> => {
      return { ...queue.meta, queue_name: queue.queueName };
    }

    const queues = this.#queues;
    async function collect(this: prometheus.Gauge<Label>): Promise<void> {
      this.reset();
      queues.forEach(queue => {
        this.inc(createLabelValues(queue), queue.data.msgSpoolUsage);
      });
    }

    this.registerMetric(new prometheus.Gauge<Label>({
      name: `${namePrefix}_queue_message_spool_usage_bytes`,
      help: 'The message spool usage by the queue, in bytes (B).',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the message spool peak usage of a queue.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createMsgSpoolPeakUsageMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'queue_name'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (queue: Queue): prometheus.LabelValues<Label> => {
      return { ...queue.meta, queue_name: queue.queueName };
    }

    const queues = this.#queues;
    async function collect(this: prometheus.Gauge<Label>): Promise<void> {
      this.reset();
      queues.forEach(queue => {
        this.inc(createLabelValues(queue), queue.data.msgSpoolPeakUsage);
      });
    }

    this.registerMetric(new prometheus.Gauge<Label>({
      name: `${namePrefix}_queue_message_spool_peak_usage_bytes`,
      help: 'The message spool peak usage by the queue, in bytes (B).',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the number of messages that were spooled in the queue.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createMsgsSpooledMsgCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'queue_name'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (queue: Queue): prometheus.LabelValues<Label> => {
      return { ...queue.meta, queue_name: queue.queueName };
    }

    const queues = this.#queues;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      queues.forEach(queue => {
        this.inc(createLabelValues(queue), queue.data.spooledMsgCount);
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_queue_messages_spooled_total`,
      help: 'The number of messages that were spooled in the queue.',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for incoming messages that have not been queued.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createMsgsNotQueuedMsgCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'queue_name', 'reason'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (queue: Queue, reason: string): prometheus.LabelValues<Label> => {
      return { ...queue.meta, queue_name: queue.queueName, reason: reason };
    }

    const reasonToDataPropertyMapping: Record<string, keyof Queue.Data> = {
      quotaExceeded: 'maxMsgSpoolUsageExceededDiscardedMsgCount',
      messageSizeExceeded: 'maxMsgSizeExceededDiscardedMsgCount',
      queueDisabled: 'disabledDiscardedMsgCount',
      deniedByClientProfile: 'clientProfileDeniedDiscardedMsgCount',
      noLocalDelivery: 'noLocalDeliveryDiscardedMsgCount',
      destinationGroupError: 'destinationGroupErrorDiscardedMsgCount',
      lowPriorityCongestionControl: 'lowPriorityMsgCongestionDiscardedMsgCount',
    }

    const queues = this.#queues;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      queues.forEach(queue => {
        for (const reason in reasonToDataPropertyMapping) {
          const value = queue.data[reasonToDataPropertyMapping[reason]] || 0;
          this.inc(createLabelValues(queue, reason), value);
        }
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_queue_messages_not_queued_total`,
      help: 'The number of incoming messages that have not been queued.',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for messages that have been removed from a queue.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createMsgsRemovedMsgCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'queue_name', 'reason'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (queue: Queue, reason: string): prometheus.LabelValues<Label> => {
      return { ...queue.meta, queue_name: queue.queueName, reason: reason };
    }

    const reasonToDataPropertyMapping: Record<string, keyof Queue.Data> = {
      deleted: 'deletedMsgCount',
      maxTtlExpired: 'maxTtlExpiredDiscardedMsgCount',
      maxTtlExpiredToDmq: 'maxTtlExpiredToDmqMsgCount',
      maxTtlExpiredToDmqFailed: 'maxTtlExpiredToDmqFailedMsgCount',
      maxRedeliveryExceeded: 'maxRedeliveryExceededDiscardedMsgCount',
      maxRedeliveryExceededToDmq: 'maxRedeliveryExceededToDmqMsgCount',
      maxRedeliveryExceededToDmqFailed: 'maxRedeliveryExceededToDmqFailedMsgCount',
      maxTtlExceeded: 'maxTtlExceededDiscardedMsgCount',
    }

    const queues = this.#queues;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      queues.forEach(queue => {
        for (const reason in reasonToDataPropertyMapping) {
          const value = queue.data[reasonToDataPropertyMapping[reason]];
          this.inc(createLabelValues(queue, reason), value);
        }
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_queue_messages_removed_total`,
      help: 'The number of messages that have been removed from the queue.',
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
      name: 'fetch-queues',
      timeout: OFFSET,
      interval: INTERVAL,
      worker: {
        workerData: this.#metadata,
      }
    }

    this.registerJob(job);
    this.registerMessageHandler((message: any, _workerMetadata: any): void => {

      if (Array.isArray(message.message)) {

        this.#queues.length = 0;
        this.#queues.push(...message.message);

        if (L.isLevelEnabled('trace')) {
          L.trace(`${this.typeName}.messageHandler`, 'Updated queues', {
            queues: this.#queues.map(item => ({ name: item.queueName, meta: item.meta }))
          });
        } else {
          L.debug(`${this.typeName}.messageHandler`, 'Updated queues');
        }

        this.emit('update', this.#queues);
      }
    });
  }

} // class QueueMetricsCollector
