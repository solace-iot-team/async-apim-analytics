import path from 'node:path';
import Bree from 'bree';
import * as prometheus from 'prom-client';
import { Logger as L } from '../../common/logger';
import { AbstractCollector } from '../abstract-collector';
import { Server } from '../../models/server';
import { Developer } from '../../models/developer';

const OFFSET = 0;
const INTERVAL = '120s';

/** The metadata for the collector. */
type CollectorMetadata = {
  server?: Server;
  organizations?: string[];
}

/** The events emitted by the collector. */
interface Events {
  update: (developers: Developer[]) => void;
}

/**
 * A collector for developer metrics.
 */
export class DeveloperMetricsCollector extends AbstractCollector<Events> {

  /** The metadata. */
  #metadata: CollectorMetadata = {};

  /** The collected data. */
  #developers: Developer[] = [];

  /**
   * Constructor for a collector for developer metrics.
   * 
   * @param prefix
   *              The name prefix for any metrics.
   * @param server
   *              The API-M connector configuration.
   * @param organizations
   *              The organizations for which to collect metrics.
   */
  constructor(prefix: string, server: Server, organizations?: string[]) {

    super('DeveloperMetricsCollector', path.join(__dirname, '../../jobs/connector'));

    this.server = server;
    if (organizations) {
      this.organizations = organizations;
    }

    this.#registerMetrics(prefix);
    this.#createJobs();
  }

  /** Setter for server configuration. */
  set server(server: Server) {
    this.#metadata.server = server;
  }

  /** Setter for organizations. */
  set organizations(organizations: string[]) {
    this.#metadata.organizations = organizations;
  }

  /**
   * Registers all metrics in the metrics registry.
   * 
   * @param namePrefix
   *              The name prefix for any metrics.
   */
  #registerMetrics(namePrefix: string): void {
    this.#createInfoMetric(namePrefix);
  }

  /**
   * Creates a metric for information about a developer.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createInfoMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'developer'] as const;
    type Label = typeof allLabelNames[number];

    const developers = this.#developers;
    async function collect(this: prometheus.Gauge<Label>): Promise<void> {
      this.reset();
      developers.forEach((developer: Developer) => {
        this.set({ ...developer.meta, developer: developer.userName }, 1);
      });
    }

    this.registerMetric(new prometheus.Gauge<Label>({
      name: `${namePrefix}_developer_info`,
      help: 'Developer information.',
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
      name: 'fetch-developers',
      timeout: OFFSET,
      interval: INTERVAL,
      worker: {
        workerData: this.#metadata,
      }
    }

    this.registerJob(job);
    this.registerMessageHandler((message: any, _workerMetadata: any): void => {

      if (Array.isArray(message.message)) {

        this.#developers.length = 0;
        this.#developers.push(...message.message);

        if (L.isLevelEnabled('trace')) {
          L.trace(`${this.typeName}.messageHandler`, 'Updated developers', {
            developers: this.#developers.map(item => ({ name: item.userName, meta: item.meta })),
          });
        } else {
          L.debug(`${this.typeName}.messageHandler`, 'Updated developers');
        }

        this.emit('update', this.#developers);
      }
    });
  }

} // class DeveloperMetricsCollector
