import path from 'node:path';
import Bree from 'bree';
import * as prometheus from 'prom-client';
import { AbstractCollector } from '../abstract-collector';
import { Constants } from '../../common/constants';
import { Logger as L } from '../../common/logger';
import { Team } from '../../model/team';

const OFFSET = 0;
const INTERVAL = '120s';

/** The events emitted by the collector. */
interface Events {
  update: (teams: Team[]) => void;
}

/**
 * A collector for team metrics.
 */
export class TeamMetricsCollector extends AbstractCollector<Events> {

  /** The collected data. */
  #teams: Team[] = [];

  /**
   * Constructor for a collector for team metrics.
   */
  constructor() {

    super('TeamMetricsCollector', path.join(__dirname, '../../jobs/connector'));

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

    const allLabelNames = ['organization', 'team'] as const;
    type Label = typeof allLabelNames[number];

    const teams = this.#teams;
    async function collect(this: prometheus.Gauge<Label>): Promise<void> {
      this.reset();
      teams.forEach((team: Team) => {
        this.set({ ...team.meta, team: team.name }, 1);
      });
    }

    this.registerMetric(new prometheus.Gauge<Label>({
      name: `${namePrefix}_team_info`,
      help: 'Team information.',
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
      name: 'fetch-teams',
      timeout: OFFSET,
      interval: INTERVAL,
    }

    this.registerJob(job);
    this.registerMessageHandler((message: any, _workerMetadata: any): void => {

      if (Array.isArray(message.message)) {

        this.#teams.length = 0;
        this.#teams.push(...message.message);

        if (L.isLevelEnabled('trace')) {
          L.trace(`${this.typeName}.messageHandler`, 'Updated teams', {
            teams: this.#teams.map(item => ({ name: item.name, meta: item.meta }))
          });
        } else {
          L.debug(`${this.typeName}.messageHandler`, 'Updated teams');
        }

        this.emit('update', this.#teams);
      }
    });
  }

} // class TeamMetricsCollector
