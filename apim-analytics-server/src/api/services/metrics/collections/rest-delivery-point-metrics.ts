import * as prometheus from 'prom-client';
import dataProvider from '../../../../data/data-provider';

const RDP_UP_DOWN_STATUS = 'rdp_up';
const RDP_MESSAGES_SENT = 'rdp_http_requests_total';
const RDP_MESSAGES_RECEIVED = 'rdp_http_responses_total';
const RDP_DATA_SENT = 'rdp_http_requests_bytes_total';
const RDP_DATA_RECEIVED = 'rdp_http_responses_bytes_total';

const RDP_SUCCESS_MESSAGES_RECEIVED = 'rdp_http_responses_success_total';
const RDP_ERROR_MESSAGES_RECEIVED = 'rdp_http_responses_error_total';
const RDP_TIMEOUT_MESSAGES_RECEIVED = 'rdp_http_responses_timeout_total';

/** The rest delivery point metrics options. */
export interface RestDeliveryPointMetricsOptions {
  prefix?: string;
  register?: prometheus.Registry;
}

/**
 * Registers the rest delivery point metrics.
 * 
 * @param options The rest delivery point metrics options.
 */
export const collectRestDeliveryPointMetrics = (options?: RestDeliveryPointMetricsOptions) => {

  const registry = options?.register ?? prometheus.register;
  const namePrefix = options?.prefix ?? '';

  registerUpDownStatusMetric(registry, namePrefix);
  registerMessagesSentMetric(registry, namePrefix);
  registerMessagesReceivedMetric(registry, namePrefix);
  registerDataSentMetric(registry, namePrefix);
  registerDataReceivedMetric(registry, namePrefix);

  registerSuccessMessagesReceivedMetric(registry, namePrefix);
  registerErrorMessagesReceivedMetric(registry, namePrefix);
  registerTimeoutMessagesReceivedMetric(registry, namePrefix);
}

/**
 * Registers a metric for the Up/Down status of an RDP.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerUpDownStatusMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Gauge<Label>): Promise<void> {
    this.reset();
    dataProvider.restDeliveryPoints.forEach((rdp) => {
      this.set({ ...rdp.meta, rdp_name: rdp.restDeliveryPointName }, rdp.data.up ? 0 : 1);
    });
  }

  new prometheus.Gauge<Label>({
    name: namePrefix + RDP_UP_DOWN_STATUS,
    help: 'Whether the rest delivery point is up (1) or down (0).',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the number of HTTP request messages transmitted from the RDP.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerMessagesSentMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.restDeliveryPoints.forEach((rdp) => {
      this.inc({ ...rdp.meta, rdp_name: rdp.restDeliveryPointName }, rdp.data.restHttpRequestTxMsgCount);
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + RDP_MESSAGES_SENT,
    help: 'The number of HTTP request messages sent from the rest delivery point.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the number of HTTP response messages received by the RDP.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerMessagesReceivedMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.restDeliveryPoints.forEach((rdp) => {
      this.inc({ ...rdp.meta, rdp_name: rdp.restDeliveryPointName }, rdp.data.restHttpResponseRxMsgCount);
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + RDP_MESSAGES_RECEIVED,
    help: 'The number of HTTP response messages received by the rest delivery point.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the amount of HTTP response messages received by the RDP.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerDataSentMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.restDeliveryPoints.forEach((rdp) => {
      this.inc({ ...rdp.meta, rdp_name: rdp.restDeliveryPointName }, rdp.data.restHttpRequestTxByteCount);
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + RDP_DATA_SENT,
    help: 'The amount of HTTP request messages sent from the rest delivery point, in bytes (B).',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the amount of HTTP response messages received by the RDP.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerDataReceivedMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.restDeliveryPoints.forEach((rdp) => {
      this.inc({ ...rdp.meta, rdp_name: rdp.restDeliveryPointName }, rdp.data.restHttpResponseRxByteCount);
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + RDP_DATA_RECEIVED,
    help: 'The amount of HTTP responses messages received by the rest delivery point, in bytes (B).',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the number of HTTP succesful response messages received by the RDP.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerSuccessMessagesReceivedMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.restDeliveryPoints.forEach((rdp) => {
      this.inc({ ...rdp.meta, rdp_name: rdp.restDeliveryPointName }, rdp.data.restHttpResponseSuccessRxMsgCount);
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + RDP_SUCCESS_MESSAGES_RECEIVED,
    help: 'The number of HTTP successful response messages received by the rest delivery point.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the number of HTTP error response messages received by the RDP.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerErrorMessagesReceivedMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.restDeliveryPoints.forEach((rdp) => {
      this.inc({ ...rdp.meta, rdp_name: rdp.restDeliveryPointName }, rdp.data.restHttpResponseErrorRxMsgCount);
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + RDP_ERROR_MESSAGES_RECEIVED,
    help: 'The number of HTTP client/server error response messages received by the rest delivery point.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for the number of HTTP 'wait-for-reply' timeout messages received by the RDP.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerTimeoutMessagesReceivedMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Counter<Label>): Promise<void> {
    this.reset();
    dataProvider.restDeliveryPoints.forEach((rdp) => {
      this.inc({ ...rdp.meta, rdp_name: rdp.restDeliveryPointName }, rdp.data.restHttpResponseTimeoutRxMsgCount);
    });
  }

  new prometheus.Counter<Label>({
    name: namePrefix + RDP_TIMEOUT_MESSAGES_RECEIVED,
    help: 'The number of HTTP wait-for-reply timeout response messages received by the rest delivery point.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}
