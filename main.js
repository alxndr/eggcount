/* global console, document, Plotly */

(function(context) {

  const GIST_ID = "c5cb1b4ceaf938d8801b60fd241fabf9";
  const GIST_FILENAME = "eggcount.json";

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

  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response;
    }
    let error = new Error(response.statusText);
    error.response = response;
    throw error;
  }

  function extractJson(response) {
    return response.json();
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

  (function() {

    context.showChart = function() {
      if (!window.Plotly) {
        die();
        return false;
      }
      fetch(`https://api.github.com/gists/${GIST_ID}`)
        .then(checkStatus)
        .then(extractJson)
        .then(({files, html_url}) => {
          appendLink(html_url);
          return fetch(files[GIST_FILENAME].raw_url);
        })
        .then(checkStatus)
        .then(extractJson)
        .then((data) => data.reduce(buildEntryDictionary, {}))
        .then((data) => calculateAverages(data)) // needs to be a separate pass
        .then((data) => {
          const allTheData = objectKeyValPairs(data).reduce(someETL, {});
          const years = keys(allTheData);

          const boundExtractData = bindExtractData(allTheData);

          removeNodesInNodelist(document.getElementById("charts").getElementsByClassName("placeholder"));

          Plotly.newPlot(
            "raw",
            years.map((year) => boundExtractData(year, "rawCount", { mode: "markers", opacity: 0.3, marker: { size: 15 } })),
            plotLayout({title: "eggs collected per day"}),
            {displayModeBar: false}
          );

          Plotly.newPlot(
            "1wk",
            years.map((year) => boundExtractData(year, "avgDays7", { mode: "line" })),
            plotLayout({title: "1-week rolling average"}),
            {displayModeBar: false}
          );

          Plotly.newPlot(
            "1mo",
            years.map((year) => boundExtractData(year, "avgDays28", { mode: "line" })),
            plotLayout({title: "1-month rolling average"}),
            {displayModeBar: false}
          );

          Plotly.newPlot(
            "3mo",
            years.map((year) => boundExtractData(year, "avgDays84", { mode: "line" })),
            plotLayout({title: "3-month rolling average"}),
            {displayModeBar: false}
          );
        })
      ; // fetch pipeline
    };

    function _dateOfLastEntry(dateEntries) {
      const lastYear = keys(dateEntries).slice(-1)[0];
      const lastMonth = keys(dateEntries[lastYear]).slice(-1)[0];
      const lastDay = keys(dateEntries[lastYear][lastMonth]).slice(-1)[0];
      const d = new Date(lastYear, lastMonth-1, lastDay);
      d.setHours(1);
      return d;
    }

    function _objectValues(obj) {
      return keys(obj).map((key) => obj[key]);
    }

    function _randomIntLessThan(max) {
      return Math.floor(max * Math.random());
    }

    function _flattener(a, b) {
      return a.concat(b);
    }

    function _range(start, end) {
      // http://stackoverflow.com/a/19506234/303896
      return Array
        .apply(0, Array(end - start))
        .map((element, index) => index + start);
    }

  })();
})(this);
this.showChart();
