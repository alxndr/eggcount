/* global describe, it */

import {expect} from "chai";
import "mocha";

import * as arrays from "../../src/helpers/arrays";

describe("arrays", function() {


  describe("last", function() {
    it("returns the last item of an array", function() {
      expect(arrays.last([1, 2, 3])).to.equal(3);
      expect(arrays.last([])).to.equal(undefined);
    });
  });


  describe("range", function() {
    it("returns an array of numbers, inclusive", function() {
      const result = arrays.range(1, 4);
      expect(result).to.be.an("array");
      expect(result).to.include(1);
      expect(result).to.include(4);
    });
  });


});
