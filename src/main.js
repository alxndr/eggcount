import { fetchFileInGist } from "./gistApi"
import plotly from "./helpers/plotly";
import * as html from "./helpers/html";
import * as arrays from "./helpers/arrays";
import * as objects from "./helpers/objects";
import * as strings from "./helpers/strings";
import * as dates from "./helpers/dates";

function die() {
  console.error("Uh oh! Expected Plotly to be globally available.");
  html.insertFirst(
    html.findId("charts"),
    html.createP("Uh oh, can't find the graphing library! Try refreshing?")
  );
}

function dateOfFirstEntry(dateEntries) {
  const firstYear = objects.keys(dateEntries)[0];
  const firstMonth = objects.keys(dateEntries[firstYear])[0];
  const firstDay = objects.keys(dateEntries[firstYear][firstMonth])[0];
  const d = new Date(firstYear, firstMonth-1, firstDay);
  d.setHours(1); // so other calculations of this date will be before...
  return d;
}

let theFirstEntry; // this is "global"
function runningAverageOverPriorDays(
  { year: startingYear,
    month: startingMonth,
    day: startingDay },
  numDays,
  dateEntries
) {
  const monthZeroIndexed = startingMonth - 1;
  const referenceDate = new Date(startingYear, monthZeroIndexed, startingDay);
  const cutoffDate = new Date(startingYear, monthZeroIndexed, startingDay);
  cutoffDate.setDate(cutoffDate.getDate() - numDays);

  if (!theFirstEntry) { // this is "global"
    theFirstEntry = dateOfFirstEntry(dateEntries);
  }
  if (cutoffDate < theFirstEntry) {
    return null;
  }
  let dateInQuestion = cutoffDate;
  let dataToAverage = [];
  while (dateInQuestion <= referenceDate) {
    const year = (dateInQuestion.getYear() + 1900).toString();
    const month = strings.padZero(dateInQuestion.getMonth() + 1);
    const day = strings.padZero(dateInQuestion.getDate());
    if (dateEntries[year] && dateEntries[year][month]) {
      const dayData = dateEntries[year][month][day];
      if (dayData) {
        dataToAverage.push(dayData.count);
      }
    }
    dateInQuestion.setDate(dateInQuestion.getDate() + 1);
  }

  if (dataToAverage.length === 0) {
    return null;
  }
  return dataToAverage.reduce((sum, n) => sum + n) / numDays;
}

function recordStuff(data, count, month, day) {
  // need to normalize all dates to same year,
  // so charting lib places all e.g. Jul 13s in the same X-axis position
  data.dateSeries.push(dates.makeFakeDate(month, day));
  data.rawCount.push(count);
  return data;
}

function emptyCounts() {
  return {
    dateSeries: [],
    rawCount: []
  };
}

function buildDateAndCountObjects(monthAcc, [month, monthData]) {
  const {dateSeries, rawCount} =
    objects.objectKeyValPairs(monthData)
      .sort(arrays.sortByFirstElement)
      .reduce(
        (dayAcc, [day, dayData]) => recordStuff(dayAcc, dayData.count, month, day),
        emptyCounts()
      );
  return {
    dateSeries: monthAcc.dateSeries.concat(dateSeries),
    rawCount: monthAcc.rawCount.concat(rawCount)
  };
}

function buildSeparateDataSets(yearAcc, [year, yearData]) {
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
  yearAcc[year] =
    objects.objectKeyValPairs(yearData)
      .sort(arrays.sortByFirstElement)
      .reduce(buildDateAndCountObjects, emptyCounts());
  return yearAcc;
}

