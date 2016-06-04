/* global describe, it */

import {expect} from "chai";
import "mocha";

import {
  checkStatus
} from "../src/http";

describe("http", function() {


  describe("checkStatus", function() {
    describe("with a 200 response", function() {
      it("doesn't throw", function() {
        const response = {status: 200};
        expect(() => checkStatus(response)).not.to.throw();
      });
    });
    describe("with a non-200 response", function() {
      it("throws", function() {
        const response = {status: 404};
        expect(() => checkStatus(response)).to.throw();
      });
    });
  });


});
