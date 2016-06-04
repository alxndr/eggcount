/* global describe, it */

import {expect} from "chai";
import "mocha";

import {
  dayDifference
} from "../src/utilities.js";

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
  })
});
