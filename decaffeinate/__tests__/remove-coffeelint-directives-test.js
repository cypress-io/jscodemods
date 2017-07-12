/* global jest */

'use strict';

jest.autoMockOff();
const {defineInlineTest} = require('jscodeshift/src/testUtils');
const transform = require('../remove-coffeelint-directives');

defineInlineTest(
  transform,
  {},
  `
  describe('SearchListService', () => {
    // declare queryBuilderObj
    /* coffeelint-variable-scope-ignore */
    let queryBuilderObj;
    return queryBuilderObj = null;
    // ...
  });
  `,
  `
  describe('SearchListService', () => {
    // declare queryBuilderObj
    let queryBuilderObj;
    return queryBuilderObj = null;
    // ...
  });
  `
);
