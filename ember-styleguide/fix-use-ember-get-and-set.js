/**
 * Use Ember.get and Ember.set instead of calling them on the objects
 * themselves. This is to avoid having to remember which objects are actually
 * Ember objects.
 * https://github.com/netguru/eslint-plugin-ember/blob/master/docs/rules/use-ember-get-and-set.md
 *
 * Old code like:
 *  import Ember from 'ember';
 *  export default Ember.Component.extend({
 *    foo: Ember.computed('bar', function() {
 *      return this.get('bar');
 *    }),
 *  });
 *
 * results in:
 *  import Ember from 'ember';
 *
 *  const {get} = Ember;
 *
 *  export default Ember.Component.extend({
 *    foo: Ember.computed('bar', function() {
 *      return get(this, 'bar');
 *    }),
 *  });
 */

const utils = require('./utils');

const AVOIDED_PROPERTIES = [
  'get',
  'set',
  'getProperties',
  'setProperties',
  'getWithDefault',
];

module.exports = function fixLocalModules(fileInfo, api) {
  const src = fileInfo.source;
  const j = api.jscodeshift;
  const root = j(src);

  const emberGetSets = root.find(j.CallExpression)
    .filter(isEmberGetSetCall);
  const emberModuleNames = collectEmberModulesFromCalls(emberGetSets);

  if (emberModuleNames.length === 0) {
    return; // no occurrences, we're okay
  }

  // Replace instances of `Ember.get` with `get`, etc.
  emberGetSets.replaceWith(path => replaceEmberGetSet(j, path));

  utils.upsertLocalModuleDeclaration(j, root, emberModuleNames);

  return root.toSource();
};

function isEmberGetSetCall(path) {
  const callExpression = path.value;
  const {callee} = callExpression;
  if (callee.type !== 'MemberExpression') return false;
  const memberProperty = callee.property;
  return memberProperty.type === 'Identifier' &&
    AVOIDED_PROPERTIES.indexOf(memberProperty.name) !== -1;
}

function collectEmberModulesFromCalls(emberModules) {
  const paths = emberModules.paths();
  const moduleNames = paths.map(({value}) =>
    value.callee.property.name
  );
  return utils.uniqueAndSort(moduleNames);
}

function replaceEmberGetSet(j, {value}) {
  const {callee} = value;
  const args = value.arguments;
  const target = callee.object;
  args.unshift(target);
  return j.callExpression(callee.property, args);
}
