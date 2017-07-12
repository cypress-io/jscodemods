'use strict';

const assert = require('assert');

const FAKE_PARAM_NAME = 'FAKE_PARAM';

module.exports = function transform(fileInfo, api) {
  const src = fileInfo.source;
  const j = api.jscodeshift;
  const root = j(src);

  const forOfStatements = root
    .find(j.ForOfStatement)
    // Don't support break or return
    .filter(path => j(path).find(j.BreakStatement).length === 0)
    .filter(path => j(path).find(j.ReturnStatement).length === 0);
  removeVariableDeclarations(forOfStatements);
  forOfStatements.replaceWith(path => forOfToForEach(j, path));

  const replacePattern = new RegExp(`, ${FAKE_PARAM_NAME}`, 'g');
  return root.toSource().replace(replacePattern, '');
};

function forOfToForEach(j, path) {
  const forOf = path.value;
  assert(forOf.left.type === 'Identifier' || forOf.left.type === 'VariableDeclaration');
  const param = forOf.left.type === 'Identifier'
    ? forOf.left
    : forOf.left.declarations[0].id;
  const iterateeParams = [
    param,
    j.identifier(FAKE_PARAM_NAME), // Need a second parameter to force parentheses
  ];
  const iterable = forOf.right;
  const iteratee = j.arrowFunctionExpression(iterateeParams, forOf.body);
  const forEachExpression = j.expressionStatement(
    j.callExpression(
      j.memberExpression(iterable, j.identifier('forEach')),
      [iteratee]
    )
  );
  replaceContinueStatementsWithReturns(j, path);
  // Retain comments
  forEachExpression.comments = forOf.comments;
  return forEachExpression;
}

function replaceContinueStatementsWithReturns(j, forOfPath) {
  j(forOfPath)
    .find(j.ContinueStatement)
    .replaceWith(j.returnStatement(null));
}

function removeVariableDeclarations(forOfStatement) {
  const declarators = forOfStatement.getVariableDeclarators(getLeftIdentifier);
  const declarations = declarators.map(path => path.parent);
  // Assumption: declarations only contain declarators that should be removed.
  declarations.replaceWith(null);
}

function getLeftIdentifier({value}) {
  return value.left.name;
}
