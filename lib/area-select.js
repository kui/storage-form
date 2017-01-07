"use strict";

exports.__esModule = true;

var initBinder = (() => {
  var _ref2 = _asyncToGenerator(function* (self) {
    // Avoid to initalize until <option> elements are appended
    if (self.options.length === 0) return;

    self.binder = null;

    var h = getAreaHandler(self);
    if (!h) return;

    self.binder = new _binder2.default(h, { write: writeSelect, read: readSelect });

    if (self.isInitLoad) {
      self.isInitLoad = false;
      yield sync(self);
    } else {
      yield submit(self);
    }
  });

  return function initBinder(_x) {
    return _ref2.apply(this, arguments);
  };
})();

var submit = (() => {
  var _ref3 = _asyncToGenerator(function* (self) {
    if (self.binder) yield self.binder.submit([self]);
  });

  return function submit(_x2) {
    return _ref3.apply(this, arguments);
  };
})();

var sync = (() => {
  var _ref4 = _asyncToGenerator(function* (self) {
    if (self.binder) yield self.binder.sync([self]);
  });

  return function sync(_x3) {
    return _ref4.apply(this, arguments);
  };
})();

exports.mixinAreaSelect = mixinAreaSelect;

var _utils = require("./utils");

var u = _interopRequireWildcard(_utils);

var _areaHandler = require("./area-handler");

var ah = _interopRequireWildcard(_areaHandler);

var _binder = require("./binder");

var _binder2 = _interopRequireDefault(_binder);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var SYNC_INTERVAL = 500;

function mixinAreaSelect(c) {
  // $FlowFixMe Force cast to the returned type.
  return class extends c {

    get area() {
      return getAttr(this, "area");
    }
    set area(v) {
      setAttr(this, "area", v);
    }

    constructor() {
      super();
    }

    createdCallback() {
      var _this = this;

      this.isInitLoad = true;

      this.addEventListener("change", () => sync(this));
      window.addEventListener("unload", () => sync(this));

      // Periodical sync
      // To observe storage changings and `.value` changings by an external javascripts
      _asyncToGenerator(function* () {
        while (true) {
          yield u.sleep(SYNC_INTERVAL);
          yield sync(_this);
          writeArea(_this);
        }
      })();
    }

    attachedCallback() {
      if (this.length === 0) addAllHandlers(this);
      initBinder(this);
      writeArea(this);
    }

    static get observedAttributes() {
      return ["area"];
    }

    attributeChangedCallback(attrName) {
      switch (attrName) {
        case "area":
          initBinder(this);
          break;
      }
    }
  };
}

var mixedSelect = mixinAreaSelect(HTMLSelectElement);
class HTMLAreaSelectElement extends mixedSelect {
  static get extends() {
    return "select";
  }
}

exports.default = HTMLAreaSelectElement;


function writeSelect(self, newValue) {
  if (self.value === newValue) return;
  self.value = newValue;
  writeArea(self);
}

function readSelect(self) {
  return self.value;
}

function writeArea(self) {
  var form = self.form;
  if (form == null) return;
  form.setAttribute("area", self.value);
}

function getAreaHandler(self) {
  var a = self.area;
  if (!a) {
    console.debug("Require 'area' attribute", self);
    return null;
  }
  var h = ah.findHandler(a);
  if (!h) {
    console.debug("No such area handler: area=%s, this=%s", self.area, self);
    return null;
  }
  return h;
}

function addAllHandlers(self) {
  for (var _iterator = ah.listHandlers(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref6;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref6 = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref6 = _i.value;
    }

    var _ref5 = _ref6;
    var _area = _ref5[0];

    var o = document.createElement("option");
    o.innerHTML = _area;
    self.appendChild(o);
  }
}

function getAttr(self, name) {
  var v = self.getAttribute(name);
  return v ? v : "";
}
function setAttr(self, name, value) {
  if (value == null) return;
  self.setAttribute(name, value);
}