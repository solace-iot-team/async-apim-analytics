import 'reflect-metadata';

export const nameKey = Symbol('name');

export function name(className: string): ClassDecorator {
  return Reflect.metadata(nameKey, className);
}

export function getName(type: Function): string {
  return Reflect.getMetadata(nameKey, type);
}

export function getInstanceName(instance: Object): string {
  return Reflect.getMetadata(nameKey, instance.constructor);
}
