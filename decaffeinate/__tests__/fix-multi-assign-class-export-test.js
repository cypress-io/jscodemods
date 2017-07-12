/* global jest */

'use strict';

jest.autoMockOff();
const {defineInlineTest} = require('jscodeshift/src/testUtils');
const transform = require('../fix-multi-assign-class-export');

defineInlineTest(
  transform,
  {},
  `
  let Foo;
  module.exports = Foo = class Foo {};
  `,
  `
  module.exports = class Foo {};
  `
);

// TODO: Fix this case
// defineInlineTest(
//   transform,
//   {},
//   `
//   let Foo;
//   module.exports = Foo = class Foo {};
//   new Foo();
//   `,
//   `
//   class Foo {}
//   module.exports = Foo;
//   new Foo()
//   `
// );
