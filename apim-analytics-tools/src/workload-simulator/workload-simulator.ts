import ms from 'ms';
import * as connector from './lib/connector-api';
import * as solace from './lib/solace-client'
import * as utils from './lib/utils'
import {
  Application,
  Configuration,
  Environment,
} from './@types';

/** A simple producer */
class Producer {

  #client: solace.Publisher;
  #topics: string[];

  #timer: NodeJS.Timer;

  /**
   * Creates a producer.
   * 
   * @param name The name of the producer.
   * @param application The target application.
   * @param environment The target environment.
   */
  constructor(name: string, application: Application, environment: Environment) {

    this.#client = new solace.Publisher({
      endpoint: environment.endpoints['smf']!,
      vpnName: environment.msgVpnName,
      username: application.credentials.username,
      password: application.credentials.password,
      clientName: name,
    });

    this.#topics = application.topics.pub;
  }

  /**
   * Activates the producer.
   * 
   * While active, a producer will do the following:
   *  1. Connect to the message broker
   *  2. Send a message to a random topic
   *  3. Wait for a random amount of time
   *  4. Repeat steps 2 to 4
   * 
   * Notes:
   *  - There is a 2% chance, that the producer sends a message to a topic without permissions,
   *    which will result in the message being discarded on the broker.
   *  - When waiting, the producer waits between 0.8 and 1.2 times of the idle time.
   * 
   * @param idleTime The idle time (in milliseconds).
   */
  async activate(idleTime: number): Promise<void> {

    const minIdleTime = Math.floor(idleTime * 0.8);
    const maxIdleTime = Math.floor(idleTime * 1.2);

    await this.#client.connect();

    this.#timer = setInterval(async () => {

      let topic: string;

      const number = utils.randomIntFromInterval(1, 100);
      if (number > 2) {
        topic = utils.randomItemFromList(this.#topics);
        topic = topic.replace(/{[^}]+}/g, 'foobar');
      } else {
        // to cause an ACL error
        topic = 'amax/pubsub/foobar';
      }

      try {
        await this.#client.publish(topic, 'Hello, Solace!');
      } catch (all) {
        // ignore
      }

    }, utils.randomIntFromInterval(minIdleTime, maxIdleTime));
  }

  /**
   * Deactivates the producer.
   */
  async deactivate(): Promise<void> {
    clearInterval(this.#timer);
    await this.#client.disconnect();
  }

} // class Producer 

/** A simple consumer */
class Consumer {

  #client: solace.Subscriber;
  #topics: string[];

  /**
   * Creates a consumer.
   * 
   * @param name The name of the consumer.
   * @param application The target application.
   * @param environment The target environment.
   */
  constructor(name: string, application: Application, environment: Environment) {

    this.#client = new solace.Subscriber({
      endpoint: environment.endpoints['smf']!,
      vpnName: environment.msgVpnName,
      username: application.credentials.username,
      password: application.credentials.password,
      clientName: name,
    });

    this.#topics = application.topics.sub;
  }

  /**
   * Activates the consumer.
   * 
   * When activated, a consumer will do the following:
   *  1. Connect to the message broker
   *  2. Subscribe to a random topic
   */
  async activate(): Promise<void> {

    let topic = utils.randomItemFromList(this.#topics);
    topic = topic.replace(/{[^}]+}/g, '*');

    await this.#client.connect();
    await this.#client.subscribe(topic);
  }

  /**
   * Deactivates the consumer.
   * 
   * When deactivated, a consumer will disconnect from the message broker.
   */
  async deactivate(): Promise<void> {
    await this.#client.disconnect();
  }

} // class Consumer 

/** A managed worker */
interface ManagedWorker {
  status: 'active' | 'inactive';
  worker?: Producer | Consumer;
  timer?: NodeJS.Timeout;
}

/** A PubSub workload simulator  */
export class WorkloadSimulator {

  /** The configuration */
  #configuration: Configuration;

