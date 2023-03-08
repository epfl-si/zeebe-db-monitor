export class JoinablePromise<T> {
  #pending: Promise<T> | undefined = undefined;
  #work: () => Promise<T>;
  #result : T | undefined = undefined;

  constructor(work: () => Promise<T>) {
    this.#work = work;
  }

  async next(timeoutMillis : number): Promise<T|undefined> {
    if (this.#pending === undefined) {
      this.#pending = this.#work();
      this.#pending.then((result : T) => {
        this.#result = result;
        this.#pending = undefined;
      })
    }
    await Promise.race([sleep(timeoutMillis),
                        this.#pending]);
    return this.#result;
  }
}

export async function sleep (millis : number) : Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, millis);
  });
}
