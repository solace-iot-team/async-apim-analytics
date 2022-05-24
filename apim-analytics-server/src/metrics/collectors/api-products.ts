import path from 'node:path';
import Bree from 'bree';
import * as prometheus from 'prom-client';
import { Logger as L } from '../../common/logger';
import { AbstractCollector } from '../abstract-collector';
import { Constants } from '../../common/constants';
import { ApiProduct } from '../../model/api-product';

const OFFSET = 0;
const INTERVAL = '120s';

/** The events emitted by the collector. */
interface Events {
  update: (apiProducts: ApiProduct[]) => void;
}

/**
 * A collector for API product metrics.
 */
export class ApiProductMetricsCollector extends AbstractCollector<Events> {

  /** The collected data. */
  #apiProducts: ApiProduct[] = [];

  /**
   * Constructor for a collector for API product metrics.
   */
  constructor() {

    super('ApiProductMetricsCollector', path.join(__dirname, '../../jobs/connector'));

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
    this.#createEnvironmentInfoMetric(namePrefix);
  }

  /**
   * Creates a metric for information about an API product.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createInfoMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'api_product', 'business_group'] as const;
    type Label = typeof allLabelNames[number];

    const apiProducts = this.#apiProducts;
    async function collect(this: prometheus.Gauge<Label>): Promise<void> {
      this.reset();
      apiProducts.forEach((apiProduct: ApiProduct) => {
        const meta = apiProduct.meta;
        this.set({ organization: meta.organization, api_product: apiProduct.name, business_group: apiProduct.businessGroup ?? '' }, 1);
      });
    }

    this.registerMetric(new prometheus.Gauge<Label>({
      name: `${namePrefix}_api_product_info`,
      help: 'Information about an API product.',
      labelNames: allLabelNames,
      collect: collect,
      registers: [], // don't register in global registry
    }));
  }

  /**
   * Creates a metric for information about the registration of an API product for an environment.
   * 
   * @param namePrefix
   *              The name prefix for the metric.
   */
  #createEnvironmentInfoMetric(namePrefix: string): void {

    const allLabelNames = ['organization', 'api_product', 'environment'] as const;
    type Label = typeof allLabelNames[number];

    const apiProducts = this.#apiProducts;
    async function collect(this: prometheus.Gauge<Label>): Promise<void> {
      this.reset();
      apiProducts.forEach((apiProduct: ApiProduct) => {
        const meta = apiProduct.meta;
        apiProduct.environments.forEach(environment => {
          this.set({ organization: meta.organization, api_product: apiProduct.name, environment: environment }, 1);
        });
      });
    }

    this.registerMetric(new prometheus.Gauge<Label>({
      name: `${namePrefix}_api_product_environment_info`,
      help: 'Information about the registration of an API product for an environment.',
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
      name: 'fetch-api-products',
      timeout: OFFSET,
      interval: INTERVAL,
    }

    this.registerJob(job);
    this.registerMessageHandler((message: any, _workerMetadata: any): void => {

      if (Array.isArray(message.message)) {

        this.#apiProducts.length = 0;
        this.#apiProducts.push(...message.message);

        if (L.isLevelEnabled('trace')) {
          L.trace(`${this.typeName}.messageHandler`, 'Updated API products', {
            apiProducts: this.#apiProducts.map(item => ({ name: item.name, meta: item.meta }))
          });
        } else {
          L.debug(`${this.typeName}.messageHandler`, 'Updated API products');
        }

        this.emit('update', this.#apiProducts);
      }
    });
  }

} // class ApiProductMetricsCollector
