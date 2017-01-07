"use strict";

exports.__esModule = true;
exports.sleep = sleep;
exports.dedup = dedup;
exports.subtractSet = subtractSet;
class CancellablePromise extends Promise {
  constructor(callback, cancell) {
    super(callback);
    this.cancellFunction = cancell;
  }

  cancell() {
    this.cancellFunction();
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
      var _ref;

      if (_isArray) {
        if (_i >= _iterator.length) break;
        _ref = _iterator[_i++];
      } else {
        _i = _iterator.next();
        if (_i.done) break;
        _ref = _i.value;
      }

      var arr = _ref;

      for (var _iterator2 = arr, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
        var _ref2;

        if (_isArray2) {
          if (_i2 >= _iterator2.length) break;
          _ref2 = _iterator2[_i2++];
        } else {
          _i2 = _iterator2.next();
          if (_i2.done) break;
          _ref2 = _i2.value;
        }

        var v = _ref2;

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