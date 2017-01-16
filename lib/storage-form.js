"use strict";

exports.__esModule = true;
exports.mixinStorageForm = mixinStorageForm;

var _utils = require("./utils");

var utils = _interopRequireWildcard(_utils);

var _storageBinder = require("./storage-binder");

var _storageBinder2 = _interopRequireDefault(_storageBinder);

var _areaHandler = require("./area-handler");

var ah = _interopRequireWildcard(_areaHandler);

var _areaSelect = require("./area-select");

var _areaSelect2 = _interopRequireDefault(_areaSelect);

var _loadButton = require("./load-button");

var _loadButton2 = _interopRequireDefault(_loadButton);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var DEFAULT_INTERVAL = 700;

function mixinStorageForm(c) {
  // $FlowFixMe Force cast to the returned type.
  return class extends c {

    get autosync() {
      return this.hasAttribute("autosync");
    }
    set autosync(b) {
      setAttrAsBoolean(this, "autosync", b);
    }

    get autoload() {
      return this.hasAttribute("autoload");
    }
    set autoload(b) {
      setAttrAsBoolean(this, "autoload", b);
    }

    get interval() {
      var n = parseInt(getAttr(this, "interval"));
      return n > 300 ? n : DEFAULT_INTERVAL;
    }
    set interval(v) {
      this.setAttribute("interval", v);
    }

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
          dispatchEvent(_this, `storage-form-${ event.type }`, event);
        });

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      })();

      this.binder.startAutoBinding();

      this.addEventListener("submit", event => {
        event.preventDefault();
        this.binder.submit({ force: true });
      });

      setObserver(this);
    }

    attachedCallback() {
      this.binder.startAutoBinding();
    }

    static get observedAttributes() {
      return ["autosync", "autoload", "area"];
    }

    attributeChangedCallback(attrName) {
      switch (attrName) {
        case "autosync":
        case "autoload":
          this.binder.startAutoBinding();
          break;
        case "area":
          this.initBinder();
          this.binder.doAutoTask();
          break;
      }
    }

    initBinder() {
      this.binder.init();
    }
    load() {
      return this.binder.load({ force: true });
    }
    sync() {
      return this.binder.sync();
    }
  };
}

function generateBindee(self) {
  return {
    getArea: () => self.area,
    getInterval: () => self.interval,
    isAutoSync: () => self.autosync,
    isAutoLoad: () => self.autoload,
    getNames: () => map(getStorageElements(self), e => e.name),
    getElements: () => getStorageElements(self),
    getTarget: () => self
  };
}

function* getStorageElements(self) {
  for (var _iterator = self.elements, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
    var _ref2;

    if (_isArray) {
      if (_i >= _iterator.length) break;
      _ref2 = _iterator[_i++];
    } else {
      _i = _iterator.next();
      if (_i.done) break;
      _ref2 = _i.value;
    }

    var e = _ref2;

    if (e.area != null) continue; // filter out "area-select"
    if (!e.name) continue;
    yield e;
  }
}

function dispatchEvent(self, type, detail) {
  return self.dispatchEvent(new CustomEvent(type, detail));
}

var mixedForm = mixinStorageForm(HTMLFormElement);
class HTMLStorageFormElement extends mixedForm {
  static get extends() {
    return "form";
  }

  static register() {
    // Custom Element v1 seems not to works right to extend <form> in Google Chrome 55
    // See http://stackoverflow.com/a/41458692/3864351
    // Polyfill too: https://github.com/webcomponents/custom-elements/tree/master/src
    // > To do: Implement built-in element extension (is=)
    // customElements.define("storage-form", StorageFormElement, { extends: "form" });
    // window.StorageFormElement = StorageFormElement;

    // Custom Element v0
    document.registerElement("storage-form", HTMLStorageFormElement);
    document.registerElement("area-select", _areaSelect2.default);
    document.registerElement("load-button", _loadButton2.default);
  }
}

exports.default = HTMLStorageFormElement;
function setObserver(self) {
  var formControlObservers = new Map();

  function observeFormControl(element) {
    var o = new MutationObserver(() => self.binder.doAutoTask());
    o.observe(element, { attributes: true, atributeFilter: ["name"] });
    formControlObservers.set(element, o);
  }

  function disconnectFormControl(element) {
    var o = formControlObservers.get(element);
    if (o == null) return;
    o.disconnect();
    formControlObservers.delete(element);
  }

  // Observe added/removed form-controls
  // Do NOT use MutationObserver. form controls are not always the DOM children of the form
  // such as <input form="..." ...>.
  // And MutationObserver might be too heaby to observe all descendants of a body element.
  observeFormControls(self, (() => {
    var _ref4 = _asyncToGenerator(function* (_ref3) {
      var addedElements = _ref3.addedElements,
          removedElements = _ref3.removedElements;

      for (var _iterator2 = addedElements, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
        var _ref5;

        if (_isArray2) {
          if (_i2 >= _iterator2.length) break;
          _ref5 = _iterator2[_i2++];
        } else {
          _i2 = _iterator2.next();
          if (_i2.done) break;
          _ref5 = _i2.value;
        }

        var e = _ref5;
        observeFormControl(e);
      }for (var _iterator3 = removedElements, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
        var _ref6;

        if (_isArray3) {
          if (_i3 >= _iterator3.length) break;
          _ref6 = _iterator3[_i3++];
        } else {
          _i3 = _iterator3.next();
          if (_i3.done) break;
          _ref6 = _i3.value;
        }

        var _e = _ref6;
        disconnectFormControl(_e);
      }yield self.binder.doAutoTask();
    });

    return function (_x2) {
      return _ref4.apply(this, arguments);
    };
  })());
}

function observeFormControls(self, callback) {
  var elements = self.elements;
  _asyncToGenerator(function* () {
    while (true) {
      yield waitAnimationFrame();
      var newElements = self.elements;
      if (isEqualsArray(elements, newElements)) continue;

      var oldSet = new Set(elements);
      var newSet = new Set(newElements);
      var _addedElements = utils.subtractSet(newSet, oldSet);
      var _removedElements = utils.subtractSet(oldSet, newSet);
      elements = newElements;
      yield callback({ addedElements: _addedElements, removedElements: _removedElements });
    }
  })();
}

function isEqualsArray(a, b) {
  if (a.length !== b.length) return false;
  var len = a.length;
  for (var i = 0; i < len; i++) {
    if (a[i] !== b[i]) return false;
  }return true;
}

function getAttr(self, name) {
  var v = self.getAttribute(name);
  return v ? v : "";
}

function setAttrAsBoolean(self, name, b) {
  if (b) {
    self.setAttribute(name, "");
  } else {
    self.removeAttribute(name);
  }
}

function waitAnimationFrame() {
  return new Promise(r => requestAnimationFrame(r));
}

function* map(iter, mapper) {
  for (var _iterator4 = iter, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
    var _ref8;

    if (_isArray4) {
      if (_i4 >= _iterator4.length) break;
      _ref8 = _iterator4[_i4++];
    } else {
      _i4 = _iterator4.next();
      if (_i4.done) break;
      _ref8 = _i4.value;
    }

    var e = _ref8;
    yield mapper(e);
  }
}