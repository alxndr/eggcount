"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/* global console, document, Plotly */

var GIST_ID = "c5cb1b4ceaf938d8801b60fd241fabf9";
var GIST_FILENAME = "eggcount.json";

var _require = require("./utilities.js");

var checkStatus = _require.checkStatus;
var dayDifference = _require.dayDifference;
var extractJson = _require.extractJson;
var keys = _require.keys;
var last = _require.last;
var objectKeyValPairs = _require.objectKeyValPairs;
var padZero = _require.padZero;
var range = _require.range;
var sortByFirstElement = _require.sortByFirstElement;
var sum = _require.sum;


function dateOfFirstEntry(dateEntries) {
  var firstYear = keys(dateEntries)[0];
  var firstMonth = keys(dateEntries[firstYear])[0];
  var firstDay = keys(dateEntries[firstYear][firstMonth])[0];
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
    var month = padZero(dateInQuestion.getMonth() + 1);
    var day = padZero(dateInQuestion.getDate());
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
  return dataToAverage.reduce(sum) / numDays;
}

var FAKE_YEAR = 1970;

function makeFakeDate(month, day) {
  // need to normalize all dates to same year, so chart lib places all e.g. Jul 13s in the same X-axis position
  return new Date(FAKE_YEAR, month - 1, day);
}

function buildSeparateDataSets(yearAcc, _ref2) {
  var _ref3 = _slicedToArray(_ref2, 2);

  var year = _ref3[0];
  var yearData = _ref3[1];

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
  var transformedYearData = objectKeyValPairs(yearData).sort(sortByFirstElement).reduce(function (monthAcc, _ref4) {
    var _ref5 = _slicedToArray(_ref4, 2);

    var month = _ref5[0];
    var monthData = _ref5[1];

    var transformedMonthData = objectKeyValPairs(monthData).sort(sortByFirstElement).reduce(function (dayAcc, _ref6) {
      var _ref7 = _slicedToArray(_ref6, 2);

      var day = _ref7[0];
      var dayData = _ref7[1];

      dayAcc.dateSeries.push(makeFakeDate(month, day)); // need to normalize all dates to same year, so chart lib places all e.g. Jul 13s in the same X-axis position
      dayAcc.rawCount.push(dayData.count);
      return dayAcc;
    }, newEmptyDataThing());
    return {
      dateSeries: monthAcc.dateSeries.concat(transformedMonthData.dateSeries),
      rawCount: monthAcc.rawCount.concat(transformedMonthData.rawCount)
    };
  }, newEmptyDataThing());
  yearAcc[year] = transformedYearData;
  return yearAcc;
}

function newEmptyDataThing() {
  return {
    dateSeries: [],
    rawCount: [],
    avgDays7: [],
    avgDays28: [],
    avgDays84: []
  };
}

