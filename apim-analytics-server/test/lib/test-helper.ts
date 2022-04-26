
export class Logger {

  log = (component: string, message: string, details?: any): void => {
    if (details) {
      console.log(`[${component}] - ${message} ${JSON.stringify(details)}`);
    } else {
      console.log(`[${component}] - ${message}`);
    }
  }
}

export const logger = new Logger();
