/* global jest */

'use strict';

jest.autoMockOff();
const {defineInlineTest} = require('jscodeshift/src/testUtils');
const transform = require('../fix-implicit-return-assignment');

defineInlineTest(
  transform,
  {},
  `
  class Foo {
    setBar(bar) {
      return this.bar = 42;
    }
    getBar(bar) {
      return this.bar;
    }
  }
  `,
  `
  class Foo {
    setBar(bar) {
      this.bar = 42;
    }
    getBar(bar) {
      return this.bar;
    }
  }
  `
);
