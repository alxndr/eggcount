import { padZero } from "./utilities";

const MSEC_IN_1_SEC = 1000;
const SEC_IN_1_MIN = 60;
const MIN_IN_1_HR = 60;
const HR_IN_1_DAY = 24;
export function dayDifference(earlierDate, laterDate) {
  // params are strings of yyyy-mm-dd
  return ( new Date(laterDate.split("-")) - new Date(earlierDate.split("-")) )
    / MSEC_IN_1_SEC / SEC_IN_1_MIN / MIN_IN_1_HR / HR_IN_1_DAY
  ;
}

export function ymdFromDate(date) {
  return [
    date.getYear() + 1900,
    padZero(date.getMonth() + 1),
    padZero(date.getDate())
  ].join("-");
}
