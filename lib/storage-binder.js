"use strict";

exports.__esModule = true;

var _utils = require("./utils");

var utils = _interopRequireWildcard(_utils);

var _areaHandler = require("./area-handler");

var ah = _interopRequireWildcard(_areaHandler);

var _binder = require("./binder");

var _binder2 = _interopRequireDefault(_binder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class StorageBinder {

  constructor(bindee) {
    var _this = this;

    this.bindee = bindee;
    this.autoTask = null;
    this.init();

    this.doAutoTask = utils.mergeNextPromise(_asyncToGenerator(function* () {
      if (_this.bindee.isAutoSync()) {
        yield _this.sync();
        return;
      }
      if (_this.bindee.isAutoLoad()) {
        yield _this.load();
        return;
      }
    }));
  }

  init() {
    var _this2 = this;

    this.binder = initBinder(this.bindee);
    this.binder.onChange = (() => {
      var _ref2 = _asyncToGenerator(function* (event) {
        if (_this2.onChange) {
          var _type = { atob: "load", btoa: "submit", sync: "sync" }[event.type];
          yield _this2.onChange({ type: _type, target: _this2.bindee.getTarget(), isForce: event.isForce });
        }
      });

      return function (_x) {
        return _ref2.apply(this, arguments);
      };
    })();
  }

  load(o) {
    var _this3 = this;

    return _asyncToGenerator(function* () {
      yield _this3.binder.aToB(o);
    })();
  }

  submit(o) {
    var _this4 = this;

    return _asyncToGenerator(function* () {
      yield _this4.binder.bToA(o);
    })();
  }

  sync() {
    var _this5 = this;

    return _asyncToGenerator(function* () {
      yield _this5.binder.sync();
    })();
  }

  startAutoBinding() {
    var _this6 = this;

    return _asyncToGenerator(function* () {
      if (_this6.autoTask) _this6.autoTask.cancell();

      if (_this6.bindee.isAutoLoad() || _this6.bindee.isAutoSync()) {
        _this6.autoTask = utils.periodicalTask({
          interval: function interval() {
            return _this6.bindee.getInterval();
          },
          task: _this6.doAutoTask
        });
      } else {
        _this6.autoTask = null;
      }
    })();
  }
}

exports.default = StorageBinder;
function initBinder(bindee) {
  return new _binder2.default({
    a: new StorageAreaHandler(bindee),
    b: new FormHandler(bindee),
    diff(oldValue, newValue) {
      return { oldValue, newValue, isChanged: oldValue !== newValue };
    }
  });
}

class StorageAreaHandler {

  constructor(bindee) {
    this.bindee = bindee;
    var h = getAreaHandler(bindee);
    this.handler = h;
  }

  readAll() {
    var _this7 = this;

    return _asyncToGenerator(function* () {
      if (!_this7.handler) return new Map();
      var o = yield _this7.handler.read(Array.from(_this7.bindee.getNames()));
      var a = Object.entries(o).filter(function (_ref3) {
        var v = _ref3[1];
        return v != null;
      });
      return new Map(a);
    })();
  }

  write(changes, isForce) {
    var _this8 = this;

    return _asyncToGenerator(function* () {
      if (!_this8.handler) return;
      var items = {};
      for (var _iterator = changes, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref5;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref5 = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref5 = _i.value;
        }

        var _ref4 = _ref5;
        var key = _ref4[0];
        var _ref4$ = _ref4[1];
        var _newValue = _ref4$.newValue;
        var _isChanged = _ref4$.isChanged;

        if (isForce || _isChanged) items[key] = _newValue || "";
      }
      yield _this8.handler.write(items);
    })();
  }
}

function getAreaHandler(bindee) {
  var a = bindee.getArea();
  if (!a) {
    console.warn("Require 'area' attribute: ", bindee.getTarget());
    return null;
  }
  var h = ah.findHandler(a);
  if (!h) {
    console.warn("Unsupported 'area':", a, bindee.getTarget());
    return null;
  }
  return h;
}

class FormHandler {

  constructor(bindee) {
    this.bindee = bindee;
  }

  readAll() {
    var items = new Map();
    for (var _iterator2 = this.bindee.getElements(), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
      var _ref6;

      if (_isArray2) {
        if (_i2 >= _iterator2.length) break;
        _ref6 = _iterator2[_i2++];
      } else {
        _i2 = _iterator2.next();
        if (_i2.done) break;
        _ref6 = _i2.value;
      }

      var _e = _ref6;

      var name = _e.name;
      if (!name) continue; // filter out empty named elements
      var prevValue = items.get(name);
      if (prevValue) continue; // empty value should update other values such as radio list.
      var value = readValue(_e);
      if (value == null) continue;
      items.set(name, value);
    }
    return Promise.resolve(items);
  }

  write(changes, isForce) {
    var changeMap = new Map(changes);
    for (var _iterator3 = this.bindee.getElements(), _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
      var _ref7;

      if (_isArray3) {
        if (_i3 >= _iterator3.length) break;
        _ref7 = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) break;
        _ref7 = _i3.value;
      }

      var _e2 = _ref7;

      var name = _e2.name;
      if (!name) continue; // filter out empty named elements
      var change = changeMap.get(name);
      if (!change) continue;
      var _isChanged2 = isForce || change.isChanged;
      if (!_isChanged2) continue;
      var value = change.newValue || "";
      writeValue(_e2, value);
    }
    return Promise.resolve();
  }
}

function readValue(e) {
  if (e instanceof HTMLInputElement && ["checkbox", "radio"].includes(e.type)) {
    if (e.checked) return e.value;
    if (e.dataset.uncheckedValue) return e.dataset.uncheckedValue;
    return "";
  } else if (e.value != null) {
    return e.value;
  }
}

function writeValue(e, value) {
  if (e instanceof HTMLInputElement && ["checkbox", "radio"].includes(e.type)) {
    e.checked = e.value === value;
  } else if (e.value != null) {
    e.value = value;
  }
}