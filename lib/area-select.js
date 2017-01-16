"use strict";

exports.__esModule = true;
exports.mixinAreaSelect = mixinAreaSelect;

var _storageBinder = require("./storage-binder");

var _storageBinder2 = _interopRequireDefault(_storageBinder);

var _areaHandler = require("./area-handler");

var ah = _interopRequireWildcard(_areaHandler);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function mixinAreaSelect(c) {
  // $FlowFixMe Force cast to the returned type.
  return class extends c {

    get area() {
      return getAttr(this, "area");
    }
    set area(v) {
      this.setAttribute("area", v);
    }

    constructor() {
      super();
    }

    createdCallback() {
      var _this = this;

      this.binder = new _storageBinder2.default(generateBindee(this));
      this.binder.onChange = (() => {
        var _ref = _asyncToGenerator(function* (event) {
          writeArea(_this);
          dispatchEvent(_this, `area-select-${ event.type }`, event);
        });

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      })();
      observeValue(this, _asyncToGenerator(function* () {
        yield _this.binder.submit();
      }));
    }

    attachedCallback() {
      if (this.length === 0) addAllHandlers(this);
      this.binder.doAutoTask();
      writeArea(this);
    }

    static get observedAttributes() {
      return ["area"];
    }
    attributeChangedCallback(attrName) {
      switch (attrName) {
        case "area":
          this.binder.init();
          this.binder.doAutoTask();
          break;
      }
    }

    sync() {
      if (!this.binder) return Promise.resolve();
      return this.binder.sync();
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
function generateBindee(self) {
  return {
    getArea: () => self.area,
    getInterval: () => 700,
    isAutoSync: () => true,
    isAutoLoad: () => false,
    getNames: () => [self.name],
    getElements: () => [self],
    getTarget: () => self
  };
}

function observeValue(self, onChange) {
  var value = self.value;
  _asyncToGenerator(function* () {
    while (true) {
      yield waitAnimationFrame();
      if (self.value === value) continue;
      value = self.value;
      yield onChange();
    }
  })();
}

function waitAnimationFrame() {
  return new Promise(r => requestAnimationFrame(r));
}

function writeArea(self) {
  var form = self.form;
  if (form == null) return;
  form.setAttribute("area", self.value);
}

function addAllHandlers(self) {
  for (var _iterator = ah.listHandlers(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
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
    var _area = _ref4[0];

    var o = document.createElement("option");
    o.innerHTML = _area;
    self.appendChild(o);
  }
}

function dispatchEvent(self, type, detail) {
  return self.dispatchEvent(new CustomEvent(type, detail));
}

function getAttr(self, name) {
  var v = self.getAttribute(name);
  return v ? v : "";
}