/* global describe, it */

import { expect } from "chai";
import "mocha";

import * as objects from "../src/objects";

describe("objects", function() {


  describe("keys", function() {
    it("returns array of keys", function() {
      const result = objects.keys({foo: "bar", baz: "qux"});
      expect(result).to.be.an("array");
    });
    it("sorts keys alphabetically", function() {
      const result = objects.keys({foo: "bar", baz: "qux", 1: 1, 5: 5, 10: 10});
      expect(result).to.deep.equal(["1", "10", "5", "baz", "foo"]);
    });
  });


  describe("objectKeyValPairs", function() {
    it("returns an array of key-val pairs, sorted by key", function() {
      const result = objects.objectKeyValPairs({foo: "bar", baz: "qux"});
      expect(result).to.deep.equal([["baz", "qux"], ["foo", "bar"]]);
    });
  });


});
