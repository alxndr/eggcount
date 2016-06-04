"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.checkStatus = checkStatus;
exports.dayDifference = dayDifference;
exports.extractJson = extractJson;
exports.keys = keys;
exports.last = last;
exports.objectKeyValPairs = objectKeyValPairs;
exports.padZero = padZero;
exports.sortByFirstElement = sortByFirstElement;
exports.sum = sum;
exports.range = range;
exports.ymdFromDate = ymdFromDate;
function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  var error = new Error(response.statusText);
  error.response = response;
  throw error;
}

var MSEC_IN_1_SEC = 1000;
var SEC_IN_1_MIN = 60;
var MIN_IN_1_HR = 60;
var HR_IN_1_DAY = 24;
function dayDifference(earlierDate, laterDate) {
  // params are strings of yyyy-mm-dd
  return (new Date(laterDate.split("-")) - new Date(earlierDate.split("-"))) / MSEC_IN_1_SEC / SEC_IN_1_MIN / MIN_IN_1_HR / HR_IN_1_DAY;
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
  return keys(obj).map(function (key) {
    return [key, obj[key]];
  });
}

function padZero(thing) {
  var length = arguments.length <= 1 || arguments[1] === undefined ? 2 : arguments[1];

  var string = thing.toString();
  while (string.length < length) {
    string = "0" + string;
  }
  return string;
}

function sortByFirstElement(_ref, _ref2) {
  var _ref4 = _slicedToArray(_ref, 1);

  var a = _ref4[0];

  var _ref3 = _slicedToArray(_ref2, 1);

  var b = _ref3[0];

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
  return Array.apply(0, Array(end - start)).map(function (element, index) {
    return index + start;
  });
}

function ymdFromDate(date) {
  return [date.getYear() + 1900, date.getMonth() + 1, date.getDate()].join("-");
}