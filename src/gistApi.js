import {checkStatus, extractJson} from "./utilities";

export function fetchGist(gistId) {
  return fetch(`https://api.github.com/gists/${gistId}`)
    .then(checkStatus)
    .then(extractJson);
}

export async function fetchFileInGist(filename, gistId) {
  global.console.log(filename, gistId);
  const {files, html_url} = await fetchGist(gistId);
  const data =
  await fetch(files[filename].raw_url)
    .then(checkStatus)
    .then(extractJson);
  return {
    fileUrl: html_url,
    data: data
  };
}
