"use strict";

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _gistApi = require("./gistApi");

var _gistApi2 = _interopRequireDefault(_gistApi);

var _plotly = require("./plotly");

var _plotly2 = _interopRequireDefault(_plotly);

var _html = require("./html");

var _html2 = _interopRequireDefault(_html);

var _utilities = require("./utilities");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function die() {
  console.error("Uh oh! Expected Plotly to be globally available.");
  _html2.default.insertFirst(_html2.default.findId("charts"), _html2.default.createP("Uh oh, can't find the graphing library! Try refreshing?"));
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
  var infilledData = data.sort(sortInput).reduce(function (smoothed, _ref2) {
    var date = _ref2.date;
    var count = _ref2.count;

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
  return infilledData.reduce(function (entries, _ref3) {
    var date = _ref3.date;
    var count = _ref3.count;

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

function buildConfigsForPlotly(_ref4) {
  var rawData = _ref4.rawData;
  var averages = _ref4.averages;

  return (0, _utilities.keys)(rawData).reduce(function (dataToChart, year) {
    var countChartOptions = { mode: "markers", opacity: 0.3, marker: { size: 15 } };
    var averagesChartsOptions = { mode: "line" };
    dataToChart.dataForCollectedChart.push(extractData(year, "rawCount", rawData, countChartOptions));
    dataToChart.dataFor7dayChart.push(extractData(year, "avgDays7", averages, averagesChartsOptions));
    dataToChart.dataFor28dayChart.push(extractData(year, "avgDays28", averages, averagesChartsOptions));
    dataToChart.dataFor84dayChart.push(extractData(year, "avgDays84", averages, averagesChartsOptions));
    return dataToChart;
  }, { dataForCollectedChart: [], dataFor7dayChart: [], dataFor28dayChart: [], dataFor84dayChart: [] });
}

global.showChart = function (_ref5) {
  var gistId = _ref5.gistId;
  var filename = _ref5.filename;

  if (!global.Plotly) {
    die();
    return false;
  }
  var newPlot = global.Plotly.newPlot;

  return (0, _gistApi2.default)(gistId).then(function (_ref6) {
    var files = _ref6.files;
    var html_url = _ref6.html_url;

    // TODO there should be a split here in the pipeline or something...
    // (there are two things to do with the result of fetching that gist)
    _html2.default.findId("charts").appendChild(_html2.default.createLink({ text: "data source", href: html_url }));
    return fetch(files[filename].raw_url);
  }).then(_utilities.checkStatus).then(_utilities.extractJson).then(constructDict).then(calculateAverages) // need to calculate averages only once all data is collected
  .then(buildConfigsForPlotly).then(function (_ref7) {
    var dataForCollectedChart = _ref7.dataForCollectedChart;
    var dataFor7dayChart = _ref7.dataFor7dayChart;
    var dataFor28dayChart = _ref7.dataFor28dayChart;
    var dataFor84dayChart = _ref7.dataFor84dayChart;

    _html2.default.removeNodesInNodelist(_html2.default.findId("charts").getElementsByClassName("placeholder"));
    var plotlyConfig = { displayModeBar: false };
    newPlot("raw", dataForCollectedChart, _plotly2.default.layout({ title: "eggs collected per day" }), plotlyConfig);
    newPlot("1wk", dataFor7dayChart, _plotly2.default.layout({ title: "1-week rolling average" }), plotlyConfig);
    newPlot("1mo", dataFor28dayChart, _plotly2.default.layout({ title: "1-month rolling average" }), plotlyConfig);
    newPlot("3mo", dataFor84dayChart, _plotly2.default.layout({ title: "3-month rolling average" }), plotlyConfig);
  });
};