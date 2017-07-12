/**
 * Use local versions of Ember.* (eslint-plugin-ember/local-modules)
 * https://github.com/netguru/eslint-plugin-ember/blob/master/docs/rules/local-modules.md
 *
 * Old code like:
 *  import Ember from 'ember';
 *  export default Ember.Component.extend({
 *    foo: Ember.computed(function() {}),
 *  });
 *
 * results in:
 *  import Ember from 'ember';
 *
 *  const {Component, computed} = Ember;
 *
 *  export default Component.extend({
 *    foo: computed(function() {}),
 *  });
 */

'use strict';

const utils = require('./utils');

module.exports = function fixLocalModules(fileInfo, api) {
  const src = fileInfo.source;
  const j = api.jscodeshift;
  const root = j(src);

  const emberModules = root.find(j.MemberExpression)
    .filter(isEmberModule);
  const emberModuleNames = collectEmberModules(emberModules);

  if (emberModuleNames.length === 0) {
    return; // no occurrences, we're okay
  }

  // Replace instances of `Ember.get` with `get`, etc.
  emberModules.replaceWith(replaceEmberModule);

  // Add declaration `const {get, set} = Ember;`
  utils.upsertLocalModuleDeclaration(j, root, emberModuleNames);

  return root.toSource(); // eslint-disable-line consistent-return
};

function isEmberModule(path) {
  const parentType = path.parent.value.type;
  if (!(parentType === 'CallExpression' || parentType === 'MemberExpression')) {
    // Only support Ember.get() or Ember.inject.service()
    // Don't accidentally replace assignments (e.g. Ember.MODEL_FACTORY_INJECTIONS = true)
    return false;
  }

  const memberExpression = path.value;
  const memberObject = memberExpression.object;
  if (memberObject.type !== 'Identifier') return false;
  if (memberObject.name !== 'Ember') return false;
  // Take some precautions to not overwrite certain keywords.
  const allowedEmberProperties = ['$', 'Object', 'Router', 'String'];
  const memberProperty = memberExpression.property;
  if (memberProperty.type === 'Identifier' && allowedEmberProperties.indexOf(memberProperty.name) !== -1) return false;
  return true;
}

function collectEmberModules(emberModules) {
  const paths = emberModules.paths();
  const moduleNames = paths.map(({value}) =>
    value.property.name
  );
  return utils.uniqueAndSort(moduleNames);
}

function replaceEmberModule({value}) {
  return value.property;
}
