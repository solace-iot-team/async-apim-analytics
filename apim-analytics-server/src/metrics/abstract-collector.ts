import Bree from 'bree';
import * as prometheus from 'prom-client';
import { ListenerSignature, TypedEmitter } from 'tiny-typed-emitter';
import { Logger as L } from '../common/logger';

/** A message handler for worker messages. */
type MessageHandlerFn = (message: any, workerMetadata: any) => void;

/** Default events. */
interface Events {
  update: () => void;
}

/**
 * Base class for a metrics collector.
 */
export abstract class AbstractCollector<L extends ListenerSignature<L> = Events> extends TypedEmitter<L> {

  /** The type name of the collector. */
  #typeName: string;

  /** The prometheus metrics registry. */
  #registry: prometheus.Registry;

  /** The job scheduler. */
  #scheduler: Bree;

  /** The message handlers. */
  #workerMessageHandlers: MessageHandlerFn[] = [];

  /** The date and time when a worker was created. */
  #workerStartTime: Record<string, number> = {};

  /**
   * Constructor for a metrics collector.
   * 
   * @param typeName
   *              The type name of the collector.
   * @param directory
   *              The root directory for the job scheduler.
   */
  constructor(typeName: string, directory: string) {

    super();

    this.#typeName = typeName;
    this.#registry = new prometheus.Registry();

    this.#scheduler = new Bree({
      root: directory,
      defaultExtension: process.env.TS_NODE ? 'ts' : 'js',
      logger: {
        info(message: string, meta: any) {
          L.info(`${typeName}.scheduler`, message.replace(/"/g, "'"), meta);
        },
        warn(message: string, meta: any) {
          L.warn(`${typeName}.scheduler`, message.replace(/"/g, "'"), meta);
        },
        error(message: string, meta: any) {
          L.error(`${typeName}.scheduler`, message.replace(/"/g, "'"), meta);
        }
      },
      jobs: [],
      worker: {
        workerData: {},
      },
      outputWorkerMetadata: false,
      workerMessageHandler: (message: any, workerMetadata: any): void => {
        if (message.message === 'done') {
          const duration = new Date().getTime() - this.#workerStartTime[message.name];
          L.info(`${typeName}.scheduler`, `Worker for job '${message.name}' signaled completion [${duration}ms]`);
        }
        this.#workerMessageHandlers.forEach(handler => handler(message, workerMetadata));
      },
      silenceRootCheckError: true,
    });

    this.#scheduler.on('worker created', (name: string) => {
      this.#workerStartTime[name] = new Date().getTime();
    });
    this.#scheduler.on('worker deleted', (name: string) => {
      delete this.#workerStartTime[name];
    });
  }

  /** Getter for type name. */
  get typeName(): string {
    return this.#typeName;
  }

  /** Getter for metrics registry. */
  get registry(): prometheus.Registry {
    return this.#registry;
  }

  /** Starts metrics collection. */
  enable(): void {
    this.#scheduler.start();
  }

  /** Stops metrics collection. */
  disable(): void {
    this.#scheduler.stop();
  }

  /**
   * Registers a metric in a metrics registry.
   * 
   * @param metric
   *              The metric to register.
   */
  protected registerMetric<T extends string>(metric: prometheus.Metric<T>): void {
    this.#registry.registerMetric(metric);
  }

  /**
   * Registers a job in a job scheduler.
   * 
   * @param job
   *              The job to register.
   */
  protected registerJob(job: Bree.JobOptions): void {
    this.#scheduler.add([job]);
  }

  /**
   * Registers a message handler for worker messages.
   * 
   * @param handler
   *              The message handler to register.
   */
  protected registerMessageHandler(handler: MessageHandlerFn): void {
    this.#workerMessageHandlers.push(handler);
  }

} // abstract class AbstractMetricsCollector<L extends ListenerSignature<L> = CollectorEvents>
