import 'dotenv/config';

export function getEnvVarAsString(name: string): string | undefined;
export function getEnvVarAsString(name: string, defaultValue: string): string;

export function getEnvVarAsString(name: string, defaultValue?: string): string | undefined {
  return process.env[name] || defaultValue;
}

export function getEnvVarAsNumber(name: string): number | undefined;
export function getEnvVarAsNumber(name: string, defaultValue: number): number;

export function getEnvVarAsNumber(name: string, defaultValue?: number): number | undefined {
  let value: number | undefined;
  const valueAsString = process.env[name];
  if (valueAsString) {
    value = parseInt(valueAsString);
    if (Number.isNaN(value)) throw new Error(`value for environment variable '${name} is not a number`);
  }
  return value || defaultValue;
}

export function getMandatoryEnvVarAsString(name: string): string {
  const value = getEnvVarAsString(name);
  if (!value) throw new Error(`environment variable '${name} is missing`);
  return value;
}

export function logMessage(component: string, message: string, details?: any): void {
  if (details) {
    console.log(`[${component}] - ${message} ${JSON.stringify(details)}`);
  } else {
    console.log(`[${component}] - ${message}`);
  }
}
