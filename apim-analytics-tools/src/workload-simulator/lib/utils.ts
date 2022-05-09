import 'dotenv/config';
import fs from 'fs';
import { Configuration } from '../@types';

/**
 * Returns the string value of an environment variable.
 * 
 * If the environment variable is not set and a default value is specified, the default value
 * is returned. Otherwise, an error is thrown.
 * 
 * @param name The name of the variable.
 * @param defaultValue The default value (optional).
 * 
 * @returns The string value for the environment variable or, if not set, the default value.
 */
export const getEnvVarAsString = (name: string, defaultValue?: string): string => {
  const value = process.env[name] || defaultValue;
  if (value === undefined) {
    throw new Error(`environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Resolves external references for configuration values.
 * 
 * @param value The value.
 * 
 * @returns The resolved value.
 */
const configReviver = (value: any): any => {

  if (typeof value === "string") {

    const match = value.match(/\$\{([^:]+):([^}]+)\}/);
    if (match) {
      const type: string = match[1].toLowerCase();
      const name: string = match[2].trim();
      if (type === "env" && process.env.hasOwnProperty(name)) {
        const envValue = process.env[name];
        if (envValue) {
          value = value.replace(match[0], envValue);
        }
      }
    }
  }

  return value;
}

/**
 * Creates configuration from a configuration file.
 * 
 * @param filename The name of the configuration file.
 * 
 * @returns The configuration.
 */
export const createConfigurationFromFile = (filename: string): Configuration => {
  const data: Buffer = fs.readFileSync(filename);
  return JSON.parse(data.toString(), (_, value) => configReviver(value));
}

/**
 * Returns a random number from an interval.
 * 
 * @param min The minimum value.
 * @param max The maximum value.
 * 
 * @returns A random number.
 */
export const randomIntFromInterval = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * Returns a random item from a list of items.
 * 
 * @param items The list of items.
 * @param filter A callback to filter the list of items before an item is choosen.
 * 
 * @returns A random item from the list of items.
 */
export const randomItemFromList = <T>(items: T[], filter?: (value: T) => boolean): T => {

  if (items.length === 0) {
    throw new Error('list is empty');
  }

  if (filter) {
    items = items.filter(item => filter(item));
  }

  return (items[Math.floor(Math.random() * items.length)]);
}
