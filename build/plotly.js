"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
function layout(opts) {
  return Object.assign({
    type: "date",
    xaxis: {
      tickformat: "%b %d"
    },
    yaxis: {}
  }, opts);
}

exports.default = {
  layout: layout
};