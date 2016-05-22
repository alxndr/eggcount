/* global console, document, Highcharts */

// Object.prototype.tap = function(cb) {
//   cb(this);
//   return this;
// };

function randomIntLessThan(max) {
  return Math.floor(max * Math.random());
}

(function(context) {

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

  function buildEntryDictionary(dateEntries, {date, count}) {
    const [year, month, day] = date.split("-");
    if (!dateEntries[year]) {
      dateEntries[year] = {};
    }
    if (!dateEntries[year][month]) {
      dateEntries[year][month] = {};
    }
    dateEntries[year][month][day] = count;
    return dateEntries;
  }

  (function() {

    context.showChart = function() {
      fetch('https://gist.githubusercontent.com/alxndr/c5cb1b4ceaf938d8801b60fd241fabf9/raw/1712731e092b6e94a350abb9a52e6a9b7b550fe2/eggcount.json')
        .then(checkStatus)
        .then((response) => response.json())
        .then((data) => data.reduce(buildEntryDictionary, {}))
        .then((data) => console.log("data...", data))
      ; // fetch pipeline
    };

  })();
})(this);
if (document.location.hash === "#show-chart") {
  console.log("auto-showing chart");
  document.getElementsByClassName("chart-placeholder")[0].remove();
  this.showChart();
}
