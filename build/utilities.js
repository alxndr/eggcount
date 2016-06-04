"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkStatus = checkStatus;
exports.dayDifference = dayDifference;
exports.extractJson = extractJson;
exports.keys = keys;
exports.last = last;
exports.padZero = padZero;
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

function padZero(thing) {
  var length = arguments.length <= 1 || arguments[1] === undefined ? 2 : arguments[1];

  var string = thing.toString();
  while (string.length < length) {
    string = "0" + string;
  }
  return string;
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