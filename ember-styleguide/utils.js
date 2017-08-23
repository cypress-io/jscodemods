'use strict';

const assert = require('assert');

module.exports.upsertLocalModuleDeclaration = function (j, root, newModuleNames) {
  const existingLocalModuleDeclaration = findLocalModuleDeclaration(j, root);
  // Add declaration `const {get, set} = Ember;`
  const existingModuleNames = getModuleNamesFromLocalModuleDeclaration(existingLocalModuleDeclaration);
  const mergedModuleNames = existingModuleNames.concat(newModuleNames);
  const moduleNames = this.uniqueAndSort(mergedModuleNames);

  const newLocalModuleDeclaration = getEmberLocalModuleDeclaration(j, moduleNames);
  if (existingLocalModuleDeclaration) {
    existingLocalModuleDeclaration.replace(newLocalModuleDeclaration);
  } else {
    // Insert after last import if there wasn't a declaration already
    root.find(j.ImportDeclaration)
      .at(-1)
      .insertAfter(newLocalModuleDeclaration);
  }
};

module.exports.uniqueAndSort = function (strings) {
  const uniqueStrings = Array.from(new Set(strings));
  const sortedStrings = uniqueStrings.sort();
  return sortedStrings;
};

function findLocalModuleDeclaration(j, root) {
  return root.find(j.VariableDeclaration)
    .filter(isLocalModuleDeclaration)
    .paths()[0];
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

function getModuleNamesFromLocalModuleDeclaration(localModuleDeclaration) {
  if (!localModuleDeclaration) return [];
  const {declarations} = localModuleDeclaration.value;
  const declarator = declarations[0];
  const properties = declarator.id.properties;
  return properties.map(property => property.key.name);
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
