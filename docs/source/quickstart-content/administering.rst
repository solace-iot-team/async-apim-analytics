.. _quickstart-content-administering:

Administering
=============

The API Management Analytics Server provides a REST API for server administration. The REST API is documented using
OpenAPI and is available at http://localhost:8088/api-explorer/.

> Note: If you changed the port of the API Management Analytics server, you must adjust the URL.

Enabling Analytics
++++++++++++++++++

To enable analytics for an organization, create the organization with the **enabled** attribute set to **true**
or, if the organization already exists, set the **enabled** attribute of the organization to **true**.

Example: Create organization **my-organization** using curl:

.. code-block:: bash

   curl http://localhost:8088/v1/organizations \ 
   --request POST \ 
   --user admin:Solace123! \ 
   --header "content-type: application/json" \ 
   --data '{
     "name": "my-organization",
     "enabled": true
   }'

Example: Update the **enabled** attribute for organization **my-organization** using curl:

.. code-block:: bash

   curl http://localhost:8088/v1/organizations/my-organization \ 
   --request PATCH \ 
   --user admin:Solace123! \ 
   --header "content-type: application/json" \ 
   --data '{
     "enabled": true
   }'


Disabling Analytics
+++++++++++++++++++

To disable analytics for an organization, set the **enabled** attribute of the organization to **false** or
delete the organization.

Example: Update the **enabled** attribute for organization **my-organization** using curl:

.. code-block:: bash

   curl http://localhost:8088/v1/organizations/my-organization \ 
   --request PATCH \ 
   --user admin:Solace123! \ 
   --header "content-type: application/json" \ 
   --data '{
     "enabled": false
   }'

Example: Delete organization **my-organization** using curl:

.. code-block:: bash

   curl http://localhost:8088/v1/organizations/my-organization \ 
   --request DELETE \ 
   --user admin:Solace123!
