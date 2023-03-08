import {JoinablePromise, sleep} from "../src/joinable_promise.js";
import {expect} from 'chai';

describe("JoinablePromise", function() {
  it("delivers", async function() {
    await (new JoinablePromise(() => sleep(10))).next(20);
  })
  it("compresses work", async function() {
    let invoked = 0, completed = 0;
    const j = new JoinablePromise(async () => {
      invoked += 1;
      await sleep(10);
      completed += 1;
    });
    const promises = [j.next(20), j.next(20)];
    expect(invoked).to.equal(1);
    expect(completed).to.equal(0);

    await Promise.all(promises);
    expect(invoked).to.equal(1);
    expect(completed).to.equal(1);
  });
  it("restarts work", async function() {
    let counter = 0;
    const j = new JoinablePromise(async () => {
      await sleep(10);
      counter += 1;
      return counter;
    });
    expect(await j.next(100)).to.equal(1);
    expect(await j.next(100)).to.equal(2);
  })
});
