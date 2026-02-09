import { expect } from 'chai';
import { describe, it } from 'mocha';
import { SingleFlight, sleep } from '../src/singleFlight.js'; // adjust the path

describe('SingleFlight', function () {
  this.timeout(10000); // allow longer timeout for async tests

  it('should return the last result if within TTL', async () => {
    let callCount = 0;

    const sf = new SingleFlight(async () => {
      callCount++;
      await sleep(500);
      return callCount;
    }, 1000); // TTL of 1 second

    // The first call triggers the work
    const result1 = await sf.get(1000);
    expect(result1).to.equal(1);
    expect(callCount).to.equal(1);

    // The second call within TTL returns the cached result immediately
    const result2 = await sf.get(1000);
    expect(result2).to.equal(1);
    expect(callCount).to.equal(1);

    // Wait beyond TTL
    await sleep(1100);

    // The next call triggers the work again
    const result3 = await sf.get(1000);
    expect(result3).to.equal(2);
    expect(callCount).to.equal(2);
  });

  it('should respect timeout and return last available result', async () => {
    let callCount = 0;

    const sf = new SingleFlight(async () => {
      callCount++;
      await sleep(1000); // long work
      return callCount;
    }, 5000); // TTL 5s

    // First call, timeout shorter than work duration
    const result1 = await sf.get(500); // 0.5s timeout
    expect(result1).to.be.undefined;
    expect(callCount).to.equal(1);

    // Wait for work to finish
    await sleep(600);

    // The next call should return the cached result immediately
    const result2 = await sf.get(500);
    expect(result2).to.equal(1);
  });

  it('should only run work once if multiple calls happen concurrently', async () => {
    let callCount = 0;

    const sf = new SingleFlight(async () => {
      callCount++;
      await sleep(500);
      return callCount;
    }, 1000);

    // Fire multiple concurrent calls
    const [r1, r2, r3] = await Promise.all([
      sf.get(1000),
      sf.get(1000),
      sf.get(1000),
    ]);

    expect(r1).to.equal(1);
    expect(r2).to.equal(1);
    expect(r3).to.equal(1);
    expect(callCount).to.equal(1);
  });
});
