import * as prometheus from 'prom-client';
import dataProvider from '../../../../data/data-provider';

const APPLICATION_INFO = 'application_info';
const APPLICATION_API_PRODUCT_INFO = 'application_api_product_info';

/** The application metrics options. */
export interface ApplicationMetricsOptions {
  prefix?: string;
  register?: prometheus.Registry;
}

/**
 * Registers the application metrics.
 * 
 * @param options The application metrics options.
 */
export const collectApplicationMetrics = (options?: ApplicationMetricsOptions) => {

  const registry = options?.register ?? prometheus.register;
  const namePrefix = options?.prefix ?? '';

  registerApplicationInfoMetric(registry, namePrefix);
  registerApplicationApiProductInfoMetric(registry, namePrefix);
}

/**
 * Registers a metric for information about an application.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerApplicationInfoMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'application', 'type', 'owner'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Gauge<Label>): Promise<void> {
    this.reset();
    dataProvider.applications.forEach((application) => {
      this.set({ ...application.meta, application: application.name }, 1);
    });
  }

  new prometheus.Gauge<Label>({
    name: namePrefix + APPLICATION_INFO,
    help: 'Information about an application.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for information about the registration of an application for an API product.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerApplicationApiProductInfoMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'application', 'api_product'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Gauge<Label>): Promise<void> {
    this.reset();
    dataProvider.applications.forEach((application) => {
      application.apiProducts.forEach((apiProduct: string) => {
        this.set({ organization: application.meta.organization, application: application.name, api_product: apiProduct }, 1);
      });
    });
  }

  new prometheus.Gauge<Label>({
    name: namePrefix + APPLICATION_API_PRODUCT_INFO,
    help: 'Information about the registration of an application for an API product.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}
