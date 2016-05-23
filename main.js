/* global console, document, Plotly */

(function(context) {

  const DATA_URL = "https://gist.githubusercontent.com/alxndr/c5cb1b4ceaf938d8801b60fd241fabf9/raw/7bf3877cd65b6e3e9ff4e64030edd2e2abb32707/eggcount.json";

  function keys(obj) {
    return Object.keys(obj).sort();
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

  function objectKeyValPairs(obj) {
    return keys(obj).map((key) => [key, obj[key]]);
  }

  function sortByFirstElement([a], [b]) {
    if (a < b) {
      return -1;
    }
    if (b < a) {
      return 1;
    }
    return 0;
  }

  function dateOfFirstEntry(dateEntries) {
    const firstYear = keys(dateEntries)[0];
    const firstMonth = keys(dateEntries[firstYear])[0];
    const firstDay = keys(dateEntries[firstYear][firstMonth])[0];
    const d = new Date(firstYear, firstMonth-1, firstDay);
    d.setHours(1); // so other calculations of this date will be before...
    return d;
  }

  function dateOfLastEntry(dateEntries) {
    const lastYear = keys(dateEntries).slice(-1)[0];
    const lastMonth = keys(dateEntries[lastYear]).slice(-1)[0];
    const lastDay = keys(dateEntries[lastYear][lastMonth]).slice(-1)[0];
    d.setHours(1);
    return d;
  }

  let theFirstEntry;
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

    if (!theFirstEntry) {
      theFirstEntry = dateOfFirstEntry(dateEntries);
    }
    if (cutoffDate < theFirstEntry) {
      return null;
    }
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
    // TODO this should go for every day in the calendar, not starting from the days we have entries for...
    // start from theFirstEntry... to dateOfLastEntry(entryDictionary)
    for (const year in entryDictionary) {
      for (const month in entryDictionary[year]) {
        for (const day in entryDictionary[year][month]) {
          entryDictionary[year][month][day].runningAverages = {
            days7 : runningAverageOverPriorDays({year, month, day}, 7, entryDictionary),
            days28: runningAverageOverPriorDays({year, month, day}, 28, entryDictionary),
            days84: runningAverageOverPriorDays({year, month, day}, 84, entryDictionary),
          };
        }
      }
    }
    return entryDictionary;
  }

  function extractData(year, measure, data, opts) {
    const defaults = {
      name: year.toString(),
      type: "scatter",
      x: data[year].dateSeries,
      y: data[year][measure],
    };
    return Object.assign(defaults, opts);
  }

  function plotLayout(opts) {
    return Object.assign({
      type: "date",
      xaxis: {
        tickformat: "%b",
      },
      yaxis: {},
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
            years.map((year) => extractData(year, "rawCount", allTheData, { mode: "markers" })),
            plotLayout({title: "eggs collected per day"}),
            {displayModeBar: false}
          );

          Plotly.newPlot(
            "1wk",
            years.map((year) => extractData(year, "avgDays7", allTheData, { mode: "line" })),
            plotLayout({title: "1-week rolling average"}),
            {displayModeBar: false}
          );

          Plotly.newPlot(
            "1mo",
            years.map((year) => extractData(year, "avgDays28", allTheData, { mode: "line" })),
            plotLayout({title: "1-month rolling average"}),
            {displayModeBar: false}
          );

          Plotly.newPlot(
            "3mo",
            years.map((year) => extractData(year, "avgDays84", allTheData, { mode: "line" })),
            plotLayout({title: "3-month rolling average"}),
            {displayModeBar: false}
          );
        })
      ; // fetch pipeline
    };

    function objectValues(obj) {
      return keys(obj).map((key) => obj[key]);
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

    function range(start, end) {
      // http://stackoverflow.com/a/19506234/303896
      return Array
        .apply(0, Array(end - start))
        .map((element, index) => index + start);
    }

  })();
})(this);
if (document.location.hash === "#show-chart") {
  document.getElementsByClassName("chart-placeholder")[0].remove();
  this.showChart();
}
