function createElement(elementName) {
  return global.createElement(elementName);
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
  return global.createTextNode(text);
}

export function findId(elementId) {
  return global.getElementById(elementId);
}

export function insertBefore(container, newElement) {
  const firstChild = container.firstChild;
  container.insertBefore(newElement, firstChild);
}

export function removeNodesInNodelist(nodelist) {
  let node;
  while (node = nodelist[nodelist.length - 1]) { // needs to recalculate placeholdersNodelist.length on each iteration
    node.remove();
  }
}
