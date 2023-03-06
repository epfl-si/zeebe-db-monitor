import { expect } from 'chai';
import {tallyHistogram} from "../src/tallyHistogram.js";


describe("tallyHistogram", function() {
  it("truncates", function() {
    let map = new Map();
    map.set("A", 5);
    map.set("B", 2);
    map.set("C", 2);
    map.set("D", 1);
    map.set("E", 1);
    map.set("F", 1);

    const h = tallyHistogram(map, 3);
    expect(Array.from(h)).to.deep.equal([["A", 5], ["B", 2], ["C", 2], ["(Other)", 3]])
  })
})
