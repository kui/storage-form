"use strict";

exports.__esModule = true;

var doSync = (() => {
  var _ref5 = _asyncToGenerator(function* (self, targets) {
    yield Promise.all(targets.map((() => {
      var _ref6 = _asyncToGenerator(function* (e) {
        yield load(self, e);
        yield store(self, e);
      });

      return function (_x4) {
        return _ref6.apply(this, arguments);
      };
    })()));
  });

  return function doSync(_x2, _x3) {
    return _ref5.apply(this, arguments);
  };
})();

var syncBlock = (() => {
  var _ref7 = _asyncToGenerator(function* (self, fn) {
    while (self.lock) {
      yield self.lock;
    }self.lock = fn();
    yield self.lock;
    self.lock = null;
  });

  return function syncBlock(_x5, _x6) {
    return _ref7.apply(this, arguments);
  };
})();

var load = (() => {
  var _ref8 = _asyncToGenerator(function* (self, elem) {
    var newN = elem.name;
    var newV = yield self.s.read(newN);
    var nv = self.v.get(elem);
    if (!nv) {
      nv = { name: elem.name, value: null };
      self.v.set(elem, nv);
    }
    if (nv.name !== newN || nv.value !== newV) {
      self.f.write(elem, newV);
      nv.name = newN;
      nv.value = newV;
    }
  });

  return function load(_x7, _x8) {
    return _ref8.apply(this, arguments);
  };
})();

var store = (() => {
  var _ref9 = _asyncToGenerator(function* (self, elem) {
    var newN = elem.name;
    var newV = fallbackIfNull(function () {
      return self.f.read(elem);
    }, function () {
      return getValueByName(self, newN);
    });
    var nv = self.v.get(elem);
    if (!nv) {
      nv = { name: elem.name, value: null };
      self.v.set(elem, nv);
    }
    if (nv.name !== newN || nv.value !== newV) {
      if (newV == null) {
        yield self.s.remove(newN);
      } else {
        yield self.s.write(newN, newV);
      }
      nv.name = newN;
      nv.value = newV;
    }
  });

  return function store(_x9, _x10) {
    return _ref9.apply(this, arguments);
  };
})();

var _utils = require("./utils");

var u = _interopRequireWildcard(_utils);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class Binder {

  constructor(s, f) {
    this.v = new Map();
    this.s = s;
    this.f = f;
    this.lock = null;
  }

  sync(targets) {
    var _this = this;

    return _asyncToGenerator(function* () {
      yield syncBlock(_this, function () {
        return doSync(_this, targets);
      });
    })();
  }

  /// Force write form values to the storage
  submit(targets) {
    var _this2 = this;

    return _asyncToGenerator(function* () {
      yield syncBlock(_this2, function () {
        return Promise.all(targets.map((() => {
          var _ref = _asyncToGenerator(function* (e) {
            yield store(_this2, e);
          });

          return function (_x) {
            return _ref.apply(this, arguments);
          };
        })()));
      });
    })();
  }

  /// Sync only new elements
  scan(targets) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      yield syncBlock(_this3, _asyncToGenerator(function* () {
        var newElements = u.subtractSet(new Set(targets), new Set(_this3.v.keys()));
        yield doSync(_this3, Array.from(newElements));
      }));
    })();
  }

  /// Invork if an element was removed from a form.
  remove(elements) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      yield syncBlock(_this4, _asyncToGenerator(function* () {
        for (var _iterator = elements, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
          var _ref4;

          if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref4 = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref4 = _i.value;
          }

          var _e = _ref4;
          _this4.v.delete(_e);
        }
      }));
    })();
  }
}

exports.default = Binder;


function fallbackIfNull() {
  for (var _len = arguments.length, fns = Array(_len), _key = 0; _key < _len; _key++) {
    fns[_key] = arguments[_key];
  }

  for (var _iterator2 = fns, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
    var _ref10;

    if (_isArray2) {
      if (_i2 >= _iterator2.length) break;
      _ref10 = _iterator2[_i2++];
    } else {
      _i2 = _iterator2.next();
      if (_i2.done) break;
      _ref10 = _i2.value;
    }

    var fn = _ref10;

    var _v = fn();
    if (_v != null) return _v;
  }
  return null;
}

function getValueByName(self, name) {
  for (var _iterator3 = self.v.values(), _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
    var _ref11;

    if (_isArray3) {
      if (_i3 >= _iterator3.length) break;
      _ref11 = _iterator3[_i3++];
    } else {
      _i3 = _iterator3.next();
      if (_i3.done) break;
      _ref11 = _i3.value;
    }

    var nv = _ref11;

    if (nv.name === name) return nv.value;
  }
  return null;
}