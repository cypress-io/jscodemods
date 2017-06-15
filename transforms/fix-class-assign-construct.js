export default function fixClassAssignmentWithConstructors(fileInfo, api) {
  const j = api.jscodeshift;
  const root = j(fileInfo.source);

  root
    .find(j.AssignmentExpression)
    .filter(isClassAssign)
    .forEach(path => transformClassAssignmentAndConstructions(j, root, path));

  return root.toSource().replace(/\(START_(.*)_END\)/g, '$1');
}

function isClassAssign(path) {
  return path.value.right.type === 'ClassExpression';
}

function transformClassAssignmentAndConstructions(j, root, assignmentPath) {
  const ctor = assignmentPath.value.left;
  const classDef = assignmentPath.value.right;
  const className = classDef.id;
  const constructions = findConstructionsInFile(root, j, ctor);
  if (constructions.size() > 0) {
    // Replace new module.exports() calls
    constructions.forEach(({value}) => {
      // eslint-disable-next-line no-param-reassign
      value.callee = className;
    });
    // Move class definition above module.exports assignment
    const assignmentExpressionStatement = assignmentPath.parent;
    const classDefExpressionStatement = j.expressionStatement(classDef) 
    assignmentExpressionStatement.insertBefore(classDefExpressionStatement);
    migrateComments(assignmentExpressionStatement.value, classDefExpressionStatement.expression);
    // Replace module.exports = (class ClassName {}); with module.exports = ClassName;
    // START_ClassName_END hack to fix extraneous parentheses around module.exports = (ClassName);
    // eslint-disable-next-line no-param-reassign
    assignmentPath.value.right = j.identifier(`START_${className.name}_END`);
  }
}

function findConstructionsInFile(root, j, ctor) {
  return root
    .find(j.NewExpression)
    .filter(({value}) => {
      const calledConstructorSource = j(value.callee).toSource();
      return new RegExp(`^\\(?${j(ctor).toSource()}\\)?$`).test(calledConstructorSource);
    });
}

function migrateComments(from, to) {
  /* eslint-disable no-param-reassign */
  to.comments = from.comments;
  to.leadingComments = from.leadingComments;
  from.comments = null;
  from.leadingComments = null;
  /* eslint-enable no-param-reassign */
}
