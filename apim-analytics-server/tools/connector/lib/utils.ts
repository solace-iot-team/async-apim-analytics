import 'dotenv/config';
import fs from 'fs';
import { ResourceSet } from '../@types';

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

    const match = value.match(/^\$\{([^:]+):([^}]+)\}$/);
    if (match) {
      const type: string = match[1].toLowerCase();
      const name: string = match[2].trim();
      if (type === "env" && process.env.hasOwnProperty(name)) {
        value = process.env[name];
      }
    }
  }

  return value;
}

/**
 * Creates a resource set from a resource definition file.
 * 
 * @param filename The name of the resource definition file.
 * 
 * @returns The resource set for the resource definition file.
 */
export const createResourceSetFromFile = (filename: string): ResourceSet => {
  const data: Buffer = fs.readFileSync(filename);
  return JSON.parse(data.toString(), (_, value) => configReviver(value));
}
