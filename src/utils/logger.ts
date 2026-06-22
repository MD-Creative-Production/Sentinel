export class Logger {
  constructor(private readonly context: string) {}
  info(msg: string, ...args: unknown[]) {
    console.log(`[${this.context}] ${msg}`, ...args);
  }
  debug(msg: string, ...args: unknown[]) {
    console.debug(`[${this.context}] ${msg}`, ...args);
  }
  error(msg: string, ...args: unknown[]) {
    console.error(`[${this.context}] ${msg}`, ...args);
  }
  warn(msg: string, ...args: unknown[]) {
    console.warn(`[${this.context}] ${msg}`, ...args);
  }
}
