import * as prometheus from 'prom-client';
import dataProvider from '../../../../data/data-provider';

const DEVELOPER_INFO = 'developer_info';

/** The developer metrics options. */
export interface DeveloperMetricsOptions {
  prefix?: string;
  register?: prometheus.Registry;
}

/**
 * Registers the developer metrics.
 * 
 * @param options The developer metrics options.
 */
export const collectDeveloperMetrics = (options?: DeveloperMetricsOptions) => {

  const registry = options?.register ?? prometheus.register;
  const namePrefix = options?.prefix ?? '';

  registerDeveloperInfoMetric(registry, namePrefix);
}

/**
 * Registers a metric for information about a developer.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerDeveloperInfoMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'developer'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Gauge<Label>): Promise<void> {
    this.reset();
    dataProvider.developers.forEach((developer) => {
      this.set({ ...developer.meta, developer: developer.userName }, 1);
    });
  }

  new prometheus.Gauge<Label>({
    name: namePrefix + DEVELOPER_INFO,
    help: 'Information about a developer.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}
