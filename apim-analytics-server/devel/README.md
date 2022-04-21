# APIM Management Analytics Development

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
cp template.env ../.env
vi ../.env
# update values as needed
```

## Development

### API Management Connector

```bash
# create and bootstrap local connector
sh connector/bootstap.sh
# start local connector
sh connector/start.sh
# stop local connector
sh connector/stop.sh
# cleanup and delete local connector
sh connector/cleanup.sh
```

### Code Analysis

```bash
# analyse and check code
npm run lint
```

### Run Analytics Server in Development Mode

```bash
npm run dev
```

### Produce and Consume Events

Use MQTTX or another MQTT client to connect and publish or subscribe to topics. The standard setup allows
to publish events to and received events from the `say/hello/{language}` topic.

---
