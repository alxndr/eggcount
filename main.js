/* global console, document, Plotly */

(function(context) {

  // Object.prototype.tap = function(cb) {
  //   cb(this);
  //   return this;
  // };

  function objectValues(obj) {
    return Object.keys(obj).map((key) => obj[key]);
  }

  function objectKeyValPairs(obj) {
    return Object.keys(obj).map((key) => [key, obj[key]]);
  }

  function randomIntLessThan(max) {
    return Math.floor(max * Math.random());
  }

  function isDayWithinNDaysBefore(numDays, beforeDate) {
    let nDaysBeforeDate = new Date(beforeDate);
    nDaysBeforeDate.setDate(nDaysBeforeDate.getDate() - numDays);
    return function(dayInQuestion) {
      const dateInQuestion = new Date(dayInQuestion.date);
      const r = dateInQuestion > nDaysBeforeDate; // TODO this doesn't account for time zones so may be off by a day
      // if (randomIntLessThan(999) % 7 == 0) console.log(`is ${beforeDate} within ${numDays} of ${dayInQuestion.date}? ${r ? "yep" : "nope"}`);
      return r;
    };
  }

  function averageOfNDaysBefore(numDays, beforeAndIncludingDate, data) {
    if (!data.length) return 0;
    const sumOfNDaysBeforeDate = data
            .filter(isDayWithinNDaysBefore(numDays, beforeAndIncludingDate))
            .reduce((sum, dayData) => sum + dayData.count, 0); // TODO this does not account for gaps in data
    return sumOfNDaysBeforeDate / numDays;
  }

  function flattener(a, b) {
    return a.concat(b);
  }

  function makeDayObject(data, moreData) {
    var date = data.date;
    var count = data.count;
    const mD = Object.keys(moreData)
            .map((key) => moreData[key])
            .map((obj) => obj.days)
            .map((arrayOfEntries) => {
              return arrayOfEntries.map((entry) => {
                return {
                  date: entry.date,
                  count: entry.count,
                };
              });
            })
            .reduce(flattener, [])
            .reverse()
    ;
    const r = {
      date: date,
      count: count,
      avg7: averageOfNDaysBefore(7, date, mD),
      // avg28: averageOfNDaysBefore(28, date, mD),
      // avg84: averageOfNDaysBefore(84, date, mD)
    };
    // console.log("day object", r);
    return r;
  }

  function chartOptions(config) {
    return {
      series: config.series,
      title: { text: config.title },
      alignTicks: false,
      xAxis: {
        type: 'datetime',
        dateTimeLabelFormats: { // don't display the dummy year; it's part of data
          month: '%b',
          year: '%b',
        },
        title: { text: 'date' },
      },
      yAxis: {
        title: { text: 'number of eggs' },
        min: 0,
        endOnTick: false,
      },
      tooltip: {
        headerFormat: '<b>{series.name}</b><br>', // fake the year
        pointFormat: '{point.x:%b}: {point.y:.0f}',
      },
      plotOptions: {
        series: {
          animation: false,
        },
      },
    };
  }

  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300) {
      return response;
    }
    let error = new Error(response.statusText);
    error.response = response;
    throw error;
  }

  function runningAverageOverPriorDays({year, month, day}, numDays, dateEntries) {
    const cutoffDate = new Date(year, month, day);
    cutoffDate.setDate(referenceDate.getdate() - numDays);
    let dateInQuestion = cutoffDate;
    while (dateInQuestion < cutoffDate) {
      const dataForThatDay = dateEntries[year][month][day];
      console.log("data for that day!", dataForThatDay);
    /* const dateRange = ...;
       dateRange
       .map(extract the data for each date from dateEntries)
       .reduce(sum it up) */
    }
  }

  function buildEntryDictionary(dateEntries, {date, count}) {
    const [year, month, day] = date.split("-");
    if (!dateEntries[year]) {
      dateEntries[year] = {};
    }
    if (!dateEntries[year][month]) {
      dateEntries[year][month] = {};
    }
    dateEntries[year][month][day] = {
      count: count,
    };
    dateEntries[year][month][day].runningAverages = {
      days7: runningAverageOverPriorDays({year, month, day}, 7, dateEntries)
    };
    return dateEntries;
  }

  const keys = Object.keys.bind(Object);

  function calculateAverages(data) {
    return keys(data).map((year) => {
    });
    /* return objectKeyValPairs(data).reduce((yearsData, [year, yearData]) => {
       return objectKeyValPairs(yearData).reduce((monthsData, [month, monthData]) => {
       return objectKeyValPairs(monthData).reduce((daysData, [day, dayData]) => {
       return dayData;
       }, [])
       }, []);
       }, []); */
  }

  function thinger(acc1, [year, yearData]) {
    /* console.log("initial reducer", year); */
    const transformedYearData = objectKeyValPairs(yearData).reduce((acc2, [month, monthData]) => {
      /* console.log("inside the month processor...", month, acc2); */
      const something = objectKeyValPairs(monthData).reduce((acc3, [day, count]) => {
        /* console.log("day processor...", `${year}-${month}-${day}`, count); */
        acc3.countSeries.push(count);
        acc3.dateSeries.push(new Date(year, month-1, day));
        return acc3;
      }, {dateSeries: [], countSeries: []});
      /* console.log("parted out", something); */
      return {
        countSeries: acc2.countSeries.concat(something.countSeries),
        dateSeries: acc2.dateSeries.concat(something.dateSeries),
      };
    }, {dateSeries: [], countSeries: []});
    /* console.log(transformedYearData); */
    return {
      countSeries: acc1.countSeries.concat(transformedYearData.countSeries),
      dateSeries: acc1.dateSeries.concat(transformedYearData.dateSeries),
    }
  }
  function convertData(data) {
    const {dateSeries, countSeries} = objectKeyValPairs(data).reduce(thinger, {dateSeries: [], countSeries: []});
    return [{
      type: "scatter",
      mode: "markers",
      x: dateSeries,
      y: countSeries
    }];
  }

  (function() {

    context.showChart = function() {
      if (!Plotly) console.error("no plotly!");
      fetch('https://gist.githubusercontent.com/alxndr/c5cb1b4ceaf938d8801b60fd241fabf9/raw/1712731e092b6e94a350abb9a52e6a9b7b550fe2/eggcount.json')
        .then(checkStatus)
        .then((response) => response.json())
        .then((data) => data.reduce(buildEntryDictionary, {})) // maybe this is a bad idea
        .then((entryDictionary) => console.debug(entryDictionary) || entryDictionary)
        .then((data) => calculateAverages(data))
        .then((data) => {
          const dataForPlotly = convertData(data);
          console.log("ready??", dataForPlotly);
          Plotly.newPlot("raw", dataForPlotly);
        })
      ; // fetch pipeline
    };

  })();
})(this);
if (document.location.hash === "#show-chart") {
  /* console.info("auto-showing chart"); */
  document.getElementsByClassName("chart-placeholder")[0].remove();
  this.showChart();
}
