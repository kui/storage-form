/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _storageForm = __webpack_require__(4);
	
	var _storageForm2 = _interopRequireDefault(_storageForm);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	// Custom Element v1 seems not to works right to extend <form> in Google Chrome 55
	// customElements.define("storage-form", StorageFormElement, { extends: "form" });
	// window.StorageFormElement = StorageFormElement;
	
	// Custom Element v0
	// $FlowFixMe Force define to avoid to affect code of `storage-form.js` by Custom Element v0
	Object.defineProperty(_storageForm2.default, "extends", { get: () => "form" });
	document.registerElement("storage-form", _storageForm2.default);

/***/ },
/* 1 */
/***/ function(module, exports) {

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

/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";
	
	exports.__esModule = true;
	exports.registerHandler = registerHandler;
	exports.findHandler = findHandler;
	/* global chrome */
	
	var handlers = {};
	
	function registerHandler(area, handler) {
	  if (handlers[area]) {
	    throw Error(`Already registered handler for "${ area }"`);
	  }
	  handlers[area] = handler;
	}
	
	function findHandler(area) {
	  return handlers[area];
	}
	
	//
	
	class WebStorageAreaHandler {
	
	  constructor(storage) {
	    this.storage = storage;
	  }
	
	  read(name) {
	    return Promise.resolve(this.storage.getItem(name));
	  }
	
	  write(name, newValue) {
	    this.storage.setItem(name, newValue);
	    return Promise.resolve();
	  }
	
	  remove(name) {
	    this.storage.removeItem(name);
	    return Promise.resolve();
	  }
	}
	
	exports.WebStorageAreaHandler = WebStorageAreaHandler;
	if (localStorage) registerHandler("local-storage", new WebStorageAreaHandler(localStorage));
	if (sessionStorage) registerHandler("session-storage", new WebStorageAreaHandler(sessionStorage));
	
	//
	
	class ChromeStorageAreaHandler {
	
	  constructor(storage) {
	    this.storage = storage;
	  }
	
	  read(name) {
	    return new Promise(resolve => this.storage.get(name, v => resolve(v[name])));
	  }
	
	  write(name, newValue) {
	    return new Promise(resolve => this.storage.set({ [name]: newValue }, resolve));
	  }
	
	  remove(name) {
	    return new Promise(resolve => this.storage.remove(name, resolve));
	  }
	}
	
	exports.ChromeStorageAreaHandler = ChromeStorageAreaHandler;
	if (chrome && chrome.storage) {
	  if (chrome.storage.local) registerHandler("chrome-local", new ChromeStorageAreaHandler(chrome.storage.local));
	  if (chrome.storage.sync) registerHandler("chrome-sync", new ChromeStorageAreaHandler(chrome.storage.sync));
	}

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

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
	
	var _utils = __webpack_require__(1);
	
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

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

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
	
	    self.binder = new _binder2.default(h, { write: writeForm,
	      read: readForm });
	    yield sync(self);
	  });
	
	  return function initBinder(_x7) {
	    return _ref10.apply(this, arguments);
	  };
	})();
	
	exports.mixinStorageForm = mixinStorageForm;
	
	var _utils = __webpack_require__(1);
	
	var u = _interopRequireWildcard(_utils);
	
	var _areaHandler = __webpack_require__(2);
	
	var ah = _interopRequireWildcard(_areaHandler);
	
	var _binder = __webpack_require__(3);
	
	var _binder2 = _interopRequireDefault(_binder);
	
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
	
	      initBinder(this);
	      this.componentObservers = new Map();
	
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
	
	var mixed = mixinStorageForm(HTMLFormElement);
	class HTMLStorageFormElement extends mixed {}
	
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
	  return Array.from(self.elements).filter(e => e.name);
	}
	
	function writeForm(component, newValue) {
	  component;
	  var type = component.type;
	  if (type === "checkbox" || type === "radio") {
	    component.checked = newValue === component.value;
	    return;
	  }
	
	  if (newValue == null || component.value == null) return;
	
	  component.value = newValue;
	}
	
	function readForm(component) {
	  component;
	  var type = component.type;
	  if (type === "checkbox" || type === "radio") {
	    return component.checked ? component.value : null;
	  }
	  return component.value;
	}
	
	function getAreaHandler(self) {
	  var a = self.area;
	  if (!a) {
	    console.error("Require 'area' attribute");
	    return null;
	  }
	  var h = ah.findHandler(a);
	  if (!h) {
	    console.error("No such area handler: area=%s", self.area);
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

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNjI4N2RhMDY3NzZiNDczNzEyODQiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0b3JhZ2UtZWxlbWVudHMtcmVnaXN0ZXJlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FyZWEtaGFuZGxlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYmluZGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9zdG9yYWdlLWZvcm0uanMiXSwibmFtZXMiOlsiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXQiLCJkb2N1bWVudCIsInJlZ2lzdGVyRWxlbWVudCIsInNsZWVwIiwiZGVkdXAiLCJzdWJ0cmFjdFNldCIsIkNhbmNlbGxhYmxlUHJvbWlzZSIsIlByb21pc2UiLCJjb25zdHJ1Y3RvciIsImNhbGxiYWNrIiwiY2FuY2VsbCIsImNhbmNlbGxGdW5jdGlvbiIsIm1zZWMiLCJ0aW1lb3V0SWQiLCJyZXNvbHZlIiwic2V0VGltZW91dCIsImNsZWFyVGltZW91dCIsImFycmF5IiwicHJlZGljYXRlIiwidCIsIm8iLCJyZWR1Y2UiLCJyZXN1bHQiLCJlbGVtZW50Iiwic29tZSIsImkiLCJjb25jYXQiLCJ0YXJnZXRTZXQiLCJyZW1vdmVkU2V0IiwiU2V0IiwiQXJyYXkiLCJmcm9tIiwiZmlsdGVyIiwiZSIsImhhcyIsIk11bHRpVmFsdWVNYXAiLCJNYXAiLCJmbGF0dGVuVmFsdWVzIiwidmFsdWVzIiwiYXJyIiwidiIsIkFycmF5VmFsdWVNYXAiLCJhZGQiLCJrZXkiLCJ2YWx1ZSIsImEiLCJzZXQiLCJwdXNoIiwiU2V0VmFsdWVNYXAiLCJyZWdpc3RlckhhbmRsZXIiLCJmaW5kSGFuZGxlciIsImhhbmRsZXJzIiwiYXJlYSIsImhhbmRsZXIiLCJFcnJvciIsIldlYlN0b3JhZ2VBcmVhSGFuZGxlciIsInN0b3JhZ2UiLCJyZWFkIiwibmFtZSIsImdldEl0ZW0iLCJ3cml0ZSIsIm5ld1ZhbHVlIiwic2V0SXRlbSIsInJlbW92ZSIsInJlbW92ZUl0ZW0iLCJsb2NhbFN0b3JhZ2UiLCJzZXNzaW9uU3RvcmFnZSIsIkNocm9tZVN0b3JhZ2VBcmVhSGFuZGxlciIsImNocm9tZSIsImxvY2FsIiwic3luYyIsInNlbGYiLCJ0YXJnZXRzIiwiYWxsIiwibWFwIiwibG9hZCIsInN0b3JlIiwiZG9TeW5jIiwiZm4iLCJsb2NrIiwic3luY0Jsb2NrIiwiZWxlbSIsIm5ld04iLCJuZXdWIiwicyIsIm52IiwiZiIsImZhbGxiYWNrSWZOdWxsIiwiZ2V0VmFsdWVCeU5hbWUiLCJ1IiwiQmluZGVyIiwic3VibWl0Iiwic2NhbiIsIm5ld0VsZW1lbnRzIiwia2V5cyIsImVsZW1lbnRzIiwiZGVsZXRlIiwiZm5zIiwiYmluZGVyIiwiZWxlbXMiLCJoIiwiZ2V0QXJlYUhhbmRsZXIiLCJ3cml0ZUZvcm0iLCJyZWFkRm9ybSIsImluaXRCaW5kZXIiLCJtaXhpblN0b3JhZ2VGb3JtIiwiYWgiLCJERUZBVUxUX1NZTkNfSU5URVJWQUwiLCJjIiwiYXV0b3N5bmMiLCJuIiwicGFyc2VJbnQiLCJnZXRBdHRyIiwic2V0QXR0ciIsImNyZWF0ZWRDYWxsYmFjayIsImNvbXBvbmVudE9ic2VydmVycyIsImFkZEV2ZW50TGlzdGVuZXIiLCJldmVudCIsInByZXZlbnREZWZhdWx0Iiwid2luZG93IiwiaXNBdXRvU3luY0VuYWJsZWQiLCJNdXRhdGlvbk9ic2VydmVyIiwicmVjb3JkcyIsImNvbnNvbGUiLCJkZWJ1ZyIsImFkZGVkIiwiZmxhdHRlbiIsInIiLCJhZGRlZE5vZGVzIiwiSFRNTEVsZW1lbnQiLCJsZW5ndGgiLCJvYnNlcnZlQ29tcG9uZW50IiwicmVtb3ZlZCIsInJlbW92ZWROb2RlcyIsImRpc2Nvbm5lY3RDb21wb25lbnQiLCJvYnNlcnZlIiwiY2hpbGRMaXN0Iiwic3VidHJlZSIsImF0dGFjaGVkQ2FsbGJhY2siLCJvYnNlcnZlZEF0dHJpYnV0ZXMiLCJhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2siLCJhdHRyTmFtZSIsIm1peGVkIiwiSFRNTEZvcm1FbGVtZW50IiwiSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCIsImhhc0F0dHJpYnV0ZSIsIm5ld0VsZW1lbnQiLCJxdWVyeVNlbGVjdG9yQWxsIiwiYXR0cmlidXRlcyIsImF0cmlidXRlRmlsdGVyIiwiZGlzY29ubmVjdCIsImNvbXBvbmVudCIsInR5cGUiLCJjaGVja2VkIiwiZXJyb3IiLCJnZXRBdHRyaWJ1dGUiLCJzZXRBdHRyaWJ1dGUiLCJpdGVyaXRlciIsIml0ZXIiXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7QUN0Q0E7Ozs7OztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0FBLFFBQU9DLGNBQVAsd0JBQTBDLFNBQTFDLEVBQXFELEVBQUVDLEtBQUssTUFBTSxNQUFiLEVBQXJEO0FBQ0FDLFVBQVNDLGVBQVQsQ0FBeUIsY0FBekIseUI7Ozs7Ozs7OztTQ1NnQkMsSyxHQUFBQSxLO1NBWUFDLEssR0FBQUEsSztTQVFBQyxXLEdBQUFBLFc7QUF0Q1QsT0FBTUMsa0JBQU4sU0FBb0NDLE9BQXBDLENBQStDO0FBRXBEQyxlQUNFQyxRQURGLEVBS0VDLE9BTEYsRUFNRTtBQUNBLFdBQU1ELFFBQU47QUFDQSxVQUFLRSxlQUFMLEdBQXVCRCxPQUF2QjtBQUNEOztBQUVEQSxhQUFVO0FBQ1IsVUFBS0MsZUFBTDtBQUNEO0FBZm1EOztTQUF6Q0wsa0IsR0FBQUEsa0I7QUFrQk4sVUFBU0gsS0FBVCxDQUFlUyxJQUFmLEVBQXVEO0FBQzVELE9BQUlDLGtCQUFKO0FBQ0EsVUFBTyxJQUFJUCxrQkFBSixDQUNKUSxPQUFELElBQWE7QUFDWEQsaUJBQVlFLFdBQVcsTUFBTUQsU0FBakIsRUFBNEJGLElBQTVCLENBQVo7QUFDRCxJQUhJLEVBSUwsTUFBTTtBQUNKSSxrQkFBYUgsU0FBYjtBQUNELElBTkksQ0FBUDtBQVFEOztBQUVNLFVBQVNULEtBQVQsQ0FBa0JhLEtBQWxCLEVBQ3FGO0FBQUEsT0FBbkVDLFNBQW1FLHVFQUE3QixDQUFDQyxDQUFELEVBQUlDLENBQUosS0FBVUQsTUFBTUMsQ0FBYTs7QUFDMUYsVUFBT0gsTUFBTUksTUFBTixDQUFhLENBQUNDLE1BQUQsRUFBbUJDLE9BQW5CLEtBQStCO0FBQ2pELFNBQUlELE9BQU9FLElBQVAsQ0FBYUMsQ0FBRCxJQUFPUCxVQUFVTyxDQUFWLEVBQWFGLE9BQWIsQ0FBbkIsQ0FBSixFQUErQ0Q7QUFDL0MsWUFBT0EsT0FBT0ksTUFBUCxDQUFjSCxPQUFkLENBQVA7QUFDRCxJQUhNLEVBR0wsRUFISyxDQUFQO0FBSUQ7O0FBRU0sVUFBU2xCLFdBQVQsQ0FBd0JzQixTQUF4QixFQUEyQ0MsVUFBM0MsRUFBdUU7QUFDNUUsVUFBTyxJQUFJQyxHQUFKLENBQVFDLE1BQU1DLElBQU4sQ0FBV0osU0FBWCxFQUFzQkssTUFBdEIsQ0FBOEJDLENBQUQsSUFBTyxDQUFDTCxXQUFXTSxHQUFYLENBQWVELENBQWYsQ0FBckMsQ0FBUixDQUFQO0FBQ0Q7O0FBRUQsT0FBTUUsYUFBTixTQUFrREMsR0FBbEQsQ0FBNEQ7QUFDMUQsSUFBRUMsYUFBRixHQUErQjtBQUM3QiwwQkFBa0IsS0FBS0MsTUFBTCxFQUFsQixrSEFBaUM7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLFdBQXRCQyxHQUFzQjs7QUFDL0IsNkJBQWdCQSxHQUFoQix5SEFBcUI7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLGFBQVZDLENBQVU7O0FBQ25CLGVBQU1BLENBQU47QUFDRDtBQUNGO0FBQ0Y7QUFQeUQ7O0FBVXJELE9BQU1DLGFBQU4sU0FBa0NOLGFBQWxDLENBQWdFO0FBQ3JFTyxPQUFJQyxHQUFKLEVBQVlDLEtBQVosRUFBNEI7QUFDMUIsU0FBSUMsSUFBSSxLQUFLN0MsR0FBTCxDQUFTMkMsR0FBVCxDQUFSO0FBQ0EsU0FBSSxDQUFDRSxDQUFMLEVBQVE7QUFDTkEsV0FBSSxFQUFKO0FBQ0EsWUFBS0MsR0FBTCxDQUFTSCxHQUFULEVBQWNFLENBQWQ7QUFDRDtBQUNEQSxPQUFFRSxJQUFGLENBQU9ILEtBQVA7QUFDQSxZQUFPLElBQVA7QUFDRDtBQVRvRTs7U0FBMURILGEsR0FBQUEsYTtBQVlOLE9BQU1PLFdBQU4sU0FBZ0NiLGFBQWhDLENBQTREO0FBQ2pFTyxPQUFJQyxHQUFKLEVBQVlDLEtBQVosRUFBNEI7QUFDMUIsU0FBSUMsSUFBSSxLQUFLN0MsR0FBTCxDQUFTMkMsR0FBVCxDQUFSO0FBQ0EsU0FBSSxDQUFDRSxDQUFMLEVBQVE7QUFDTkEsV0FBSSxJQUFJaEIsR0FBSixFQUFKO0FBQ0EsWUFBS2lCLEdBQUwsQ0FBU0gsR0FBVCxFQUFjRSxDQUFkO0FBQ0Q7QUFDREEsT0FBRUgsR0FBRixDQUFNRSxLQUFOO0FBQ0EsWUFBTyxJQUFQO0FBQ0Q7QUFUZ0U7U0FBdERJLFcsR0FBQUEsVzs7Ozs7Ozs7O1NDcERHQyxlLEdBQUFBLGU7U0FPQUMsVyxHQUFBQSxXO0FBbkJoQjs7QUFVQSxLQUFNQyxXQUEwQyxFQUFoRDs7QUFFTyxVQUFTRixlQUFULENBQXlCRyxJQUF6QixFQUFxQ0MsT0FBckMsRUFBaUU7QUFDdEUsT0FBSUYsU0FBU0MsSUFBVCxDQUFKLEVBQW9CO0FBQ2xCLFdBQU1FLE1BQU8sb0NBQWtDRixJQUFLLElBQTlDLENBQU47QUFDRDtBQUNERCxZQUFTQyxJQUFULElBQWlCQyxPQUFqQjtBQUNEOztBQUVNLFVBQVNILFdBQVQsQ0FBcUJFLElBQXJCLEVBQStDO0FBQ3BELFVBQU9ELFNBQVNDLElBQVQsQ0FBUDtBQUNEOztBQUVEOztBQUVPLE9BQU1HLHFCQUFOLENBQTRCOztBQUdqQy9DLGVBQVlnRCxPQUFaLEVBQThCO0FBQzVCLFVBQUtBLE9BQUwsR0FBZUEsT0FBZjtBQUNEOztBQUVEQyxRQUFLQyxJQUFMLEVBQXFDO0FBQ25DLFlBQU9uRCxRQUFRTyxPQUFSLENBQWdCLEtBQUswQyxPQUFMLENBQWFHLE9BQWIsQ0FBcUJELElBQXJCLENBQWhCLENBQVA7QUFDRDs7QUFFREUsU0FBTUYsSUFBTixFQUFvQkcsUUFBcEIsRUFBcUQ7QUFDbkQsVUFBS0wsT0FBTCxDQUFhTSxPQUFiLENBQXFCSixJQUFyQixFQUEyQkcsUUFBM0I7QUFDQSxZQUFPdEQsUUFBUU8sT0FBUixFQUFQO0FBQ0Q7O0FBRURpRCxVQUFPTCxJQUFQLEVBQW9DO0FBQ2xDLFVBQUtGLE9BQUwsQ0FBYVEsVUFBYixDQUF3Qk4sSUFBeEI7QUFDQSxZQUFPbkQsUUFBUU8sT0FBUixFQUFQO0FBQ0Q7QUFuQmdDOztTQUF0QnlDLHFCLEdBQUFBLHFCO0FBc0JiLEtBQUlVLFlBQUosRUFDRWhCLGdCQUFnQixlQUFoQixFQUFpQyxJQUFJTSxxQkFBSixDQUEwQlUsWUFBMUIsQ0FBakM7QUFDRixLQUFJQyxjQUFKLEVBQ0VqQixnQkFBZ0IsaUJBQWhCLEVBQW1DLElBQUlNLHFCQUFKLENBQTBCVyxjQUExQixDQUFuQzs7QUFFRjs7QUFFTyxPQUFNQyx3QkFBTixDQUErQjs7QUFHcEMzRCxlQUFZZ0QsT0FBWixFQUF3QztBQUN0QyxVQUFLQSxPQUFMLEdBQWVBLE9BQWY7QUFDRDs7QUFFREMsUUFBS0MsSUFBTCxFQUFxQztBQUNuQyxZQUFPLElBQUluRCxPQUFKLENBQWFPLE9BQUQsSUFBYSxLQUFLMEMsT0FBTCxDQUFheEQsR0FBYixDQUFpQjBELElBQWpCLEVBQXdCbEIsQ0FBRCxJQUFPMUIsUUFBUTBCLEVBQUVrQixJQUFGLENBQVIsQ0FBOUIsQ0FBekIsQ0FBUDtBQUNEOztBQUVERSxTQUFNRixJQUFOLEVBQW9CRyxRQUFwQixFQUFxRDtBQUNuRCxZQUFPLElBQUl0RCxPQUFKLENBQWFPLE9BQUQsSUFBYSxLQUFLMEMsT0FBTCxDQUFhVixHQUFiLENBQWlCLEVBQUUsQ0FBQ1ksSUFBRCxHQUFRRyxRQUFWLEVBQWpCLEVBQXVDL0MsT0FBdkMsQ0FBekIsQ0FBUDtBQUNEOztBQUVEaUQsVUFBT0wsSUFBUCxFQUFvQztBQUNsQyxZQUFPLElBQUluRCxPQUFKLENBQWFPLE9BQUQsSUFBYSxLQUFLMEMsT0FBTCxDQUFhTyxNQUFiLENBQW9CTCxJQUFwQixFQUEwQjVDLE9BQTFCLENBQXpCLENBQVA7QUFDRDtBQWpCbUM7O1NBQXpCcUQsd0IsR0FBQUEsd0I7QUFvQmIsS0FBSUMsVUFBVUEsT0FBT1osT0FBckIsRUFBOEI7QUFDNUIsT0FBSVksT0FBT1osT0FBUCxDQUFlYSxLQUFuQixFQUNFcEIsZ0JBQWdCLGNBQWhCLEVBQWdDLElBQUlrQix3QkFBSixDQUE2QkMsT0FBT1osT0FBUCxDQUFlYSxLQUE1QyxDQUFoQztBQUNGLE9BQUlELE9BQU9aLE9BQVAsQ0FBZWMsSUFBbkIsRUFDRXJCLGdCQUFnQixhQUFoQixFQUErQixJQUFJa0Isd0JBQUosQ0FBNkJDLE9BQU9aLE9BQVAsQ0FBZWMsSUFBNUMsQ0FBL0I7QUFDSCxFOzs7Ozs7Ozs7OztpQ0NwQkQsV0FBc0JDLElBQXRCLEVBQW9DQyxPQUFwQyxFQUE2RDtBQUMzRCxXQUFNakUsUUFBUWtFLEdBQVIsQ0FBWUQsUUFBUUUsR0FBUjtBQUFBLHFDQUFZLFdBQU96QyxDQUFQLEVBQWE7QUFDekMsZUFBTTBDLEtBQUtKLElBQUwsRUFBV3RDLENBQVgsQ0FBTjtBQUNBLGVBQU0yQyxNQUFNTCxJQUFOLEVBQVl0QyxDQUFaLENBQU47QUFDRCxRQUhpQjs7QUFBQTtBQUFBO0FBQUE7QUFBQSxVQUFaLENBQU47QUFJRCxJOzttQkFMYzRDLE07Ozs7OztpQ0FPZixXQUF5Qk4sSUFBekIsRUFBdUNPLEVBQXZDLEVBQWlFO0FBQy9ELFlBQU9QLEtBQUtRLElBQVo7QUFBa0IsYUFBTVIsS0FBS1EsSUFBWDtBQUFsQixNQUNBUixLQUFLUSxJQUFMLEdBQVlELElBQVo7QUFDQSxXQUFNUCxLQUFLUSxJQUFYO0FBQ0FSLFVBQUtRLElBQUwsR0FBWSxJQUFaO0FBQ0QsSTs7bUJBTGNDLFM7Ozs7OztpQ0FPZixXQUFvQlQsSUFBcEIsRUFBa0NVLElBQWxDLEVBQWdFO0FBQzlELFNBQU1DLE9BQU9ELEtBQUt2QixJQUFsQjtBQUNBLFNBQU15QixPQUFPLE1BQU1aLEtBQUthLENBQUwsQ0FBTzNCLElBQVAsQ0FBWXlCLElBQVosQ0FBbkI7QUFDQSxTQUFJRyxLQUFpQmQsS0FBSy9CLENBQUwsQ0FBT3hDLEdBQVAsQ0FBV2lGLElBQVgsQ0FBckI7QUFDQSxTQUFJLENBQUNJLEVBQUwsRUFBUztBQUNQQSxZQUFLLEVBQUUzQixNQUFNdUIsS0FBS3ZCLElBQWIsRUFBbUJkLE9BQU8sSUFBMUIsRUFBTDtBQUNBMkIsWUFBSy9CLENBQUwsQ0FBT00sR0FBUCxDQUFXbUMsSUFBWCxFQUFpQkksRUFBakI7QUFDRDtBQUNELFNBQUlBLEdBQUczQixJQUFILEtBQVl3QixJQUFaLElBQW9CRyxHQUFHekMsS0FBSCxLQUFhdUMsSUFBckMsRUFBMkM7QUFDekNaLFlBQUtlLENBQUwsQ0FBTzFCLEtBQVAsQ0FBYXFCLElBQWIsRUFBbUJFLElBQW5CO0FBQ0FFLFVBQUczQixJQUFILEdBQVd3QixJQUFYO0FBQ0FHLFVBQUd6QyxLQUFILEdBQVl1QyxJQUFaO0FBQ0Q7QUFDRixJOzttQkFiY1IsSTs7Ozs7O2lDQWVmLFdBQXFCSixJQUFyQixFQUFtQ1UsSUFBbkMsRUFBaUU7QUFDL0QsU0FBTUMsT0FBT0QsS0FBS3ZCLElBQWxCO0FBQ0EsU0FBTXlCLE9BQU9JLGVBQWU7QUFBQSxjQUFNaEIsS0FBS2UsQ0FBTCxDQUFPN0IsSUFBUCxDQUFZd0IsSUFBWixDQUFOO0FBQUEsTUFBZixFQUNlO0FBQUEsY0FBTU8sZUFBZWpCLElBQWYsRUFBcUJXLElBQXJCLENBQU47QUFBQSxNQURmLENBQWI7QUFFQSxTQUFJRyxLQUFpQmQsS0FBSy9CLENBQUwsQ0FBT3hDLEdBQVAsQ0FBV2lGLElBQVgsQ0FBckI7QUFDQSxTQUFJLENBQUNJLEVBQUwsRUFBUztBQUNQQSxZQUFLLEVBQUUzQixNQUFNdUIsS0FBS3ZCLElBQWIsRUFBbUJkLE9BQU8sSUFBMUIsRUFBTDtBQUNBMkIsWUFBSy9CLENBQUwsQ0FBT00sR0FBUCxDQUFXbUMsSUFBWCxFQUFpQkksRUFBakI7QUFDRDtBQUNELFNBQUlBLEdBQUczQixJQUFILEtBQVl3QixJQUFaLElBQW9CRyxHQUFHekMsS0FBSCxLQUFhdUMsSUFBckMsRUFBMkM7QUFDekMsV0FBSUEsUUFBUSxJQUFaLEVBQWtCO0FBQ2hCLGVBQU1aLEtBQUthLENBQUwsQ0FBT3JCLE1BQVAsQ0FBY21CLElBQWQsQ0FBTjtBQUNELFFBRkQsTUFFTztBQUNMLGVBQU1YLEtBQUthLENBQUwsQ0FBT3hCLEtBQVAsQ0FBYXNCLElBQWIsRUFBbUJDLElBQW5CLENBQU47QUFDRDtBQUNERSxVQUFHM0IsSUFBSCxHQUFXd0IsSUFBWDtBQUNBRyxVQUFHekMsS0FBSCxHQUFZdUMsSUFBWjtBQUNEO0FBQ0YsSTs7bUJBbEJjUCxLOzs7OztBQXhGZjs7S0FBWWEsQzs7Ozs7O0FBbUJHLE9BQU1DLE1BQU4sQ0FBYTs7QUFNMUJsRixlQUFZNEUsQ0FBWixFQUErQkUsQ0FBL0IsRUFBK0M7QUFDN0MsVUFBSzlDLENBQUwsR0FBUyxJQUFJSixHQUFKLEVBQVQ7QUFDQSxVQUFLZ0QsQ0FBTCxHQUFTQSxDQUFUO0FBQ0EsVUFBS0UsQ0FBTCxHQUFTQSxDQUFUO0FBQ0EsVUFBS1AsSUFBTCxHQUFZLElBQVo7QUFDRDs7QUFFS1QsT0FBTixDQUFXRSxPQUFYLEVBQW1EO0FBQUE7O0FBQUE7QUFDakQsYUFBTVEsaUJBQWdCO0FBQUEsZ0JBQU1ILGNBQWFMLE9BQWIsQ0FBTjtBQUFBLFFBQWhCLENBQU47QUFEaUQ7QUFFbEQ7O0FBRUQ7QUFDTW1CLFNBQU4sQ0FBYW5CLE9BQWIsRUFBcUQ7QUFBQTs7QUFBQTtBQUNuRCxhQUFNUSxrQkFBZ0I7QUFBQSxnQkFBTXpFLFFBQVFrRSxHQUFSLENBQVlELFFBQVFFLEdBQVI7QUFBQSx3Q0FBWSxXQUFPekMsQ0FBUCxFQUFhO0FBQy9ELG1CQUFNMkMsY0FBWTNDLENBQVosQ0FBTjtBQUNELFlBRnVDOztBQUFBO0FBQUE7QUFBQTtBQUFBLGNBQVosQ0FBTjtBQUFBLFFBQWhCLENBQU47QUFEbUQ7QUFJcEQ7O0FBRUQ7QUFDTTJELE9BQU4sQ0FBV3BCLE9BQVgsRUFBbUQ7QUFBQTs7QUFBQTtBQUNqRCxhQUFNUSxvQ0FBZ0IsYUFBWTtBQUNoQyxhQUFNYSxjQUFjSixFQUFFcEYsV0FBRixDQUFjLElBQUl3QixHQUFKLENBQVEyQyxPQUFSLENBQWQsRUFBZ0MsSUFBSTNDLEdBQUosQ0FBUSxPQUFLVyxDQUFMLENBQU9zRCxJQUFQLEVBQVIsQ0FBaEMsQ0FBcEI7QUFDQSxlQUFNakIsZUFBYS9DLE1BQU1DLElBQU4sQ0FBVzhELFdBQVgsQ0FBYixDQUFOO0FBQ0QsUUFISyxFQUFOO0FBRGlEO0FBS2xEOztBQUVEO0FBQ005QixTQUFOLENBQWFnQyxRQUFiLEVBQXVDO0FBQUE7O0FBQUE7QUFDckMsYUFBTWYsb0NBQWdCLGFBQVk7QUFDaEMsOEJBQWdCZSxRQUFoQjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUEsZUFBVzlELEVBQVg7QUFBMEIsa0JBQUtPLENBQUwsQ0FBT3dELE1BQVAsQ0FBYy9ELEVBQWQ7QUFBMUI7QUFDRCxRQUZLLEVBQU47QUFEcUM7QUFJdEM7QUFyQ3lCOzttQkFBUHlELE07OztBQXlGckIsVUFBU0gsY0FBVCxHQUF1RDtBQUFBLHFDQUF6QlUsR0FBeUI7QUFBekJBLFFBQXlCO0FBQUE7O0FBQ3JELHlCQUFpQkEsR0FBakIseUhBQXNCO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxTQUFYbkIsRUFBVzs7QUFDcEIsU0FBTXRDLEtBQUlzQyxJQUFWO0FBQ0EsU0FBSXRDLE1BQUssSUFBVCxFQUFlLE9BQU9BLEVBQVA7QUFDaEI7QUFDRCxVQUFPLElBQVA7QUFDRDs7QUFFRCxVQUFTZ0QsY0FBVCxDQUF3QmpCLElBQXhCLEVBQXNDYixJQUF0QyxFQUEwRDtBQUN4RCx5QkFBaUJhLEtBQUsvQixDQUFMLENBQU9GLE1BQVAsRUFBakIseUhBQWtDO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxTQUF2QitDLEVBQXVCOztBQUNoQyxTQUFJQSxHQUFHM0IsSUFBSCxLQUFZQSxJQUFoQixFQUFzQixPQUFPMkIsR0FBR3pDLEtBQVY7QUFDdkI7QUFDRCxVQUFPLElBQVA7QUFDRCxFOzs7Ozs7Ozs7OztpQ0NRRCxXQUFzQjJCLElBQXRCLEVBQWdFO0FBQzlELFNBQUlBLEtBQUsyQixNQUFULEVBQWlCLE1BQU0zQixLQUFLMkIsTUFBTCxDQUFZUCxNQUFaLENBQW1CSSxTQUFTeEIsSUFBVCxDQUFuQixDQUFOO0FBQ2xCLEk7O21CQUZjb0IsTTs7Ozs7O2lDQUlmLFdBQW9CcEIsSUFBcEIsRUFBK0NDLE9BQS9DLEVBQXdGO0FBQ3RGLFNBQUlELEtBQUsyQixNQUFULEVBQWlCLE1BQU0zQixLQUFLMkIsTUFBTCxDQUFZNUIsSUFBWixDQUFpQkUsVUFBVUEsT0FBVixHQUFvQnVCLFNBQVN4QixJQUFULENBQXJDLENBQU47QUFDbEIsSTs7bUJBRmNELEk7Ozs7OztpQ0FJZixXQUFvQkMsSUFBcEIsRUFBOEQ7QUFDNUQsU0FBSUEsS0FBSzJCLE1BQVQsRUFBaUIsTUFBTTNCLEtBQUsyQixNQUFMLENBQVlOLElBQVosQ0FBaUJHLFNBQVN4QixJQUFULENBQWpCLENBQU47QUFDbEIsSTs7bUJBRmNxQixJOzs7Ozs7aUNBSWYsV0FBc0JyQixJQUF0QixFQUFpRDRCLEtBQWpELEVBQXVGO0FBQ3JGLFNBQUk1QixLQUFLMkIsTUFBVCxFQUFpQixNQUFNM0IsS0FBSzJCLE1BQUwsQ0FBWW5DLE1BQVosQ0FBbUJvQyxLQUFuQixDQUFOO0FBQ2xCLEk7O21CQUZjcEMsTTs7Ozs7O2tDQStCZixXQUEwQlEsSUFBMUIsRUFBb0U7QUFDbEVBLFVBQUsyQixNQUFMLEdBQWMsSUFBZDs7QUFFQSxTQUFNRSxJQUFJQyxlQUFlOUIsSUFBZixDQUFWO0FBQ0EsU0FBSSxDQUFDNkIsQ0FBTCxFQUFROztBQUVSN0IsVUFBSzJCLE1BQUwsR0FBYyxxQkFDWkUsQ0FEWSxFQUVaLEVBQUV4QyxPQUFPMEMsU0FBVDtBQUNFN0MsYUFBTThDLFFBRFIsRUFGWSxDQUFkO0FBS0EsV0FBTWpDLEtBQUtDLElBQUwsQ0FBTjtBQUNELEk7O21CQVpjaUMsVTs7Ozs7U0FqSkNDLGdCLEdBQUFBLGdCOztBQTNCaEI7O0tBQVloQixDOztBQUNaOztLQUFZaUIsRTs7QUFDWjs7Ozs7Ozs7OztBQXVCQSxLQUFNQyx3QkFBd0IsR0FBOUI7O0FBRU8sVUFBU0YsZ0JBQVQsQ0FBOENHLENBQTlDLEVBQW1GO0FBQ3hGO0FBQ0EsVUFBTyxjQUFjQSxDQUFkLENBQWdCOztBQUlyQixTQUFJQyxRQUFKLEdBQXVCO0FBQ3JCLFdBQU1DLElBQUlDLFNBQVNDLFFBQVEsSUFBUixFQUFjLFVBQWQsQ0FBVCxDQUFWO0FBQ0EsY0FBT0YsSUFBSSxDQUFKLEdBQVFBLENBQVIsR0FBWUgscUJBQW5CO0FBQ0Q7QUFDRCxTQUFJRSxRQUFKLENBQWFyRSxDQUFiLEVBQXFCO0FBQUV5RSxlQUFRLElBQVIsRUFBYyxVQUFkLEVBQTBCekUsQ0FBMUI7QUFBK0I7QUFDdEQsU0FBSVksSUFBSixHQUFvQjtBQUFFLGNBQU80RCxRQUFRLElBQVIsRUFBYyxNQUFkLENBQVA7QUFBK0I7QUFDckQsU0FBSTVELElBQUosQ0FBU1osQ0FBVCxFQUFpQjtBQUFFeUUsZUFBUSxJQUFSLEVBQWMsTUFBZCxFQUFzQnpFLENBQXRCO0FBQTJCOztBQUU5Q2hDLG1CQUFjO0FBQ1o7QUFDRDs7QUFFRDBHLHVCQUFrQjtBQUFBOztBQUNoQlYsa0JBQVcsSUFBWDtBQUNBLFlBQUtXLGtCQUFMLEdBQTBCLElBQUkvRSxHQUFKLEVBQTFCOztBQUVBLFlBQUtnRixnQkFBTCxDQUFzQixRQUF0QixFQUFpQ0MsS0FBRCxJQUFXO0FBQ3pDQSxlQUFNQyxjQUFOO0FBQ0EzQixnQkFBTyxJQUFQO0FBQ0QsUUFIRDs7QUFLQTRCLGNBQU9ILGdCQUFQLENBQXdCLFFBQXhCLEVBQWtDLE1BQU07QUFDdEMsYUFBSUksa0JBQWtCLElBQWxCLENBQUosRUFBNkI7QUFDM0JsRCxnQkFBSyxJQUFMO0FBQ0Q7QUFDRixRQUpEOztBQU1BLFdBQUltRCxnQkFBSixDQUFzQkMsT0FBRCxJQUFhO0FBQ2hDQyxpQkFBUUMsS0FBUixDQUFjLGlDQUFkLEVBQWlELElBQWpEO0FBQ0FoQyxjQUFLLElBQUw7O0FBRUEsYUFBTWlDLFFBQ0FDLFFBQVFKLFFBQVFoRCxHQUFSLENBQVlxRCxLQUFNQSxFQUFFQyxVQUFwQixDQUFSLEVBQ0NoRyxNQURELENBQ1NDLENBQUQsSUFBT0EsYUFBYWdHLFdBRDVCLENBRE47QUFHQSxhQUFJSixNQUFNSyxNQUFOLEdBQWUsQ0FBbkIsRUFBc0I7QUFDcEIsZ0NBQWdCTCxLQUFoQixrSEFBdUI7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLGlCQUFaNUYsQ0FBWTs7QUFDckJrRyw4QkFBaUIsSUFBakIsRUFBdUJsRyxDQUF2QjtBQUNEO0FBQ0Y7O0FBRUQsYUFBTW1HLFVBQ0FOLFFBQVFKLFFBQVFoRCxHQUFSLENBQWFxRCxDQUFELElBQVFBLEVBQUVNLFlBQXRCLENBQVIsRUFDQ3JHLE1BREQsQ0FDU0MsQ0FBRCxJQUFPQSxhQUFhZ0csV0FENUIsQ0FETjtBQUdBLGFBQUlHLFFBQVFGLE1BQVIsR0FBaUIsQ0FBckIsRUFBd0I7QUFDdEI7QUFDQW5FLGtCQUFPLElBQVAsRUFBY3FFLFFBQVFwRyxNQUFSLENBQWdCQyxDQUFELElBQVFBLENBQUQsQ0FBU3lCLElBQS9CLENBQWQ7QUFDQSxpQ0FBZ0IwRSxPQUFoQix5SEFBeUI7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLGlCQUFkbkcsRUFBYzs7QUFDdkJxRyxpQ0FBb0IsSUFBcEIsRUFBMEJyRyxFQUExQjtBQUNEO0FBQ0Y7QUFDRixRQXZCRCxFQXVCR3NHLE9BdkJILENBdUJXLElBdkJYLEVBdUJpQixFQUFFQyxXQUFXLElBQWIsRUFBbUJDLFNBQVMsSUFBNUIsRUF2QmpCOztBQXlCQTdDLFlBQUssSUFBTDs7QUFFQSx5QkFBQyxhQUFZO0FBQ1gsZ0JBQU8sSUFBUCxFQUFhO0FBQ1gsaUJBQU1ILEVBQUV0RixLQUFGLENBQVEsTUFBSzBHLFFBQWIsQ0FBTjtBQUNBLGVBQUlXLHdCQUFKLEVBQTZCO0FBQzNCLG1CQUFNbEQsV0FBTjtBQUNELFlBRkQsTUFFTztBQUNMLG1CQUFNc0IsV0FBTjtBQUNEO0FBQ0Y7QUFDRixRQVREO0FBVUQ7O0FBRUQ4Qyx3QkFBbUI7QUFDakI5QyxZQUFLLElBQUw7QUFDRDs7QUFFRCxnQkFBVytDLGtCQUFYLEdBQWdDO0FBQzlCLGNBQU8sQ0FDTCxVQURLLEVBRUwsTUFGSyxDQUFQO0FBSUQ7O0FBRURDLDhCQUF5QkMsUUFBekIsRUFBMkM7QUFDekMsZUFBUUEsUUFBUjtBQUNBLGNBQUssVUFBTDtBQUNFO0FBQ0YsY0FBSyxNQUFMO0FBQ0VyQyxzQkFBVyxJQUFYO0FBQ0E7QUFMRjtBQU9EO0FBekZvQixJQUF2QjtBQTJGRDs7QUFFRCxLQUFNc0MsUUFBUXJDLGlCQUFpQnNDLGVBQWpCLENBQWQ7QUFDZSxPQUFNQyxzQkFBTixTQUFxQ0YsS0FBckMsQ0FBMkM7O21CQUFyQ0Usc0I7QUFFckIsVUFBU3hCLGlCQUFULENBQTJCakQsSUFBM0IsRUFBMkQ7QUFDekQsVUFBT0EsS0FBSzBFLFlBQUwsQ0FBa0IsVUFBbEIsQ0FBUDtBQUNEOztBQWtCRCxVQUFTZCxnQkFBVCxDQUEwQjVELElBQTFCLEVBQXFEMkUsVUFBckQsRUFBb0Y7QUFDbEYsT0FBTW5EO0FBQ0E7QUFDQyxJQUFDbUQsVUFBRCxFQUFhLEdBQUdwSCxNQUFNQyxJQUFOLENBQVdtSCxXQUFXQyxnQkFBWCxDQUE0QixHQUE1QixDQUFYLENBQWhCLEVBQ0NuSCxNQURELENBQ1NDLENBQUQsSUFBUUEsQ0FBRCxDQUFTVyxLQUFULElBQWtCLElBQWxCLElBQTJCWCxDQUFELENBQVN5QixJQUFULElBQWlCLElBRDFELENBRlA7O0FBRGtGLDhCQU12RXpCLENBTnVFO0FBT2hGLFNBQU1iLElBQUksSUFBSXFHLGdCQUFKLENBQXFCLE1BQU1uRCxLQUFLQyxJQUFMLEVBQVcsQ0FBQ3RDLENBQUQsQ0FBWCxDQUEzQixDQUFWO0FBQ0FiLE9BQUVtSCxPQUFGLENBQVV0RyxDQUFWLEVBQWEsRUFBRW1ILFlBQVksSUFBZCxFQUFvQkMsZ0JBQWdCLENBQUMsTUFBRCxDQUFwQyxFQUFiO0FBQ0E5RSxVQUFLNEMsa0JBQUwsQ0FBd0JyRSxHQUF4QixDQUE0QmIsQ0FBNUIsRUFBK0JiLENBQS9CO0FBVGdGOztBQU1sRix5QkFBZ0IyRSxRQUFoQix5SEFBMEI7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLFNBQWY5RCxDQUFlOztBQUFBLFdBQWZBLENBQWU7QUFJekI7QUFDRjs7QUFFRCxVQUFTcUcsbUJBQVQsQ0FBNkIvRCxJQUE3QixFQUF3RGhELE9BQXhELEVBQW9GO0FBQ2xGLE9BQU13RSxXQUFXLENBQUN4RSxPQUFELEVBQVUsR0FBR08sTUFBTUMsSUFBTixDQUFXUixRQUFRNEgsZ0JBQVIsQ0FBeUIsR0FBekIsQ0FBWCxDQUFiLENBQWpCO0FBQ0EseUJBQWdCcEQsUUFBaEIseUhBQTBCO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxTQUFmOUQsQ0FBZTs7QUFDeEIsU0FBTWIsSUFBSW1ELEtBQUs0QyxrQkFBTCxDQUF3Qm5ILEdBQXhCLENBQTZCaUMsQ0FBN0IsQ0FBVjtBQUNBLFNBQUliLEtBQUssSUFBVCxFQUFlO0FBQ2ZtRCxVQUFLNEMsa0JBQUwsQ0FBd0JuQixNQUF4QixDQUFnQy9ELENBQWhDO0FBQ0FiLE9BQUVrSSxVQUFGO0FBQ0Q7QUFDRjs7QUFFRCxVQUFTdkQsUUFBVCxDQUFrQnhCLElBQWxCLEVBQTZEO0FBQzNELFVBQU96QyxNQUFNQyxJQUFOLENBQWF3QyxLQUFLd0IsUUFBbEIsRUFBNkMvRCxNQUE3QyxDQUFvREMsS0FBS0EsRUFBRXlCLElBQTNELENBQVA7QUFDRDs7QUFnQkQsVUFBUzRDLFNBQVQsQ0FBbUJpRCxTQUFuQixFQUFtQzFGLFFBQW5DLEVBQTJEO0FBQ3hEMEYsWUFBRDtBQUNBLE9BQU1DLE9BQU9ELFVBQVVDLElBQXZCO0FBQ0EsT0FBSUEsU0FBUyxVQUFULElBQXVCQSxTQUFTLE9BQXBDLEVBQTZDO0FBQzNDRCxlQUFVRSxPQUFWLEdBQW9CNUYsYUFBYTBGLFVBQVUzRyxLQUEzQztBQUNBO0FBQ0Q7O0FBRUQsT0FBSWlCLFlBQVksSUFBWixJQUFvQjBGLFVBQVUzRyxLQUFWLElBQW1CLElBQTNDLEVBQ0U7O0FBRUYyRyxhQUFVM0csS0FBVixHQUFrQmlCLFFBQWxCO0FBQ0Q7O0FBRUQsVUFBUzBDLFFBQVQsQ0FBa0JnRCxTQUFsQixFQUEwQztBQUN2Q0EsWUFBRDtBQUNBLE9BQU1DLE9BQU9ELFVBQVVDLElBQXZCO0FBQ0EsT0FBSUEsU0FBUyxVQUFULElBQXVCQSxTQUFTLE9BQXBDLEVBQTZDO0FBQzNDLFlBQU9ELFVBQVVFLE9BQVYsR0FBb0JGLFVBQVUzRyxLQUE5QixHQUFzQyxJQUE3QztBQUNEO0FBQ0QsVUFBTzJHLFVBQVUzRyxLQUFqQjtBQUNEOztBQUVELFVBQVN5RCxjQUFULENBQXdCOUIsSUFBeEIsRUFBb0U7QUFDbEUsT0FBTTFCLElBQUkwQixLQUFLbkIsSUFBZjtBQUNBLE9BQUksQ0FBQ1AsQ0FBTCxFQUFRO0FBQ044RSxhQUFRK0IsS0FBUixDQUFjLDBCQUFkO0FBQ0EsWUFBTyxJQUFQO0FBQ0Q7QUFDRCxPQUFNdEQsSUFBSU0sR0FBR3hELFdBQUgsQ0FBZUwsQ0FBZixDQUFWO0FBQ0EsT0FBSSxDQUFDdUQsQ0FBTCxFQUFRO0FBQ051QixhQUFRK0IsS0FBUixDQUFjLCtCQUFkLEVBQStDbkYsS0FBS25CLElBQXBEO0FBQ0EsWUFBTyxJQUFQO0FBQ0Q7QUFDRCxVQUFPZ0QsQ0FBUDtBQUNEOztBQUVELFVBQVNZLE9BQVQsQ0FBaUJ6QyxJQUFqQixFQUFvQ2IsSUFBcEMsRUFBMEQ7QUFDeEQsT0FBTWxCLElBQUkrQixLQUFLb0YsWUFBTCxDQUFrQmpHLElBQWxCLENBQVY7QUFDQSxVQUFPbEIsSUFBSUEsQ0FBSixHQUFRLEVBQWY7QUFDRDtBQUNELFVBQVN5RSxPQUFULENBQWlCMUMsSUFBakIsRUFBb0NiLElBQXBDLEVBQWtEZCxLQUFsRCxFQUF3RTtBQUN0RSxPQUFJQSxTQUFTLElBQWIsRUFBbUI7QUFDbkIyQixRQUFLcUYsWUFBTCxDQUFrQmxHLElBQWxCLEVBQXdCZCxLQUF4QjtBQUNEOztBQUVELFVBQVNrRixPQUFULENBQW9CK0IsUUFBcEIsRUFBK0Q7QUFDN0QsVUFBTy9ILE1BQU1DLElBQU4sQ0FBWSxhQUFhO0FBQzlCLDJCQUFtQjhILFFBQW5CO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxXQUFXQyxJQUFYO0FBQTZCLDZCQUFnQkEsSUFBaEI7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLGFBQVczSSxDQUFYO0FBQXNCLGVBQU1BLENBQU47QUFBdEI7QUFBN0I7QUFDRCxJQUZpQixFQUFYLENBQVA7QUFHRCxFIiwiZmlsZSI6InN0b3JhZ2UtZWxlbWVudHMtZGVidWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyB3ZWJwYWNrL2Jvb3RzdHJhcCA2Mjg3ZGEwNjc3NmI0NzM3MTI4NCIsImltcG9ydCBTdG9yYWdlRm9ybUVsZW1lbnQgZnJvbSBcIi4vc3RvcmFnZS1mb3JtXCI7XG5cbi8vIEN1c3RvbSBFbGVtZW50IHYxIHNlZW1zIG5vdCB0byB3b3JrcyByaWdodCB0byBleHRlbmQgPGZvcm0+IGluIEdvb2dsZSBDaHJvbWUgNTVcbi8vIGN1c3RvbUVsZW1lbnRzLmRlZmluZShcInN0b3JhZ2UtZm9ybVwiLCBTdG9yYWdlRm9ybUVsZW1lbnQsIHsgZXh0ZW5kczogXCJmb3JtXCIgfSk7XG4vLyB3aW5kb3cuU3RvcmFnZUZvcm1FbGVtZW50ID0gU3RvcmFnZUZvcm1FbGVtZW50O1xuXG4vLyBDdXN0b20gRWxlbWVudCB2MFxuLy8gJEZsb3dGaXhNZSBGb3JjZSBkZWZpbmUgdG8gYXZvaWQgdG8gYWZmZWN0IGNvZGUgb2YgYHN0b3JhZ2UtZm9ybS5qc2AgYnkgQ3VzdG9tIEVsZW1lbnQgdjBcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdG9yYWdlRm9ybUVsZW1lbnQsIFwiZXh0ZW5kc1wiLCB7IGdldDogKCkgPT4gXCJmb3JtXCIgfSk7XG5kb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJzdG9yYWdlLWZvcm1cIiwgU3RvcmFnZUZvcm1FbGVtZW50KTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9zdG9yYWdlLWVsZW1lbnRzLXJlZ2lzdGVyZXIuanMiLCJleHBvcnQgY2xhc3MgQ2FuY2VsbGFibGVQcm9taXNlPFI+IGV4dGVuZHMgUHJvbWlzZTxSPiB7XG4gIGNhbmNlbGxGdW5jdGlvbjogKCkgPT4gdm9pZDtcbiAgY29uc3RydWN0b3IoXG4gICAgY2FsbGJhY2s6IChcbiAgICAgIHJlc29sdmU6IChyZXN1bHQ6IFByb21pc2U8Uj4gfCBSKSA9PiB2b2lkLFxuICAgICAgcmVqZWN0OiAoZXJyb3I6IGFueSkgPT4gdm9pZFxuICAgICkgPT4gbWl4ZWQsXG4gICAgY2FuY2VsbDogKCkgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihjYWxsYmFjayk7XG4gICAgdGhpcy5jYW5jZWxsRnVuY3Rpb24gPSBjYW5jZWxsO1xuICB9XG5cbiAgY2FuY2VsbCgpIHtcbiAgICB0aGlzLmNhbmNlbGxGdW5jdGlvbigpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzbGVlcChtc2VjOiBudW1iZXIpOiBDYW5jZWxsYWJsZVByb21pc2U8dm9pZD4ge1xuICBsZXQgdGltZW91dElkOiA/bnVtYmVyO1xuICByZXR1cm4gbmV3IENhbmNlbGxhYmxlUHJvbWlzZShcbiAgICAocmVzb2x2ZSkgPT4ge1xuICAgICAgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiByZXNvbHZlKCksIG1zZWMpO1xuICAgIH0sXG4gICAgKCkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgfVxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVkdXA8VD4oYXJyYXk6IEFycmF5PFQ+LFxuICAgICAgICAgICAgICAgICAgICAgICAgIHByZWRpY2F0ZT86ICh0OiBULCBvOiBUKSA9PiBib29sZWFuID0gKHQsIG8pID0+IHQgPT09IG8pOiBBcnJheTxUPiB7XG4gIHJldHVybiBhcnJheS5yZWR1Y2UoKHJlc3VsdDogQXJyYXk8VD4sIGVsZW1lbnQpID0+IHtcbiAgICBpZiAocmVzdWx0LnNvbWUoKGkpID0+IHByZWRpY2F0ZShpLCBlbGVtZW50KSkpIHJlc3VsdDtcbiAgICByZXR1cm4gcmVzdWx0LmNvbmNhdChlbGVtZW50KTtcbiAgfSxbXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdWJ0cmFjdFNldDxUPih0YXJnZXRTZXQ6IFNldDxUPiwgcmVtb3ZlZFNldDogU2V0PFQ+KTogU2V0PFQ+IHtcbiAgcmV0dXJuIG5ldyBTZXQoQXJyYXkuZnJvbSh0YXJnZXRTZXQpLmZpbHRlcigoZSkgPT4gIXJlbW92ZWRTZXQuaGFzKGUpKSk7XG59XG5cbmNsYXNzIE11bHRpVmFsdWVNYXA8SywgViwgSTogSXRlcmFibGU8Vj4+IGV4dGVuZHMgTWFwPEssIEk+IHtcbiAgKiBmbGF0dGVuVmFsdWVzKCk6IEl0ZXJhdG9yPFY+IHtcbiAgICBmb3IgKGNvbnN0IGFyciBvZiB0aGlzLnZhbHVlcygpKSB7XG4gICAgICBmb3IgKGNvbnN0IHYgb2YgYXJyKSB7XG4gICAgICAgIHlpZWxkIHY7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBcnJheVZhbHVlTWFwPEssIFY+IGV4dGVuZHMgTXVsdGlWYWx1ZU1hcDxLLCBWLCBBcnJheTxWPj4ge1xuICBhZGQoa2V5OiBLLCB2YWx1ZTogVik6IHRoaXMge1xuICAgIGxldCBhID0gdGhpcy5nZXQoa2V5KTtcbiAgICBpZiAoIWEpIHtcbiAgICAgIGEgPSBbXTtcbiAgICAgIHRoaXMuc2V0KGtleSwgYSk7XG4gICAgfVxuICAgIGEucHVzaCh2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNldFZhbHVlTWFwPEssIFY+IGV4dGVuZHMgTXVsdGlWYWx1ZU1hcDxLLCBWLCBTZXQ8Vj4+IHtcbiAgYWRkKGtleTogSywgdmFsdWU6IFYpOiB0aGlzIHtcbiAgICBsZXQgYSA9IHRoaXMuZ2V0KGtleSk7XG4gICAgaWYgKCFhKSB7XG4gICAgICBhID0gbmV3IFNldCgpO1xuICAgICAgdGhpcy5zZXQoa2V5LCBhKTtcbiAgICB9XG4gICAgYS5hZGQodmFsdWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvdXRpbHMuanMiLCIvKiBnbG9iYWwgY2hyb21lICovXG5cbmV4cG9ydCB0eXBlIEFyZWEgPSBzdHJpbmc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXJlYUhhbmRsZXIge1xuICByZWFkKG5hbWU6IHN0cmluZyk6IFByb21pc2U8P3N0cmluZz47XG4gIHdyaXRlKG5hbWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG4gIHJlbW92ZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5jb25zdCBoYW5kbGVyczogeyBbYXJlYTogQXJlYV06IEFyZWFIYW5kbGVyIH0gPSB7fTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySGFuZGxlcihhcmVhOiBBcmVhLCBoYW5kbGVyOiBBcmVhSGFuZGxlcik6IHZvaWQge1xuICBpZiAoaGFuZGxlcnNbYXJlYV0pIHtcbiAgICB0aHJvdyBFcnJvcihgQWxyZWFkeSByZWdpc3RlcmVkIGhhbmRsZXIgZm9yIFwiJHthcmVhfVwiYCk7XG4gIH1cbiAgaGFuZGxlcnNbYXJlYV0gPSBoYW5kbGVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZEhhbmRsZXIoYXJlYTogQXJlYSk6ID9BcmVhSGFuZGxlciB7XG4gIHJldHVybiBoYW5kbGVyc1thcmVhXTtcbn1cblxuLy9cblxuZXhwb3J0IGNsYXNzIFdlYlN0b3JhZ2VBcmVhSGFuZGxlciB7XG4gIHN0b3JhZ2U6IFN0b3JhZ2U7XG5cbiAgY29uc3RydWN0b3Ioc3RvcmFnZTogU3RvcmFnZSkge1xuICAgIHRoaXMuc3RvcmFnZSA9IHN0b3JhZ2U7XG4gIH1cblxuICByZWFkKG5hbWU6IHN0cmluZyk6IFByb21pc2U8P3N0cmluZz4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5zdG9yYWdlLmdldEl0ZW0obmFtZSkpO1xuICB9XG5cbiAgd3JpdGUobmFtZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zdG9yYWdlLnNldEl0ZW0obmFtZSwgbmV3VmFsdWUpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIHJlbW92ZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnN0b3JhZ2UucmVtb3ZlSXRlbShuYW1lKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cbn1cblxuaWYgKGxvY2FsU3RvcmFnZSlcbiAgcmVnaXN0ZXJIYW5kbGVyKFwibG9jYWwtc3RvcmFnZVwiLCBuZXcgV2ViU3RvcmFnZUFyZWFIYW5kbGVyKGxvY2FsU3RvcmFnZSkpO1xuaWYgKHNlc3Npb25TdG9yYWdlKVxuICByZWdpc3RlckhhbmRsZXIoXCJzZXNzaW9uLXN0b3JhZ2VcIiwgbmV3IFdlYlN0b3JhZ2VBcmVhSGFuZGxlcihzZXNzaW9uU3RvcmFnZSkpO1xuXG4vL1xuXG5leHBvcnQgY2xhc3MgQ2hyb21lU3RvcmFnZUFyZWFIYW5kbGVyIHtcbiAgc3RvcmFnZTogQ2hyb21lU3RvcmFnZUFyZWE7XG5cbiAgY29uc3RydWN0b3Ioc3RvcmFnZTogQ2hyb21lU3RvcmFnZUFyZWEpIHtcbiAgICB0aGlzLnN0b3JhZ2UgPSBzdG9yYWdlO1xuICB9XG5cbiAgcmVhZChuYW1lOiBzdHJpbmcpOiBQcm9taXNlPD9zdHJpbmc+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHRoaXMuc3RvcmFnZS5nZXQobmFtZSwgKHYpID0+IHJlc29sdmUodltuYW1lXSkpKTtcbiAgfVxuXG4gIHdyaXRlKG5hbWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gdGhpcy5zdG9yYWdlLnNldCh7IFtuYW1lXTogbmV3VmFsdWUgfSwgcmVzb2x2ZSkpO1xuICB9XG5cbiAgcmVtb3ZlKG5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gdGhpcy5zdG9yYWdlLnJlbW92ZShuYW1lLCByZXNvbHZlKSk7XG4gIH1cbn1cblxuaWYgKGNocm9tZSAmJiBjaHJvbWUuc3RvcmFnZSkge1xuICBpZiAoY2hyb21lLnN0b3JhZ2UubG9jYWwpXG4gICAgcmVnaXN0ZXJIYW5kbGVyKFwiY2hyb21lLWxvY2FsXCIsIG5ldyBDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIoY2hyb21lLnN0b3JhZ2UubG9jYWwpKTtcbiAgaWYgKGNocm9tZS5zdG9yYWdlLnN5bmMpXG4gICAgcmVnaXN0ZXJIYW5kbGVyKFwiY2hyb21lLXN5bmNcIiwgbmV3IENocm9tZVN0b3JhZ2VBcmVhSGFuZGxlcihjaHJvbWUuc3RvcmFnZS5zeW5jKSk7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvYXJlYS1oYW5kbGVyLmpzIiwiaW1wb3J0ICogYXMgdSBmcm9tIFwiLi91dGlsc1wiO1xuXG5kZWNsYXJlIHR5cGUgTmFtZSA9IHN0cmluZztcbmRlY2xhcmUgdHlwZSBWYWx1ZSA9IHN0cmluZztcbmRlY2xhcmUgdHlwZSBOYW1lVmFsdWUgPSB7IG5hbWU6IE5hbWUsIHZhbHVlOiA/VmFsdWUgfTtcbmRlY2xhcmUgdHlwZSBWYWx1ZXMgPSBNYXA8RWxlbWVudCwgTmFtZVZhbHVlPjtcbmV4cG9ydCBpbnRlcmZhY2UgRWxlbWVudCB7XG4gIG5hbWU6IE5hbWU7XG59XG5kZWNsYXJlIGludGVyZmFjZSBTdG9yYWdlSGFuZGxlciB7XG4gIHJlYWQobjogTmFtZSk6IFByb21pc2U8P1ZhbHVlPjtcbiAgd3JpdGUobjogTmFtZSwgdjogVmFsdWUpOiBQcm9taXNlPHZvaWQ+O1xuICByZW1vdmUobjogTmFtZSk6UHJvbWlzZTx2b2lkPjtcbn1cbmRlY2xhcmUgaW50ZXJmYWNlIEZvcm1IYW5kbGVyIHtcbiAgd3JpdGUoZTogRWxlbWVudCwgdjogP1ZhbHVlKTogdm9pZDtcbiAgcmVhZChlOiBFbGVtZW50KTogP1ZhbHVlO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCaW5kZXIge1xuICB2OiBWYWx1ZXM7XG4gIHM6IFN0b3JhZ2VIYW5kbGVyO1xuICBmOiBGb3JtSGFuZGxlcjtcbiAgbG9jazogP1Byb21pc2U8bWl4ZWQ+O1xuXG4gIGNvbnN0cnVjdG9yKHM6IFN0b3JhZ2VIYW5kbGVyLCBmOiBGb3JtSGFuZGxlcikge1xuICAgIHRoaXMudiA9IG5ldyBNYXA7XG4gICAgdGhpcy5zID0gcztcbiAgICB0aGlzLmYgPSBmO1xuICAgIHRoaXMubG9jayA9IG51bGw7XG4gIH1cblxuICBhc3luYyBzeW5jKHRhcmdldHM6IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsICgpID0+IGRvU3luYyh0aGlzLCB0YXJnZXRzKSk7XG4gIH1cblxuICAvLy8gRm9yY2Ugd3JpdGUgZm9ybSB2YWx1ZXMgdG8gdGhlIHN0b3JhZ2VcbiAgYXN5bmMgc3VibWl0KHRhcmdldHM6IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsICgpID0+IFByb21pc2UuYWxsKHRhcmdldHMubWFwKGFzeW5jIChlKSA9PiB7XG4gICAgICBhd2FpdCBzdG9yZSh0aGlzLCBlKTtcbiAgICB9KSkpO1xuICB9XG5cbiAgLy8vIFN5bmMgb25seSBuZXcgZWxlbWVudHNcbiAgYXN5bmMgc2Nhbih0YXJnZXRzOiBBcnJheTxFbGVtZW50Pik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN5bmNCbG9jayh0aGlzLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBuZXdFbGVtZW50cyA9IHUuc3VidHJhY3RTZXQobmV3IFNldCh0YXJnZXRzKSwgbmV3IFNldCh0aGlzLnYua2V5cygpKSk7XG4gICAgICBhd2FpdCBkb1N5bmModGhpcywgQXJyYXkuZnJvbShuZXdFbGVtZW50cykpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8vIEludm9yayBpZiBhbiBlbGVtZW50IHdhcyByZW1vdmVkIGZyb20gYSBmb3JtLlxuICBhc3luYyByZW1vdmUoZWxlbWVudHM6IEFycmF5PEVsZW1lbnQ+KSB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsIGFzeW5jICgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgZSBvZiBlbGVtZW50cykgdGhpcy52LmRlbGV0ZShlKTtcbiAgICB9KTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBkb1N5bmMoc2VsZjogQmluZGVyLCB0YXJnZXRzOiBBcnJheTxFbGVtZW50Pikge1xuICBhd2FpdCBQcm9taXNlLmFsbCh0YXJnZXRzLm1hcChhc3luYyAoZSkgPT4ge1xuICAgIGF3YWl0IGxvYWQoc2VsZiwgZSk7XG4gICAgYXdhaXQgc3RvcmUoc2VsZiwgZSk7XG4gIH0pKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc3luY0Jsb2NrKHNlbGY6IEJpbmRlciwgZm46ICgpID0+IFByb21pc2U8bWl4ZWQ+KSB7XG4gIHdoaWxlIChzZWxmLmxvY2spIGF3YWl0IHNlbGYubG9jaztcbiAgc2VsZi5sb2NrID0gZm4oKTtcbiAgYXdhaXQgc2VsZi5sb2NrO1xuICBzZWxmLmxvY2sgPSBudWxsO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkKHNlbGY6IEJpbmRlciwgZWxlbTogRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBuZXdOID0gZWxlbS5uYW1lO1xuICBjb25zdCBuZXdWID0gYXdhaXQgc2VsZi5zLnJlYWQobmV3Tik7XG4gIGxldCBudjogP05hbWVWYWx1ZSA9IHNlbGYudi5nZXQoZWxlbSk7XG4gIGlmICghbnYpIHtcbiAgICBudiA9IHsgbmFtZTogZWxlbS5uYW1lLCB2YWx1ZTogbnVsbCB9O1xuICAgIHNlbGYudi5zZXQoZWxlbSwgbnYpO1xuICB9XG4gIGlmIChudi5uYW1lICE9PSBuZXdOIHx8IG52LnZhbHVlICE9PSBuZXdWKSB7XG4gICAgc2VsZi5mLndyaXRlKGVsZW0sIG5ld1YpO1xuICAgIG52Lm5hbWUgPSAgbmV3TjtcbiAgICBudi52YWx1ZSA9ICBuZXdWO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN0b3JlKHNlbGY6IEJpbmRlciwgZWxlbTogRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBuZXdOID0gZWxlbS5uYW1lO1xuICBjb25zdCBuZXdWID0gZmFsbGJhY2tJZk51bGwoKCkgPT4gc2VsZi5mLnJlYWQoZWxlbSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKSA9PiBnZXRWYWx1ZUJ5TmFtZShzZWxmLCBuZXdOKSk7XG4gIGxldCBudjogP05hbWVWYWx1ZSA9IHNlbGYudi5nZXQoZWxlbSk7XG4gIGlmICghbnYpIHtcbiAgICBudiA9IHsgbmFtZTogZWxlbS5uYW1lLCB2YWx1ZTogbnVsbCB9O1xuICAgIHNlbGYudi5zZXQoZWxlbSwgbnYpO1xuICB9XG4gIGlmIChudi5uYW1lICE9PSBuZXdOIHx8IG52LnZhbHVlICE9PSBuZXdWKSB7XG4gICAgaWYgKG5ld1YgPT0gbnVsbCkge1xuICAgICAgYXdhaXQgc2VsZi5zLnJlbW92ZShuZXdOKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgc2VsZi5zLndyaXRlKG5ld04sIG5ld1YpO1xuICAgIH1cbiAgICBudi5uYW1lID0gIG5ld047XG4gICAgbnYudmFsdWUgPSAgbmV3VjtcbiAgfVxufVxuXG5mdW5jdGlvbiBmYWxsYmFja0lmTnVsbDxUPiguLi5mbnM6IEFycmF5PCgpID0+IFQ+KTogP1Qge1xuICBmb3IgKGNvbnN0IGZuIG9mIGZucykge1xuICAgIGNvbnN0IHYgPSBmbigpO1xuICAgIGlmICh2ICE9IG51bGwpIHJldHVybiB2O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRWYWx1ZUJ5TmFtZShzZWxmOiBCaW5kZXIsIG5hbWU6IE5hbWUpOiA/VmFsdWUge1xuICBmb3IgKGNvbnN0IG52IG9mIHNlbGYudi52YWx1ZXMoKSkge1xuICAgIGlmIChudi5uYW1lID09PSBuYW1lKSByZXR1cm4gbnYudmFsdWU7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvYmluZGVyLmpzIiwiaW1wb3J0ICogYXMgdSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0ICogYXMgYWggZnJvbSBcIi4vYXJlYS1oYW5kbGVyXCI7XG5pbXBvcnQgQmluZGVyIGZyb20gXCIuL2JpbmRlclwiO1xuaW1wb3J0IHR5cGUgeyBFbGVtZW50IH0gZnJvbSBcIi4vYmluZGVyXCI7XG5cbmRlY2xhcmUgdHlwZSBOYW1lID0gc3RyaW5nO1xuZGVjbGFyZSB0eXBlIFZhbHVlID0gc3RyaW5nO1xuXG5kZWNsYXJlIGludGVyZmFjZSBGb3JtQ29tcG9uZW50RWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgbmFtZTogTmFtZTtcbiAgdmFsdWU/OiBWYWx1ZTtcbiAgdHlwZT86IHN0cmluZztcbiAgY2hlY2tlZD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RvcmFnZUZvcm0gZXh0ZW5kcyBIVE1MRm9ybUVsZW1lbnQge1xuICBhdXRvc3luYzogbnVtYmVyO1xuICBhcmVhOiBzdHJpbmc7XG59XG5cbmRlY2xhcmUgaW50ZXJmYWNlIEludGVybmFsU3RvcmFnZUZvcm0gZXh0ZW5kcyBTdG9yYWdlRm9ybSB7XG4gIGJpbmRlcjogP0JpbmRlcjtcbiAgY29tcG9uZW50T2JzZXJ2ZXJzOiBNYXA8Rm9ybUNvbXBvbmVudEVsZW1lbnQsIE11dGF0aW9uT2JzZXJ2ZXI+O1xufVxuXG5jb25zdCBERUZBVUxUX1NZTkNfSU5URVJWQUwgPSA3MDA7XG5cbmV4cG9ydCBmdW5jdGlvbiBtaXhpblN0b3JhZ2VGb3JtPFQ6IEhUTUxGb3JtRWxlbWVudD4oYzogQ2xhc3M8VD4pOiBDbGFzczxUICYgU3RvcmFnZUZvcm0+IHtcbiAgLy8gJEZsb3dGaXhNZSBGb3JjZSBjYXN0IHRvIHRoZSByZXR1cm5lZCB0eXBlLlxuICByZXR1cm4gY2xhc3MgZXh0ZW5kcyBjIHtcbiAgICBiaW5kZXI6ID9CaW5kZXI7XG4gICAgY29tcG9uZW50T2JzZXJ2ZXJzOiBNYXA8Rm9ybUNvbXBvbmVudEVsZW1lbnQsIE11dGF0aW9uT2JzZXJ2ZXI+O1xuXG4gICAgZ2V0IGF1dG9zeW5jKCk6IG51bWJlciB7XG4gICAgICBjb25zdCBuID0gcGFyc2VJbnQoZ2V0QXR0cih0aGlzLCBcImF1dG9zeW5jXCIpKTtcbiAgICAgIHJldHVybiBuID4gMCA/IG4gOiBERUZBVUxUX1NZTkNfSU5URVJWQUw7XG4gICAgfVxuICAgIHNldCBhdXRvc3luYyh2OiBhbnkpIHsgc2V0QXR0cih0aGlzLCBcImF1dG9zeW5jXCIsIHYpOyB9XG4gICAgZ2V0IGFyZWEoKTogYWguQXJlYSB7IHJldHVybiBnZXRBdHRyKHRoaXMsIFwiYXJlYVwiKTsgfVxuICAgIHNldCBhcmVhKHY6IGFueSkgeyBzZXRBdHRyKHRoaXMsIFwiYXJlYVwiLCB2KTsgfVxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgIGluaXRCaW5kZXIodGhpcyk7XG4gICAgICB0aGlzLmNvbXBvbmVudE9ic2VydmVycyA9IG5ldyBNYXAoKTtcblxuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBzdWJtaXQodGhpcyk7XG4gICAgICB9KTtcblxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmxvYWRcIiwgKCkgPT4ge1xuICAgICAgICBpZiAoaXNBdXRvU3luY0VuYWJsZWQodGhpcykpIHtcbiAgICAgICAgICBzeW5jKHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKHJlY29yZHMpID0+IHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcInNjYW4gYnkgZm9ybSBNdXRhdGlvbk9ic2VydmVyOiBcIiwgdGhpcyk7XG4gICAgICAgIHNjYW4odGhpcyk7XG5cbiAgICAgICAgY29uc3QgYWRkZWQ6IEFycmF5PEhUTUxFbGVtZW50PiA9XG4gICAgICAgICAgICAgIGZsYXR0ZW4ocmVjb3Jkcy5tYXAociA9PiAoci5hZGRlZE5vZGVzOiBJdGVyYWJsZTxhbnk+KSkpXG4gICAgICAgICAgICAgIC5maWx0ZXIoKGUpID0+IGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCk7XG4gICAgICAgIGlmIChhZGRlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBlIG9mIGFkZGVkKSB7XG4gICAgICAgICAgICBvYnNlcnZlQ29tcG9uZW50KHRoaXMsIGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlbW92ZWQ6IEFycmF5PEhUTUxFbGVtZW50PiA9XG4gICAgICAgICAgICAgIGZsYXR0ZW4ocmVjb3Jkcy5tYXAoKHIpID0+IChyLnJlbW92ZWROb2RlczogSXRlcmFibGU8YW55PikpKVxuICAgICAgICAgICAgICAuZmlsdGVyKChlKSA9PiBlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpO1xuICAgICAgICBpZiAocmVtb3ZlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy8gVXNlIGFueSB0byBmb3JjZSBjYXN0IHRvIEFycmF5PEZvcm1Db21wb25lbnRFbGVtZW50cz5cbiAgICAgICAgICByZW1vdmUodGhpcywgKHJlbW92ZWQuZmlsdGVyKChlKSA9PiAoZTogYW55KS5uYW1lKTogQXJyYXk8YW55PikpO1xuICAgICAgICAgIGZvciAoY29uc3QgZSBvZiByZW1vdmVkKSB7XG4gICAgICAgICAgICBkaXNjb25uZWN0Q29tcG9uZW50KHRoaXMsIGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkub2JzZXJ2ZSh0aGlzLCB7IGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZSB9KTtcblxuICAgICAgc2Nhbih0aGlzKTtcblxuICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICBhd2FpdCB1LnNsZWVwKHRoaXMuYXV0b3N5bmMpO1xuICAgICAgICAgIGlmIChpc0F1dG9TeW5jRW5hYmxlZCh0aGlzKSkge1xuICAgICAgICAgICAgYXdhaXQgc3luYyh0aGlzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXdhaXQgc2Nhbih0aGlzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pKCk7XG4gICAgfVxuXG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgIHNjYW4odGhpcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICBcImF1dG9zeW5jXCIsXG4gICAgICAgIFwiYXJlYVwiLFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ck5hbWU6IHN0cmluZykge1xuICAgICAgc3dpdGNoIChhdHRyTmFtZSkge1xuICAgICAgY2FzZSBcImF1dG9zeW5jXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFyZWFcIjpcbiAgICAgICAgaW5pdEJpbmRlcih0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG5jb25zdCBtaXhlZCA9IG1peGluU3RvcmFnZUZvcm0oSFRNTEZvcm1FbGVtZW50KTtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhUTUxTdG9yYWdlRm9ybUVsZW1lbnQgZXh0ZW5kcyBtaXhlZCB7fVxuXG5mdW5jdGlvbiBpc0F1dG9TeW5jRW5hYmxlZChzZWxmOiBIVE1MRm9ybUVsZW1lbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIHNlbGYuaGFzQXR0cmlidXRlKFwiYXV0b3N5bmNcIik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN1Ym1pdChzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZWxmLmJpbmRlcikgYXdhaXQgc2VsZi5iaW5kZXIuc3VibWl0KGVsZW1lbnRzKHNlbGYpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc3luYyhzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtLCB0YXJnZXRzPzogQXJyYXk8RWxlbWVudD4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbGYuYmluZGVyKSBhd2FpdCBzZWxmLmJpbmRlci5zeW5jKHRhcmdldHMgPyB0YXJnZXRzIDogZWxlbWVudHMoc2VsZikpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzY2FuKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbGYuYmluZGVyKSBhd2FpdCBzZWxmLmJpbmRlci5zY2FuKGVsZW1lbnRzKHNlbGYpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVtb3ZlKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0sIGVsZW1zOiBBcnJheTxFbGVtZW50Pik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnJlbW92ZShlbGVtcyk7XG59XG5cbmZ1bmN0aW9uIG9ic2VydmVDb21wb25lbnQoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSwgbmV3RWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3QgZWxlbWVudHM6IEFycmF5PEZvcm1Db21wb25lbnRFbGVtZW50PiA9XG4gICAgICAgIC8vIGZvcmNlIGNhc3RcbiAgICAgICAgKFtuZXdFbGVtZW50LCAuLi5BcnJheS5mcm9tKG5ld0VsZW1lbnQucXVlcnlTZWxlY3RvckFsbChcIipcIikpXVxuICAgICAgICAgLmZpbHRlcigoZSkgPT4gKGU6IGFueSkudmFsdWUgIT0gbnVsbCAmJiAoZTogYW55KS5uYW1lICE9IG51bGwpOiBhbnkpO1xuXG4gIGZvciAoY29uc3QgZSBvZiBlbGVtZW50cykge1xuICAgIGNvbnN0IG8gPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PiBzeW5jKHNlbGYsIFtlXSkpO1xuICAgIG8ub2JzZXJ2ZShlLCB7IGF0dHJpYnV0ZXM6IHRydWUsIGF0cmlidXRlRmlsdGVyOiBbXCJuYW1lXCJdIH0pO1xuICAgIHNlbGYuY29tcG9uZW50T2JzZXJ2ZXJzLnNldChlLCBvKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkaXNjb25uZWN0Q29tcG9uZW50KHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0sIGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGNvbnN0IGVsZW1lbnRzID0gW2VsZW1lbnQsIC4uLkFycmF5LmZyb20oZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiKlwiKSldO1xuICBmb3IgKGNvbnN0IGUgb2YgZWxlbWVudHMpIHtcbiAgICBjb25zdCBvID0gc2VsZi5jb21wb25lbnRPYnNlcnZlcnMuZ2V0KChlOiBhbnkpKTtcbiAgICBpZiAobyA9PSBudWxsKSBjb250aW51ZTtcbiAgICBzZWxmLmNvbXBvbmVudE9ic2VydmVycy5kZWxldGUoKGU6IGFueSkpO1xuICAgIG8uZGlzY29ubmVjdCgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGVsZW1lbnRzKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pOiBBcnJheTxFbGVtZW50PiB7XG4gIHJldHVybiBBcnJheS5mcm9tKCgoc2VsZi5lbGVtZW50cyk6IEl0ZXJhYmxlPGFueT4pKS5maWx0ZXIoZSA9PiBlLm5hbWUpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0QmluZGVyKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgc2VsZi5iaW5kZXIgPSBudWxsO1xuXG4gIGNvbnN0IGggPSBnZXRBcmVhSGFuZGxlcihzZWxmKTtcbiAgaWYgKCFoKSByZXR1cm47XG5cbiAgc2VsZi5iaW5kZXIgPSBuZXcgQmluZGVyKFxuICAgIGgsXG4gICAgeyB3cml0ZTogd3JpdGVGb3JtLFxuICAgICAgcmVhZDogcmVhZEZvcm0gfVxuICApO1xuICBhd2FpdCBzeW5jKHNlbGYpO1xufVxuXG5mdW5jdGlvbiB3cml0ZUZvcm0oY29tcG9uZW50OiBhbnksIG5ld1ZhbHVlOiA/VmFsdWUpOiB2b2lkIHtcbiAgKGNvbXBvbmVudDogRm9ybUNvbXBvbmVudEVsZW1lbnQpO1xuICBjb25zdCB0eXBlID0gY29tcG9uZW50LnR5cGU7XG4gIGlmICh0eXBlID09PSBcImNoZWNrYm94XCIgfHwgdHlwZSA9PT0gXCJyYWRpb1wiKSB7XG4gICAgY29tcG9uZW50LmNoZWNrZWQgPSBuZXdWYWx1ZSA9PT0gY29tcG9uZW50LnZhbHVlO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChuZXdWYWx1ZSA9PSBudWxsIHx8IGNvbXBvbmVudC52YWx1ZSA9PSBudWxsKVxuICAgIHJldHVybjtcblxuICBjb21wb25lbnQudmFsdWUgPSBuZXdWYWx1ZTtcbn1cblxuZnVuY3Rpb24gcmVhZEZvcm0oY29tcG9uZW50OiBhbnkpOiA/VmFsdWUge1xuICAoY29tcG9uZW50OiBGb3JtQ29tcG9uZW50RWxlbWVudCk7XG4gIGNvbnN0IHR5cGUgPSBjb21wb25lbnQudHlwZTtcbiAgaWYgKHR5cGUgPT09IFwiY2hlY2tib3hcIiB8fCB0eXBlID09PSBcInJhZGlvXCIpIHtcbiAgICByZXR1cm4gY29tcG9uZW50LmNoZWNrZWQgPyBjb21wb25lbnQudmFsdWUgOiBudWxsO1xuICB9XG4gIHJldHVybiBjb21wb25lbnQudmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldEFyZWFIYW5kbGVyKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pOiA/YWguQXJlYUhhbmRsZXIge1xuICBjb25zdCBhID0gc2VsZi5hcmVhO1xuICBpZiAoIWEpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiUmVxdWlyZSAnYXJlYScgYXR0cmlidXRlXCIpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGggPSBhaC5maW5kSGFuZGxlcihhKTtcbiAgaWYgKCFoKSB7XG4gICAgY29uc29sZS5lcnJvcihcIk5vIHN1Y2ggYXJlYSBoYW5kbGVyOiBhcmVhPSVzXCIsIHNlbGYuYXJlYSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIGg7XG59XG5cbmZ1bmN0aW9uIGdldEF0dHIoc2VsZjogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHYgPSBzZWxmLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgcmV0dXJuIHYgPyB2IDogXCJcIjtcbn1cbmZ1bmN0aW9uIHNldEF0dHIoc2VsZjogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZywgdmFsdWU6ID9zdHJpbmcpOiB2b2lkIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybjtcbiAgc2VsZi5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuPFQ+KGl0ZXJpdGVyOiBJdGVyYWJsZTxJdGVyYWJsZTxUPj4pOiBBcnJheTxUPiB7XG4gIHJldHVybiBBcnJheS5mcm9tKChmdW5jdGlvbiogKCkge1xuICAgIGZvciAoY29uc3QgaXRlciBvZiBpdGVyaXRlcikgZm9yIChjb25zdCB0IG9mIGl0ZXIpIHlpZWxkIHQ7XG4gIH0pKCkpO1xufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3N0b3JhZ2UtZm9ybS5qcyJdLCJzb3VyY2VSb290IjoiIn0=