function calculateAverages(entryDictionary) {
  var years = keys(entryDictionary);
  var averages = {};

  // iterates through all days between first and last data points, and
  // calculates a bunch of numbers, and
  // mutates the `averages` object, filling it up with the numbers.
  range(parseInt(years[0]), parseInt(years.slice(-1)[0])).map(function (yearInt) {
    var year = yearInt.toString();
    if (!entryDictionary[year]) {
      return;
    }
    averages[year] = {};
    averages[year].dateSeries = [];
    averages[year].avgDays7 = [];
    averages[year].avgDays28 = [];
    averages[year].avgDays84 = [];
    range(1, 12).map(function (monthInt) {
      var month = padZero(monthInt); // entry dictionary has zero-padded string as keys
      if (!entryDictionary[year][month]) {
        return;
      }
      range(1, 31).map(function (dayInt) {
        var date = new Date(yearInt, monthInt - 1, dayInt);
        if (date.getDate() !== dayInt) {
          return; // we auto-generated an invalid date, e.g. feb 31st
        }
        // TODO return if we're past the last date or before the first date
        var day = padZero(dayInt); // entry dictionary has zero-padded string as keys
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

function bindExtractData(data) {
  return function (year, metric, opts) {
    return extractData(year, metric, data, opts);
  };
}

function plotLayout(opts) {
  return Object.assign({
    type: "date",
    xaxis: {
      tickformat: "%b %d"
    },
    yaxis: {}
  }, opts);
}

function die() {
  console.error("Uh oh! Expected Plotly to be globally available.");
  var p = document.createElement("p"); // this is what JSX is for...
  p.appendChild(document.createTextNode("Uh oh, can't find the graphing library! Try refreshing?"));
  var charts = document.getElementById("charts");
  var firstChart = charts.firstChild;
  charts.insertBefore(p, firstChart);
}

function removeNodesInNodelist(nodelist) {
  var node = void 0;
  while (node = nodelist[nodelist.length - 1]) {
    // need to recalculate placeholdersNodelist.length on each iteration
    node.remove();
  }
}

function appendLink(url) {
  var charts = document.getElementById("charts");
  var link = document.createElement("a");
  link.appendChild(document.createTextNode("data source"));
  link.href = url;
  charts.appendChild(link);
}

function sortInput(a, b) {
  var aDate = new Date(a.date.split("-"));
  var bDate = new Date(b.date.split("-"));
  if (aDate < bDate) {
    return -1;
  }
  return 1;
}

function ymdFromDate(date) {
  return [date.getYear() + 1900, date.getMonth() + 1, date.getDate()].join("-");
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
    var lastMeasurement = last(smoothed);
    var difference = dayDifference(lastMeasurement.date, date);
    if (difference <= 1) {
      smoothed.push({ date: date, count: count });
    } else {
      var lastMeasurementDate = new Date(lastMeasurement.date.split("-"));
      var dailyAverage = count / difference;
      for (var i = 1; i < difference; i++) {
        var missingDate = new Date(lastMeasurementDate);
        missingDate.setDate(lastMeasurementDate.getDate() + i);
        smoothed.push({ date: ymdFromDate(missingDate), count: dailyAverage });
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

global.showChart = function () {
  if (!global.Plotly) {
    die();
    return false;
  }
  return fetch("https://api.github.com/gists/" + GIST_ID).then(checkStatus).then(extractJson).then(function (_ref10) {
    var files = _ref10.files;
    var html_url = _ref10.html_url;

    appendLink(html_url);
    return fetch(files[GIST_FILENAME].raw_url);
  }).then(checkStatus).then(extractJson).then(constructDict).then(function (data) {
    return calculateAverages(data);
  }) // need to calculate averages only once all data is collected
  .then(function (_ref11) {
    var rawData = _ref11.rawData;
    var averages = _ref11.averages;

    var transformedData = objectKeyValPairs(rawData).reduce(buildSeparateDataSets, {});
    var years = keys(transformedData);
    var boundExtractData = bindExtractData(transformedData);

    // TODO only years.map() once; map each year's data to the transformations it needs...

    var dataForCollectedChart = years.map(function (year) {
      return boundExtractData(year, "rawCount", { mode: "markers", opacity: 0.3, marker: { size: 15 } });
    });

    var dataFor7dayChart = years.map(function (year) {
      return extractData(year, "avgDays7", averages, { mode: "line" });
    });

    return [{
      domId: "raw",
      data: dataForCollectedChart,
      layout: plotLayout({ title: "eggs collected per day" }),
      config: { displayModeBar: false }
    }, {
      domId: "1wk",
      data: dataFor7dayChart,
      layout: plotLayout({ title: "1-week rolling average" }),
      config: { displayModeBar: false }
    }, {
      domId: "1mo",
      data: years.map(function (year) {
        return extractData(year, "avgDays28", averages, { mode: "line" });
      }),
      layout: plotLayout({ title: "1-month rolling average" }),
      config: { displayModeBar: false }
    }, {
      domId: "3mo",
      data: years.map(function (year) {
        return extractData(year, "avgDays84", averages, { mode: "line" });
      }),
      layout: plotLayout({ title: "3-month rolling average" }),
      config: { displayModeBar: false }
    }];
  }).then(function (configsForPlotly) {
    removeNodesInNodelist(document.getElementById("charts").getElementsByClassName("placeholder"));
    configsForPlotly.map(function (_ref12) {
      var domId = _ref12.domId;
      var data = _ref12.data;
      var layout = _ref12.layout;
      var config = _ref12.config;
      return Plotly.newPlot(domId, data, layout, config);
    });
  }); // fetch pipeline
};