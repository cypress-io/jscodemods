/* global jest */

'use strict';

jest.autoMockOff();
const {defineInlineTest} = require('jscodeshift/src/testUtils');
const transform = require('../fix-for-of-statement');

defineInlineTest(
  transform,
  {},
  `
  for (let x of [1, 2, 3, 4, 5]) {
    if ((x % 2) === 0) { continue; }
    console.log(x);
  }
  `,
  `
  [1, 2, 3, 4, 5].forEach((x) => {
    if ((x % 2) === 0) {
      return;
    }
    console.log(x);
  });
  `
);

defineInlineTest(
  transform,
  {},
  `
  for (let x of xs) {
    if ((x % 2) === 0) { continue; }
    console.log(x);
  }
  `,
  `
  xs.forEach((x) => {
    if ((x % 2) === 0) {
      return;
    }
    console.log(x);
  });
  `
);

defineInlineTest(
  transform,
  {},
  `
  for (let x of Array.from(xs)) {
    if ((x % 2) === 0) { continue; }
    console.log(x);
  }
  `,
  `
  Array.from(xs).forEach((x) => {
    if ((x % 2) === 0) {
      return;
    }
    console.log(x);
  });
  `
);

defineInlineTest(
  transform,
  {},
  `
  for (let x of xs) {
    for (let y of ys) {
      if ((x % 2) === 0) { continue; }
      console.log(x, y);
    }
  }
  `,
  `
  xs.forEach((x) => {
    ys.forEach((y) => {
      if ((x % 2) === 0) {
        return;
      }
      console.log(x, y);
    });
  });
  `
);
