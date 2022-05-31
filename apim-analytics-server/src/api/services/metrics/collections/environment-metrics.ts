import * as prometheus from 'prom-client';
import dataProvider from '../../../../data/data-provider';

const ENVIRONMENT_INFO = 'environment_info';

/** The environment metrics options. */
export interface EnvironmentMetricsOptions {
  prefix?: string;
  register?: prometheus.Registry;
}

/**
 * Registers the environment metrics.
 * 
 * @param options The environment metrics options.
 */
export const collectEnvironmentMetrics = (options?: EnvironmentMetricsOptions) => {

  const registry = options?.register ?? prometheus.register;
  const namePrefix = options?.prefix ?? '';

  registerEnvironmentInfoMetric(registry, namePrefix);
}

/**
 * Registers a metric for information about an environment.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerEnvironmentInfoMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'environment', 'datacenter_id'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Gauge<Label>): Promise<void> {
    this.reset();
    dataProvider.environments.forEach((environment) => {
      this.set({ ...environment.meta, environment: environment.name, datacenter_id: environment.datacenterId }, 1);
    });
  }

  new prometheus.Gauge<Label>({
    name: namePrefix + ENVIRONMENT_INFO,
    help: 'Information about an environment.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}
