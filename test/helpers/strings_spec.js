/* global describe, it */

import { expect } from "chai";
import "mocha";

import * as strings from "../../src/helpers/strings";

describe("strings", function() {


  describe("padZero", function() {
    it("puts zeros in front of a thing", function() {
      expect(strings.padZero(2, 4)).to.equal("0002");
      expect(strings.padZero("foo", 5)).to.equal("00foo");
    });
    describe("with just a string", function() {
      it("pads to 2 long", function() {
        expect(strings.padZero(2)).to.equal("02");
        expect(strings.padZero(0)).to.equal("00");
      })
    })
  });


});
