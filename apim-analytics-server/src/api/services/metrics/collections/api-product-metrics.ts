import * as prometheus from 'prom-client';
import dataProvider from '../../../../data/data-provider';

const API_PRODUCT_INFO = 'api_product_info';
const API_PRODUCT_ENVIRONMENT_INFO = 'api_product_environment_info';

/** The API product metrics options. */
export interface ApiProductMetricsOptions {
  prefix?: string;
  register?: prometheus.Registry;
}

/**
 * Registers the API product metrics.
 * 
 * @param options The API product metrics options.
 */
export const collectApiProductMetrics = (options?: ApiProductMetricsOptions) => {

  const registry = options?.register ?? prometheus.register;
  const namePrefix = options?.prefix ?? '';

  registerApiProductInfoMetric(registry, namePrefix);
  registerApiProductEnvironmentInfoMetric(registry, namePrefix);
}

/**
 * Registers a metric for information about an API product.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerApiProductInfoMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'api_product', 'business_group'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Gauge<Label>): Promise<void> {
    this.reset();
    dataProvider.apiProducts.forEach((apiProduct) => {
      const businessGroup = apiProduct.businessGroup ?? '-';
      this.set({ organization: apiProduct.meta.organization, api_product: apiProduct.name, business_group: businessGroup }, 1);
    });
  }

  new prometheus.Gauge<Label>({
    name: namePrefix + API_PRODUCT_INFO,
    help: 'Information about an API product.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}

/**
 * Registers a metric for information about the registration of an API product for an environment.
 * 
 * @param registry The registry to which the metric should be registered.
 * @param namePrefix The prefix for the metric name.
 */
const registerApiProductEnvironmentInfoMetric = (registry: prometheus.Registry, namePrefix: string): void => {

  const allLabelNames = ['organization', 'api_product', 'environment'] as const;
  type Label = typeof allLabelNames[number];

  async function collect(this: prometheus.Gauge<Label>): Promise<void> {
    this.reset();
    dataProvider.apiProducts.forEach((apiProduct) => {
      const meta = apiProduct.meta;
      apiProduct.environments.forEach(environment => {
        this.set({ organization: meta.organization, api_product: apiProduct.name, environment: environment }, 1);
      });
    });
  }

  new prometheus.Gauge<Label>({
    name: namePrefix + API_PRODUCT_ENVIRONMENT_INFO,
    help: 'Information about the registration of an API product for an environment.',
    labelNames: allLabelNames,
    collect: collect,
    registers: [registry],
  });
}
