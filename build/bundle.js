(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchGist = fetchGist;

var _utilities = require("./utilities");

function fetchGist(gistId) {
  return fetch("https://api.github.com/gists/" + gistId).then(_utilities.checkStatus).then(_utilities.extractJson);
}
/*  */
/* export async function fetchFileInGist(filename, gistId) { */
/* global.console.log("ffig", filename, gistId); */
/* const {files, html_url} = await fetchGist(gistId); */
/* const data = */
/* await fetch(files[filename].raw_url) */
/* .then(checkStatus) */
/* .then(extractJson); */
/* return { */
/* fileUrl: html_url, */
/* data: data */
/* }; */
/* } */

},{"./utilities":5}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createLink = createLink;
exports.createP = createP;
exports.findId = findId;
exports.insertFirst = insertFirst;
exports.removeNodesInNodelist = removeNodesInNodelist;
function createElement(elementName) {
  return document.createElement(elementName);
}

function createLink(_ref) {
  var href = _ref.href;
  var text = _ref.text;

  var link = createElement("a");
  link.appendChild(createText(text));
  link.href = href;
  return link;
}

function createP(text) {
  var p = createElement("p");
  p.appendChild(createText(text));
  return p;
}

function createText(text) {
  return document.createTextNode(text);
}

function findId(elementId) {
  return document.getElementById(elementId);
}

function insertFirst(container, newElement) {
  var firstChild = container.firstChild;
  container.insertBefore(newElement, firstChild);
}

