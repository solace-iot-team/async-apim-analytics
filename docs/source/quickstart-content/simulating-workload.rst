.. _quickstart-content-simulating-workload:

Simulating Workload
===================

.. note::

   In the following, the API Management Analytics home directory is referred to as ``<ANALYTICS_HOME>``.


Simulating Workload Using the Workload Simulator
++++++++++++++++++++++++++++++++++++++++++++++++

If you installed API Management Analytics with the **all-in-one** profile, you can simulate workload for
the created application using the **Workload Simulator**:

.. code-block:: bash

   cd <ANALYTICS_HOME>/apim-analytics-tools
   export DOTENV_CONFIG_PATH=<ANALYTICS_HOME>/quickstart/.env
   npm run workload-simulator <ANALYTICS_HOME>/quickstart/resources/workload-simulator/organization1.json
