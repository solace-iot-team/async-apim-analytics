import * as prometheus from 'prom-client';
import { Constants } from '../../../common/constants';
import { collectEnvironmentMetrics } from './collections/environment-metrics';
import { collectApiProductMetrics } from './collections/api-product-metrics';
import { collectTeamMetrics } from './collections/team-metrics';
import { collectDeveloperMetrics } from './collections/developer-metrics';
import { collectApplicationMetrics } from './collections/application-metrics';
import { collectClientMetrics } from './collections/client-metrics';
import { collectQueueMetrics } from './collections/queue-metrics';
import { collectRestDeliveryPointMetrics } from './collections/rest-delivery-point-metrics';

/**
 * The metrics service.
 */
class MetricsService {

  /** The metrics registry. */
  #registry: prometheus.Registry = new prometheus.Registry();

  constructor() {

    const prefix = Constants.METRICS_PREFIX + '_';
    const register = this.#registry;

    collectEnvironmentMetrics({ prefix, register });
    collectApiProductMetrics({ prefix, register });
    collectTeamMetrics({ prefix, register });
    collectDeveloperMetrics({ prefix, register });
    collectApplicationMetrics({ prefix, register });
    collectClientMetrics({ prefix, register });
    collectQueueMetrics({ prefix, register });
    collectRestDeliveryPointMetrics({ prefix, register });
  }

  /** Returns all metrics. */
  async all(): Promise<string> {
    return this.#registry.metrics();
  }
}

export default new MetricsService();
