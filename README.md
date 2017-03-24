# jscodemods

This repository contains [`jscodeshift`](jscodeshift) tranformation scripts used by DataFox.

## `decaffeinate`

Tranformation scripts in the `decaffeinate` directory are scripts meant to be run on [`decaffeinate`](decaffeinate) tranpiled CoffeeScript -> ES6 code.
These scripts are mainly meant to fix style rather than correctness.
The style issues are mainly those imposed by the [Airbnb JavaScript style guide](airbnb) that were unable to be fixed by `eslint --fix` in the `bulk-decaffeinate` process.
These scripts are operating on files run with decaffeinate's `--keep-commonjs` and `--prefer-const` flags on.

### `fix-multi-assign-class-export`

#### CoffeeScript source

```coffeescript
module.exports = class Foo
```

#### Decaffeinated JavaScript

```javascript
let Foo;
module.exports = Foo = class Foo {};
```

#### Fixed JavaScript

```javascript
module.exports = class Foo {};
```


<!-- Links -->
[jscodeshift]: https://github.com/facebook/jscodeshift
[decaffeinate]: https://github.com/decaffeinate/decaffeinate
[airbnb]: https://github.com/airbnb/javascript

