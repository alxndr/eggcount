import fetchGist from "./gistApi"
import {
  checkStatus,
  dayDifference,
  extractJson,
  keys,
  last,
  objectKeyValPairs,
  padZero,
  range,
  sortByFirstElement,
  sum,
  ymdFromDate
} from "./utilities";

function dateOfFirstEntry(dateEntries) {
  const firstYear = keys(dateEntries)[0];
  const firstMonth = keys(dateEntries[firstYear])[0];
  const firstDay = keys(dateEntries[firstYear][firstMonth])[0];
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
    const month = padZero(dateInQuestion.getMonth() + 1);
    const day = padZero(dateInQuestion.getDate());
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
  return dataToAverage.reduce(sum) / numDays;
}

const FAKE_YEAR = 1970;
function makeFakeDate(month, day) {
  return new Date(FAKE_YEAR, month-1, day);
}

function storeData(store, count, month, day) {
  // need to normalize all dates to same year,
  // so charting lib places all e.g. Jul 13s in the same X-axis position
  store.dateSeries.push(makeFakeDate(month, day));
  store.rawCount.push(count);
  return store;
}

function buildDateAndCountArrays(month, monthData) {
  return objectKeyValPairs(monthData)
    .sort(sortByFirstElement)
    .reduce(
      (dayAcc, [day, dayData]) => storeData(dayAcc, dayData.count, month, day),
      newEmptyDataThing()
    );
}

function buildDateAndCountObject(monthAcc, [month, monthData]) {
  const {dateSeries, rawCount} = buildDateAndCountArrays(month, monthData);
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
    objectKeyValPairs(yearData)
      .sort(sortByFirstElement)
      .reduce(buildDateAndCountObject, newEmptyDataThing());
  return yearAcc;
}

function newEmptyDataThing() {
  return {
    dateSeries: [],
    rawCount: []
  };
}

function calculateAverages(entryDictionary) {
  const years = keys(entryDictionary);
  let averages = {};

  // iterates through all days between first and last data points, and
  // calculates a bunch of numbers, and
  // mutates the `averages` object, filling it up with the numbers.
  range(parseInt(years[0]), parseInt(years.slice(-1)[0])).map((yearInt) => {
    const year = yearInt.toString();
    if (!entryDictionary[year]) {
      return;
    }
    averages[year] = {};
    averages[year].dateSeries = [];
    averages[year].avgDays7 = [];
    averages[year].avgDays28 = [];
    averages[year].avgDays84 = [];
    range(1, 12).map((monthInt) => {
      const month = padZero(monthInt); // entry dictionary has zero-padded string as keys
      if (!entryDictionary[year][month]) {
        return;
      }
      range(1, 31).map((dayInt) => {
        const date = new Date(yearInt, monthInt - 1, dayInt);
        if (date.getDate() !== dayInt) {
          return; // we auto-generated an invalid date, e.g. feb 31st
        }
        // TODO return if we're past the last date or before the first date
        const day = padZero(dayInt); // entry dictionary has zero-padded string as keys
        if (!averages[year][month]) {
          averages[year][month] = {};
        }
        const days7 = runningAverageOverPriorDays({year, month, day}, 7, entryDictionary);
        if (days7 !== null) {
          const days28 = runningAverageOverPriorDays({year, month, day}, 28, entryDictionary);
          const days84 = runningAverageOverPriorDays({year, month, day}, 84, entryDictionary);
          const fakeDate = makeFakeDate(month, day);
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

function plotLayout(opts) {
  return Object.assign({
    type: "date",
    xaxis: {
      tickformat: "%b %d"
    },
    yaxis: {
    }
  }, opts);
}

function die() {
  console.error("Uh oh! Expected Plotly to be globally available.");
  const p = document.createElement("p"); // this is what JSX is for...
  p.appendChild(document.createTextNode("Uh oh, can't find the graphing library! Try refreshing?"));
  const charts = document.getElementById("charts");
  const firstChart = charts.firstChild;
  charts.insertBefore(p, firstChart);
}

function removeNodesInNodelist(nodelist) {
  let node;
  while (node = nodelist[nodelist.length - 1]) { // need to recalculate placeholdersNodelist.length on each iteration
    node.remove();
  }
}

function appendLink(url) {
  const charts = document.getElementById("charts");
  const link = document.createElement("a");
  link.appendChild(document.createTextNode("data source"));
  link.href = url;
  charts.appendChild(link);
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
    const lastMeasurement = last(smoothed);
    const difference = dayDifference(lastMeasurement.date, date);
    if (difference <= 1) {
      smoothed.push({date, count});
    } else {
      const lastMeasurementDate = new Date(lastMeasurement.date.split("-"));
      const dailyAverage = count / difference;
      for (let i = 1; i < difference; i++) {
        const missingDate = new Date(lastMeasurementDate);
        missingDate.setDate(lastMeasurementDate.getDate() + i);
        smoothed.push({date: ymdFromDate(missingDate), count: dailyAverage});
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
  const transformedData = objectKeyValPairs(rawData).reduce(buildSeparateDataSets, {});
  const years = keys(transformedData);
  return years.reduce(
    (acc, year) => {
      acc.dataForCollectedChart.push(extractData(year, "rawCount", transformedData, { mode: "markers", opacity: 0.3, marker: { size: 15 } }));
      acc.dataFor7dayChart.push(extractData(year, "avgDays7", averages, { mode: "line" }));
      acc.dataFor28dayChart.push(extractData(year, "avgDays28", averages, { mode: "line" }));
      acc.dataFor84dayChart.push(extractData(year, "avgDays84", averages, { mode: "line" }));
      return acc;
    },
    {dataForCollectedChart:[], dataFor7dayChart:[], dataFor28dayChart:[], dataFor84dayChart:[]}
  );
}

global.showChart = function({gistId, filename}) {
  if (!global.Plotly) {
    die();
    return false;
  }
  return fetchGist(gistId)
    .then(({files, html_url}) => {
      appendLink(html_url);
      return fetch(files[filename].raw_url);
    })
    .then(checkStatus)
    .then(extractJson)
    .then(constructDict)
    .then(calculateAverages) // need to calculate averages only once all data is collected
    .then(buildConfigsForPlotly)
    .then((configsForPlotly) => {
      const {dataForCollectedChart, dataFor7dayChart, dataFor28dayChart, dataFor84dayChart} = configsForPlotly;
      removeNodesInNodelist(document.getElementById("charts").getElementsByClassName("placeholder"));
      const plotlyConfig = {displayModeBar: false};
      global.Plotly.newPlot("raw", dataForCollectedChart, plotLayout({title: "eggs collected per day"}) , plotlyConfig);
      global.Plotly.newPlot("1wk", dataFor7dayChart     , plotLayout({title: "1-week rolling average"}) , plotlyConfig);
      global.Plotly.newPlot("1mo", dataFor28dayChart    , plotLayout({title: "1-month rolling average"}), plotlyConfig);
      global.Plotly.newPlot("3mo", dataFor84dayChart    , plotLayout({title: "3-month rolling average"}), plotlyConfig);
    })
  ; // fetch pipeline
};
