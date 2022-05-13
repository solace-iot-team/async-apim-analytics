import path from 'node:path';
import Bree from 'bree';
import * as prometheus from 'prom-client';
import { AbstractCollector } from '../abstract-collector';
import { Constants } from '../../common/constants';
import { Logger as L } from '../../common/logger';
import { Environment } from '../../model/environment';

const OFFSET = 0;
const INTERVAL = '240s';

/** The events emitted by the collector. */
interface CollectorEvents {
  update: (environments: Environment[]) => void;
}

/**
 * A collector for environment metrics.
 */
export class EnvironmentMetricsCollector extends AbstractCollector<CollectorEvents> {

  /** The collected data. */
  #environments: Environment[] = [];

  /**
   * Constructor for a collector for team metrics.
   */
  constructor() {

    super('EnvironmentMetricsCollector', path.join(__dirname, '../../jobs/connector'));

    this.#registerMetrics(Constants.METRICS_PREFIX);
    this.#createJobs();
  }

  /**
   * Registers all metrics in the metrics registry.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
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
