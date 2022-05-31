import * as prometheus from 'prom-client';
import dataProvider from '../../../../data/data-provider';

const TEAM_INFO = 'team_info';

/** The team metrics options. */
export interface TeamMetricsOptions {
  prefix?: string;
  register?: prometheus.Registry;
}

/**
 * Registers the team metrics.
 * 
 * @param options The team metrics options.
 */
export const collectTeamMetrics = (options?: TeamMetricsOptions) => {

  const registry = options?.register ?? prometheus.register;
  const namePrefix = options?.prefix ?? '';

  registerTeamInfoMetric(registry, namePrefix);
}

/**
 * Registers a metric for information about a team.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerTeamInfoMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'team'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Gauge<Label>): Promise<void> {
    this.reset();
    dataProvider.teams.forEach((team) => {
      this.set({ ...team.meta, team: team.name }, 1);
    });
  }

  new prometheus.Gauge<Label>({
    name: namePrefix + TEAM_INFO,
    help: 'Information about a team.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}
