import solace from 'solclientjs';

const factoryProperties: solace.SolclientFactoryProperties = new solace.SolclientFactoryProperties();
factoryProperties.logLevel = solace.LogLevel.ERROR;

solace.SolclientFactory.init(factoryProperties);

export class ConnectionProperties {
  endpoint: string;
  vpnName: string;
  username: string;
  password: string;
  clientName?: string;
}

/**
 * Base class for a PubSub client.
 */
class SolaceClient {

  /** client session */
  protected session: solace.Session;

  /** constructor */
  constructor(connectionProperties: ConnectionProperties) {

    const sessionProperties: solace.SessionProperties = {
      url: connectionProperties.endpoint,
      vpnName: connectionProperties.vpnName,
      userName: connectionProperties.username,
      password: connectionProperties.password,
      clientName: connectionProperties.clientName,
      publisherProperties: {
        enabled: false,
      }
    }

    this.session = solace.SolclientFactory.createSession(sessionProperties);
  }

  /**
   * Connect to the message broker.
   * 
   * @returns Promise. 
   */
  async connect(): Promise<void> {

    const session = this.session;
    return new Promise<void>((resolve, reject) => {

      session.on(solace.SessionEventCode.UP_NOTICE, (_event: solace.SessionEvent) => {
        resolve();
      });
      session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, (event: solace.SessionEvent) => {
        reject(`Failed to connect to the message broker; info=${event.infoStr}`);
      });
      session.connect();
    });
  }

  /**
   * Disconnect from the message broker.
   * 
   * @returns Promise. 
   */
  async disconnect(): Promise<void> {

    const session = this.session;
    return new Promise<void>(resolve => {

      session.on(solace.SessionEventCode.DISCONNECTED, (_event: solace.SessionEvent) => {
        resolve();
      });
      session.disconnect();
    });
  }

}

/**
 * A client to publish messages to a message broker.
 */
export class Publisher extends SolaceClient {

  /**
   * Publish a message to a topic.
   * 
   * @param topicName The topic in SMF format.
   * @param messageData The message data.
   * 
   * @returns Promise.
   */
  async publish(topicName: string, messageData: string): Promise<void> {

    const session = this.session;
    return new Promise<void>((resolve, reject) => {

      try {

        const topic = solace.SolclientFactory.createTopicDestination(topicName);

        const message = solace.SolclientFactory.createMessage();
        message.setDestination(topic);
        message.setBinaryAttachment(new TextEncoder().encode(messageData));
        message.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);

        session.send(message);
        resolve();

      } catch (error) {
        reject(error);
      }
    });
  }

} // class Publisher

/** internal representation of a subscription */
class Subscription {
  topic: solace.Destination;
  isActive?: boolean = false;
  onUpdate?: { resolve: () => void, reject: (reason: Error) => void };
}

/**
 * A client to subscribe to one or more topics to receive messages.
 */
export class Subscriber extends SolaceClient {

  /** subscriptions */
  private subscriptions: Map<string, Subscription> = new Map<string, Subscription>();

  /** constructor */
  constructor(connectionProperties: ConnectionProperties, onMessageReceived?: (topicName: string, messageData: string) => void) {

    super(connectionProperties);
    const subscriptions = this.subscriptions;

    this.session.on(solace.SessionEventCode.SUBSCRIPTION_OK, (event: solace.SessionEvent) => {
      const key = `${event.correlationKey}`;
      const subscription = subscriptions.get(key);
      if (subscription) {
        subscription.isActive = !subscription.isActive;
        subscription.onUpdate?.resolve();
        subscriptions.set(key, subscription);
      }
    });

    this.session.on(solace.SessionEventCode.SUBSCRIPTION_ERROR, (event: solace.SessionEvent) => {
      const key = `${event.correlationKey}`;
      const subscription = subscriptions.get(key);
      if (subscription) {
        subscription.onUpdate?.reject(new Error(event.infoStr));
      }
    });

    this.session.on(solace.SessionEventCode.MESSAGE, (message: solace.Message) => {
      const topicName = message.getDestination()?.name;
      if (topicName) {
        if (message.getSdtContainer()) {
          onMessageReceived?.(topicName, message.getSdtContainer()?.getValue() || "<empty>");
        } else {
          onMessageReceived?.(topicName, `${message.getBinaryAttachment()}`);
        }
      }
    });
  }

  /**
   * Subscribe to a topic.
   * 
   * @param topicName The topic in SMF format.
   * @returns Promise.
   */
  async subscribe(topicName: string): Promise<void> {

    const session = this.session;
    const subscriptions = this.subscriptions;

    return new Promise<void>((resolve, reject) => {

      if (!subscriptions.has(topicName) || !subscriptions.get(topicName)?.isActive) {

        try {

          const topic = solace.SolclientFactory.createTopicDestination(topicName);

          this.subscriptions.set(topicName, {
            topic: topic,
            isActive: false,
            onUpdate: { resolve, reject },
          });

          const key: any = topicName;
          session.subscribe(topic, true, key, 10000);

        } catch (error) {
          reject(error);
        }

      } else {
        resolve();
      }
    });
  }

  /**
   * Unsubscribe from a topic.
   * 
   * @param topicName The topic in SMF format.
   * @returns Promise.
   */
  async unsubscribe(topicName: string): Promise<void> {

    const session = this.session;
    const subscriptions = this.subscriptions;

    return new Promise<void>((resolve, reject) => {

      const subscription = subscriptions.get(topicName);
      if (subscription && subscription.isActive) {

        try {

          const topic = subscription.topic;

          this.subscriptions.set(topicName, {
            ...subscription,
            onUpdate: { resolve, reject },
          });

          const key: any = topicName;
          session.unsubscribe(topic, true, key, 10000);

        } catch (error) {
          reject(error);
        }

      } else {
        resolve();
      }
    });
  }

} // class Subscriber
