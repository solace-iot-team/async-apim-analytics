.. _quickstart-content-installing:

Installing
==========

You can install API Management Analytics with one of the following profiles:

:standard:

  This installation profile creates a multi-container application with the following services:

  - API Management Analytics
  - MongoDB
  - Prometheus
  - Grafana

  Use this profile, if you want to use API Management Analytics with an existing API Management Connector.

:all-in-one:

  This installation profile creates a multi-container application with the following services:
  
  - API Management Connector
  - API Management Analytics
  - MongoDB
  - Prometheus
  - Grafana

  The API Management Connector will be setup with organization **organization1** and the following resources:
  
  - A **developement** environment
  - A **say-hello** API and API product
  - A **team-a_application** team application

  Use this profile, if you don't have an API Management Connector or if you don't want to connect API Management
  Analytics to an existing API Management Connector.

.. note::

   In the following, the API Management Analytics home directory is referred to as ``<ANALYTICS_HOME>``.


Before You Begin
++++++++++++++++

1. Download the `latest release`_ of Solace Async API Management Analytics and extract the files to the ``<ANALYTICS_HOME>`` directory.

2. Install dependencies for the API Management Analytics tools.

   .. code-block:: bash

      cd <ANALYTICS_HOME>/apim-analytics-server
      npm ci


Installation Procedure
++++++++++++++++++++++

1. Create the **.env** file using the provided template.

   .. code-block:: bash

      cd <ANALYTICS_HOME>/quickstart
      cp template.env .env

2. Update the **.env** file.

   a) Change the values of the following variables:

     * ``AMAX_SERVER_USERNAME``
     * ``AMAX_SERVER_PASSWORD``
     * ``AMAX_SERVER_CONNECTOR_USERNAME``
     * ``AMAX_SERVER_CONNECTOR_PASSWORD``

   b) If you want to use the **standard** profile, replace the value of ``AMAX_ORGANIZATIONS`` with
      a comma-separated list of organizations for which you want to enable analytics.

   c) If you want to use the **all-in-one** profile:

     * Replace ``{solace-cloud-token}`` with the API token for Solace's Cloud REST API.
     * Replace ``{solace-service-id}`` with the ID of the Solace Cloud service you want to use.

3. Create, start and bootstrap the API Management Analytics components.

   - Using the **standard** profile:

     .. code-block:: bash

        cd <ANALYTICS_HOME>/quickstart
        ./scripts/bootstrap.sh

   - Using the **all-in-one** profile:

     .. code-block:: bash

        cd <ANALYTICS_HOME>/quickstart
        ./scripts/bootstrap.sh all-in-one


.. _latest release: https://github.com/solace-iot-team/async-apim-analytics/releases/latest
