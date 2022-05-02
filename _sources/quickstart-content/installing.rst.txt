.. _quickstart-content-installing:

Installing
==========

You can install API Management Analytics with one of the following profiles:

:standard:

  This installation profile creates a multi-container application with the following services:

  - API Management Analytics server
  - Prometheus
  - Grafana

  Use this profile, if you want to use API Management Analytics with an existing API Management Connector.

:all-in-one:

  This installation profile creates a multi-container application with the following services:
  
  - API Management Connector database
  - API Management Connector server
  - API Management Analytics server
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

1. Download the `latest release`_ of Solace Async API Management Analytics and extract the files to the ``<ANALYTICS_HOME>`` directory

2. Install dependencies for the API Management Analytics tools

   .. code-block:: bash

      cd <ANALYTICS_HOME>/apim-analytics-server
      npm ci


Installation Procedure
++++++++++++++++++++++

1. Create the **.env** file

   .. code-block:: bash

      cd <ANALYTICS_HOME>/quickstart
      cp template.env .env

2. In the created **.env** file:

   - Replace ``{solace-cloud-token}`` with the API token for Solace's Cloud REST API
   - Replace ``{solace-service-id}`` with the ID of the Solace Cloud service you want to use
   - Change the values of ``AMAX_SERVER_USERNAME`` and ``AMAX_SERVER_PASSWORD``
   - Change the values of ``AMAX_SERVER_CONNECTOR_USERNAME`` and ``AMAX_SERVER_CONNECTOR_PASSWORD``

.. |br| raw:: html

    <br/>

3. Create, start and bootstrap the API Management Analytics components

   - Using the **standard** profile:

     .. code-block:: bash

        cd <ANALYTICS_HOME>/quickstart
        ./scripts/bootstrap.sh

   - Using the **all-in-one** profile:

     .. code-block:: bash

        cd <ANALYTICS_HOME>/quickstart
        ./scripts/bootstrap.sh all-in-one


.. _latest release: https://github.com/solace-iot-team/async-apim-analytics/releases/latest
