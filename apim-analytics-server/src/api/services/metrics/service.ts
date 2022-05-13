import * as prometheus from 'prom-client';
import { AbstractCollector } from '../../../metrics/abstract-collector';
import { EnvironmentMetricsCollector } from '../../../metrics/collectors/environment';
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

    const environmentMetricCollector = new EnvironmentMetricsCollector();
    const teamMetricCollector = new TeamMetricsCollector();
    const developerMetricCollector = new DeveloperMetricsCollector();
    const applicationMetricCollector = new ApplicationMetricsCollector();
    const clientMetricsCollector = new ClientMetricsCollector();
    const queueMetricsCollector = new QueueMetricsCollector();
    const restDeliveryPointMetricsCollector = new RestDeliveryPointMetricsCollector();

    // Some collectors depend on data from others.
    // Use event listeners to update the metadata for those collectors.

    teamMetricCollector.on('update', teams => {
      applicationMetricCollector.teams = teams;
    });

    developerMetricCollector.on('update', developers => {
      applicationMetricCollector.developers = developers;
    });

    environmentMetricCollector.on('update', environments => {
      clientMetricsCollector.environments = environments;
      queueMetricsCollector.environments = environments;
      restDeliveryPointMetricsCollector.environments = environments;
    });

    applicationMetricCollector.on('update', applications => {
      clientMetricsCollector.applications = applications;
      queueMetricsCollector.applications = applications;
      restDeliveryPointMetricsCollector.applications = applications;
    });

    // Start data collection for all metrics and create a merged registry

    const collectors: AbstractCollector[] = [
      environmentMetricCollector,
      teamMetricCollector,
      developerMetricCollector,
      applicationMetricCollector,
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
