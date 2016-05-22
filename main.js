/* global console, document, Plotly */

(function(context) {

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

  function sortByFirstElement([a], [b]) {
    if (a < b) {
      return -1;
    }
    if (b < a) {
      return 1;
    }
    return 0;
  }

  function someETL(yearAcc, [year, yearData]) {
    const transformedYearData = objectKeyValPairs(yearData)
      .sort(sortByFirstElement)
      .reduce((monthAcc, [month, monthData]) => {
        const something =
          objectKeyValPairs(monthData)
          .sort(sortByFirstElement)
          .reduce((dayAcc, [day, dayData]) => {
            const date = new Date(year, month-1, day);
            dayAcc.dateSeries.push(date);
            dayAcc.rawCount.push(dayData.count);
            dayAcc.avgDays7.push(dayData.runningAverages.days7);
            dayAcc.avgDays28.push(dayData.runningAverages.days28);
            dayAcc.avgDays84.push(dayData.runningAverages.days84);
            return dayAcc;
          }, newEmptyDataThing())
        ;
        return {
          dateSeries: monthAcc.dateSeries.concat(something.dateSeries),
          rawCount: monthAcc.rawCount.concat(something.rawCount),
          avgDays7: monthAcc.avgDays7.concat(something.avgDays7),
          avgDays28: monthAcc.avgDays28.concat(something.avgDays28),
          avgDays84: monthAcc.avgDays84.concat(something.avgDays84),
        };
      }, newEmptyDataThing())
    ;
    return {
      dateSeries: yearAcc.dateSeries.concat(transformedYearData.dateSeries),
      rawCount: yearAcc.rawCount.concat(transformedYearData.rawCount),
      avgDays7: yearAcc.avgDays7.concat(transformedYearData.avgDays7),
      avgDays28: yearAcc.avgDays28.concat(transformedYearData.avgDays28),
      avgDays84: yearAcc.avgDays84.concat(transformedYearData.avgDays84),
    };
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

  (function() {

    context.showChart = function() {
      if (!Plotly) console.error("no plotly!");
      fetch('https://gist.githubusercontent.com/alxndr/c5cb1b4ceaf938d8801b60fd241fabf9/raw/1712731e092b6e94a350abb9a52e6a9b7b550fe2/eggcount.json')
        .then(checkStatus)
        .then((response) => response.json())
        .then((data) => data.reduce(buildEntryDictionary, {}))
        .then((data) => calculateAverages(data)) // needs to be a separate pass
        .then((data) => {
          const allTheData = objectKeyValPairs(data).reduce(someETL, newEmptyDataThing());
          const {
            dateSeries,
            rawCount,
            avgDays7,
            avgDays28
          } = allTheData;
          const dataForPlotly = [
            {
              type: "scatter",
              mode: "markers",
              x: dateSeries,
              y: rawCount,
            },
            {
              type: "scatter",
              mode: "line",
              x: dateSeries,
              y: avgDays7,
            },
            {
              type: "scatter",
              mode: "line",
              x: dateSeries,
              y: avgDays28,
            },
          ];
          Plotly.newPlot("raw", dataForPlotly);
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
