/* global console, document, Plotly */

(function(context) {

  const DATA_URL = "https://gist.githubusercontent.com/alxndr/c5cb1b4ceaf938d8801b60fd241fabf9/raw/7bf3877cd65b6e3e9ff4e64030edd2e2abb32707/eggcount.json";

  function runningAverageOverPriorDays({year: startingYear, month: startingMonth, day: startingDay}, numDays, dateEntries) {
    const referenceDate = new Date(startingYear, startingMonth-1, startingDay);
    const cutoffDate = new Date(startingYear, startingMonth-1, startingDay);
    cutoffDate.setDate(cutoffDate.getDate() - numDays);
    let dateInQuestion = cutoffDate;
    let dataToAverage = [];
    while (dateInQuestion <= referenceDate) {
      const year = (dateInQuestion.getYear() + 1900).toString();
      const month = padZero((dateInQuestion.getMonth() + 1).toString());
      const day = padZero((dateInQuestion.getDate()).toString());
      if (dateEntries[year] && dateEntries[year][month]) {
        const dayData = dateEntries[year][month][day];
        if (dayData) {
          dataToAverage.push(dayData.count);
        }
      }
      dateInQuestion.setDate(dateInQuestion.getDate() + 1);
    }
    return dataToAverage.reduce(sum) / numDays;
  }

  function buildEntryDictionary(entries, {date, count}) {
    const [year, month, day] = date.split("-");
    if (!entries[year]) {
      entries[year] = {};
    }
    if (!entries[year][month]) {
      entries[year][month] = {};
    }
    entries[year][month][day] = {
      count: count,
    };
    return entries;
  }

  const FAKE_YEAR = 1970;

  function someETL(yearAcc, [year, yearData]) {
    const transformedYearData =
      objectKeyValPairs(yearData)
      .sort(sortByFirstElement)
      .reduce((monthAcc, [month, monthData]) => {
        const transformedMonthData =
          objectKeyValPairs(monthData)
          .sort(sortByFirstElement)
          .reduce((dayAcc, [day, dayData]) => {
            const date = new Date(FAKE_YEAR, month-1, day);
            dayAcc.dateSeries.push(date);
            dayAcc.rawCount.push(dayData.count);
            dayAcc.avgDays7.push(dayData.runningAverages.days7);
            dayAcc.avgDays28.push(dayData.runningAverages.days28);
            dayAcc.avgDays84.push(dayData.runningAverages.days84);
            return dayAcc;
          }, newEmptyDataThing())
        ;
        return {
          dateSeries: monthAcc.dateSeries.concat(transformedMonthData.dateSeries),
          rawCount: monthAcc.rawCount.concat(transformedMonthData.rawCount),
          avgDays7: monthAcc.avgDays7.concat(transformedMonthData.avgDays7),
          avgDays28: monthAcc.avgDays28.concat(transformedMonthData.avgDays28),
          avgDays84: monthAcc.avgDays84.concat(transformedMonthData.avgDays84),
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
    for (const year in entryDictionary) {
      for (const month in entryDictionary[year]) {
        for (const day in entryDictionary[year][month]) {
          entryDictionary[year][month][day].runningAverages = {
            days7:  runningAverageOverPriorDays({year, month, day}, 7, entryDictionary),
            days28: runningAverageOverPriorDays({year, month, day}, 28, entryDictionary),
            days84: runningAverageOverPriorDays({year, month, day}, 84, entryDictionary),
          };
        }
      }
    }
    return entryDictionary;
  }

  function extract(year, measure, mode, data) {
    return {
      name: year.toString(),
      type: "scatter",
      mode: mode,
      x: data[year].dateSeries,
      y: data[year][measure],
    };
  }

  function plotLayout(opts) {
    return Object.assign({
      type: "date",
      xaxis: {},
      yaxis: {},
      // zerolinewidth: 0,
    }, opts);
  }

  (function() {

    context.showChart = function() {
      if (!Plotly) {
        console.error("no plotly!");
        throw new Error("missing Plotly");
      }
      fetch(DATA_URL)
        .then(checkStatus)
        .then((response) => response.json())
        .then((data) => {
          const charts = document.getElementById("charts");
          const link = document.createElement("a");
          link.appendChild(document.createTextNode("data source"));
          link.href = DATA_URL;
          charts.appendChild(link);
          return data;
        })
        .then((data) => data.reduce(buildEntryDictionary, {}))
        .then((data) => calculateAverages(data)) // needs to be a separate pass
        .then((data) => {
          const allTheData = objectKeyValPairs(data).reduce(someETL, {});
          const years = keys(allTheData);

          Plotly.newPlot(
            "raw",
            years.map((year) => extract(year, "rawCount", "markers", allTheData)),
            plotLayout({title: "eggs collected per day"}),
            {displayModeBar: false}
          );

          Plotly.newPlot(
            "1wk",
            years.map((year) => extract(year, "avgDays7", "line", allTheData)),
            plotLayout({title: "1-week rolling average"}),
            {displayModeBar: false}
          );

          Plotly.newPlot(
            "1mo",
            years.map((year) => extract(year, "avgDays28", "line", allTheData)),
            plotLayout({title: "1-month rolling average"}),
            {displayModeBar: false}
          );

          Plotly.newPlot(
            "3mo",
            years.map((year) => extract(year, "avgDays84", "line", allTheData)),
            plotLayout({title: "3-month rolling average"}),
            {displayModeBar: false}
          );
        })
      ; // fetch pipeline
    };

  })();
})(this);
if (document.location.hash === "#show-chart") {
  document.getElementsByClassName("chart-placeholder")[0].remove();
  this.showChart();
}

function objectValues(obj) {
  return Object.keys(obj).map((key) => obj[key]);
}

function objectKeyValPairs(obj) {
  return Object.keys(obj).map((key) => [key, obj[key]]);
}

function randomIntLessThan(max) {
  return Math.floor(max * Math.random());
}

function flattener(a, b) {
  return a.concat(b);
}

function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  let error = new Error(response.statusText);
  error.response = response;
  throw error;
}

function padZero(string, length = 2) {
  while (string.length < length) {
    string = `0${string}`;
  }
  return string;
}

function sum(sum, n) {
  return sum + n;
}

const keys = Object.keys.bind(Object);

function sortByFirstElement([a], [b]) {
  if (a < b) {
    return -1;
  }
  if (b < a) {
    return 1;
  }
  return 0;
}