function calculateAverages(entryDictionary) {
  const years = objects.keys(entryDictionary);
  let averages = {};

  // iterates through all days between first and last data points, and
  // calculates a bunch of numbers, and
  // mutates the `averages` object, filling it up with the numbers.
  arrays.range(parseInt(years[0]), parseInt(years.slice(-1)[0])).map((yearInt) => {
    const year = yearInt.toString();
    if (!entryDictionary[year]) {
      return;
    }
    averages[year] = {};
    averages[year].dateSeries = [];
    averages[year].avgDays7 = [];
    averages[year].avgDays28 = [];
    averages[year].avgDays84 = [];
    arrays.range(1, 12).map((monthInt) => {
      const month = strings.padZero(monthInt); // entry dictionary has zero-padded string as keys
      if (!entryDictionary[year][month]) {
        return;
      }
      arrays.range(1, 31).map((dayInt) => {
        const date = new Date(yearInt, monthInt - 1, dayInt);
        if (date.getDate() !== dayInt) {
          return; // we auto-generated an invalid date, e.g. feb 31st
        }
        // TODO return if we're past the last date or before the first date
        const day = strings.padZero(dayInt); // entry dictionary has zero-padded string as keys
        if (!averages[year][month]) {
          averages[year][month] = {};
        }
        const days7 = runningAverageOverPriorDays({year, month, day}, 7, entryDictionary);
        if (days7 !== null) {
          const days28 = runningAverageOverPriorDays({year, month, day}, 28, entryDictionary);
          const days84 = runningAverageOverPriorDays({year, month, day}, 84, entryDictionary);
          const fakeDate = dates.makeFakeDate(month, day);
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
  const defaults = {
    name: year.toString(),
    type: "scatter",
    x: data[year].dateSeries,
    y: data[year][measure]
  };
  return Object.assign(defaults, opts);
}

function sortInput(a, b) {
  const aDate = new Date(a.date.split("-"));
  const bDate = new Date(b.date.split("-"));
  if (aDate < bDate) {
    return -1;
  }
  return 1;
}

function constructDict(data) {
  const infilledData = data.sort(sortInput).reduce(function(smoothed, {date, count}) {
    if (!smoothed.length) { // the first measurement. no need to process any further.
      smoothed.push({date, count});
      return smoothed;
    }
    const lastMeasurement = arrays.last(smoothed);
    const difference = dates.dayDifference(lastMeasurement.date, date);
    if (difference <= 1) {
      smoothed.push({date, count});
    } else {
      const lastMeasurementDate = new Date(lastMeasurement.date.split("-"));
      const dailyAverage = count / difference;
      for (let i = 1; i < difference; i++) {
        const missingDate = new Date(lastMeasurementDate);
        missingDate.setDate(lastMeasurementDate.getDate() + i);
        smoothed.push({date: dates.ymdFromDate(missingDate), count: dailyAverage});
      }
      smoothed.push({date, count: dailyAverage});
    }
    return smoothed;
  }, []);
  return infilledData.reduce(function(entries, {date, count}) {
    const [year, month, day] = date.split("-");
    if (!entries[year]) {
      entries[year] = {};
    }
    if (!entries[year][month]) {
      entries[year][month] = {};
    }
    entries[year][month][day] = {count: count};
    return entries;
  }, {});
}

function buildConfigsForPlotly({rawData, averages}) {
  const transformedData = objects.objectKeyValPairs(rawData).reduce(buildSeparateDataSets, {});
  return objects.keys(rawData).reduce(
    (dataToChart, year) => {
      const countChartOptions = { mode: "markers", opacity: 0.3, marker: { size: 15 } };
      const averagesChartsOptions = { mode: "line" };
      dataToChart.dataForCollectedChart.push(extractData(year, "rawCount", transformedData, countChartOptions));
      dataToChart.dataFor7dayChart.push(extractData(year, "avgDays7", averages, averagesChartsOptions));
      dataToChart.dataFor28dayChart.push(extractData(year, "avgDays28", averages, averagesChartsOptions));
      dataToChart.dataFor84dayChart.push(extractData(year, "avgDays84", averages, averagesChartsOptions));
      return dataToChart;
    },
    {dataForCollectedChart:[], dataFor7dayChart:[], dataFor28dayChart:[], dataFor84dayChart:[]}
  );
}

global.showChart = function({gistId, filename}) {
  if (!global.Plotly) {
    die();
    return false;
  }
  const {newPlot} = global.Plotly;
  fetchFileInGist(filename, gistId)
    .then(({fileUrl, data}) => {
      html.findId("charts").appendChild(html.createLink({text: "data source", href: fileUrl}));
      return data;
    })
    .then(constructDict)
    .then(calculateAverages) // need to calculate averages only once all data is collected
    .then(buildConfigsForPlotly)
    .then(({dataForCollectedChart, dataFor7dayChart, dataFor28dayChart, dataFor84dayChart}) => {
      html.removeNodesInNodelist(html.findId("charts").getElementsByClassName("placeholder"));
      const plotlyConfig = {displayModeBar: false};
      newPlot("raw", dataForCollectedChart, plotly.layout({title: "eggs collected per day"}) , plotlyConfig);
      newPlot("1wk", dataFor7dayChart     , plotly.layout({title: "1-week rolling average"}) , plotlyConfig);
      newPlot("1mo", dataFor28dayChart    , plotly.layout({title: "1-month rolling average"}), plotlyConfig);
      newPlot("3mo", dataFor84dayChart    , plotly.layout({title: "3-month rolling average"}), plotlyConfig);
    });
};
