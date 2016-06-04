/* global describe, it */

import {expect} from "chai";
import "mocha";

import * as utilities from "../src/utilities";

describe("utilities", function() {


  describe("last", function() {
    it("returns the last item of an array", function() {
      expect(utilities.last([1, 2, 3])).to.equal(3);
      expect(utilities.last([])).to.equal(undefined);
    });
  });


  describe("range", function() {
    it("returns an array of numbers, inclusive", function() {
      const result = utilities.range(1, 4);
      expect(result).to.be.an("array");
      expect(result).to.include(1);
      expect(result).to.include(4);
    });
  });


});
