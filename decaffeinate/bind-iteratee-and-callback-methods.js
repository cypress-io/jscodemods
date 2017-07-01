'use strict';

const MAX_TRANSFORM_ITERATIONS = 4;

// [callee pattern, iteratee argument position]
const HIGHER_ORDER_FUNCTIONS = [
  // Underscore
  [/^_\.each$/, 1],
  [/^_\.map$/, 1],
  [/^_\.reduce$/, 1],
  [/^_\.reduceRight$/, 1],
  [/^_\.find$/, 1],
  [/^_\.filter$/, 1],
  [/^_\.reject$/, 1],
  [/^_\.every$/, 1],
  [/^_\.some$/, 1],
  [/^_\.max$/, 1],
  [/^_\.min$/, 1],
  [/^_\.sortBy$/, 1],
  [/^_\.groupBy$/, 1],
  [/^_\.indexBy$/, 1],
  [/^_\.countBy$/, 1],
  [/^_\.partition$/, 1],
  [/^_\.findIndex$/, 1],
  [/^_\.findLastIndex$/, 1],
  [/^_\.mapObject$/, 1],
  [/^_\.findKey$/, 1],
  // Underscore (chain)
  [/^_\.chain\(.*\.each$/, 0],
  [/^_\.chain\(.*\.map$/, 0],
  [/^_\.chain\(.*\.reduce$/, 0],
  [/^_\.chain\(.*\.reduceRight$/, 0],
  [/^_\.chain\(.*\.find$/, 0],
  [/^_\.chain\(.*\.filter$/, 0],
  [/^_\.chain\(.*\.reject$/, 0],
  [/^_\.chain\(.*\.every$/, 0],
  [/^_\.chain\(.*\.some$/, 0],
  [/^_\.chain\(.*\.max$/, 0],
  [/^_\.chain\(.*\.min$/, 0],
  [/^_\.chain\(.*\.sortBy$/, 0],
  [/^_\.chain\(.*\.groupBy$/, 0],
  [/^_\.chain\(.*\.indexBy$/, 0],
  [/^_\.chain\(.*\.countBy$/, 0],
  [/^_\.chain\(.*\.partition$/, 0],
  [/^_\.chain\(.*\.findIndex$/, 0],
  [/^_\.chain\(.*\.findLastIndex$/, 0],
  [/^_\.chain\(.*\.mapObject$/, 0],
  [/^_\.chain\(.*\.findKey$/, 0],
  // Array.prototype
  [/^[^_].*\.every$/, 0],
  [/^[^_].*\.map$/, 0],
  [/^[^_].*\.filter$/, 0],
  [/^[^_].*\.find$/, 0],
  [/^[^_].*\.findIndex$/, 0],
  [/^[^_].*\.forEach$/, 0],
  [/^[^_].*\.map$/, 0],
  [/^[^_].*\.reduce$/, 0],
  [/^[^_].*\.reduceRight$/, 0],
  [/^[^_].*\.some$/, 0],
  [/^[^_].*\.sort$/, 0],
  // StreamWorker
  [/^StreamWorker$/i, 1],
  [/^StreamWorker$/i, 3],
  // async
  [/^async\.auto$/, 1],
  [/^async\.auto$/, 2],
  [/^async\.autoInject$/, 1],
  [/^async\.autoInject$/, 2],
  [/^async\.cargo$/, 0],
  [/^async\.(doDuring|during)$/, 0],
  [/^async\.(doDuring|during)$/, 1],
  [/^async\.(doDuring|during)$/, 2],
  [/^async\.(doUntil|until)$/, 0],
  [/^async\.(doUntil|until)$/, 1],
  [/^async\.(doUntil|until)$/, 2],
  [/^async\.(doWhilst|whilst)$/, 0],
  [/^async\.(doWhilst|whilst)$/, 1],
  [/^async\.(doWhilst|whilst)$/, 2],
  [/^async\.forever$/, 0],
  [/^async\.forever$/, 1],
  [/^async\.parallel$/, 1],
  [/^async\.parallelLimit$/, 2],
  [/^async\.priorityQueue$/, 0],
  [/^async\.queue$/, 0],
  [/^async\.race$/, 1],
  [/^async\.retry$/, 1],
  [/^async\.retry$/, 2],
  [/^async\.retryable$/, 1],
  [/^async\.series$/, 1],
  [/^async\.times$/, 1],
  [/^async\.times$/, 2],
  [/^async\.timesLimit$/, 2],
  [/^async\.timesLimit$/, 3],
  [/^async\.timesSeries$/, 1],
  [/^async\.timesSeries$/, 2],
  [/^async\.tryEach$/, 1],
  [/^async\.waterfall$/, 1],
];

const ASYNC_COLLECTION_FUNCTIONS = [
  'concat',
  'concatSeries',
  'detect',
  'detectLimit',
  'each',
  'eachLimit',
  'eachOf',
  'eachOfLimit',
  'eachOfSeries',
  'eachSeries',
  'every',
  'everyLimit',
  'everySeries',
  'filter',
  'filterLimit',
  'filterSeries',
  'groupBy',
  'groupByLimit',
  'groupBySeries',
  'map',
  'mapLimit',
  'mapSeries',
  'mapValues',
  'mapValuesLimit',
  'mapValuesSeries',
  'reduce',
  'reduceRight',
  'reject',
  'rejectLimit',
  'rejectSeries',
  'some',
  'someLimit',
  'someSeries',
  'sortBy',
  'transform',
].map(fnName => [
  [new RegExp(`^async\\.${fnName}$`), -2], // iteratee
  [new RegExp(`^async\\.${fnName}$`), -1], // callback
]);
ASYNC_COLLECTION_FUNCTIONS.forEach((pairs) => {
  pairs.forEach((pair) => {
    HIGHER_ORDER_FUNCTIONS.push(pair);
  });
});

// for performance
const EARLY_BAIL_PATTERN = /(_\.|async|StreamWorker|every|map|filter|find|forEach|map|reduce|some|sort)/i;

module.exports = function transform(fileInfo, api, options) {
  const src = fileInfo.source;
  const j = api.jscodeshift;
  const root = j(src);

  // Run until source stops changing
  // (each function could have multiple arguments to replace)
  let hasChanged;
  let currentIteration = 0;
  let lastSource = root.toSource();
  do {
    _transform(j, root);
    const currentSource = root.toSource();
    hasChanged = currentSource !== lastSource;
    lastSource = currentSource;
  } while (hasChanged && ++currentIteration < MAX_TRANSFORM_ITERATIONS);

  return root.toSource();
};

function _transform(j, root) {
  const possibleUnboundFunctions = findPossibleUnboundIterateesAndCallbacks(j, root);

  // Fix unbound methods directly in call expression
  replaceUnboundMethodsWithBoundMethods(j, possibleUnboundFunctions);

  // Fix unbound methods that are assigned to variables
  possibleUnboundFunctions
    .filter(({node}) => node.type === 'Identifier')
    .forEach((idPath) => {
      // post-declaration, initialized variables
      const initializationValues = j(idPath)
        .closestScope()
        .find(j.AssignmentExpression)
        .filter(({node}) => node.left.type === 'Identifier' && node.left.name === idPath.node.name)
        .map(assignmentPath => assignmentPath.get('right'));
      replaceUnboundMethodsWithBoundMethods(j, initializationValues);

      // variable declarators with initialization
      const variableDeclaratorInitValues = j(idPath)
        .closestScope()
        .find(j.VariableDeclarator)
        .filter(({node}) => node.id.type === 'Identifier' && node.id.name === idPath.node.name)
        .map(declaratorPath => declaratorPath.get('init'));
      replaceUnboundMethodsWithBoundMethods(j, variableDeclaratorInitValues);
    });
}

function findPossibleUnboundIterateesAndCallbacks(j, root) {
  return root.find(j.CallExpression)
    .map((path) => {
      const {node} = path;
      const {callee} = node;
      const args = node.arguments;
      const calleeSource = getSource(j, callee).replace(/\s/g, '');
      if (!EARLY_BAIL_PATTERN.test(calleeSource)) return null;

      const match = HIGHER_ORDER_FUNCTIONS.find(([fn, argPos]) => {
        const arg = getArg(args, argPos);
        return fn.test(calleeSource) && (
          arg.type === 'MemberExpression' ||
          arg.type === 'Identifier'
        );
      });
      if (match) {
        const argPos = getNormalizedArgPos(args, match[1]);
        return path.get('arguments', argPos);
      }
      return null;
    });
}

function getSource(j, node) {
  return j(node).toSource();
}

function getArg(args, argPos) {
  // support negative positions
  const sliceEnd = argPos === -1 ? undefined : argPos + 1;
  const normalizedArgPos = getNormalizedArgPos(args, argPos);
  return args.slice(normalizedArgPos, sliceEnd)[0];
}

function getNormalizedArgPos(args, argPos) {
  if (argPos < 0) {
    return args.length + argPos;
  }
  return argPos;
}

function replaceUnboundMethodsWithBoundMethods(j, collection) {
  collection
    .filter(({node}) => node.type === 'MemberExpression')
    .replaceWith(({node}) => getBoundMethodFromMemberExpression(j, node));
}

function getBoundMethodFromMemberExpression(j, node) {
  const boundMethod = j.callExpression(
    j.memberExpression(node, j.identifier('bind')),
    [node.object]
  );
  return boundMethod;
}
