import path from 'node:path';
import Bree from 'bree';
import * as prometheus from 'prom-client';
import { Logger as L } from '../../common/logger';
import { AbstractCollector } from '../abstract-collector';
import { RestDeliveryPoint } from '../../models/rest-delivery-point';
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
  update: (restDeliveryPoints: RestDeliveryPoint[]) => void;
}

/**
 * A collector for client metrics.
 */
export class RestDeliveryPointMetricsCollector extends AbstractCollector<Events> {

  /** The metadata. */
  #metadata: CollectorMetadata = {};

  /** The collected data. */
  #restDeliveryPoints: RestDeliveryPoint[] = [];

  /**
   * Constructor for a collector for rest delivery point (RDP) metrics.
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

    super('RestDeliveryPointMetricsCollector', path.join(__dirname, '../../jobs/broker'));

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

    this.#createUpDownStatusMetric(namePrefix);

    this.#createHttpReqTxMsgCountMetric(namePrefix);
    this.#createHttpResRxMsgCountMetric(namePrefix);

    this.#createHttpResSuccessRxMsgCountMetric(namePrefix);
    this.#createHttpResErrorRxMsgCountMetric(namePrefix);
    this.#createHttpResTimeoutRxMsgCountMetric(namePrefix);

    this.#createHttpReqTxByteCountMetric(namePrefix);
    this.#createHttpResRxByteCountMetric(namePrefix);
  }

  /**
   * Creates a metric for the Up/Down status of an RDP.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createUpDownStatusMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (rdp: RestDeliveryPoint): prometheus.LabelValues<Label> => {
      return { ...rdp.meta, rdp_name: rdp.restDeliveryPointName };
    }

    const restDeliveryPoints = this.#restDeliveryPoints;
    async function collect(this: prometheus.Gauge<Label>): Promise<void> {
      this.reset();
      restDeliveryPoints.forEach(rdp => {
        this.set(createLabelValues(rdp), rdp.data.up ? 0 : 1);
      });
    }

    this.registerMetric(new prometheus.Gauge<Label>({
      name: `${namePrefix}_rdp_up`,
      help: 'Whether the rest delivery point is up (1) or down (0).',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the number of HTTP request messages transmitted from the RDP.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createHttpReqTxMsgCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (rdp: RestDeliveryPoint): prometheus.LabelValues<Label> => {
      return { ...rdp.meta, rdp_name: rdp.restDeliveryPointName };
    }

    const restDeliveryPoints = this.#restDeliveryPoints;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      restDeliveryPoints.forEach(rdp => {
        this.inc(createLabelValues(rdp), rdp.data.restHttpRequestTxMsgCount);
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_rdp_http_requests_total`,
      help: 'The number of HTTP request messages sent from the rest delivery point.',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the number of HTTP response messages received by the RDP.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createHttpResRxMsgCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (rdp: RestDeliveryPoint): prometheus.LabelValues<Label> => {
      return { ...rdp.meta, rdp_name: rdp.restDeliveryPointName };
    }

    const restDeliveryPoints = this.#restDeliveryPoints;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      restDeliveryPoints.forEach(rdp => {
        this.inc(createLabelValues(rdp), rdp.data.restHttpResponseRxMsgCount);
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_rdp_http_responses_total`,
      help: 'The number of HTTP response messages received by the rest delivery point.',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the number of HTTP succesful response messages received by the RDP.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createHttpResSuccessRxMsgCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (rdp: RestDeliveryPoint): prometheus.LabelValues<Label> => {
      return { ...rdp.meta, rdp_name: rdp.restDeliveryPointName };
    }

    const restDeliveryPoints = this.#restDeliveryPoints;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      restDeliveryPoints.forEach(rdp => {
        this.inc(createLabelValues(rdp), rdp.data.restHttpResponseSuccessRxMsgCount);
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_rdp_http_responses_success_total`,
      help: 'The number of HTTP successful response messages received by the rest delivery point.',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the number of HTTP error response messages received by the RDP.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createHttpResErrorRxMsgCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (rdp: RestDeliveryPoint): prometheus.LabelValues<Label> => {
      return { ...rdp.meta, rdp_name: rdp.restDeliveryPointName };
    }

    const restDeliveryPoints = this.#restDeliveryPoints;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      restDeliveryPoints.forEach(rdp => {
        this.inc(createLabelValues(rdp), rdp.data.restHttpResponseErrorRxMsgCount);
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_rdp_http_responses_error_total`,
      help: 'The number of HTTP client/server error response messages received by the rest delivery point.',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the number of HTTP 'wait-for-reply' timeout messages received by the RDP.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createHttpResTimeoutRxMsgCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (rdp: RestDeliveryPoint): prometheus.LabelValues<Label> => {
      return { ...rdp.meta, rdp_name: rdp.restDeliveryPointName };
    }

    const restDeliveryPoints = this.#restDeliveryPoints;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      restDeliveryPoints.forEach(rdp => {
        this.inc(createLabelValues(rdp), rdp.data.restHttpResponseTimeoutRxMsgCount);
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_rdp_http_responses_timeout_total`,
      help: 'The number of HTTP wait-for-reply timeout response messages received by the rest delivery point.',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the amount of HTTP request messages transmitted from the RDP.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createHttpReqTxByteCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (rdp: RestDeliveryPoint): prometheus.LabelValues<Label> => {
      return { ...rdp.meta, rdp_name: rdp.restDeliveryPointName };
    }

    const restDeliveryPoints = this.#restDeliveryPoints;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      restDeliveryPoints.forEach(rdp => {
        this.inc(createLabelValues(rdp), rdp.data.restHttpRequestTxByteCount);
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_rdp_http_requests_bytes_total`,
      help: 'The amount of HTTP request messages sent from the rest delivery point, in bytes (B).',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for the amount of HTTP response messages received by the RDP.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createHttpResRxByteCountMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment', 'application', 'rdp_name'] as const;
    type Label = typeof allLabelNames[number];

    const createLabelValues = (rdp: RestDeliveryPoint): prometheus.LabelValues<Label> => {
      return { ...rdp.meta, rdp_name: rdp.restDeliveryPointName };
    }

    const restDeliveryPoints = this.#restDeliveryPoints;
    async function collect(this: prometheus.Counter<Label>): Promise<void> {
      this.reset();
      restDeliveryPoints.forEach(rdp => {
        this.inc(createLabelValues(rdp), rdp.data.restHttpResponseRxByteCount);
      });
    }

    this.registerMetric(new prometheus.Counter<Label>({
      name: `${namePrefix}_rdp_http_responses_bytes_total`,
      help: 'The amount of HTTP responses messages received by the rest delivery point, in bytes (B).',
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
      name: 'fetch-rest-delivery-points',
      timeout: OFFSET,
      interval: INTERVAL,
      worker: {
        workerData: this.#metadata,
      }
    }

    this.registerJob(job);
    this.registerMessageHandler((message: any, _workerMetadata: any): void => {

      if (Array.isArray(message.message)) {

        this.#restDeliveryPoints.length = 0;
        this.#restDeliveryPoints.push(...message.message);

        if (L.isLevelEnabled('trace')) {
          L.trace(`${this.typeName}.messageHandler`, 'Updated rest delivery points', {
            restDeliveryPoints: this.#restDeliveryPoints.map(item => ({ name: item.restDeliveryPointName, meta: item.meta }))
          });
        } else {
          L.debug(`${this.typeName}.messageHandler`, 'Updated rest delivery points');
        }

        this.emit('update', this.#restDeliveryPoints);
      }
    });
  }

} // class RestDeliveryPointMetricsCollector
