"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _gistApi = require("./gistApi");

var _gistApi2 = _interopRequireDefault(_gistApi);

var _utilities = require("./utilities");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

function storeData(store, count, month, day) {
  // need to normalize all dates to same year,
  // so charting lib places all e.g. Jul 13s in the same X-axis position
  store.dateSeries.push(makeFakeDate(month, day));
  store.rawCount.push(count);
  return store;
}

function buildDateAndCountArrays(month, monthData) {
  return (0, _utilities.objectKeyValPairs)(monthData).sort(_utilities.sortByFirstElement).reduce(function (dayAcc, _ref2) {
    var _ref3 = _slicedToArray(_ref2, 2);

    var day = _ref3[0];
    var dayData = _ref3[1];
    return storeData(dayAcc, dayData.count, month, day);
  }, newEmptyDataThing());
}

function buildDateAndCountObject(monthAcc, _ref4) {
  var _ref5 = _slicedToArray(_ref4, 2);

  var month = _ref5[0];
  var monthData = _ref5[1];

  var _buildDateAndCountArr = buildDateAndCountArrays(month, monthData);

  var dateSeries = _buildDateAndCountArr.dateSeries;
  var rawCount = _buildDateAndCountArr.rawCount;

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
  yearAcc[year] = (0, _utilities.objectKeyValPairs)(yearData).sort(_utilities.sortByFirstElement).reduce(buildDateAndCountObject, newEmptyDataThing());
  return yearAcc;
}

function newEmptyDataThing() {
  return {
    dateSeries: [],
    rawCount: []
  };
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
  var years = (0, _utilities.keys)(transformedData);
  return years.reduce(function (acc, year) {
    acc.dataForCollectedChart.push(extractData(year, "rawCount", transformedData, { mode: "markers", opacity: 0.3, marker: { size: 15 } }));
    acc.dataFor7dayChart.push(extractData(year, "avgDays7", averages, { mode: "line" }));
    acc.dataFor28dayChart.push(extractData(year, "avgDays28", averages, { mode: "line" }));
    acc.dataFor84dayChart.push(extractData(year, "avgDays84", averages, { mode: "line" }));
    return acc;
  }, { dataForCollectedChart: [], dataFor7dayChart: [], dataFor28dayChart: [], dataFor84dayChart: [] });
}

global.showChart = function (_ref11) {
  var gistId = _ref11.gistId;
  var filename = _ref11.filename;

  if (!global.Plotly) {
    die();
    return false;
  }
  return (0, _gistApi2.default)(gistId).then(function (_ref12) {
    var files = _ref12.files;
    var html_url = _ref12.html_url;

    appendLink(html_url);
    return fetch(files[filename].raw_url);
  }).then(_utilities.checkStatus).then(_utilities.extractJson).then(constructDict).then(calculateAverages) // need to calculate averages only once all data is collected
  .then(buildConfigsForPlotly).then(function (configsForPlotly) {
    var dataForCollectedChart = configsForPlotly.dataForCollectedChart;
    var dataFor7dayChart = configsForPlotly.dataFor7dayChart;
    var dataFor28dayChart = configsForPlotly.dataFor28dayChart;
    var dataFor84dayChart = configsForPlotly.dataFor84dayChart;

    removeNodesInNodelist(document.getElementById("charts").getElementsByClassName("placeholder"));
    var plotlyConfig = { displayModeBar: false };
    global.Plotly.newPlot("raw", dataForCollectedChart, plotLayout({ title: "eggs collected per day" }), plotlyConfig);
    global.Plotly.newPlot("1wk", dataFor7dayChart, plotLayout({ title: "1-week rolling average" }), plotlyConfig);
    global.Plotly.newPlot("1mo", dataFor28dayChart, plotLayout({ title: "1-month rolling average" }), plotlyConfig);
    global.Plotly.newPlot("3mo", dataFor84dayChart, plotLayout({ title: "3-month rolling average" }), plotlyConfig);
  }); // fetch pipeline
};