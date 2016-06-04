/* global describe, it */

import {expect} from "chai";
import "mocha";

import {
  dayDifference,
  ymdFromDate
} from "../src/dates";

describe("dates", function() {


  describe("dayDifference", function() {
    describe("1 day apart", function() {
      it("returns 1", function() {
        expect(dayDifference("2016-06-01", "2016-06-02")).to.equal(1);
      });
    });
    describe("1 year apart", function() {
      it("returns 365", function() {
        expect(dayDifference("2013-06-01", "2014-06-01")).to.equal(365);
      });
      describe("on a leap year", function() {
        it("returns 366", function() {
          expect(dayDifference("2016-01-01", "2017-01-01")).to.equal(366);
        });
      });
    });
  });


  describe("ymdFromDate", function() {
    describe("with a Date", function() {
      it("returns a string representation", function() {
        // don't forget that the month of Date is 0-indexed...
        expect(ymdFromDate(new Date(2000, 0, 1))).to.equal("2000-01-01");
        expect(ymdFromDate(new Date(2000, 1, 29))).to.equal("2000-02-29");
        expect(ymdFromDate(new Date(2000, 1, 30))).to.equal("2000-03-01");
        expect(ymdFromDate(new Date(2000, 11, 31))).to.equal("2000-12-31");
      })
    });
  });

});
