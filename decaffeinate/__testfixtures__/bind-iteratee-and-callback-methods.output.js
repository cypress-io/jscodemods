'use strict';

const async = require('async');

const asyncUtil = {
  multiplier: 42,
  multiply(x, callback) {
    callback(null, x * this.multiplier);
  },
  divide(x, callback) {
    callback(null, x / this.multiplier);
  },
  report(err, results) {
    console.log(err, results);
  },
};

class AsyncService {
  constructor(workerFunction) {
    this.workerFunction = workerFunction;
  }
  test0(someCollection, callback) {
    const doWork = (item, next) => this.doWork(item, next);
    async.eachLimit(someCollection, 1, doWork, callback);
  }
  test1(someCollection, callback) {
    async.eachLimit(someCollection, 1, this.doWork.bind(this), callback);
  }
  test2(someCollection, callback) {
    async.eachLimit(someCollection, 1, asyncUtil.multiply.bind(asyncUtil), callback);
  }
  test3(someCollection) {
    async.eachLimit(someCollection, 1, this.doWork.bind(this), asyncUtil.report.bind(asyncUtil));
  }
  test4(someCollection, callback) {
    const doWork = asyncUtil.multiply.bind(asyncUtil);
    async.eachLimit(someCollection, 1, doWork, callback);
  }
  test5(someCollection, callback) {
    let doWork;
    if (Math.random() > 0.5) {
      doWork = asyncUtil.multiply.bind(asyncUtil);
    } else {
      doWork = asyncUtil.divide.bind(asyncUtil);
    }
    async.eachLimit(someCollection, 1, doWork, callback);
  }
  doWork(item, callback) {
    this.workerFunction(item, callback);
  }
}

const syncUtil = {
  multiplier: 42,
  multiply(x) {
    return x * this.multiplier;
  },
  divide(x) {
    return x / this.multiplier;
  },
};

class SyncService {
  constructor(workerFunction) {
    this.workerFunction = workerFunction;
  }
  test0(xs) {
    const doWork = x => this.doWork(x);
    return xs.map(doWork);
  }
  test1(xs) {
    return xs.map(this.doWork.bind(this));
  }
  test2(xs) {
    return xs.map(syncUtil.multipy.bind(syncUtil));
  }
  test3(xs) {
    const doWork = this.doWork.bind(this);
    return xs.map(doWork);
  }
  test4(xs) {
    const doWork = syncUtil.multiply.bind(syncUtil);
    return xs.map(doWork);
  }
  test5(xs) {
    let doWork;
    if (Math.random() > 0.5) {
      doWork = syncUtil.multiply.bind(syncUtil);
    } else {
      doWork = syncUtil.divide.bind(syncUtil);
    }
    return xs.map(doWork);
  }
  test6(x) {
    let doWork;
    if (Math.random() > 0.5) {
      doWork = syncUtil.multiply.bind(syncUtil);
    } else {
      doWork = syncUtil.divide.bind(syncUtil);
    }
    return doWork(x);
  }
  test7(doWork, x) {
    return doWork(x);
  }
  doWork(x) {
    return this.workerFunction(x);
  }
}

module.exports = {
  AsyncService,
  SyncService,
};

