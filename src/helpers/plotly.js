function layout(opts) {
  return Object.assign({
    type: "date",
    xaxis: {
      tickformat: "%b %d"
    },
    yaxis: {}
  }, opts);
}

export default {
  layout
};
