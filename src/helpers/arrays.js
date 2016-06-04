export function last(array) {
  // return the last element in the array
  return array.slice(-1)[0];
}

export function sortByFirstElement([a], [b]) {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
}

export function sum(sum, n) {
  return sum + n;
}

export function range(start, end) {
  return rangeExclusive(start, end + 1);
}

function rangeExclusive(start, end) {
  // start-inclusive, end-noninclusive, pass integers not strings
  // http://stackoverflow.com/a/19506234/303896
  return Array
    .apply(0, Array(end - start))
    .map((element, index) => index + start);
}
