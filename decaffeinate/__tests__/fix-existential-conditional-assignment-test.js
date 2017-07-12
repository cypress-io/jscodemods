/* global jest */

'use strict';

jest.autoMockOff();
const {defineInlineTest} = require('jscodeshift/src/testUtils');
const transform = require('../fix-existential-conditional-assignment');

defineInlineTest(
  transform,
  {},
  `
  let left;
  const bar = (left = foo()) != null ? left : '';
  `,
  `
  const bar = foo() || '';
  `
);

defineInlineTest(
  transform,
  {},
  `
  let left;
  const bar = (left = foo()) != 'this should not be fixed' ? left : '';
  `,
  `
  let left;
  const bar = (left = foo()) != 'this should not be fixed' ? left : '';
  `
);

defineInlineTest(
  transform,
  {},
  `
  let left;
  const bar = (left = foo()) == null ? left : '';
  `,
  `
  let left;
  const bar = (left = foo()) == null ? left : '';
  `
);
