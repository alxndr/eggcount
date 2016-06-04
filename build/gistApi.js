"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.fetchGist = fetchGist;

var _utilities = require("./utilities");

function fetchGist(gistId) {
  return fetch("https://api.github.com/gists/" + gistId).then(_utilities.checkStatus).then(_utilities.extractJson);
}