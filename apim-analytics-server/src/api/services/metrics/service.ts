import * as prometheus from 'prom-client';
import config from '../../../common/config';
import { AbstractCollector } from '../../../metrics/abstract-collector';
import { EnvironmentMetricsCollector } from '../../../metrics/collectors/environment';
import { TeamMetricsCollector } from '../../../metrics/collectors/team';
import { DeveloperMetricsCollector } from '../../../metrics/collectors/developer';
import { ApplicationMetricsCollector } from '../../../metrics/collectors/application';
import { ClientMetricsCollector } from '../../../metrics/collectors/client';
import { QueueMetricsCollector } from '../../../metrics/collectors/queue';
import { RestDeliveryPointMetricsCollector } from '../../../metrics/collectors/rest-delivery-point';

// CONFIG

const metricsPrefix = 'amax';

/** The metrics service. */
class MetricsService {

  /** The metrics registry. */
  #registry: prometheus.Registry;

  /** Constructor. */
  constructor() {

    const organizations = config.organizations;
    const connector = config.connectorServer;
    const pubSubCloud = config.pubSubCloudServer;

    // Create all metrics collectors

    const environmentMetricCollector = new EnvironmentMetricsCollector(metricsPrefix, connector, organizations);
    const teamMetricCollector = new TeamMetricsCollector(metricsPrefix, connector, organizations);
    const developerMetricCollector = new DeveloperMetricsCollector(metricsPrefix, connector, organizations);
    const applicationMetricCollector = new ApplicationMetricsCollector(metricsPrefix, connector);
    const clientMetricsCollector = new ClientMetricsCollector(metricsPrefix, pubSubCloud);
    const queueMetricsCollector = new QueueMetricsCollector(metricsPrefix, pubSubCloud);
    const restDeliveryPointMetricsCollector = new RestDeliveryPointMetricsCollector(metricsPrefix, pubSubCloud);

    // Some metrics collector depend on data from others.
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

    // Start data collection for all connectors and create a merged registry

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

  async all(): Promise<string> {
    return this.#registry.metrics();
  }

}

export default new MetricsService();
