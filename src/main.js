/* global Plotly */

const GIST_ID = "c5cb1b4ceaf938d8801b60fd241fabf9";
const GIST_FILENAME = "eggcount.json";

const {
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
} = require("./utilities.js");

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
  // need to normalize all dates to same year, so chart lib places all e.g. Jul 13s in the same X-axis position
  return new Date(FAKE_YEAR, month-1, day);
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
  const transformedYearData =
  objectKeyValPairs(yearData)
    .sort(sortByFirstElement)
    .reduce((monthAcc, [month, monthData]) => {
      const transformedMonthData =
      objectKeyValPairs(monthData)
        .sort(sortByFirstElement)
        .reduce((dayAcc, [day, dayData]) => {
          dayAcc.dateSeries.push(makeFakeDate(month, day)); // need to normalize all dates to same year, so chart lib places all e.g. Jul 13s in the same X-axis position
          dayAcc.rawCount.push(dayData.count);
          return dayAcc;
        }, newEmptyDataThing())
      ;
      return {
        dateSeries: monthAcc.dateSeries.concat(transformedMonthData.dateSeries),
        rawCount: monthAcc.rawCount.concat(transformedMonthData.rawCount),
      };
    }, newEmptyDataThing())
  ;
  yearAcc[year] = transformedYearData;
  return yearAcc;
}

function newEmptyDataThing() {
  return {
    dateSeries: [],
    rawCount: [],
    avgDays7: [],
    avgDays28: [],
    avgDays84: [],
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
    y: data[year][measure],
  };
  return Object.assign(defaults, opts);
}

function bindExtractData(data) {
  return function(year, metric, opts) {
    return extractData(year, metric, data, opts);
  };
}

function plotLayout(opts) {
  return Object.assign({
    type: "date",
    xaxis: {
      tickformat: "%b %d",
    },
    yaxis: {
    },
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

function ymdFromDate(date) {
  return [
    date.getYear() + 1900,
    date.getMonth() + 1,
    date.getDate()
  ].join("-");
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

global.showChart = function() {
  if (!global.Plotly) {
    die();
    return false;
  }
  return fetch(`https://api.github.com/gists/${GIST_ID}`)
    .then(checkStatus)
    .then(extractJson)
    .then(({files, html_url}) => {
      appendLink(html_url);
      return fetch(files[GIST_FILENAME].raw_url);
    })
    .then(checkStatus)
    .then(extractJson)
    .then(constructDict)
    .then((data) => calculateAverages(data)) // need to calculate averages only once all data is collected
    .then(({rawData, averages}) => {
      const transformedData = objectKeyValPairs(rawData).reduce(buildSeparateDataSets, {});
      const years = keys(transformedData);
      const boundExtractData = bindExtractData(transformedData);

      // TODO only years.map() once; map each year's data to the transformations it needs...

      const dataForCollectedChart =
      years.map((year) => boundExtractData(year, "rawCount", { mode: "markers", opacity: 0.3, marker: { size: 15 } }));

      const dataFor7dayChart =
      years.map((year) => extractData(year, "avgDays7", averages, { mode: "line" }));

      return [
        {
          domId: "raw",
          data: dataForCollectedChart,
          layout: plotLayout({title: "eggs collected per day"}),
          config: {displayModeBar: false}
        },
        {
          domId: "1wk",
          data: dataFor7dayChart,
          layout: plotLayout({title: "1-week rolling average"}),
          config: {displayModeBar: false}
        },
        {
          domId: "1mo",
          data: years.map((year) => extractData(year, "avgDays28", averages, { mode: "line" })),
          layout: plotLayout({title: "1-month rolling average"}),
          config: {displayModeBar: false}
        },
        {
          domId: "3mo",
          data: years.map((year) => extractData(year, "avgDays84", averages, { mode: "line" })),
          layout: plotLayout({title: "3-month rolling average"}),
          config: {displayModeBar: false}
        },
      ];
    })
    .then((configsForPlotly) => {
      removeNodesInNodelist(document.getElementById("charts").getElementsByClassName("placeholder"));
      configsForPlotly.map(({domId, data, layout, config}) => Plotly.newPlot(domId, data, layout, config));
    })
  ; // fetch pipeline
};
