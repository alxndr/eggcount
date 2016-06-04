"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createLink = createLink;
exports.createP = createP;
exports.findId = findId;
exports.insertBefore = insertBefore;
exports.removeNodesInNodelist = removeNodesInNodelist;
function createElement(elementName) {
  return global.createElement(elementName);
}

function createLink(_ref) {
  var href = _ref.href;
  var text = _ref.text;

  var link = createElement("a");
  link.appendChild(createText(text));
  link.href = href;
  return link;
}

function createP(text) {
  var p = createElement("p");
  p.appendChild(createText(text));
  return p;
}

function createText(text) {
  return global.createTextNode(text);
}

function findId(elementId) {
  return global.getElementById(elementId);
}

function insertBefore(container, newElement) {
  var firstChild = container.firstChild;
  container.insertBefore(newElement, firstChild);
}

function removeNodesInNodelist(nodelist) {
  var node = void 0;
  while (node = nodelist[nodelist.length - 1]) {
    // needs to recalculate placeholdersNodelist.length on each iteration
    node.remove();
  }
}