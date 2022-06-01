import * as prometheus from 'prom-client';
import dataProvider from '../../../../data/data-provider';
import { Queue } from '../../../../model/queue';

const QUEUE_CONSUMER_COUNT = 'queue_consumer_count';
const QUEUE_MESSAGES_QUEUED = 'queue_messages_queued';
const QUEUE_MESSAGES_NOT_QUEUED = 'queue_messages_not_queued_total';
const QUEUE_MESSAGES_SPOOLED = 'queue_messages_spooled_total';
const QUEUE_MESSAGES_REMOVED = 'queue_messages_removed_total';
const QUEUE_MESSAGE_SPOOL_USAGE = 'queue_message_spool_usage_bytes';
const QUEUE_MESSAGE_SPOOL_PEAK_USAGE = 'queue_message_spool_peak_usage_bytes';

/** The queue metrics options. */
export interface QueueMetricsOptions {
  prefix?: string;
  register?: prometheus.Registry;
}

/**
 * Registers the queue metrics.
 * 
 * @param options The queue metrics options.
 */
export const collectQueueMetrics = (options?: QueueMetricsOptions) => {

  const registry = options?.register ?? prometheus.register;
  const namePrefix = options?.prefix ?? '';

  registerConsumerCountMetric(registry, namePrefix);
  registerMessagesQueuedMetric(registry, namePrefix);
  registerMessagesNotQueuedMetric(registry, namePrefix);
  registerMessagesSpooledMetric(registry, namePrefix);
  registerMessagesRemovedMetric(registry, namePrefix);
  registerMessageSpoolUsageMetric(registry, namePrefix);
  registerMessageSpoolPeakUsageMetric(registry, namePrefix);
}

/**
 * Registers a metric for the number of consumers for a queue.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerConsumerCountMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'queue_name'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Gauge<Label>): Promise<void> {
    this.reset();
    dataProvider.queues.forEach((queue) => {
      this.inc({ ...queue.meta, queue_name: queue.queueName }, queue.data.bindCount);
    });
  }

  new prometheus.Gauge<Label>({
    name: namePrefix + QUEUE_CONSUMER_COUNT,
    help: 'The number of consumers for the queue.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the number of messages in a queue.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerMessagesQueuedMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'queue_name'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Gauge<Label>): Promise<void> {
    this.reset();
    dataProvider.queues.forEach((queue) => {
      this.inc({ ...queue.meta, queue_name: queue.queueName }, queue.data.msgCount);
    });
  }

  new prometheus.Gauge<Label>({
    name: namePrefix + QUEUE_MESSAGES_QUEUED,
    help: 'The number of messages in the queue.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for incoming messages that have not been queued.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerMessagesNotQueuedMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'queue_name', 'reason'] as const;
  type Label = typeof allLabelNames[number];

  const reasonToDataPropertyMapping: Record<string, keyof Queue.Data> = {
    quotaExceeded: 'maxMsgSpoolUsageExceededDiscardedMsgCount',
    messageSizeExceeded: 'maxMsgSizeExceededDiscardedMsgCount',
    queueDisabled: 'disabledDiscardedMsgCount',
    deniedByClientProfile: 'clientProfileDeniedDiscardedMsgCount',
    noLocalDelivery: 'noLocalDeliveryDiscardedMsgCount',
    destinationGroupError: 'destinationGroupErrorDiscardedMsgCount',
    lowPriorityCongestionControl: 'lowPriorityMsgCongestionDiscardedMsgCount',
  }

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.queues.forEach((queue) => {
      for (const reason in reasonToDataPropertyMapping) {
        const value = queue.data[reasonToDataPropertyMapping[reason]] || 0;
        this.inc({ ...queue.meta, queue_name: queue.queueName, reason: reason }, value);
      }
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + QUEUE_MESSAGES_NOT_QUEUED,
    help: 'The number of incoming messages that have not been queued.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the number of messages that were spooled in the queue.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerMessagesSpooledMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'queue_name'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.queues.forEach((queue) => {
      this.inc({ ...queue.meta, queue_name: queue.queueName }, queue.data.spooledMsgCount);
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + QUEUE_MESSAGES_SPOOLED,
    help: 'The number of messages that were spooled in the queue.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for messages that have been removed from a queue.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerMessagesRemovedMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'queue_name', 'reason'] as const;
  type Label = typeof allLabelNames[number];

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

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.queues.forEach((queue) => {
      for (const reason in reasonToDataPropertyMapping) {
        const value = queue.data[reasonToDataPropertyMapping[reason]] || 0;
        this.inc({ ...queue.meta, queue_name: queue.queueName, reason: reason }, value);
      }
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + QUEUE_MESSAGES_REMOVED,
    help: 'The number of messages that have been removed from the queue.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the message spool usage of a queue.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerMessageSpoolUsageMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'queue_name'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Gauge<Label>): Promise<void> {
    this.reset();
    dataProvider.queues.forEach((queue) => {
      this.inc({ ...queue.meta, queue_name: queue.queueName }, queue.data.msgSpoolUsage);
    });
  }

  new prometheus.Gauge<Label>({
    name: namePrefix + QUEUE_MESSAGE_SPOOL_USAGE,
    help: 'The message spool usage by the queue, in bytes (B).',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the message spool peak usage of a queue.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerMessageSpoolPeakUsageMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'queue_name'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Gauge<Label>): Promise<void> {
    this.reset();
    dataProvider.queues.forEach((queue) => {
      this.inc({ ...queue.meta, queue_name: queue.queueName }, queue.data.msgSpoolUsage);
    });
  }

  new prometheus.Gauge<Label>({
    name: namePrefix + QUEUE_MESSAGE_SPOOL_PEAK_USAGE,
    help: 'The message spool usage by the queue, in bytes (B).',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}