  /** The target environments */
  #environments: Environment[] = [];

  /** The target applications */
  #applications: Application[] = [];

  /** The producers */
  #producers: Record<string, ManagedWorker> = {};

  /** The consumers */
  #consumers: Record<string, ManagedWorker> = {};

  /** The active timers */
  #timers: NodeJS.Timer[] = [];

  /** Hidden constructor */
  private constructor(configuration: Configuration) {
    this.#configuration = configuration;
  }

  /**
   * Creates a PubSub workload simulator.
   * 
   * @param configuration The configuration.
   * 
   * @returns The created PubSub workload simulator.
   */
  static async create(configuration: Configuration): Promise<WorkloadSimulator> {

    const server = configuration.server;
    const organizationName = configuration.organization;

    // create environment list

    const environments: Environment[] = [];

    const e = await connector.getEnvironments(server, organizationName);
    e.forEach(environment => {
      if (environment.endpoints['smf']) {
        if (!configuration.environments || configuration.environments.includes(environment.name)) {
          environments.push(environment);
        }
      }
    });

    if (environments.length === 0) {
      throw new Error('SMF not supported for any of the environments');
    }

    // create application list

    const applications: Application[] = [];

    const a = await connector.getApplications(server, organizationName);
    a.forEach(application => {
      const envs = application.environments.filter(name => environments.find(item => item.name == name));
      if (envs.length > 0) {
        applications.push({ ...application, environments: envs });
      }
    });

    if (applications.length === 0) {
      throw new Error('SMF not supported for any of the applications');
    }

    const manager = new WorkloadSimulator(configuration);

    manager.#environments = environments;
    manager.#applications = applications;

    for (let i = 0; i < configuration.producers.count; i++) {
      const name = '#smf/producer/' + String(i + 1).padStart(4, '0');
      manager.#producers[name] = {
        status: 'inactive',
      };
    }

