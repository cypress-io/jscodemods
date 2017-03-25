const LEFT_IDENTIFIER_REGEX = /^left\d*/;

module.exports = function transform(fileInfo, api, options) {
  const src = fileInfo.source;
  const j = api.jscodeshift;
  const root = j(src);

  const existentialAssignments = root.find(j.ConditionalExpression)
    .filter(isCoffeeScriptExistentialOperator);

  removeVariableDeclarations(existentialAssignments);
  existentialAssignments.replaceWith(path => replaceExistentialAssignmentWithLogicalOr(j, path));

  return root.toSource();
};

function isCoffeeScriptExistentialOperator({value}) {
  const testExpression = value.test;
  if (testExpression.type !== 'BinaryExpression') return false;

  const isLefthandSideAssignment = testExpression.left.type === 'AssignmentExpression';
  if (!isLefthandSideAssignment) return false;

  const assignmentExpression = testExpression.left;
  const isAssigningLeftVariable = assignmentExpression.left.type === 'Identifier' && LEFT_IDENTIFIER_REGEX.test(assignmentExpression.left.name);

  const isNullTest = testExpression.right.type === 'Literal' && testExpression.right.raw === 'null';

  return isAssigningLeftVariable;
}

function replaceExistentialAssignmentWithLogicalOr(j, {value}) {
  const lefthandAssignment = value.test.left;
  const expressionUnderTest = lefthandAssignment.right;
  const providedDefault = value.alternate;
  // Assumption: the value is either truthy or should be the default
  return j.logicalExpression('||', expressionUnderTest, providedDefault);
}

function removeVariableDeclarations(existentialAssignments) {
  const declarators = existentialAssignments.getVariableDeclarators(getLeftIdentifier);
  const declarations = declarators.map(path => path.parent)
  // Assumption: declarations only contain declarators that should be removed.
  declarations.replaceWith(null);
}

function getLeftIdentifier({value}) {
  return value.test.left.left.name;
}
