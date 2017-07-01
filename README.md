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


### `fix-class-assign-construct`

#### CoffeeScript source

```coffeescript
module.exports = class Foo

new Foo()
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


### `fix-implicit-return-assignment`

#### CoffeeScript source

```coffeescript
class Foo
  setBar: (bar) ->
    this.bar = 42
```

#### Decaffeinated JavaScript

```javascript
class Foo {
  setBar(bar) {
    return this.bar = 42;
  }
}
```

#### Fixed JavaScript

```javascript
class Foo {
  setBar(bar) {
    this.bar = 42;
  }
}
```


### `fix-existential-conditional-assignment`

#### CoffeeScript source

```coffeescript
bar = foo() ? ''
```

#### Decaffeinated JavaScript

```javascript
let left;
const bar = (left = foo()) != null ? left : '';
```

#### Fixed JavaScript

```javascript
const bar = foo() || '';
```


### `fix-for-of-statement`

#### CoffeeScript source

Note: This will skip over any `for..of` statements that contain a `break` or `return` since it cannot easily be converted into a `forEach`.

```coffeescript
for x in [1, 2, 3, 4, 5]
  continue if x % 2 == 0
  console.log(x)
```

#### Decaffeinated JavaScript

```javascript
for (let x of [1, 2, 3, 4, 5]) {
  if ((x % 2) === 0) { continue; }
  console.log(x);
}
```

#### Fixed JavaScript

```javascript
[1, 2, 3, 4, 5].forEach((x) => {
  if ((x % 2) === 0) {
    return;
  }
  console.log(x);
});
```

### `remove-coffeelint-directives`

#### CoffeeScript source

```coffeescript
describe('SearchListService', () =>
  # declare queryBuilderObj
  ### coffeelint-variable-scope-ignore ###
  queryBuilderObj = null
  # ...
)
```

#### Decaffeinated JavaScript

```javascript
describe('SearchListService', () => {
  // declare queryBuilderObj
  /* coffeelint-variable-scope-ignore */
  let queryBuilderObj;
  return queryBuilderObj = null;
  // ...
});
```

#### Fixed JavaScript

```javascript
describe('SearchListService', () => {
  // declare queryBuilderObj
  let queryBuilderObj;
  return queryBuilderObj = null;
  // ...
});
```

### `bind-iteratee-and-callback-methods`

NOTE: Works with common `Array.prototype`, underscore `_`, `async`, and `StreamWorker` functions.
Does not work with tasks in `async` control flow functions.

#### CoffeeScript Source

```coffeescript
class MultiplierService
  constructor: ->
    this.multiplier = 42
  # Originally a bound method:
  #   multiply: (x) =>
  multiply: (x) ->
    return x * @multiplier
  multiplyAll: (xs) ->
    return xs.map(@multiply)

xs = [1, 2, 3]
ms = new MultiplierService()

# Direct usage
xs.map(ms.multiply)

# Assigning to a variable prior to usage
doWork = ms.multiply
xs.map(multiply)
multiply(1)
```

#### Decaffeinated JavaScript

```javascript
class MultiplierService {
  constructor() {
    this.multiplier = 42;
  }
  // Originally a bound method:
  //   multiply: (x) =>
  multiply(x) {
    return x * this.multiplier;
  }
  multiplyAll(xs) {
    return xs.map(this.multiply);
  }
}

const xs = [1, 2, 3];
const ms = new MultiplierService();

// Direct usage
xs.map(ms.multiply);

// Assigning to a variable prior to usage
const doWork = ms.multiply;
xs.map(doWork);
doWork(1);
```

#### Fixed JavaScript

```javascript
class MultiplierService {
  constructor() {
    this.multiplier = 42;
  }
  // Originally a bound method:
  //   multiply: (x) =>
  multiply(x) {
    return x * this.multiplier;
  }
  multiplyAll(xs) {
    return xs.map(this.multiply.bind(this));
  }
}

const xs = [1, 2, 3];
const ms = new MultiplierService();

// Direct usage
xs.map(ms.multiply.bind(ms));

// Assigning to a variable prior to usage
const doWork = ms.multiply.bind(ms);
xs.map(doWork);
doWork(1);
```

## `ember-styleguide`

Tranformation scripts in the `ember-styleguide` directory are scripts meant to be run on ES6 ember-cli code.
These scripts are mainly meant to fix style rather than correctness.
The style issues are mainly those imposed by the [NetGuru Ember Style Guide](netguru).

### `fix-local-modules`

#### Original JavaScript

```javascript
import Ember from 'ember';

export default Ember.Component.extend({
  foo: Ember.computed(function() {}),
});
```

#### Fixed JavaScript

```javascript
import Ember from 'ember';

const {Component, computed} = Ember;

export default Component.extend({
  foo: computed(function() {}),
});
```

### `fix-use-ember-get-and-set`

#### Original JavaScript

```javascript
import Ember from 'ember';

export default Ember.Component.extend({
  foo: Ember.computed('bar', function() {
    return this.get('bar');
  }),
});
```

#### Fixed JavaScript

```javascript
import Ember from 'ember';

const {get} = Ember;

export default Ember.Component.extend({
  foo: Ember.computed('bar', function() {
    return get(this, 'bar');
  }),
});
```

## `transforms`

These are some miscellaneous transforms.

### `fix-class-assign-construct`

This should be run if you have classes that are assigned to some identifier and then the identifier is used in the file to construct the class.

#### Original JavaScript

```javascript
module.exports = (class FooScript { });

if (!module.parent) {
  const script = new module.exports();
}
```

#### Fixed JavaScript

```javascript
class FooScript { };
module.exports = FooScript;

if (!module.parent) {
  const script = new FooScript();
}
```

### `use-strict`

Adds a top-level 'use strict' statement to JavaScript files.
If you are doing this with bulk-decaffeinate, you should run `eslint --fix` afterwards since bulk-decaffeinate puts a comment directly before the `'use strict';` directive.

Borrowed from [cpojer/jscodemod](https://github.com/cpojer/js-codemod);

<!-- Links -->
[jscodeshift]: https://github.com/facebook/jscodeshift
[decaffeinate]: https://github.com/decaffeinate/decaffeinate
[airbnb]: https://github.com/airbnb/javascript
[netguru]: https://github.com/netguru/eslint-plugin-ember/blob/master/docs/RULES.md

