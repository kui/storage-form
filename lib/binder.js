"use strict";

exports.__esModule = true;

var lockBlock = (() => {
  var _ref2 = _asyncToGenerator(function* (self, fn) {
    while (self.lock) {
      yield self.lock;
    }self.lock = fn();
    var t = yield self.lock;
    self.lock = null;
    return t;
  });

  return function lockBlock(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
})();

var readAndWrite = (() => {
  var _ref3 = _asyncToGenerator(function* (self, from, to, isForce) {
    var newValues = yield from.readAll();
    var oldValues = self.values;
    self.values = newValues;
    var keys = new Set(concat(oldValues.keys(), newValues.keys()));
    var hasChanged = false;
    var changes = map(keys, function (k) {
      var d = self.handler.diff(oldValues.get(k), newValues.get(k));
      hasChanged = hasChanged || d.isChanged;
      return [k, d];
    });
    yield to.write(changes, isForce);
    return hasChanged;
  });

  return function readAndWrite(_x5, _x6, _x7, _x8) {
    return _ref3.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class Binder {

  constructor(handler) {
    this.handler = handler;
    this.values = new Map();
    this.lock = null;
  }

  aToB() {
    var _arguments = arguments,
        _this = this;

    return _asyncToGenerator(function* () {
      var o = _arguments.length > 0 && _arguments[0] !== undefined ? _arguments[0] : { force: false };

      var hasChanged = yield lockBlock(_this, function () {
        return readAndWrite(_this, _this.handler.a, _this.handler.b, o.force);
      });
      if (hasChanged && _this.onChange) yield _this.onChange({ type: "atob", isForce: o.force });
    })();
  }

  bToA() {
    var _arguments2 = arguments,
        _this2 = this;

    return _asyncToGenerator(function* () {
      var o = _arguments2.length > 0 && _arguments2[0] !== undefined ? _arguments2[0] : { force: false };

      var hasChanged = yield lockBlock(_this2, function () {
        return readAndWrite(_this2, _this2.handler.b, _this2.handler.a, o.force);
      });
      if (hasChanged && _this2.onChange) yield _this2.onChange({ type: "btoa", isForce: o.force });
    })();
  }

  sync() {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      var hasChanged = false;
      yield lockBlock(_this3, _asyncToGenerator(function* () {
        hasChanged = (yield readAndWrite(_this3, _this3.handler.a, _this3.handler.b, false)) || hasChanged;
        hasChanged = (yield readAndWrite(_this3, _this3.handler.b, _this3.handler.a, false)) || hasChanged;
      }));
      if (hasChanged && _this3.onChange) yield _this3.onChange({ type: "sync", isForce: false });
    })();
  }
}

exports.default = Binder;


function* concat() {
  for (var _len = arguments.length, iters = Array(_len), _key = 0; _key < _len; _key++) {
    iters[_key] = arguments[_key];
  }

  for (var _iterator = iters, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref4;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref4 = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref4 = _i.value;
    }

    var iter = _ref4;
    for (var _iterator2 = iter, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref5;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref5 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref5 = _i2.value;
      }

      var k = _ref5;
      yield k;
    }
  }
}

function* map(iter, fn) {
  for (var _iterator3 = iter, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
    var _ref6;

    if (_isArray3) {
      if (_i3 >= _iterator3.length) break;
      _ref6 = _iterator3[_i3++];
    } else {
      _i3 = _iterator3.next();
      if (_i3.done) break;
      _ref6 = _i3.value;
    }

    var _t = _ref6;
    yield fn(_t);
  }
}