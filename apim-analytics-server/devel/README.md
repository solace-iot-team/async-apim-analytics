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

## Developement

### Use Local API Management Connector

**Create and Start Local API Management Connector**
```bash
sh connector/start.sh
```

**Bootstrap Local API Management Connector**
```bash
sh connector/bootstap.sh
```

**Stop Local API Management Connector**
```bash
sh connector/stop.sh
```

**Remove Local API Management Connector**
```bash
sh connector/cleanup.sh
```

### Check Code

```bash
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
