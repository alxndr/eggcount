/* global describe, it */

import {expect} from "chai";
import "mocha";

import * as main from "../src/main";

describe("main", function() {

  describe("sortInput", function() {
    it("sorts by date property", function() {
      const jul1 = { date: "2016-07-01" };
      const jul13 = { date: "2016-07-13" };
      const jul16 = { date: "2016-07-16" };
      expect(
        [jul13, jul1, jul16].sort(main.sortInput)
      ).to.deep.equal(
        [jul1, jul13, jul16]
      );
    });
  });

});
