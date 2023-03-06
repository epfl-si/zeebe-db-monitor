export function tallyHistogram(map: Map<string, number>, n: number = 100) {
  const fullTally = Array.from(map).sort((entryA, entryB) => compare(entryB[1], entryA[1]));
  const summaryTally = new Map<string, number>(Array.from(fullTally.splice(0, n)));
  if (fullTally.length) { // Meaning, there were originally more than n
    summaryTally.set('(Other)', fullTally.map((entry) => entry[1]).reduce((accum, entry) => accum + entry,
      0));
  }
  return summaryTally;

  function compare(numA: number, numB: number) {
    return numA < numB ? -1 : numA > numB ? 1 : 0;
  }
}
