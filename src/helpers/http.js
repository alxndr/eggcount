export function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  }
  let error = new Error(response.statusText);
  error.response = response;
  throw error;
}

export function extractJson(response) {
  return response.json();
}

export function fetchJson(url) {
  return fetch(url).then(checkStatus).then(extractJson);
}
