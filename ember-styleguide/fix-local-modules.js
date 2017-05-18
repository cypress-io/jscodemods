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

const assert = require('assert');

module.exports = function fixLocalModules(fileInfo, api) {
  const src = fileInfo.source;
  const j = api.jscodeshift;
  const root = j(src);

  const emberModules = root.find(j.MemberExpression)
    .filter(isEmberModule);
  const emberModuleNames = collectEmberModules(emberModules);
  const localModuleDeclaration = root.find(j.VariableDeclaration)
    .filter(isLocalModuleDeclaration)
    .paths()[0];

  if (emberModuleNames.length === 0) {
    return; // no occurrences, we're okay
  }

  // Replace instances of `Ember.get` with `get`, etc.
  emberModules.replaceWith(replaceEmberModule);

  // Add declaration `const {get, set} = Ember;`
  const existingModuleNames = getModuleNames(localModuleDeclaration);
  const allModuleNames = uniqueAndSort(existingModuleNames.concat(emberModuleNames));
  const newLocalModuleDeclaration = getEmberLocalModuleDeclaration(j, allModuleNames);
  if (localModuleDeclaration) {
    localModuleDeclaration.replace(newLocalModuleDeclaration);
  } else {
    // Insert after last import if there wasn't a declaration already
    root.find(j.ImportDeclaration)
      .at(-1)
      .insertAfter(newLocalModuleDeclaration);
  }

  return root.toSource();
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
  return uniqueAndSort(moduleNames);
}

function uniqueAndSort(strings) {
  const uniqueStrings = Array.from(new Set(strings));
  const sortedStrings = uniqueStrings.sort((a, b) => a - b);
  return sortedStrings;
}

function isLocalModuleDeclaration({value}) {
  const {declarations} = value;
  const declarator = declarations[0];
  if (!declarator) return false;
  if (declarator.id.type !== 'ObjectPattern') return false;
  if (declarator.init.type !== 'Identifier') return false;
  if (declarator.init.name !== 'Ember') return false;
  // Only handle single declarations
  assert(declarations.length === 1);
  return true;
}

function getModuleNames(localModuleDeclaration) {
  if (!localModuleDeclaration) return [];
  const {declarations} = localModuleDeclaration.value;
  const declarator = declarations[0];
  const properties = declarator.id.properties;
  return properties.map(property => property.key.name);
}

function replaceEmberModule({value}) {
  return value.property;
}

function getEmberLocalModuleDeclaration(j, moduleNames) {
  const properties = moduleNames.map((name) => {
    const id = j.identifier(name);
    const property = j.property('init', id, id);
    property.shorthand = true;
    return property;
  });
  const declarations = [
    j.variableDeclarator(j.objectPattern(properties), j.identifier('Ember')),
  ];
  return j.variableDeclaration('const', declarations);
}