function removeNodesInNodelist(nodelist) {
  var node = void 0;
  while (node = nodelist[nodelist.length - 1]) {
    // needs to recalculate placeholdersNodelist.length on each iteration
    node.remove();
  }
  // TODO use a for loop?
}

},{}],3:[function(require,module,exports){
(function (global){
"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _gistApi = require("./gistApi");

var _plotly = require("./plotly");

var _plotly2 = _interopRequireDefault(_plotly);

var _html = require("./html");

var html = _interopRequireWildcard(_html);

var _utilities = require("./utilities");

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function die() {
  console.error("Uh oh! Expected Plotly to be globally available.");
  html.insertFirst(html.findId("charts"), html.createP("Uh oh, can't find the graphing library! Try refreshing?"));
}

function dateOfFirstEntry(dateEntries) {
  var firstYear = (0, _utilities.keys)(dateEntries)[0];
  var firstMonth = (0, _utilities.keys)(dateEntries[firstYear])[0];
  var firstDay = (0, _utilities.keys)(dateEntries[firstYear][firstMonth])[0];
  var d = new Date(firstYear, firstMonth - 1, firstDay);
  d.setHours(1); // so other calculations of this date will be before...
  return d;
}

var theFirstEntry = void 0; // this is "global"
function runningAverageOverPriorDays(_ref, numDays, dateEntries) {
  var startingYear = _ref.year;
  var startingMonth = _ref.month;
  var startingDay = _ref.day;

  var monthZeroIndexed = startingMonth - 1;
  var referenceDate = new Date(startingYear, monthZeroIndexed, startingDay);
  var cutoffDate = new Date(startingYear, monthZeroIndexed, startingDay);
  cutoffDate.setDate(cutoffDate.getDate() - numDays);

  if (!theFirstEntry) {
    // this is "global"
    theFirstEntry = dateOfFirstEntry(dateEntries);
  }
  if (cutoffDate < theFirstEntry) {
    return null;
  }
  var dateInQuestion = cutoffDate;
  var dataToAverage = [];
  while (dateInQuestion <= referenceDate) {
    var year = (dateInQuestion.getYear() + 1900).toString();
    var month = (0, _utilities.padZero)(dateInQuestion.getMonth() + 1);
    var day = (0, _utilities.padZero)(dateInQuestion.getDate());
    if (dateEntries[year] && dateEntries[year][month]) {
      var dayData = dateEntries[year][month][day];
      if (dayData) {
        dataToAverage.push(dayData.count);
      }
    }
    dateInQuestion.setDate(dateInQuestion.getDate() + 1);
  }

  if (dataToAverage.length === 0) {
    return null;
  }
  return dataToAverage.reduce(_utilities.sum) / numDays;
}

var FAKE_YEAR = 1970;
function makeFakeDate(month, day) {
  return new Date(FAKE_YEAR, month - 1, day);
}

function recordStuff(data, count, month, day) {
  // need to normalize all dates to same year,
  // so charting lib places all e.g. Jul 13s in the same X-axis position
  data.dateSeries.push(makeFakeDate(month, day));
  data.rawCount.push(count);
  return data;
}

function emptyCounts() {
  return {
    dateSeries: [],
    rawCount: []
  };
}

function buildDateAndCountObjects(monthAcc, _ref2) {
  var _ref3 = _slicedToArray(_ref2, 2);

  var month = _ref3[0];
  var monthData = _ref3[1];

  var _objectKeyValPairs$so = (0, _utilities.objectKeyValPairs)(monthData).sort(_utilities.sortByFirstElement).reduce(function (dayAcc, _ref4) {
    var _ref5 = _slicedToArray(_ref4, 2);

    var day = _ref5[0];
    var dayData = _ref5[1];
    return recordStuff(dayAcc, dayData.count, month, day);
  }, emptyCounts());

  var dateSeries = _objectKeyValPairs$so.dateSeries;
  var rawCount = _objectKeyValPairs$so.rawCount;

  return {
    dateSeries: monthAcc.dateSeries.concat(dateSeries),
    rawCount: monthAcc.rawCount.concat(rawCount)
  };
}

function buildSeparateDataSets(yearAcc, _ref6) {
  var _ref7 = _slicedToArray(_ref6, 2);

  var year = _ref7[0];
  var yearData = _ref7[1];

  /* feed through a .reduce(); will return an object shaped like...
     {
       2014: {
         dateSeries: [...]
         rawCount: [...]
       averages...
       },
       ...
     }
   */
  yearAcc[year] = (0, _utilities.objectKeyValPairs)(yearData).sort(_utilities.sortByFirstElement).reduce(buildDateAndCountObjects, emptyCounts());
  return yearAcc;
}

function calculateAverages(entryDictionary) {
  var years = (0, _utilities.keys)(entryDictionary);
  var averages = {};

  // iterates through all days between first and last data points, and
  // calculates a bunch of numbers, and
  // mutates the `averages` object, filling it up with the numbers.
  (0, _utilities.range)(parseInt(years[0]), parseInt(years.slice(-1)[0])).map(function (yearInt) {
    var year = yearInt.toString();
    if (!entryDictionary[year]) {
      return;
    }
    averages[year] = {};
    averages[year].dateSeries = [];
    averages[year].avgDays7 = [];
    averages[year].avgDays28 = [];
    averages[year].avgDays84 = [];
    (0, _utilities.range)(1, 12).map(function (monthInt) {
      var month = (0, _utilities.padZero)(monthInt); // entry dictionary has zero-padded string as keys
      if (!entryDictionary[year][month]) {
        return;
      }
      (0, _utilities.range)(1, 31).map(function (dayInt) {
        var date = new Date(yearInt, monthInt - 1, dayInt);
        if (date.getDate() !== dayInt) {
          return; // we auto-generated an invalid date, e.g. feb 31st
        }
        // TODO return if we're past the last date or before the first date
        var day = (0, _utilities.padZero)(dayInt); // entry dictionary has zero-padded string as keys
        if (!averages[year][month]) {
          averages[year][month] = {};
        }
        var days7 = runningAverageOverPriorDays({ year: year, month: month, day: day }, 7, entryDictionary);
        if (days7 !== null) {
          var days28 = runningAverageOverPriorDays({ year: year, month: month, day: day }, 28, entryDictionary);
          var days84 = runningAverageOverPriorDays({ year: year, month: month, day: day }, 84, entryDictionary);
          var fakeDate = makeFakeDate(month, day);
          averages[year].dateSeries.push(fakeDate);
          averages[year].avgDays7.push(days7);
          averages[year].avgDays28.push(days28);
          averages[year].avgDays84.push(days84);
        }
      });
    });
  });
  return {
    averages: averages,
    rawData: entryDictionary
  };
}

function extractData(year, measure, data, opts) {
  // expects `data` to have a `[year]` property, and that object to have `.dateSeries` and `[measure]` properties
  var defaults = {
    name: year.toString(),
    type: "scatter",
    x: data[year].dateSeries,
    y: data[year][measure]
  };
  return Object.assign(defaults, opts);
}

function sortInput(a, b) {
  var aDate = new Date(a.date.split("-"));
  var bDate = new Date(b.date.split("-"));
  if (aDate < bDate) {
    return -1;
  }
  return 1;
}

function constructDict(data) {
  var infilledData = data.sort(sortInput).reduce(function (smoothed, _ref8) {
    var date = _ref8.date;
    var count = _ref8.count;

    if (!smoothed.length) {
      // the first measurement. no need to process any further.
      smoothed.push({ date: date, count: count });
      return smoothed;
    }
    var lastMeasurement = (0, _utilities.last)(smoothed);
    var difference = (0, _utilities.dayDifference)(lastMeasurement.date, date);
    if (difference <= 1) {
      smoothed.push({ date: date, count: count });
    } else {
      var lastMeasurementDate = new Date(lastMeasurement.date.split("-"));
      var dailyAverage = count / difference;
      for (var i = 1; i < difference; i++) {
        var missingDate = new Date(lastMeasurementDate);
        missingDate.setDate(lastMeasurementDate.getDate() + i);
        smoothed.push({ date: (0, _utilities.ymdFromDate)(missingDate), count: dailyAverage });
      }
      smoothed.push({ date: date, count: dailyAverage });
    }
    return smoothed;
  }, []);
  return infilledData.reduce(function (entries, _ref9) {
    var date = _ref9.date;
    var count = _ref9.count;

    var _date$split = date.split("-");

    var _date$split2 = _slicedToArray(_date$split, 3);

    var year = _date$split2[0];
    var month = _date$split2[1];
    var day = _date$split2[2];

    if (!entries[year]) {
      entries[year] = {};
    }
    if (!entries[year][month]) {
      entries[year][month] = {};
    }
    entries[year][month][day] = { count: count };
    return entries;
  }, {});
}

function buildConfigsForPlotly(_ref10) {
  var rawData = _ref10.rawData;
  var averages = _ref10.averages;

  var transformedData = (0, _utilities.objectKeyValPairs)(rawData).reduce(buildSeparateDataSets, {});
  return (0, _utilities.keys)(rawData).reduce(function (dataToChart, year) {
    var countChartOptions = { mode: "markers", opacity: 0.3, marker: { size: 15 } };
    var averagesChartsOptions = { mode: "line" };
    dataToChart.dataForCollectedChart.push(extractData(year, "rawCount", transformedData, countChartOptions));
    dataToChart.dataFor7dayChart.push(extractData(year, "avgDays7", averages, averagesChartsOptions));
    dataToChart.dataFor28dayChart.push(extractData(year, "avgDays28", averages, averagesChartsOptions));
    dataToChart.dataFor84dayChart.push(extractData(year, "avgDays84", averages, averagesChartsOptions));
    return dataToChart;
  }, { dataForCollectedChart: [], dataFor7dayChart: [], dataFor28dayChart: [], dataFor84dayChart: [] });
}

global.showChart = function (_ref11) {
  var gistId = _ref11.gistId;
  var filename = _ref11.filename;

  if (!global.Plotly) {
    die();
    return false;
  }
  var newPlot = global.Plotly.newPlot;

  return (0, _gistApi.fetchGist)(gistId).then(function (_ref12) {
    var files = _ref12.files;
    var html_url = _ref12.html_url;

    // TODO there should be a split here in the pipeline or something...
    // (there are two things to do with the result of fetching that gist)
    html.findId("charts").appendChild(html.createLink({ text: "data source", href: html_url }));
    return fetch(files[filename].raw_url).then(_utilities.checkStatus).then(_utilities.extractJson);
  }).then(constructDict).then(calculateAverages) // need to calculate averages only once all data is collected
  .then(buildConfigsForPlotly).then(function (_ref13) {
    var dataForCollectedChart = _ref13.dataForCollectedChart;
    var dataFor7dayChart = _ref13.dataFor7dayChart;
    var dataFor28dayChart = _ref13.dataFor28dayChart;
    var dataFor84dayChart = _ref13.dataFor84dayChart;

    html.removeNodesInNodelist(html.findId("charts").getElementsByClassName("placeholder"));
    var plotlyConfig = { displayModeBar: false };
    newPlot("raw", dataForCollectedChart, _plotly2.default.layout({ title: "eggs collected per day" }), plotlyConfig);
    newPlot("1wk", dataFor7dayChart, _plotly2.default.layout({ title: "1-week rolling average" }), plotlyConfig);
    newPlot("1mo", dataFor28dayChart, _plotly2.default.layout({ title: "1-month rolling average" }), plotlyConfig);
    newPlot("3mo", dataFor84dayChart, _plotly2.default.layout({ title: "3-month rolling average" }), plotlyConfig);
  });
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})

},{"./gistApi":1,"./html":2,"./plotly":4,"./utilities":5}],4:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function layout(opts) {
  return Object.assign({
    type: "date",
    xaxis: {
      tickformat: "%b %d"
    },
    yaxis: {}
  }, opts);
}

exports.default = {
  layout: layout
};

},{}],5:[function(require,module,exports){
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
  if (a > b) {
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

},{}]},{},[1,2,3,4,5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvZ2lzdEFwaS5qcyIsInNyYy9odG1sLmpzIiwic3JjL21haW4uanMiLCJzcmMvcGxvdGx5LmpzIiwic3JjL3V0aWxpdGllcy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O1FDRWdCLFMsR0FBQSxTOztBQUZoQjs7QUFFTyxTQUFTLFNBQVQsQ0FBbUIsTUFBbkIsRUFBMkI7QUFDaEMsU0FBTyx3Q0FBc0MsTUFBdEMsRUFDSixJQURJLHlCQUVKLElBRkksd0JBQVA7QUFHRDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O1FDRmUsVSxHQUFBLFU7UUFPQSxPLEdBQUEsTztRQVVBLE0sR0FBQSxNO1FBSUEsVyxHQUFBLFc7UUFLQSxxQixHQUFBLHFCO0FBOUJoQixTQUFTLGFBQVQsQ0FBdUIsV0FBdkIsRUFBb0M7QUFDbEMsU0FBTyxTQUFTLGFBQVQsQ0FBdUIsV0FBdkIsQ0FBUDtBQUNEOztBQUVNLFNBQVMsVUFBVCxPQUFrQztBQUFBLE1BQWIsSUFBYSxRQUFiLElBQWE7QUFBQSxNQUFQLElBQU8sUUFBUCxJQUFPOztBQUN2QyxNQUFNLE9BQU8sY0FBYyxHQUFkLENBQWI7QUFDQSxPQUFLLFdBQUwsQ0FBaUIsV0FBVyxJQUFYLENBQWpCO0FBQ0EsT0FBSyxJQUFMLEdBQVksSUFBWjtBQUNBLFNBQU8sSUFBUDtBQUNEOztBQUVNLFNBQVMsT0FBVCxDQUFpQixJQUFqQixFQUF1QjtBQUM1QixNQUFNLElBQUksY0FBYyxHQUFkLENBQVY7QUFDQSxJQUFFLFdBQUYsQ0FBYyxXQUFXLElBQVgsQ0FBZDtBQUNBLFNBQU8sQ0FBUDtBQUNEOztBQUVELFNBQVMsVUFBVCxDQUFvQixJQUFwQixFQUEwQjtBQUN4QixTQUFPLFNBQVMsY0FBVCxDQUF3QixJQUF4QixDQUFQO0FBQ0Q7O0FBRU0sU0FBUyxNQUFULENBQWdCLFNBQWhCLEVBQTJCO0FBQ2hDLFNBQU8sU0FBUyxjQUFULENB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QStCLEdBQS9CLEVBQW9DOzs7QUFHbEMsU0FBTyxNQUNKLEtBREksQ0FDRSxDQURGLEVBQ0ssTUFBTSxNQUFNLEtBQVosQ0FETCxFQUVKLEdBRkksQ0FFQSxVQUFDLE9BQUQsRUFBVSxLQUFWO0FBQUEsV0FBb0IsUUFBUSxLQUE1QjtBQUFBLEdBRkEsQ0FBUDtBQUdEOztBQUVNLFNBQVMsV0FBVCxDQUFxQixJQUFyQixFQUEyQjtBQUNoQyxTQUFPLENBQ0wsS0FBSyxPQUFMLEtBQWlCLElBRFosRUFFTCxLQUFLLFFBQUwsS0FBa0IsQ0FGYixFQUdMLEtBQUssT0FBTCxFQUhLLEVBSUwsSUFKSyxDQUlBLEdBSkEsQ0FBUDtBQUtEIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImltcG9ydCB7Y2hlY2tTdGF0dXMsIGV4dHJhY3RKc29ufSBmcm9tIFwiLi91dGlsaXRpZXNcIjtcblxuZXhwb3J0IGZ1bmN0aW9uIGZldGNoR2lzdChnaXN0SWQpIHtcbiAgcmV0dXJuIGZldGNoKGBodHRwczovL2FwaS5naXRodWIuY29tL2dpc3RzLyR7Z2lzdElkfWApXG4gICAgLnRoZW4oY2hlY2tTdGF0dXMpXG4gICAgLnRoZW4oZXh0cmFjdEpzb24pO1xufVxuLyogICovXG4vKiBleHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hGaWxlSW5HaXN0KGZpbGVuYW1lLCBnaXN0SWQpIHsgKi9cbi8qIGdsb2JhbC5jb25zb2xlLmxvZyhcImZmaWdcIiwgZmlsZW5hbWUsIGdpc3RJZCk7ICovXG4vKiBjb25zdCB7ZmlsZXMsIGh0bWxfdXJsfSA9IGF3YWl0IGZldGNoR2lzdChnaXN0SWQpOyAqL1xuLyogY29uc3QgZGF0YSA9ICovXG4vKiBhd2FpdCBmZXRjaChmaWxlc1tmaWxlbmFtZV0ucmF3X3VybCkgKi9cbi8qIC50aGVuKGNoZWNrU3RhdHVzKSAqL1xuLyogLnRoZW4oZXh0cmFjdEpzb24pOyAqL1xuLyogcmV0dXJuIHsgKi9cbi8qIGZpbGVVcmw6IGh0bWxfdXJsLCAqL1xuLyogZGF0YTogZGF0YSAqL1xuLyogfTsgKi9cbi8qIH0gKi9cbiIsImZ1bmN0aW9uIGNyZWF0ZUVsZW1lbnQoZWxlbWVudE5hbWUpIHtcbiAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoZWxlbWVudE5hbWUpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlTGluayh7aHJlZiwgdGV4dH0pIHtcbiAgY29uc3QgbGluayA9IGNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICBsaW5rLmFwcGVuZENoaWxkKGNyZWF0ZVRleHQodGV4dCkpO1xuICBsaW5rLmhyZWYgPSBocmVmO1xuICByZXR1cm4gbGluaztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVAodGV4dCkge1xuICBjb25zdCBwID0gY3JlYXRlRWxlbWVudChcInBcIik7XG4gIHAuYXBwZW5kQ2hpbGQoY3JlYXRlVGV4dCh0ZXh0KSk7XG4gIHJldHVybiBwO1xufVxuXG5mdW5jdGlvbiBjcmVhdGVUZXh0KHRleHQpIHtcbiAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKHRleHQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZElkKGVsZW1lbnRJZCkge1xuICByZXR1cm4gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoZWxlbWVudElkKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGluc2VydEZpcnN0KGNvbnRhaW5lciwgbmV3RWxlbWVudCkge1xuICBjb25zdCBmaXJzdENoaWxkID0gY29udGFpbmVyLmZpcnN0Q2hpbGQ7XG4gIGNvbnRhaW5lci5pbnNlcnRCZWZvcmUobmV3RWxlbWVudCwgZmlyc3RDaGlsZCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiByZW1vdmVOb2Rlc0luTm9kZWxpc3Qobm9kZWxpc3QpIHtcbiAgbGV0IG5vZGU7XG4gIHdoaWxlIChub2RlID0gbm9kZWxpc3Rbbm9kZWxpc3QubGVuZ3RoIC0gMV0pIHsgLy8gbmVlZHMgdG8gcmVjYWxjdWxhdGUgcGxhY2Vob2xkZXJzTm9kZWxpc3QubGVuZ3RoIG9uIGVhY2ggaXRlcmF0aW9uXG4gICAgbm9kZS5yZW1vdmUoKTtcbiAgfVxuICAvLyBUT0RPIHVzZSBhIGZvciBsb29wP1xufVxuIiwiaW1wb3J0IHsgZmV0Y2hHaXN0IH0gZnJvbSBcIi4vZ2lzdEFwaVwiXG5pbXBvcnQgcGxvdGx5IGZyb20gXCIuL3Bsb3RseVwiO1xuaW1wb3J0ICogYXMgaHRtbCBmcm9tIFwiLi9odG1sXCI7XG5pbXBvcnQge1xuICBjaGVja1N0YXR1cyxcbiAgZGF5RGlmZmVyZW5jZSxcbiAgZXh0cmFjdEpzb24sXG4gIGtleXMsXG4gIGxhc3QsXG4gIG9iamVjdEtleVZhbFBhaXJzLFxuICBwYWRaZXJvLFxuICByYW5nZSxcbiAgc29ydEJ5Rmlyc3RFbGVtZW50LFxuICBzdW0sXG4gIHltZEZyb21EYXRlXG59IGZyb20gXCIuL3V0aWxpdGllc1wiO1xuXG5mdW5jdGlvbiBkaWUoKSB7XG4gIGNvbnNvbGUuZXJyb3IoXCJVaCBvaCEgRXhwZWN0ZWQgUGxvdGx5IHRvIGJlIGdsb2JhbGx5IGF2YWlsYWJsZS5cIik7XG4gIGh0bWwuaW5zZXJ0Rmlyc3QoXG4gICAgaHRtbC5maW5kSWQoXCJjaGFydHNcIiksXG4gICAgaHRtbC5jcmVhdGVQKFwiVWggb2gsIGNhbid0IGZpbmQgdGhlIGdyYXBoaW5nIGxpYnJhcnkhIFRyeSByZWZyZXNoaW5nP1wiKVxuICApO1xufVxuXG5mdW5jdGlvbiBkYXRlT2ZGaXJzdEVudHJ5KGRhdGVFbnRyaWVzKSB7XG4gIGNvbnN0IGZpcnN0WWVhciA9IGtleXMoZGF0ZUVudHJpZXMpWzBdO1xuICBjb25zdCBmaXJzdE1vbnRoID0ga2V5cyhkYXRlRW50cmllc1tmaXJzdFllYXJdKVswXTtcbiAgY29uc3QgZmlyc3REYXkgPSBrZXlzKGRhdGVFbnRyaWVzW2ZpcnN0WWVhcl1bZmlyc3RNb250aF0pWzBdO1xuICBjb25zdCBkID0gbmV3IERhdGUoZmlyc3RZZWFyLCBmaXJzdE1vbnRoLTEsIGZpcnN0RGF5KTtcbiAgZC5zZXRIb3VycygxKTsgLy8gc28gb3RoZXIgY2FsY3VsYXRpb25zIG9mIHRoaXMgZGF0ZSB3aWxsIGJlIGJlZm9yZS4uLlxuICByZXR1cm4gZDtcbn1cblxubGV0IHRoZUZpcnN0RW50cnk7IC8vIHRoaXMgaXMgXCJnbG9iYWxcIlxuZnVuY3Rpb24gcnVubmluZ0F2ZXJhZ2VPdmVyUHJpb3JEYXlzKFxuICB7IHllYXI6IHN0YXJ0aW5nWWVhcixcbiAgICBtb250aDogc3RhcnRpbmdNb250aCxcbiAgICBkYXk6IHN0YXJ0aW5nRGF5IH0sXG4gIG51bURheXMsXG4gIGRhdGVFbnRyaWVzXG4pIHtcbiAgY29uc3QgbW9udGhaZXJvSW5kZXhlZCA9IHN0YXJ0aW5nTW9udGggLSAxO1xuICBjb25zdCByZWZlcmVuY2VEYXRlID0gbmV3IERhdGUoc3RhcnRpbmdZZWFyLCBtb250aFplcm9JbmRleGVkLCBzdGFydGluZ0RheSk7XG4gIGNvbnN0IGN1dG9mZkRhdGUgPSBuZXcgRGF0ZShzdGFydGluZ1llYXIsIG1vbnRoWmVyb0luZGV4ZWQsIHN0YXJ0aW5nRGF5KTtcbiAgY3V0b2ZmRGF0ZS5zZXREYXRlKGN1dG9mZkRhdGUuZ2V0RGF0ZSgpIC0gbnVtRGF5cyk7XG5cbiAgaWYgKCF0aGVGaXJzdEVudHJ5KSB7IC8vIHRoaXMgaXMgXCJnbG9iYWxcIlxuICAgIHRoZUZpcnN0RW50cnkgPSBkYXRlT2ZGaXJzdEVudHJ5KGRhdGVFbnRyaWVzKTtcbiAgfVxuICBpZiAoY3V0b2ZmRGF0ZSA8IHRoZUZpcnN0RW50cnkpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBsZXQgZGF0ZUluUXVlc3Rpb24gPSBjdXRvZmZEYXRlO1xuICBsZXQgZGF0YVRvQXZlcmFnZSA9IFtdO1xuICB3aGlsZSAoZGF0ZUluUXVlc3Rpb24gPD0gcmVmZXJlbmNlRGF0ZSkge1xuICAgIGNvbnN0IHllYXIgPSAoZGF0ZUluUXVlc3Rpb24uZ2V0WWVhcigpICsgMTkwMCkudG9TdHJpbmcoKTtcbiAgICBjb25zdCBtb250aCA9IHBhZFplcm8oZGF0ZUluUXVlc3Rpb24uZ2V0TW9udGgoKSArIDEpO1xuICAgIGNvbnN0IGRheSA9IHBhZFplcm8oZGF0ZUluUXVlc3Rpb24uZ2V0RGF0ZSgpKTtcbiAgICBpZiAoZGF0ZUVudHJpZXNbeWVhcl0gJiYgZGF0ZUVudHJpZXNbeWVhcl1bbW9udGhdKSB7XG4gICAgICBjb25zdCBkYXlEYXRhID0gZGF0ZUVudHJpZXNbeWVhcl1bbW9udGhdW2RheV07XG4gICAgICBpZiAoZGF5RGF0YSkge1xuICAgICAgICBkYXRhVG9BdmVyYWdlLnB1c2goZGF5RGF0YS5jb3VudCk7XG4gICAgICB9XG4gICAgfVxuICAgIGRhdGVJblF1ZXN0aW9uLnNldERhdGUoZGF0ZUluUXVlc3Rpb24uZ2V0RGF0ZSgpICsgMSk7XG4gIH1cblxuICBpZiAoZGF0YVRvQXZlcmFnZS5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gZGF0YVRvQXZlcmFnZS5yZWR1Y2Uoc3VtKSAvIG51bURheXM7XG59XG5cbmNvbnN0IEZBS0VfWUVBUiA9IDE5NzA7XG5mdW5jdGlvbiBtYWtlRmFrZURhdGUobW9udGgsIGRheSkge1xuICByZXR1cm4gbmV3IERhdGUoRkFLRV9ZRUFSLCBtb250aC0xLCBkYXkpO1xufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVBdmVyYWdlcyhlbnRyeURpY3Rpb25hcnkpIHtcbiAgY29uc3QgeWVhcnMgPSBrZXlzKGVudHJ5RGljdGlvbmFyeSk7XG4gIGxldCBhdmVyYWdlcyA9IHt9O1xuXG4gIC8vIGl0ZXJhdGVzIHRocm91Z2ggYWxsIGRheXMgYmV0d2VlbiBmaXJzdCBhbmQgbGFzdCBkYXRhIHBvaW50cywgYW5kXG4gIC8vIGNhbGN1bGF0ZXMgYSBidW5jaCBvZiBudW1iZXJzLCBhbmRcbiAgLy8gbXV0YXRlcyB0aGUgYGF2ZXJhZ2VzYCBvYmplY3QsIGZpbGxpbmcgaXQgdXAgd2l0aCB0aGUgbnVtYmVycy5cbiAgcmFuZ2UocGFyc2VJbnQoeWVhcnNbMF0pLCBwYXJzZUludCh5ZWFycy5zbGljZSgtMSlbMF0pKS5tYXAoKHllYXJJbnQpID0+IHtcbiAgICBjb25zdCB5ZWFyID0geWVhckludC50b1N0cmluZygpO1xuICAgIGlmICghZW50cnlEaWN0aW9uYXJ5W3llYXJdKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGF2ZXJhZ2VzW3llYXJdID0ge307XG4gICAgYXZlcmFnZXNbeWVhcl0uZGF0ZVNlcmllcyA9IFtdO1xuICAgIGF2ZXJhZ2VzW3llYXJdLmF2Z0RheXM3ID0gW107XG4gICAgYXZlcmFnZXNbeWVhcl0uYXZnRGF5czI4ID0gW107XG4gICAgYXZlcmFnZXNbeWVhcl0uYXZnRGF5czg0ID0gW107XG4gICAgcmFuZ2UoMSwgMTIpLm1hcCgobW9udGhJbnQpID0+IHtcbiAgICAgIGNvbnN0IG1vbnRoID0gcGFkWmVybyhtb250aEludCk7IC8vIGVudHJ5IGRpY3Rpb25hcnkgaGFzIHplcm8tcGFkZGVkIHN0cmluZyBhcyBrZXlzXG4gICAgICBpZiAoIWVudHJ5RGljdGlvbmFyeVt5ZWFyXVttb250aF0pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgcmFuZ2UoMSwgMzEpLm1hcCgoZGF5SW50KSA9PiB7XG4gICAgICAgIGNvbnN0IGRhdGUgPSBuZXcgRGF0ZSh5ZWFySW50LCBtb250aEludCAtIDEsIGRheUludCk7XG4gICAgICAgIGlmIChkYXRlLmdldERhdGUoKSAhPT0gZGF5SW50KSB7XG4gICAgICAgICAgcmV0dXJuOyAvLyB3ZSBhdXRvLWdlbmVyYXRlZCBhbiBpbnZhbGlkIGRhdGUsIGUuZy4gZmViIDMxc3RcbiAgICAgICAgfVxuICAgICAgICAvLyBUT0RPIHJldHVybiBpZiB3ZSdyZSBwYXN0IHRoZSBsYXN0IGRhdGUgb3IgYmVmb3JlIHRoZSBmaXJzdCBkYXRlXG4gICAgICAgIGNvbnN0IGRheSA9IHBhZFplcm8oZGF5SW50KTsgLy8gZW50cnkgZGljdGlvbmFyeSBoYXMgemVyby1wYWRkZWQgc3RyaW5nIGFzIGtleXNcbiAgICAgICAgaWYgKCFhdmVyYWdlc1t5ZWFyXVttb250aF0pIHtcbiAgICAgICAgICBhdmVyYWdlc1t5ZWFyXVttb250aF0gPSB7fTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBkYXlzNyA9IHJ1bm5pbmdBdmVyYWdlT3ZlclByaW9yRGF5cyh7eWVhciwgbW9udGgsIGRheX0sIDcsIGVudHJ5RGljdGlvbmFyeSk7XG4gICAgICAgIGlmIChkYXlzNyAhPT0gbnVsbCkge1xuICAgICAgICAgIGNvbnN0IGRheXMyOCA9IHJ1bm5pbmdBdmVyYWdlT3ZlclByaW9yRGF5cyh7eWVhciwgbW9udGgsIGRheX0sIDI4LCBlbnRyeURpY3Rpb25hcnkpO1xuICAgICAgICAgIGNvbnN0IGRheXM4NCA9IHJ1bm5pbmdBdmVyYWdlT3ZlclByaW9yRGF5cyh7eWVhciwgbW9udGgsIGRheX0sIDg0LCBlbnRyeURpY3Rpb25hcnkpO1xuICAgICAgICAgIGNvbnN0IGZha2VEYXRlID0gbWFrZUZha2VEYXRlKG1vbnRoLCBkYXkpO1xuICAgICAgICAgIGF2ZXJhZ2VzW3llYXJdLmRhdGVTZXJpZXMucHVzaChmYWtlRGF0ZSk7XG4gICAgICAgICAgYXZlcmFnZXNbeWVhcl0uYXZnRGF5czcucHVzaChkYXlzNyk7XG4gICAgICAgICAgYXZlcmFnZXNbeWVhcl0uYXZnRGF5czI4LnB1c2goZGF5czI4KTtcbiAgICAgICAgICBhdmVyYWdlc1t5ZWFyXS5hdmdEYXlzODQucHVzaChkYXlzODQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG4gIHJldHVybiB7XG4gICAgYXZlcmFnZXM6IGF2ZXJhZ2VzLFxuICAgIHJhd0RhdGE6IGVudHJ5RGljdGlvbmFyeVxuICB9O1xufVxuXG5mdW5jdGlvbiBleHRyYWN0RGF0YSh5ZWFyLCBtZWFzdXJlLCBkYXRhLCBvcHRzKSB7XG4gIC8vIGV4cGVjdHMgYGRhdGFgIHRvIGhhdmUgYSBgW3llYXJdYCBwcm9wZXJ0eSwgYW5kIHRoYXQgb2JqZWN0IHRvIGhhdmUgYC5kYXRlU2VyaWVzYCBhbmQgYFttZWFzdXJlXWAgcHJvcGVydGllc1xuICBjb25zdCBkZWZhdWx0cyA9IHtcbiAgICBuYW1lOiB5ZWFyLnRvU3RyaW5nKCksXG4gICAgdHlwZTogXCJzY2F0dGVyXCIsXG4gICAgeDogZGF0YVt5ZWFyXS5kYXRlU2VyaWVzLFxuICAgIHk6IGRhdGFbeWVhcl1bbWVhc3VyZV1cbiAgfTtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oZGVmYXVsdHMsIG9wdHMpO1xufVxuXG5mdW5jdGlvbiBzb3J0SW5wdXQoYSwgYikge1xuICBjb25zdCBhRGF0ZSA9IG5ldyBEYXRlKGEuZGF0ZS5zcGxpdChcIi1cIikpO1xuICBjb25zdCBiRGF0ZSA9IG5ldyBEYXRlKGIuZGF0ZS5zcGxpdChcIi1cIikpO1xuICBpZiAoYURhdGUgPCBiRGF0ZSkge1xuICAgIHJldHVybiAtMTtcbiAgfVxuICByZXR1cm4gMTtcbn1cblxuZnVuY3Rpb24gY29uc3RydWN0RGljdChkYXRhKSB7XG4gIGNvbnN0IGluZmlsbGVkRGF0YSA9IGRhdGEuc29ydChzb3J0SW5wdXQpLnJlZHVjZShmdW5jdGlvbihzbW9vdGhlZCwge2RhdGUsIGNvdW50fSkge1xuICAgIGlmICghc21vb3RoZWQubGVuZ3RoKSB7IC8vIHRoZSBmaXJzdCBtZWFzdXJlbWVudC4gbm8gbmVlZCB0byBwcm9jZXNzIGFueSBmdXJ0aGVyLlxuICAgICAgc21vb3RoZWQucHVzaCh7ZGF0ZSwgY291bnR9KTtcbiAgICAgIHJldHVybiBzbW9vdGhlZDtcbiAgICB9XG4gICAgY29uc3QgbGFzdE1lYXN1cmVtZW50ID0gbGFzdChzbW9vdGhlZCk7XG4gICAgY29uc3QgZGlmZmVyZW5jZSA9IGRheURpZmZlcmVuY2UobGFzdE1lYXN1cmVtZW50LmRhdGUsIGRhdGUpO1xuICAgIGlmIChkaWZmZXJlbmNlIDw9IDEpIHtcbiAgICAgIHNtb290aGVkLnB1c2goe2RhdGUsIGNvdW50fSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IGxhc3RNZWFzdXJlbWVudERhdGUgPSBuZXcgRGF0ZShsYXN0TWVhc3VyZW1lbnQuZGF0ZS5zcGxpdChcIi1cIikpO1xuICAgICAgY29uc3QgZGFpbHlBdmVyYWdlID0gY291bnQgLyBkaWZmZXJlbmNlO1xuICAgICAgZm9yIChsZXQgaSA9IDE7IGkgPCBkaWZmZXJlbmNlOyBpKyspIHtcbiAgICAgICAgY29uc3QgbWlzc2luZ0RhdGUgPSBuZXcgRGF0ZShsYXN0TWVhc3VyZW1lbnREYXRlKTtcbiAgICAgICAgbWlzc2luZ0RhdGUuc2V0RGF0ZShsYXN0TWVhc3VyZW1lbnREYXRlLmdldERhdGUoKSArIGkpO1xuICAgICAgICBzbW9vdGhlZC5wdXNoKHtkYXRlOiB5bWRGcm9tRGF0ZShtaXNzaW5nRGF0ZSksIGNvdW50OiBkYWlseUF2ZXJhZ2V9KTtcbiAgICAgIH1cbiAgICAgIHNtb290aGVkLnB1c2goe2RhdGUsIGNvdW50OiBkYWlseUF2ZXJhZ2V9KTtcbiAgICB9XG4gICAgcmV0dXJuIHNtb290aGVkO1xuICB9LCBbXSk7XG4gIHJldHVybiBpbmZpbGxlZERhdGEucmVkdWNlKGZ1bmN0aW9uKGVudHJpZXMsIHtkYXRlLCBjb3VudH0pIHtcbiAgICBjb25zdCBbeWVhciwgbW9udGgsIGRheV0gPSBkYXRlLnNwbGl0KFwiLVwiKTtcbiAgICBpZiAoIWVudHJpZXNbeWVhcl0pIHtcbiAgICAgIGVudHJpZXNbeWVhcl0gPSB7fTtcbiAgICB9XG4gICAgaWYgKCFlbnRyaWVzW3llYXJdW21vbnRoXSkge1xuICAgICAgZW50cmllc1t5ZWFyXVttb250aF0gPSB7fTtcbiAgICB9XG4gICAgZW50cmllc1t5ZWFyXVttb250aF1bZGF5XSA9IHtjb3VudDogY291bnR9O1xuICAgIHJldHVybiBlbnRyaWVzO1xuICB9LCB7fSk7XG59XG5cbmZ1bmN0aW9uIG5ld0VtcHR5RGF0YVRoaW5nKCkge1xuICByZXR1cm4ge1xuICAgIGRhdGVTZXJpZXM6IFtdLFxuICAgIHJhd0NvdW50OiBbXSxcbiAgICBhdmdEYXlzNzogW10sXG4gICAgYXZnRGF5czI4OiBbXSxcbiAgICBhdmdEYXlzODQ6IFtdXG4gIH07XG59XG5cbmZ1bmN0aW9uIGJ1aWxkU2VwYXJhdGVEYXRhU2V0cyh5ZWFyQWNjLCBbeWVhciwgeWVhckRhdGFdKSB7XG4gIC8qIGZlZWQgdGhyb3VnaCBhIC5yZWR1Y2UoKTsgd2lsbCByZXR1cm4gYW4gb2JqZWN0IHNoYXBlZCBsaWtlLi4uXG4gICAgIHtcbiAgICAgICAyMDE0OiB7XG4gICAgICAgICBkYXRlU2VyaWVzOiBbLi4uXVxuICAgICAgICAgcmF3Q291bnQ6IFsuLi5dXG4gICAgICAgYXZlcmFnZXMuLi5cbiAgICAgICB9LFxuICAgICAgIC4uLlxuICAgICB9XG4gICAqL1xuICB5ZWFyQWNjW3llYXJdID1cbiAgICBvYmplY3RLZXlWYWxQYWlycyh5ZWFyRGF0YSlcbiAgICAgIC5zb3J0KHNvcnRCeUZpcnN0RWxlbWVudClcbiAgICAgIC5yZWR1Y2UoKG1vbnRoQWNjLCBbbW9udGgsIG1vbnRoRGF0YV0pID0+IHtcbiAgICAgICAgY29uc3Qge2RhdGVTZXJpZXMsIHJhd0NvdW50fSA9XG4gICAgICAgICAgb2JqZWN0S2V5VmFsUGFpcnMobW9udGhEYXRhKVxuICAgICAgICAgICAgLnNvcnQoc29ydEJ5Rmlyc3RFbGVtZW50KVxuICAgICAgICAgICAgLnJlZHVjZSgoZGF5QWNjLCBbZGF5LCBkYXlEYXRhXSkgPT4ge1xuICAgICAgICAgICAgICAvLyBuZWVkIHRvIG5vcm1hbGl6ZSBhbGwgZGF0ZXMgdG8gc2FtZSB5ZWFyLFxuICAgICAgICAgICAgICAvLyBzbyBjaGFydGluZyBsaWIgcGxhY2VzIGFsbCBlLmcuIEp1bCAxM3MgaW4gdGhlIHNhbWUgWC1heGlzIHBvc2l0aW9uXG4gICAgICAgICAgICAgIGRheUFjYy5kYXRlU2VyaWVzLnB1c2gobWFrZUZha2VEYXRlKG1vbnRoLCBkYXkpKTtcbiAgICAgICAgICAgICAgZGF5QWNjLnJhd0NvdW50LnB1c2goZGF5RGF0YS5jb3VudCk7XG4gICAgICAgICAgICAgIHJldHVybiBkYXlBY2M7XG4gICAgICAgICAgICB9LCBuZXdFbXB0eURhdGFUaGluZygpKVxuICAgICAgICAgIDtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBkYXRlU2VyaWVzOiBtb250aEFjYy5kYXRlU2VyaWVzLmNvbmNhdChkYXRlU2VyaWVzKSxcbiAgICAgICAgICByYXdDb3VudDogbW9udGhBY2MucmF3Q291bnQuY29uY2F0KHJhd0NvdW50KVxuICAgICAgICB9O1xuICAgICAgfSwgbmV3RW1wdHlEYXRhVGhpbmcoKSlcbiAgICA7XG4gIHJldHVybiB5ZWFyQWNjO1xufVxuXG5mdW5jdGlvbiBidWlsZENvbmZpZ3NGb3JQbG90bHkoe3Jhd0RhdGEsIGF2ZXJhZ2VzfSkge1xuICBjb25zdCB0cmFuc2Zvcm1lZERhdGEgPSBvYmplY3RLZXlWYWxQYWlycyhyYXdEYXRhKS5yZWR1Y2UoYnVpbGRTZXBhcmF0ZURhdGFTZXRzLCB7fSk7XG4gIHJldHVybiBrZXlzKHJhd0RhdGEpLnJlZHVjZShcbiAgICAoZGF0YVRvQ2hhcnQsIHllYXIpID0+IHtcbiAgICAgIGNvbnN0IGNvdW50Q2hhcnRPcHRpb25zID0geyBtb2RlOiBcIm1hcmtlcnNcIiwgb3BhY2l0eTogMC4zLCBtYXJrZXI6IHsgc2l6ZTogMTUgfSB9O1xuICAgICAgY29uc3QgYXZlcmFnZXNDaGFydHNPcHRpb25zID0geyBtb2RlOiBcImxpbmVcIiB9O1xuICAgICAgZGF0YVRvQ2hhcnQuZGF0YUZvckNvbGxlY3RlZENoYXJ0LnB1c2goZXh0cmFjdERhdGEoeWVhciwgXCJyYXdDb3VudFwiLCB0cmFuc2Zvcm1lZERhdGEsIGNvdW50Q2hhcnRPcHRpb25zKSk7XG4gICAgICBkYXRhVG9DaGFydC5kYXRhRm9yN2RheUNoYXJ0LnB1c2goZXh0cmFjdERhdGEoeWVhciwgXCJhdmdEYXlzN1wiLCBhdmVyYWdlcywgYXZlcmFnZXNDaGFydHNPcHRpb25zKSk7XG4gICAgICBkYXRhVG9DaGFydC5kYXRhRm9yMjhkYXlDaGFydC5wdXNoKGV4dHJhY3REYXRhKHllYXIsIFwiYXZnRGF5czI4XCIsIGF2ZXJhZ2VzLCBhdmVyYWdlc0NoYXJ0c09wdGlvbnMpKTtcbiAgICAgIGRhdGFUb0NoYXJ0LmRhdGFGb3I4NGRheUNoYXJ0LnB1c2goZXh0cmFjdERhdGEoeWVhciwgXCJhdmdEYXlzODRcIiwgYXZlcmFnZXMsIGF2ZXJhZ2VzQ2hhcnRzT3B0aW9ucykpO1xuICAgICAgcmV0dXJuIGRhdGFUb0NoYXJ0O1xuICAgIH0sXG4gICAge2RhdGFGb3JDb2xsZWN0ZWRDaGFydDpbXSwgZGF0YUZvcjdkYXlDaGFydDpbXSwgZGF0YUZvcjI4ZGF5Q2hhcnQ6W10sIGRhdGFGb3I4NGRheUNoYXJ0OltdfVxuICApO1xufVxuXG4vKiBjb25zb2xlLmxvZyhcImh0bWwuLi5cIiwgaHRtbCk7ICovXG5cbmdsb2JhbC5zaG93Q2hhcnQgPSBmdW5jdGlvbih7Z2lzdElkLCBmaWxlbmFtZX0pIHtcbiAgaWYgKCFnbG9iYWwuUGxvdGx5KSB7XG4gICAgZGllKCk7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IHtuZXdQbG90fSA9IGdsb2JhbC5QbG90bHk7XG4gIHJldHVybiBmZXRjaEdpc3QoZ2lzdElkKVxuICAgIC50aGVuKCh7ZmlsZXMsIGh0bWxfdXJsfSkgPT4ge1xuICAgICAgLy8gVE9ETyB0aGVyZSBzaG91bGQgYmUgYSBzcGxpdCBoZXJlIGluIHRoZSBwaXBlbGluZSBvciBzb21ldGhpbmcuLi5cbiAgICAgIC8vICh0aGVyZSBhcmUgdHdvIHRoaW5ncyB0byBkbyB3aXRoIHRoZSByZXN1bHQgb2YgZmV0Y2hpbmcgdGhhdCBnaXN0KVxuICAgICAgZ2xvYmFsLmNvbnNvbGUubG9nKGh0bWwpO1xuICAgICAgaHRtbC5maW5kSWQoXCJjaGFydHNcIikuYXBwZW5kQ2hpbGQoaHRtbC5jcmVhdGVMaW5rKHt0ZXh0OiBcImRhdGEgc291cmNlXCIsIGhyZWY6IGh0bWxfdXJsfSkpO1xuICAgICAgcmV0dXJuIGZldGNoKGZpbGVzW2ZpbGVuYW1lXS5yYXdfdXJsKVxuICAgICAgICAudGhlbihjaGVja1N0YXR1cylcbiAgICAgICAgLnRoZW4oZXh0cmFjdEpzb24pO1xuICAgIH0pXG4gICAgLnRoZW4oY29uc3RydWN0RGljdClcbiAgICAudGhlbihjYWxjdWxhdGVBdmVyYWdlcykgLy8gbmVlZCB0byBjYWxjdWxhdGUgYXZlcmFnZXMgb25seSBvbmNlIGFsbCBkYXRhIGlzIGNvbGxlY3RlZFxuICAgIC50aGVuKGJ1aWxkQ29uZmlnc0ZvclBsb3RseSlcbiAgICAudGhlbigoe2RhdGFGb3JDb2xsZWN0ZWRDaGFydCwgZGF0YUZvcjdkYXlDaGFydCwgZGF0YUZvcjI4ZGF5Q2hhcnQsIGRhdGFGb3I4NGRheUNoYXJ0fSkgPT4ge1xuICAgICAgaHRtbC5yZW1vdmVOb2Rlc0luTm9kZWxpc3QoaHRtbC5maW5kSWQoXCJjaGFydHNcIikuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShcInBsYWNlaG9sZGVyXCIpKTtcbiAgICAgIGNvbnN0IHBsb3RseUNvbmZpZyA9IHtkaXNwbGF5TW9kZUJhcjogZmFsc2V9O1xuICAgICAgbmV3UGxvdChcInJhd1wiLCBkYXRhRm9yQ29sbGVjdGVkQ2hhcnQsIHBsb3RseS5sYXlvdXQoe3RpdGxlOiBcImVnZ3MgY29sbGVjdGVkIHBlciBkYXlcIn0pICwgcGxvdGx5Q29uZmlnKTtcbiAgICAgIG5ld1Bsb3QoXCIxd2tcIiwgZGF0YUZvcjdkYXlDaGFydCAgICAgLCBwbG90bHkubGF5b3V0KHt0aXRsZTogXCIxLXdlZWsgcm9sbGluZyBhdmVyYWdlXCJ9KSAsIHBsb3RseUNvbmZpZyk7XG4gICAgICBuZXdQbG90KFwiMW1vXCIsIGRhdGFGb3IyOGRheUNoYXJ0ICAgICwgcGxvdGx5LmxheW91dCh7dGl0bGU6IFwiMS1tb250aCByb2xsaW5nIGF2ZXJhZ2VcIn0pLCBwbG90bHlDb25maWcpO1xuICAgICAgbmV3UGxvdChcIjNtb1wiLCBkYXRhRm9yODRkYXlDaGFydCAgICAsIHBsb3RseS5sYXlvdXQoe3RpdGxlOiBcIjMtbW9udGggcm9sbGluZyBhdmVyYWdlXCJ9KSwgcGxvdGx5Q29uZmlnKTtcbiAgICB9KTtcbn07XG5cbi8qIGNvbnNvbGUubG9nKGdsb2JhbC5zaG93Q2hhcnQpOyAqL1xuIiwiZnVuY3Rpb24gbGF5b3V0KG9wdHMpIHtcbiAgcmV0dXJuIE9iamVjdC5hc3NpZ24oe1xuICAgIHR5cGU6IFwiZGF0ZVwiLFxuICAgIHhheGlzOiB7XG4gICAgICB0aWNrZm9ybWF0OiBcIiViICVkXCJcbiAgICB9LFxuICAgIHlheGlzOiB7XG4gICAgfVxuICB9LCBvcHRzKTtcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuICBsYXlvdXRcbn07XG4iLCJleHBvcnQgZnVuY3Rpb24gY2hlY2tTdGF0dXMocmVzcG9uc2UpIHtcbiAgaWYgKHJlc3BvbnNlLnN0YXR1cyA+PSAyMDAgJiYgcmVzcG9uc2Uuc3RhdHVzIDwgMzAwKSB7XG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9XG4gIGxldCBlcnJvciA9IG5ldyBFcnJvcihyZXNwb25zZS5zdGF0dXNUZXh0KTtcbiAgZXJyb3IucmVzcG9uc2UgPSByZXNwb25zZTtcbiAgdGhyb3cgZXJyb3I7XG59XG5cbmNvbnN0IE1TRUNfSU5fMV9TRUMgPSAxMDAwO1xuY29uc3QgU0VDX0lOXzFfTUlOID0gNjA7XG5jb25zdCBNSU5fSU5fMV9IUiA9IDYwO1xuY29uc3QgSFJfSU5fMV9EQVkgPSAyNDtcbmV4cG9ydCBmdW5jdGlvbiBkYXlEaWZmZXJlbmNlKGVhcmxpZXJEYXRlLCBsYXRlckRhdGUpIHtcbiAgLy8gcGFyYW1zIGFyZSBzdHJpbmdzIG9mIHl5eXktbW0tZGRcbiAgcmV0dXJuICggbmV3IERhdGUobGF0ZXJEYXRlLnNwbGl0KFwiLVwiKSkgLSBuZXcgRGF0ZShlYXJsaWVyRGF0ZS5zcGxpdChcIi1cIikpIClcbiAgLyBNU0VDX0lOXzFfU0VDIC8gU0VDX0lOXzFfTUlOIC8gTUlOX0lOXzFfSFIgLyBIUl9JTl8xX0RBWVxuICA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBleHRyYWN0SnNvbihyZXNwb25zZSkge1xuICByZXR1cm4gcmVzcG9uc2UuanNvbigpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24ga2V5cyhvYmopIHtcbiAgcmV0dXJuIE9iamVjdC5rZXlzKG9iaikuc29ydCgpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbGFzdChhcnJheSkge1xuICAvLyByZXR1cm4gdGhlIGxhc3QgZWxlbWVudCBpbiB0aGUgYXJyYXlcbiAgcmV0dXJuIGFycmF5LnNsaWNlKC0xKVswXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG9iamVjdEtleVZhbFBhaXJzKG9iaikge1xuICByZXR1cm4ga2V5cyhvYmopLm1hcCgoa2V5KSA9PiBba2V5LCBvYmpba2V5XV0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcGFkWmVybyh0aGluZywgbGVuZ3RoID0gMikge1xuICBsZXQgc3RyaW5nID0gdGhpbmcudG9TdHJpbmcoKTtcbiAgd2hpbGUgKHN0cmluZy5sZW5ndGggPCBsZW5ndGgpIHtcbiAgICBzdHJpbmcgPSBgMCR7c3RyaW5nfWA7XG4gIH1cbiAgcmV0dXJuIHN0cmluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNvcnRCeUZpcnN0RWxlbWVudChbYV0sIFtiXSkge1xuICBpZiAoYSA8IGIpIHtcbiAgICByZXR1cm4gLTE7XG4gIH1cbiAgaWYgKGEgPiBiKSB7XG4gICAgcmV0dXJuIDE7XG4gIH1cbiAgcmV0dXJuIDA7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdW0oc3VtLCBuKSB7XG4gIHJldHVybiBzdW0gKyBuO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gcmFuZ2Uoc3RhcnQsIGVuZCkge1xuICByZXR1cm4gcmFuZ2VFeGNsdXNpdmUoc3RhcnQsIGVuZCArIDEpO1xufVxuXG5mdW5jdGlvbiByYW5nZUV4Y2x1c2l2ZShzdGFydCwgZW5kKSB7XG4gIC8vIHN0YXJ0LWluY2x1c2l2ZSwgZW5kLW5vbmluY2x1c2l2ZSwgcGFzcyBpbnRlZ2VycyBub3Qgc3RyaW5nc1xuICAvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS8xOTUwNjIzNC8zMDM4OTZcbiAgcmV0dXJuIEFycmF5XG4gICAgLmFwcGx5KDAsIEFycmF5KGVuZCAtIHN0YXJ0KSlcbiAgICAubWFwKChlbGVtZW50LCBpbmRleCkgPT4gaW5kZXggKyBzdGFydCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiB5bWRGcm9tRGF0ZShkYXRlKSB7XG4gIHJldHVybiBbXG4gICAgZGF0ZS5nZXRZZWFyKCkgKyAxOTAwLFxuICAgIGRhdGUuZ2V0TW9udGgoKSArIDEsXG4gICAgZGF0ZS5nZXREYXRlKClcbiAgXS5qb2luKFwiLVwiKTtcbn1cbiJdfQ==
