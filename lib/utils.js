"use strict";

exports.__esModule = true;
exports.sleep = sleep;
exports.periodicalTask = periodicalTask;
exports.dedup = dedup;
exports.subtractSet = subtractSet;
exports.mergeNextPromise = mergeNextPromise;

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class CancellablePromise extends Promise {
  constructor(callback, cancell) {
    super(callback);
    this.cancell = cancell;
  }
}

exports.CancellablePromise = CancellablePromise;
function sleep(msec) {
  var timeoutId = void 0;
  return new CancellablePromise(resolve => {
    timeoutId = setTimeout(() => resolve(), msec);
  }, () => {
    clearTimeout(timeoutId);
  });
}

function periodicalTask(o) {
  var sleepPromise = void 0;
  return new CancellablePromise(_asyncToGenerator(function* () {
    do {
      yield o.task();
      sleepPromise = sleep(o.interval());
      yield sleepPromise;
    } while (sleepPromise);
  }), () => {
    if (sleepPromise) sleepPromise.cancell();
    sleepPromise = null;
  });
}

function dedup(array) {
  var predicate = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : (t, o) => t === o;

  return array.reduce((result, element) => {
    if (result.some(i => predicate(i, element))) result;
    return result.concat(element);
  }, []);
}

function subtractSet(targetSet, removedSet) {
  return new Set(Array.from(targetSet).filter(e => !removedSet.has(e)));
}

class MultiValueMap extends Map {
  *flattenValues() {
    for (var _iterator = this.values(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
      var _ref2;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref2 = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref2 = _i.value;
      }

      var arr = _ref2;

      for (var _iterator2 = arr, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
        var _ref3;

        if (_isArray2) {
          if (_i2 >= _iterator2.length) break;
          _ref3 = _iterator2[_i2++];
        } else {
          _i2 = _iterator2.next();
          if (_i2.done) break;
          _ref3 = _i2.value;
        }

        var v = _ref3;

        yield v;
      }
    }
  }
}

class ArrayValueMap extends MultiValueMap {
  add(key, value) {
    var a = this.get(key);
    if (!a) {
      a = [];
      this.set(key, a);
    }
    a.push(value);
    return this;
  }
  getOrSetEmpty(key) {
    var v = super.get(key);
    if (v == null) {
      var n = [];
      super.set(key, n);
      return n;
    } else {
      return v;
    }
  }
}

exports.ArrayValueMap = ArrayValueMap;
class SetValueMap extends MultiValueMap {
  add(key, value) {
    var a = this.get(key);
    if (!a) {
      a = new Set();
      this.set(key, a);
    }
    a.add(value);
    return this;
  }
}

exports.SetValueMap = SetValueMap;
function mergeNextPromise(task) {
  var currentPromise = void 0;
  var nextPromise = void 0;
  return _asyncToGenerator(function* () {
    if (nextPromise) {
      yield nextPromise;
      return;
    }

    if (currentPromise) {
      nextPromise = _asyncToGenerator(function* () {
        if (currentPromise) {
          yield currentPromise;
        }
        nextPromise = null;

        currentPromise = task();
        yield currentPromise;
        currentPromise = null;
      })();

      yield nextPromise;
      return;
    }

    currentPromise = _asyncToGenerator(function* () {
      yield task();
      currentPromise = null;
    })();
    yield currentPromise;
  });
}