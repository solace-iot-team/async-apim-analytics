import path from 'node:path';
import Bree from 'bree';
import * as prometheus from 'prom-client';
import { Logger as L } from '../../common/logger';
import { AbstractCollector } from '../abstract-collector';
import { Constants } from '../../common/constants';
import { Developer } from '../../model/developer';
import { Team } from '../../model/team';
import { Application } from '../../model/application';

const OFFSET = '15s';
const INTERVAL = '60s';

/** The metadata for the collector. */
type CollectorMetadata = {
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
   * @param teams
   *              The teams for which to collect metrics.
   * @param developers
   *              The developers for which to collect metrics.
   */
  constructor(teams?: Team[], developers?: Developer[]) {

    super('ApplicationMetricsCollector', path.join(__dirname, '../../jobs/connector'));

    if (teams) {
      this.teams = teams;
    }
    if (developers) {
      this.developers = developers;
    }

    this.#registerMetrics(Constants.METRICS_PREFIX);
    this.#createJobs();
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
   *              The name prefix for the metric.
   */
  #registerMetrics(namePrefix: string): void {
    this.#createInfoMetric(namePrefix);
    this.#createApiProductInfoMetric(namePrefix);
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
      help: 'Information about an application.',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for information about the registration of an application for an API product.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
   #createApiProductInfoMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'application', 'api_product'] as const;
    type Label = typeof allLabelNames[number];

    const applications = this.#applications;
    async function collect(this: prometheus.Gauge<Label>): Promise<void> {
      this.reset();
      applications.forEach((application: Application) => {
        application.apiProducts.forEach((apiProduct: string) => {
          this.set({ organization: application.meta.organization, application: application.name, api_product: apiProduct }, 1);        
        });
      });
    }

    this.registerMetric(new prometheus.Gauge<Label>({
      name: `${namePrefix}_application_api_product_info`,
      help: 'Information about the registration of an application for an API product.',
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
