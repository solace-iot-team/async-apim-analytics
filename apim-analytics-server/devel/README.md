# Solace Async API Management Analytics Server: Development

## Installation and Setup (MacOS)

### Install Node.js

````bash
brew search node
brew install node@16
````

### Install Node.js Packages

To install the required Node.js packages for the API Management Analytics server:

```bash
npm install
```

### Set Environment Variables

To create the **.env** file for the API Management Analytics server:

```bash
cp template.env .env
vi .env
# change values as needed
```

### Install and Setup of API Management Connector, Prometheus and Grafana

To create a multi-container Docker application with API Management Connector, Prometheus and Grafana:

```bash
./scripts/bootstrap.sh standard
```

> The API Management Connector is created with two organizations (organization1, organization2), each with a
> pre-defined setup of resources (the resources definition files are located in the `resources/` directory).

To create a multi-container Docker application with Prometheus and Grafana (but no API Management Connector):

```bash
./scripts/bootstrap.sh prometheus-grafana
```

To stop all services:

```bash
./scripts/stop.sh
```

To start all services:

```bash
./scripts/start.sh
```

To remove API Management Connector, Prometheus and Grafana:

```bash
./scripts/clean.sh
```

## Development

### Code Analysis

To analyse the source code and check for possible programming problems and errors:

```bash
npm run lint
```

### Start API Management Analytics server

To start the API Management Analytics server:

```bash
npm start
```

To start the API Management Analytics server with automatic restart when a source file changes:

```bash
npm run start:watch
```

### Produce and Consume Events

You can use MQTTX or another MQTT client to connect and publish or subscribe to topics.

