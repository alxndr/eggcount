import {checkStatus, extractJson} from "./utilities";

export function fetchGist(gistId) {
  return fetch(`https://api.github.com/gists/${gistId}`)
    .then(checkStatus)
    .then(extractJson);
}
