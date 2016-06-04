"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createLink = createLink;
exports.removeNodesInNodelist = removeNodesInNodelist;
function createLink(_ref) {
  var text = _ref.text;
  var href = _ref.href;

  var link = document.createElement("a");
  link.appendChild(document.createTextNode(text));
  link.href = href;
  return link;
}

function removeNodesInNodelist(nodelist) {
  var node = void 0;
  while (node = nodelist[nodelist.length - 1]) {
    // need to recalculate placeholdersNodelist.length on each iteration
    node.remove();
  }
}