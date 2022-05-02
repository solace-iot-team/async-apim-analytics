.. _quickstart-content-uninstalling:

Uninstalling
============

.. note::

   In the following, the API Management Analytics home directory is referred to as ``<ANALYTICS_HOME>``.

.. important::

   If you installed API Management Analytics using the **all-in-one** profile and if you created additional organizations in the
   API Management Connector, you must delete them first. Otherwise, you might end up with resources in your Solace Cloud service
   that must be deleted manually.

To remove all API Management Analytics components, do the following:

.. code-block:: bash

   cd <ANALYTICS_HOME>/quickstart
   ./scripts/cleanup.sh
