function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  let error = new Error(response.statusText);
  error.response = response;
  throw error;
}

const MSEC_IN_1_SEC = 1000;
const SEC_IN_1_MIN = 60;
const MIN_IN_1_HR = 60;
const HR_IN_1_DAY = 24;
function dayDifference(earlierDate, laterDate) {
  // params are strings of yyyy-mm-dd
  return ( new Date(laterDate.split("-")) - new Date(earlierDate.split("-")) )
  / MSEC_IN_1_SEC / SEC_IN_1_MIN / MIN_IN_1_HR / HR_IN_1_DAY
  ;
}

function extractJson(response) {
  return response.json();
}

function keys(obj) {
  return Object.keys(obj).sort();
}

function last(array) {
  // return the last element in the array
  return array.slice(-1)[0];
}

function objectKeyValPairs(obj) {
  return keys(obj).map((key) => [key, obj[key]]);
}

function padZero(thing, length = 2) {
  let string = thing.toString();
  while (string.length < length) {
    string = `0${string}`;
  }
  return string;
}

function sortByFirstElement([a], [b]) {
  if (a < b) {
    return -1;
  }
  if (b < a) {
    return 1;
  }
  return 0;
}

function sum(sum, n) {
  return sum + n;
}

function range(start, end) {
  return rangeExclusive(start, end + 1);
}

function rangeExclusive(start, end) {
  // start-inclusive, end-noninclusive, pass integers not strings
  // http://stackoverflow.com/a/19506234/303896
  return Array
    .apply(0, Array(end - start))
    .map((element, index) => index + start);
}

module.exports = {
  checkStatus,
  dayDifference,
  extractJson,
  keys,
  last,
  objectKeyValPairs,
  padZero,
  range,
  sortByFirstElement,
  sum
};
