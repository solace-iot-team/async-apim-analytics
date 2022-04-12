import pino from 'pino';

const file = process.env.AMAX_SERVER_LOGGER_LOG_FILE;

/** A simple logger. */
export class Logger {

  static #logger: pino.Logger = pino({
    name: process.env.AMAX_SERVER_LOGGER_APP_ID || 'apim-analytics-server',
    level: process.env.AMAX_SERVER_LOGGER_LOG_LEVEL || 'info'
  }, file ? pino.destination(file) : pino.destination(1));

  static isLevelEnabled = (level: string): boolean => {
    return Logger.#logger.isLevelEnabled(level);
  }

  static fatal = (component: string, message: string, details?: any): void => {
    Logger.#logger.fatal({ component: component, ...details }, message);
  }

  static error = (component: string, message: string, details?: any): void => {
    Logger.#logger.error({ component: component, ...details }, message);
  }

  static warn = (component: string, message: string, details?: any): void => {
    Logger.#logger.warn({ component: component, ...details }, message);
  }

  static info = (component: string, message: string, details?: any): void => {
    Logger.#logger.info({ component: component, ...details }, message);
  }

  static debug = (component: string, message: string, details?: any): void => {
    Logger.#logger.debug({ component: component, ...details }, message);
  }

  static trace = (component: string, message: string, details?: any): void => {
    Logger.#logger.trace({ component: component, ...details }, message);
  }
}
