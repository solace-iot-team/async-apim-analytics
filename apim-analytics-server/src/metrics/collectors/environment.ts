import path from 'node:path';
import Bree from 'bree';
import * as prometheus from 'prom-client';
import { Logger as L } from '../../common/logger';
import { AbstractCollector } from '../abstract-collector';
import { Server } from '../../models/server';
import { Environment } from '../../models/environment';

const OFFSET = 0;
const INTERVAL = '240s';

/** The metadata for the collector. */
type CollectorMetadata = {
  server?: Server;
  organizations?: string[];
}

/** The events emitted by the collector. */
interface CollectorEvents {
  update: (environments: Environment[]) => void;
}

/**
 * A collector for environment metrics.
 */
export class EnvironmentMetricsCollector extends AbstractCollector<CollectorEvents> {

  /** The metadata. */
  #metadata: CollectorMetadata = {};

  /** The collected data. */
  #environments: Environment[] = [];

  /**
   * Constructor for a collector for team metrics.
   * 
   * @param namePrefix
   *              The name prefix for any metrics.
   * @param server
   *              The server from which to collect metrics.
   * @param organizations
   *              The organizations for which to collect metrics.
   */
  constructor(namePrefix: string, server: Server, organizations?: string[]) {

    super('EnvironmentMetricsCollector', path.join(__dirname, '../../jobs/connector'));

    this.server = server;
    if (organizations) {
      this.organizations = organizations;
    }

    this.#registerMetrics(namePrefix);
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
   * Creates a metric for information about a team.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createInfoMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'environment'] as const;
    type Label = typeof allLabelNames[number];

    const environments = this.#environments;
    async function collect(this: prometheus.Gauge<Label>): Promise<void> {
      this.reset();
      environments.forEach((environment: Environment) => {
        this.set({ ...environment.meta, environment: environment.name }, 1);
      });
    }

    this.registerMetric(new prometheus.Gauge<Label>({
      name: `${namePrefix}_environment_info`,
      help: 'Environment information.',
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
      name: 'fetch-environments',
      timeout: OFFSET,
      interval: INTERVAL,
      worker: {
        workerData: this.#metadata,
      }
    }

    this.registerJob(job);
    this.registerMessageHandler((message: any, _workerMetadata: any): void => {

      if (Array.isArray(message.message)) {

        this.#environments.length = 0;
        this.#environments.push(...message.message);

        if (L.isLevelEnabled('trace')) {
          L.trace(`${this.typeName}.messageHandler`, 'Updated environments', {
            environments: this.#environments.map(item => ({ name: item.name, meta: item.meta })),
          });
        } else {
          L.debug(`${this.typeName}.messageHandler`, 'Updated environments');
        }

        this.emit('update', this.#environments);
      }
    });
  }

} // class EnvironmentMetricsCollector