    for (let i = 0; i < configuration.consumers.count; i++) {
      const name = '#smf/consumer/' + String(i + 1).padStart(4, '0');
      manager.#consumers[name] = {
        status: 'inactive',
      }
    }

    return manager;
  }

  /**
   * Starts the PubSub workload simulator.
   */
  async start(): Promise<void> {

    await this.#activateProducers();
    const activateProducersTimer = setInterval(() => {
      this.#activateProducers();
    }, 15000);
    this.#timers.push(activateProducersTimer);

    await this.#activateConsumers();
    const activateConsumersTimer = setInterval(() => {
      this.#activateConsumers();
    }, 15000);
    this.#timers.push(activateConsumersTimer);
  }

  /**
   * Stops the PubSub workload simulator.
   */
  async stop(): Promise<void> {
    this.#timers.forEach(timer => clearInterval(timer));
    await this.#deactivateProducers();
    await this.#deactivateConsumers();
  }

  /**
   * Activates all inactive producers.
   */
  async #activateProducers(): Promise<void> {
    for (const name in this.#producers) {
      if (this.#producers[name].status == 'inactive') { await this.#activateProducer(name); }
    }
  }

  /**
   * Activates a producer.
   * 
   * @param name The name of the producer.
   */
  async #activateProducer(name: string): Promise<void> {

    const options = this.#configuration.producers;

    const lifespan = ms(options.lifespan); // average lifespan of a producer
    const idleTime = ms(options.idleTime); // average idle time of a producer

    const application = utils.randomItemFromList(this.#applications, (application) => {
      const whitelist = options.applications;
      return ((!whitelist || whitelist.includes(application.name)) && application.topics.pub.length > 0);
    });

    const environment = utils.randomItemFromList(this.#environments, (environment) => {
      return (!application.environments || application.environments.includes(environment.name));
    });

    try {

      console.log(`Activate producer '${name}' for application '${application.name}' and environment '${environment.name}' ..`);

      const producer = new Producer(name, application, environment);

      producer.activate(idleTime);
      const deactivateTimer = setTimeout(() => {
        this.#deactivateProducer(name);
      }, utils.randomIntFromInterval(Math.floor(lifespan * 0.9), Math.floor(lifespan * 1.1)));

      this.#producers[name] = {
        status: 'active',
        worker: producer,
        timer: deactivateTimer,
      };

      console.log(' .. producer activated');

    } catch (error: any) {
      console.log(` .. failed to activate producer '${name}'; reason='${error.message}`);
    }

  } // WorkloadSimulator.#activateProducers(name: string): Promise<void>

  /**
   * Deactivates all active producers.
   */
  async #deactivateProducers(): Promise<void> {
    for (const name in this.#producers) {
      if (this.#producers[name].status == 'active') { await this.#deactivateProducer(name); }
    }
  }

  /**
   * Deactivates a producer.
   * 
   * @param name The name of the producer.
   */
  async #deactivateProducer(name: string): Promise<void> {

    try {

      console.log(`Deactivate producer '${name}' ..`)

      const producer = this.#producers[name];
      if (producer) {

        producer.status = 'inactive';

        if (producer.worker) {
          await producer.worker.deactivate();
          delete producer.worker;
        }
        if (producer.timer) {
          clearTimeout(producer.timer);
          delete producer.timer;
        }
      }

      console.log(' .. producer deactivated');

    } catch (error: any) {
      console.log(` .. failed to deactivate producer '${name}'; reason='${error.message}`);
    }
  }

  /**
   * Activates all inactive consumers.
   */
  async #activateConsumers(): Promise<void> {
    for (const name in this.#consumers) {
      if (this.#consumers[name].status == 'inactive') { await this.#activateConsumer(name); }
    }
  }

  /**
   * Activates a consumer.
   * 
   * @param name The name of the consumer.
   */
  async #activateConsumer(name: string): Promise<void> {

    const options = this.#configuration.consumers;
    const lifespan = ms(options.lifespan); // average lifespan of a consumer

    const application = utils.randomItemFromList(this.#applications, (application) => {
      const whitelist = options.applications;
      return ((!whitelist || whitelist.includes(application.name)) && application.topics.sub.length > 0);
    });

    const environment = utils.randomItemFromList(this.#environments, (environment) => {
      return (!application.environments || application.environments.includes(environment.name));
    });

    try {

      console.log(`Activate consumer '${name}' for application '${application.name}' and environment '${environment.name}' ..`);

      const consumer = new Consumer(name, application, environment);

      consumer.activate();
      const deactivateTimer = setTimeout(() => {
        this.#deactivateConsumer(name);
      }, utils.randomIntFromInterval(Math.floor(lifespan * 0.9), Math.floor(lifespan * 1.1)));

      this.#consumers[name] = {
        status: 'active',
        worker: consumer,
        timer: deactivateTimer,
      };

      console.log(' .. consumer activated');

    } catch (error: any) {
      console.log(` .. failed to activate consumer '${name}'; reason='${error.message}`);
    }
  }

  /**
   * Deactivates all active consumers.
   */
  async #deactivateConsumers(): Promise<void> {
    for (const name in this.#consumers) {
      if (this.#consumers[name].status == 'active') { await this.#deactivateConsumer(name); }
    }
  }

  /**
   * Deactivates a consumer.
   * 
   * @param name The name of the consumer.
   */
  async #deactivateConsumer(name: string): Promise<void> {

    try {

      console.log(`Deactivate consumer '${name}' ..`)

      const consumer = this.#consumers[name];
      if (consumer) {

        consumer.status = 'inactive';
        if (consumer.worker) {
          await consumer.worker.deactivate();
          delete consumer.worker;
        }
        if (consumer.timer) {
          clearTimeout(consumer.timer);
          delete consumer.timer;
        }
      }

      console.log(' .. consumer deactivated');

    } catch (error: any) {
      console.log(` .. failed to deactivate consumer '${name}'; reason='${error.message}`);
    }
  }

} // class WorkloadSimulator
