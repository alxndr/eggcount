export function padZero(thing, length = 2) {
  let string = thing.toString();
  while (string.length < length) {
    string = `0${string}`;
  }
  return string;
}
