/* global jest */

'use strict';

jest.autoMockOff();
const defineTest = require('jscodeshift/src/testUtils').defineTest;

defineTest(__dirname, 'bind-iteratee-and-callback-methods');
