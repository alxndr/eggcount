import {fetchJson} from "./helpers/http";

function fetchGist(gistId) {
  return fetchJson(`https://api.github.com/gists/${gistId}`);
}

export async function fetchFileInGist(filename, gistId) {
  const {files, html_url} = await fetchGist(gistId);
  const data = await fetchJson(files[filename].raw_url);
  return {
    data,
    fileUrl: html_url
  };
}
