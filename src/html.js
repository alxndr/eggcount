export function createLink({text, href}) {
  const link = document.createElement("a");
  link.appendChild(document.createTextNode(text));
  link.href = href;
  return link;
}

export function removeNodesInNodelist(nodelist) {
  let node;
  while (node = nodelist[nodelist.length - 1]) { // need to recalculate placeholdersNodelist.length on each iteration
    node.remove();
  }
}
