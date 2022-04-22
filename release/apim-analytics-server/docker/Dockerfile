# Based on: https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/

# The build image
FROM node:latest AS build

WORKDIR /usr/local/apim-analytics-server
COPY . /usr/local/apim-analytics-server/

RUN npm install
RUN npm run build:production

# The production image
FROM node:lts-alpine@sha256:a9b9cb880fa429b0bea899cd3b1bc081ab7277cc97e6d2dcd84bd9753b2027e1

RUN apk add dumb-init

ENV NODE_ENV production

WORKDIR /usr/local/apim-analytics-server
RUN chown -R node:node /usr/local/apim-analytics-server

USER node

COPY --chown=node:node --from=build /usr/local/apim-analytics-server/dist ./
COPY --chown=node:node package*.json ./

RUN npm ci --only=production

CMD ["dumb-init", "node", "server.js"]
