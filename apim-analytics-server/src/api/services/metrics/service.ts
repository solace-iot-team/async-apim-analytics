import * as prometheus from 'prom-client';
import { AbstractCollector } from '../../../metrics/abstract-collector';
import { EnvironmentMetricsCollector } from '../../../metrics/collectors/environment';
import { ApiProductMetricsCollector } from '../../../metrics/collectors/api-products';
import { TeamMetricsCollector } from '../../../metrics/collectors/team';
import { DeveloperMetricsCollector } from '../../../metrics/collectors/developer';
import { ApplicationMetricsCollector } from '../../../metrics/collectors/application';
import { ClientMetricsCollector } from '../../../metrics/collectors/client';
import { QueueMetricsCollector } from '../../../metrics/collectors/queue';
import { RestDeliveryPointMetricsCollector } from '../../../metrics/collectors/rest-delivery-point';

/**
 * The metrics service.
 */
class MetricsService {

  /** The metrics registry. */
  #registry: prometheus.Registry;

  /** Constructor. */
  constructor() {

    // Create all metrics collectors

    const environmentMetricsCollector = new EnvironmentMetricsCollector();
    const apiProductMetricsCollector = new ApiProductMetricsCollector();
    const teamMetricsCollector = new TeamMetricsCollector();
    const developerMetricsCollector = new DeveloperMetricsCollector();
    const applicationMetricsCollector = new ApplicationMetricsCollector();
    const clientMetricsCollector = new ClientMetricsCollector();
    const queueMetricsCollector = new QueueMetricsCollector();
    const restDeliveryPointMetricsCollector = new RestDeliveryPointMetricsCollector();

    // Some collectors depend on data from others.
    // Use event listeners to update the metadata for those collectors.

    teamMetricsCollector.on('update', teams => {
      applicationMetricsCollector.teams = teams;
    });

    developerMetricsCollector.on('update', developers => {
      applicationMetricsCollector.developers = developers;
    });

    environmentMetricsCollector.on('update', environments => {
      clientMetricsCollector.environments = environments;
      queueMetricsCollector.environments = environments;
      restDeliveryPointMetricsCollector.environments = environments;
    });

    applicationMetricsCollector.on('update', applications => {
      clientMetricsCollector.applications = applications;
      queueMetricsCollector.applications = applications;
      restDeliveryPointMetricsCollector.applications = applications;
    });

    // Start data collection for all metrics and create a merged registry

    const collectors: AbstractCollector[] = [
      environmentMetricsCollector,
      apiProductMetricsCollector,
      teamMetricsCollector,
      developerMetricsCollector,
      applicationMetricsCollector,
      clientMetricsCollector,
      queueMetricsCollector,
      restDeliveryPointMetricsCollector,
    ];

    collectors.forEach(collector => { collector.enable(); });

    const registries = collectors.map(collector => collector.registry);
    this.#registry = prometheus.Registry.merge(registries);
  }

  /**
   * Returns all metrics.
   * 
   * @returns The metrics.
   */
  async all(): Promise<string> {
    return this.#registry.metrics();
  }

} // class MetricsService

export default new MetricsService();
