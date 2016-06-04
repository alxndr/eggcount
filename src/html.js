function createElement(elementName) {
  return document.createElement(elementName);
}

export function createLink({href, text}) {
  const link = createElement("a");
  link.appendChild(createText(text));
  link.href = href;
  return link;
}

export function createP(text) {
  const p = createElement("p");
  p.appendChild(createText(text));
  return p;
}

function createText(text) {
  return document.createTextNode(text);
}

export function findId(elementId) {
  return document.getElementById(elementId);
}

export function insertFirst(container, newElement) {
  const firstChild = container.firstChild;
  container.insertBefore(newElement, firstChild);
}

export function removeNodesInNodelist(nodelist) {
  let node;
  while (node = nodelist[nodelist.length - 1]) { // needs to recalculate placeholdersNodelist.length on each iteration
    node.remove();
  }
}
