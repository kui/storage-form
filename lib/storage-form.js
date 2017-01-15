"use strict";

exports.__esModule = true;

var submit = (() => {
  var _ref4 = _asyncToGenerator(function* (self) {
    if (self.binder) yield self.binder.submit(elements(self));
  });

  return function submit(_x) {
    return _ref4.apply(this, arguments);
  };
})();

var sync = (() => {
  var _ref5 = _asyncToGenerator(function* (self, targets) {
    if (self.binder) yield self.binder.sync(targets ? targets : elements(self));
  });

  return function sync(_x2, _x3) {
    return _ref5.apply(this, arguments);
  };
})();

var scan = (() => {
  var _ref6 = _asyncToGenerator(function* (self) {
    if (self.binder) yield self.binder.scan(elements(self));
  });

  return function scan(_x4) {
    return _ref6.apply(this, arguments);
  };
})();

var remove = (() => {
  var _ref7 = _asyncToGenerator(function* (self, elems) {
    if (self.binder) yield self.binder.remove(elems);
  });

  return function remove(_x5, _x6) {
    return _ref7.apply(this, arguments);
  };
})();

var initBinder = (() => {
  var _ref10 = _asyncToGenerator(function* (self) {
    self.binder = null;

    var h = getAreaHandler(self);
    if (!h) return;

    self.binder = new _binder2.default(h, { write: writeForm, read: readForm });
    if (self.isInitLoad) {
      self.isInitLoad = false;
      yield sync(self);
    } else {
      yield submit(self);
    }

    self.dispatchEvent(new CustomEvent("storage-form-init", { detail: { target: self } }));
  });

  return function initBinder(_x7) {
    return _ref10.apply(this, arguments);
  };
})();

exports.mixinStorageForm = mixinStorageForm;

var _utils = require("./utils");

var u = _interopRequireWildcard(_utils);

var _binder = require("./binder");

var _binder2 = _interopRequireDefault(_binder);

var _areaHandler = require("./area-handler");

var ah = _interopRequireWildcard(_areaHandler);

var _areaSelect = require("./area-select");

var _areaSelect2 = _interopRequireDefault(_areaSelect);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var DEFAULT_SYNC_INTERVAL = 700;

function mixinStorageForm(c) {
  // $FlowFixMe Force cast to the returned type.
  return class extends c {

    get autosync() {
      var n = parseInt(getAttr(this, "autosync"));
      return n > 0 ? n : DEFAULT_SYNC_INTERVAL;
    }
    set autosync(v) {
      setAttr(this, "autosync", v);
    }
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
      this.componentObservers = new Map();

      initBinder(this);

      this.addEventListener("submit", event => {
        event.preventDefault();
        submit(this);
      });

      window.addEventListener("unload", () => {
        if (isAutoSyncEnabled(this)) {
          sync(this);
        }
      });

      new MutationObserver(records => {
        console.debug("scan by form MutationObserver: ", this);
        scan(this);

        var added = flatten(records.map(r => r.addedNodes)).filter(e => e instanceof HTMLElement);
        if (added.length > 0) {
          for (var _iterator = added, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
            var _ref;

            if (_isArray) {
              if (_i >= _iterator.length) break;
              _ref = _iterator[_i++];
            } else {
              _i = _iterator.next();
              if (_i.done) break;
              _ref = _i.value;
            }

            var e = _ref;

            observeComponent(this, e);
          }
        }

        var removed = flatten(records.map(r => r.removedNodes)).filter(e => e instanceof HTMLElement);
        if (removed.length > 0) {
          // Use any to force cast to Array<FormComponentElements>
          remove(this, removed.filter(e => e.name));
          for (var _iterator2 = removed, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
            var _ref2;

            if (_isArray2) {
              if (_i2 >= _iterator2.length) break;
              _ref2 = _iterator2[_i2++];
            } else {
              _i2 = _iterator2.next();
              if (_i2.done) break;
              _ref2 = _i2.value;
            }

            var _e = _ref2;

            disconnectComponent(this, _e);
          }
        }
      }).observe(this, { childList: true, subtree: true });

      scan(this);

      // Periodical scan/sync
      // To observe:
      //   * storage value changings
      //   * external form components (such as a <input form="..." ...>)
      //   * form value changings by an external javascript
      _asyncToGenerator(function* () {
        while (true) {
          yield u.sleep(_this.autosync);
          if (isAutoSyncEnabled(_this)) {
            yield sync(_this);
          } else {
            yield scan(_this);
          }
        }
      })();
    }

    attachedCallback() {
      scan(this);
    }

    static get observedAttributes() {
      return ["autosync", "area"];
    }

    attributeChangedCallback(attrName) {
      switch (attrName) {
        case "autosync":
          break;
        case "area":
          initBinder(this);
          break;
      }
    }
  };
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
  }
}

