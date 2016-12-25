export type Area = string;

export interface AreaHandler {
  read(name: string): Promise<?string>;
  write(name: string, newValue: string): Promise<void>;
  removeItem(name: string): Promise<void>;
}

const handlers: { [area: Area]: AreaHandler } = {};

export function registerHandler(area: Area, handler: AreaHandler): void {
  if (handlers[area]) {
    throw Error(`Already registered handler for "${area}"`);
  }
  handlers[area] = handler;
}

export function findHandler(area: Area): ?AreaHandler {
  return handlers[area];
}
