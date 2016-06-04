/* global describe, it */

import {expect} from "chai";
import "mocha";

import {
  checkStatus,
  dayDifference,
  last,
  range
} from "../src/utilities.js";


describe("checkStatus", function() {
  describe("with a non-200 response", function() {
    it("throws", function() {
      const response = {status: 404};
      expect(() => checkStatus(response)).to.throw();
    });
  });
});


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


describe("last", function() {
  it("returns the last item of an array", function() {
    expect(last([1, 2, 3])).to.equal(3);
    expect(last([])).to.equal(undefined);
  });
});

describe("range", function() {
  it("returns an array of numbers, inclusive", function() {
    const result = range(1, 4);
    expect(result).to.be.an("array");
    expect(result).to.include(1);
    expect(result).to.include(4);
  });
});
