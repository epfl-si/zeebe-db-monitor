/**
 * Allow running a promise in the SingleFlight pattern.
 * The last result is cached with a TTL
 */
export class SingleFlight<T> {
  private promise?: Promise<T>;
  private lastResult?: T;
  private lastResultTime = 0;

  constructor(private work: () => Promise<T>, private ttlMillis: number = 0) {}

  async get(timeout: number): Promise<T | undefined> {
    const now = Date.now();

    // If the lastResult exists and hasn't expired, return it immediately
    if (this.lastResult !== undefined && now - this.lastResultTime < this.ttlMillis) {
      return this.lastResult;
    }

    // If work is already running, reuse the pending promise
    if (!this.promise) {
      this.promise = this.work().then(res => {
        this.lastResult = res;
        this.lastResultTime = Date.now();
        this.promise = undefined;
        return res;
      });
    }

    // Wait for either the pending work or timeout
    await Promise.race([this.promise, sleep(timeout)]);
    return this.lastResult;
  }
}

// Utility sleep function
export function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}
