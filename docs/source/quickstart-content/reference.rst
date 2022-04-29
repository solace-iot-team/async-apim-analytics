.. _quickstart-content-reference:

Reference
=========

Application Properties
++++++++++++++++++++++

The following properties are used to create and configure the API Management Analytics application. If you change any properties
after API Management Analytics has been installed, the changes won't become active until you restart the application.

.. note::

   The resources created in the API Management Connector will **not** be updated when the API Management Analytics application
   is restarted. If you want to update resources in the API Management Connector, you must use the API Management Connector REST API.

:AMAX_SERVER_PORT:

  The port of the API Management Analytics server. The default is **8080**.

:AMAX_SERVER_USERNAME:

  The username of the API Management Analytics server administrator. If not set, the metrics endpoint is unsecured.

:AMAX_SERVER_PASSWORD:

  The password of the API Management Analytics server administrator. If not set, the metrics endpoint is unsecured.

:AMAX_SERVER_LOGGER_LOG_LEVEL:

  The log level of the API Management Analytics server. The default is **debug**.

:AMAX_SERVER_ORGANIZATIONS:

  The comma-separared list of organizations for which to create statistics.

:AMAX_CONNECTOR_HOST:

  The hostname of the API Management Connector server. The default hostname is **docker.host.internal**.

:AMAX_CONNECTOR_PORT:

  The port of the API Management Connector server. The default is **8081**.

:AMAX_CONNECTOR_USERNAME:

  The username of the API Management Connector server platform and ORG administrator.

:AMAX_CONNECTOR_PASSWORD:

  The password of the API Management Connector server platform and ORG administrator.

:AMAX_SOLACE_CLOUD_URL:

  The Base URL of Solace's Cloud REST API. The default is **https://api.solace.cloud/api/v0**.

:AMAX_SOLACE_CLOUD_TOKEN:

  The API token for Solace's Cloud REST API.

:AMAX_SOLACE_SERVICE_ID:

  The service ID of the Solace Cloud service to use in the API Management Connector. This environment variable
  is required only when API Management Analytics is installed using the **all-in-one** installation profile.

:AMAX_GRAFANA_PORT:

  The port of Grafana. The default is **8084**.


Services
++++++++

The API Management Analytics application is created as a multi-container application using Docker Compose and is
composed of the following services:

======================== =================================== =====================
Name                     Description                         Installation Profile
======================== =================================== =====================
apim-connector-mongodb   API Management Connector database   all-in-one
apim-connector           API Management Connector server     all-in-one
apim-analytics-server    API Management Analytics server     all-in-one, standard
prometheus               Prometheus                          all-in-one, standard
grafana                  Grafana                             all-in-one, standard
======================== =================================== =====================


Ports
+++++

By default, the API Management Analytics application exposes the following ports:

- **8080**: API Management Analytics server
- **8081**: API Management Connector server (only exposed when the **all-in-one** installation profile is used)
- **8084**: Grafana

.. note::

   The ports can be changed by changing the corresponding `Application Properties`_.
