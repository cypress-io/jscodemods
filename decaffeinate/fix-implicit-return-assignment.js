/**
 * Running decaffeinate results in implicit returns being added. One case where
 * we can probably assume it was an implicit return is when we're returning an
 * assignment at the end of a function body, which is equivalent to no return.
 */

const assert = require('assert');

module.exports = function transform(fileInfo, api, options) {
  const src = fileInfo.source;
  const j = api.jscodeshift;
  const root = j(src);

  root
    .find(j.ReturnStatement)
    .filter(isImplicitReturnOfAssignment)
    .replaceWith(({value}) => fixImplicitReturnOfAssignment(j, value));

  return root.toSource();
};

function isImplicitReturnOfAssignment(path) {
  const returnStatement = path.value;
  const isReturningAnAssignment = returnStatement.argument.type === "AssignmentExpression";
  return isReturningAnAssignment && isLastStatement(path);
}

function isLastStatement(path) {
  const functionBlock = path.parent.value;
  assert(functionBlock.type === 'BlockStatement');
  const lastFunctionStatement = functionBlock.body.slice(-1);
  return lastFunctionStatement[0] === path.value;
}

function fixImplicitReturnOfAssignment(j, returnStatement) {
  return j.expressionStatement(returnStatement.argument);
}
