module.exports = function removeCoffeeLintDirectives(fileInfo, api) {
  const src = fileInfo.source;
  const j = api.jscodeshift;
  const root = j(src);
  
  let commentsRemoved = false;
  root.find(j.Node).forEach(({value}) => {
    const {comments} = value;
    if (!comments) return;
    comments.forEach((comment) => {
      if (/coffeelint/.test(comment.value)) {
        const idx = comments.indexOf(comment);
        comments.splice(idx, 1);
        commentsRemoved = true;
      }
    });
  });

  if (!commentsRemoved) return;
  return root.toSource();
};