exports.default = HTMLStorageFormElement;
function isAutoSyncEnabled(self) {
  return self.hasAttribute("autosync");
}

function observeComponent(self, newElement) {
  var elements =
  // force cast
  [newElement, ...Array.from(newElement.querySelectorAll("*"))].filter(e => e.value != null && e.name != null);

  var _loop = function _loop(e) {
    var o = new MutationObserver(() => sync(self, [e]));
    o.observe(e, { attributes: true, atributeFilter: ["name"] });
    self.componentObservers.set(e, o);
  };

  for (var _iterator3 = elements, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
    var _ref8;

    if (_isArray3) {
      if (_i3 >= _iterator3.length) break;
      _ref8 = _iterator3[_i3++];
    } else {
      _i3 = _iterator3.next();
      if (_i3.done) break;
      _ref8 = _i3.value;
    }

    var e = _ref8;

    _loop(e);
  }
}

function disconnectComponent(self, element) {
  var elements = [element, ...Array.from(element.querySelectorAll("*"))];
  for (var _iterator4 = elements, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
    var _ref9;

    if (_isArray4) {
      if (_i4 >= _iterator4.length) break;
      _ref9 = _iterator4[_i4++];
    } else {
      _i4 = _iterator4.next();
      if (_i4.done) break;
      _ref9 = _i4.value;
    }

    var e = _ref9;

    var o = self.componentObservers.get(e);
    if (o == null) continue;
    self.componentObservers.delete(e);
    o.disconnect();
  }
}

function elements(self) {
  return Array.from(self.elements).filter(e => e.name).filter(e => !(e instanceof _areaSelect2.default));
}

function writeForm(component, newValue) {
  var type = component.type;
  if (type === "checkbox" || type === "radio") {
    component.checked = newValue === component.value;
    return;
  }

  if (newValue == null || component.value == null) return;

  component.value = newValue;
}

function readForm(component) {
  var type = component.type;
  if (type === "checkbox" || type === "radio") {
    return component.checked ? component.value : null;
  }
  return component.value;
}

function getAreaHandler(self) {
  var a = self.area;
  if (!a) {
    console.debug("Require 'area' attribute", self);
    return null;
  }
  var h = ah.findHandler(a);
  if (!h) {
    console.debug("No such area handler: area=%s, this=%o", self.area, self);
    return null;
  }
  return h;
}

function getAttr(self, name) {
  var v = self.getAttribute(name);
  return v ? v : "";
}
function setAttr(self, name, value) {
  if (value == null) return;
  self.setAttribute(name, value);
}

function flatten(iteriter) {
  return Array.from(function* () {
    for (var _iterator5 = iteriter, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {
      var _ref11;

      if (_isArray5) {
        if (_i5 >= _iterator5.length) break;
        _ref11 = _iterator5[_i5++];
      } else {
        _i5 = _iterator5.next();
        if (_i5.done) break;
        _ref11 = _i5.value;
      }

      var iter = _ref11;
      for (var _iterator6 = iter, _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : _iterator6[Symbol.iterator]();;) {
        var _ref12;

        if (_isArray6) {
          if (_i6 >= _iterator6.length) break;
          _ref12 = _iterator6[_i6++];
        } else {
          _i6 = _iterator6.next();
          if (_i6.done) break;
          _ref12 = _i6.value;
        }

        var t = _ref12;
        yield t;
      }
    }
  }());
}