# Solace Async API Management Analytics Server: Development

> Note: The root directory of this repository is referred to as `<ANALYTICS_HOME>` and the parent
>       directory of this README is referred to as `<SERVER_DEVEL_HOME>`.

## Installation and Setup (MacOS)

### Install Node.js

````bash
brew search node
brew install node@16
````

### Install Node.js Packages

To install the required Node.js packages for the API Management Analytics server:

```bash
cd <ANALYTICS_HOME>/apim-analytics-server
npm install
```

To install the required Node.js packages for the API Management Analytics tools:

```bash
cd <ANALYTICS_HOME>/apim-analytics-tools
npm install
```

### Set Environment Variables

To create an **.env** file with environment variables for the API Management Analytics server:

```bash
cd <SERVER_DEVEL_HOME>
cp template.env .env
vi .env
# change values as needed
```

### Install and Setup of API Management Connector, Prometheus and Grafana

To create a multi-container Docker application with MongoDB, API Management Connector, Prometheus and Grafana:

```bash
cd <SERVER_DEVEL_HOME>
./scripts/bootstrap.sh standard
```

> The API Management Connector is created with two organizations (organization1, organization2), each with a pre-defined setup
> of resources (the resources definition files are located in the `<SERVER_DEVEL_HOME>/resources/apim-connector/` directory).

To create a multi-container Docker application with MongoDB, Prometheus and Grafana (but no API Management Connector):

```bash
cd <SERVER_DEVEL_HOME>
./scripts/bootstrap.sh prometheus-grafana
```

To stop all services:

```bash
cd <SERVER_DEVEL_HOME>
./scripts/scripts//stop.sh
```

To start all services:

```bash
cd <SERVER_DEVEL_HOME>
./scripts/start.sh
```

To remove API Management Connector, Prometheus and Grafana:

```bash
cd <SERVER_DEVEL_HOME>
./scripts/clean.sh
```

## Development

### Code Analysis

To analyse the source code and check for possible programming problems and errors:

```bash
cd <SERVER_DEVEL_HOME>
npm run lint
```

### Start API Management Analytics Server

To start the API Management Analytics server:

```bash
cd <SERVER_DEVEL_HOME>
npm start
```

To start the API Management Analytics server with automatic restart when a source file changes:

```bash
cd <SERVER_DEVEL_HOME>
npm run start:watch
```

### Enable Analytics for an Organization

To enable analytics for organization 'organization1':

```bash
curl -X POST -u admin:Solace123! -H 'Content-Type:application/json' http://localhost:8088/v1/organizations -d '{"name":"organization1","enabled":true}'
```

> Note: If you changed username, password or port for the analytics server in the **.env** file, you need to adjust
>       the corresponding values in the **curl** command.

### Simulate Workload

If you use the the API Management Connector with the pre-defined setup, you can simulate workload on applications in organization1:

```bash
cd <ANALYTICS_HOME>/apim-analytics-tools
export DOTENV_CONFIG_PATH=<SERVER_DEVEL_HOME>/.env
npm run simulate-workload <SERVER_DEVEL_HOME>/resources/workload-simulator/organization1.json
```

### View Statistics

To view application or client statistics, open Grafana via http://localhost:8084/ and choose one of the following dashboards:

- AsyncAPI Analytics: Application Statistics
- AsyncAPI Analytics: Client Statistics

> Note: If you changed the port for Grafana in the **.env** file, you need to adjust the URL.

> Note: The default username/password for Grafana are **admin**/**admin**. When you login for the first time, you will be
>       asked to change the default password.
