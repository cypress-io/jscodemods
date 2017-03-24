/**
 * Running decaffeinate when you have a statement like:
 *  module.exports = class Foo
 * 
 * results in:
 *  let Foo;
 *  module.exports = Foo = class Foo {};
 * 
 * The extra variable declaration is not necessary, and
 * it causes eslint no-multi-assign to fail.
 * 
 * This transformation converts the decaffeniated javascript to remove the
 * variable declaration and the subsequent multi-assign.
 */

const assert = require('assert');

module.exports = function test(fileInfo, api, options) {
  const src = fileInfo.source;
  const j = api.jscodeshift;
  const root = j(src);

  const { comments } = root.find(j.Program).get('body', 0).node;

  const multiAssignClassExports = findMultiAssignClassExports(j, root);
  if (multiAssignClassExports.length === 0) return;

  // Fail if there are more than 1 `module.exports = SomeClass = class SomeClass` statements.
  assert(multiAssignClassExports.length === 1);

  multiAssignClassExports.forEach(({value}) => {
    fixMultiAssignExport(j, root, value);
  });

  // Retain leading comments
  root.get().node.comments = comments;
  return root.toSource();
};

function findMultiAssignClassExports(j, root) {
  return root
    .find(j.AssignmentExpression)
    .filter(({value}) => {
      const isModuleExports = (value.left.type === 'MemberExpression'
        && value.left.object.name === 'module'
        && value.left.property.name === 'exports');
      if (!isModuleExports) return false;

      const isMultiAssign = value.right.type === 'AssignmentExpression';
      if (!isMultiAssign) return false;

      const isClassAssignment = value.right.right.type === 'ClassExpression';
      return isClassAssignment;
    });
}

function fixMultiAssignExport(j, root, value) {
  const classIdentifier = value.right.right.id.name;
  // Removes the intermediary assignment
  value.right = value.right.right;
  return removeVariableDeclarationForIdentifier(j, root, classIdentifier);
}

function removeVariableDeclarationForIdentifier(j, root, identifier) {
  root
    .find(j.VariableDeclaration)
    .filter(({value}) => isVariableDeclarationForIdentifier(value, identifier))
    .replaceWith(() => null);
  return root;
}

function isVariableDeclarationForIdentifier(variableDeclaration, identifier) {
  const declarators = variableDeclaration.declarations.filter(declarator =>
    declarator.id.name === identifier
  );
  // Only supporting the case of single variable declaration
  return declarators.length === 1;
}
