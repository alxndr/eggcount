export function keys(obj) {
  return Object.keys(obj).sort();
}

export function objectKeyValPairs(obj) {
  return keys(obj).map((key) => [key, obj[key]]);
}
