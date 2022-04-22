# Solace Async API Management Analytics Server: Development

## Setup (MacOS)

### Install Node.js

````bash
brew search node
brew install node@16
````

### Change Node.js Version

```bash
brew unlink node
brew link node@14
```

### Update Node.js Packages

```bash
npm install
```

### Set Environment Variables

```bash
cp template.env .env
vi .env
# update values as needed
```

## Development

### API Management Connector

The API Management Analytics Server requires an API Management Connector. The following scripts can be used to setup, run and
teardown an API Management Connector on your local machine. [^1]

| Script       | Description |
|--------------|-------------|
| bootstrap.sh | Create, start and bootstrap the latest release of the API Management Connector |
| start.sh     | Start the API Management Connector |
| stop.sh      | Stop the API Management Connector |
| cleanup.sh   | Remove the API Management Connector |

[^1]: The API Management Connector is created as multi-container Docker application and requires Docker Engine and Docker Compose,
      which are both included in Docker Desktop for Mac.

### Code Analysis

```bash
# analyse and check code
npm run lint
```

### Run server for API Management Analytics

```bash
# start server
npm start
# start server with automatic restart when a source file changes
npm run start:watch
```

### Produce and Consume Events

Use MQTTX or another MQTT client to connect and publish or subscribe to topics. The standard setup allows
to publish events to and received events from the `say/hello/{language}` topic.

---
