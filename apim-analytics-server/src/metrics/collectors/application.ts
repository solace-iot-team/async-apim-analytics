import path from 'node:path';
import Bree from 'bree';
import * as prometheus from 'prom-client';
import { Logger as L } from '../../common/logger';
import { AbstractCollector } from '../abstract-collector';
import { Server } from '../../model/server';
import { Developer } from '../../model/developer';
import { Team } from '../../model/team';
import { Application } from '../../model/application';

const OFFSET = '15s';
const INTERVAL = '60s';

/** The metadata for the collector. */
type CollectorMetadata = {
  server?: Server;
  organizations?: string[];
  teams?: Team[];
  developers?: Developer[];
}

/** The events emitted by the collector. */
interface Events {
  update: (applications: Application[]) => void;
}

/**
 * A collector for application metrics.
 */
export class ApplicationMetricsCollector extends AbstractCollector<Events> {

  /** The metadata. */
  #metadata: CollectorMetadata = {};

  /** The collected data. */
  #applications: Application[] = [];

  /**
   * Constructor for a collector for application metrics.
   * 
   * @param namePrefix
   *              The name prefix for any metrics.
   * @param server
   *              The server configuration for the API Management connector.
   * @param teams
   *              The teams for which to collect metrics.
   * @param developers
   *              The developers for which to collect metrics.
   */
  constructor(namePrefix: string, server: Server, teams?: Team[], developers?: Developer[]) {

    super('ApplicationMetricsCollector', path.join(__dirname, '../../jobs/connector'));

    this.server = server;
    if (teams) {
      this.teams = teams;
    }
    if (developers) {
      this.developers = developers;
    }

    this.#registerMetrics(namePrefix);
    this.#createJobs();
  }

  /** Setter for server configuration. */
  set server(server: Server) {
    this.#metadata.server = server;
  }

  /** Setter for teams metadata. */
  set teams(teams: Team[]) {
    this.#metadata.teams = teams;
  }

  /** Setter for developers metadata. */
  set developers(developers: Developer[]) {
    this.#metadata.developers = developers;
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
   * Creates a metric for information about an application.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createInfoMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'application', 'type', 'owner'] as const;
    type Label = typeof allLabelNames[number];

    const applications = this.#applications;
    async function collect(this: prometheus.Gauge<Label>): Promise<void> {
      this.reset();
      applications.forEach((application: Application) => {
        this.set({ ...application.meta, application: application.name }, 1);
      });
    }

    this.registerMetric(new prometheus.Gauge<Label>({
      name: `${namePrefix}_application_info`,
      help: 'Application information.',
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
      name: 'fetch-applications',
      timeout: OFFSET,
      interval: INTERVAL,
      worker: {
        workerData: this.#metadata,
      }
    }

    this.registerJob(job);
    this.registerMessageHandler((message: any, _workerMetadata: any): void => {

      if (Array.isArray(message.message)) {

        this.#applications.length = 0;
        this.#applications.push(...message.message);

        if (L.isLevelEnabled('trace')) {
          L.trace(`${this.typeName}.messageHandler`, 'Updated applications', {
            applications: this.#applications.map(item => ({ name: item.name, meta: item.meta }))
          });
        } else {
          L.debug(`${this.typeName}.messageHandler`, 'Updated applications');
        }

        this.emit('update', this.#applications);
      }
    });
  }

} // class ApplicationMetricsCollector
