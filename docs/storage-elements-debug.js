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
	
	_storageForm2.default.register();

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
	class HTMLStorageFormElement extends mixed {
	  static get extends() {
	    return "form";
	  }
	
	  static register() {
	    // Custom Element v1 seems not to works right to extend <form> in Google Chrome 55
	    // See http://stackoverflow.com/a/41458692/3864351
	    // customElements.define("storage-form", StorageFormElement, { extends: "form" });
	    // window.StorageFormElement = StorageFormElement;
	
	    // Custom Element v0
	    document.registerElement("storage-form", HTMLStorageFormElement);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMDk2YTBjMzg5ZmFkODcwMWM1YTciLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0b3JhZ2UtZWxlbWVudHMtcmVnaXN0ZXJlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FyZWEtaGFuZGxlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYmluZGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9zdG9yYWdlLWZvcm0uanMiXSwibmFtZXMiOlsicmVnaXN0ZXIiLCJzbGVlcCIsImRlZHVwIiwic3VidHJhY3RTZXQiLCJDYW5jZWxsYWJsZVByb21pc2UiLCJQcm9taXNlIiwiY29uc3RydWN0b3IiLCJjYWxsYmFjayIsImNhbmNlbGwiLCJjYW5jZWxsRnVuY3Rpb24iLCJtc2VjIiwidGltZW91dElkIiwicmVzb2x2ZSIsInNldFRpbWVvdXQiLCJjbGVhclRpbWVvdXQiLCJhcnJheSIsInByZWRpY2F0ZSIsInQiLCJvIiwicmVkdWNlIiwicmVzdWx0IiwiZWxlbWVudCIsInNvbWUiLCJpIiwiY29uY2F0IiwidGFyZ2V0U2V0IiwicmVtb3ZlZFNldCIsIlNldCIsIkFycmF5IiwiZnJvbSIsImZpbHRlciIsImUiLCJoYXMiLCJNdWx0aVZhbHVlTWFwIiwiTWFwIiwiZmxhdHRlblZhbHVlcyIsInZhbHVlcyIsImFyciIsInYiLCJBcnJheVZhbHVlTWFwIiwiYWRkIiwia2V5IiwidmFsdWUiLCJhIiwiZ2V0Iiwic2V0IiwicHVzaCIsIlNldFZhbHVlTWFwIiwicmVnaXN0ZXJIYW5kbGVyIiwiZmluZEhhbmRsZXIiLCJoYW5kbGVycyIsImFyZWEiLCJoYW5kbGVyIiwiRXJyb3IiLCJXZWJTdG9yYWdlQXJlYUhhbmRsZXIiLCJzdG9yYWdlIiwicmVhZCIsIm5hbWUiLCJnZXRJdGVtIiwid3JpdGUiLCJuZXdWYWx1ZSIsInNldEl0ZW0iLCJyZW1vdmUiLCJyZW1vdmVJdGVtIiwibG9jYWxTdG9yYWdlIiwic2Vzc2lvblN0b3JhZ2UiLCJDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIiLCJjaHJvbWUiLCJsb2NhbCIsInN5bmMiLCJzZWxmIiwidGFyZ2V0cyIsImFsbCIsIm1hcCIsImxvYWQiLCJzdG9yZSIsImRvU3luYyIsImZuIiwibG9jayIsInN5bmNCbG9jayIsImVsZW0iLCJuZXdOIiwibmV3ViIsInMiLCJudiIsImYiLCJmYWxsYmFja0lmTnVsbCIsImdldFZhbHVlQnlOYW1lIiwidSIsIkJpbmRlciIsInN1Ym1pdCIsInNjYW4iLCJuZXdFbGVtZW50cyIsImtleXMiLCJlbGVtZW50cyIsImRlbGV0ZSIsImZucyIsImJpbmRlciIsImVsZW1zIiwiaCIsImdldEFyZWFIYW5kbGVyIiwid3JpdGVGb3JtIiwicmVhZEZvcm0iLCJpbml0QmluZGVyIiwibWl4aW5TdG9yYWdlRm9ybSIsImFoIiwiREVGQVVMVF9TWU5DX0lOVEVSVkFMIiwiYyIsImF1dG9zeW5jIiwibiIsInBhcnNlSW50IiwiZ2V0QXR0ciIsInNldEF0dHIiLCJjcmVhdGVkQ2FsbGJhY2siLCJjb21wb25lbnRPYnNlcnZlcnMiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJwcmV2ZW50RGVmYXVsdCIsIndpbmRvdyIsImlzQXV0b1N5bmNFbmFibGVkIiwiTXV0YXRpb25PYnNlcnZlciIsInJlY29yZHMiLCJjb25zb2xlIiwiZGVidWciLCJhZGRlZCIsImZsYXR0ZW4iLCJyIiwiYWRkZWROb2RlcyIsIkhUTUxFbGVtZW50IiwibGVuZ3RoIiwib2JzZXJ2ZUNvbXBvbmVudCIsInJlbW92ZWQiLCJyZW1vdmVkTm9kZXMiLCJkaXNjb25uZWN0Q29tcG9uZW50Iiwib2JzZXJ2ZSIsImNoaWxkTGlzdCIsInN1YnRyZWUiLCJhdHRhY2hlZENhbGxiYWNrIiwib2JzZXJ2ZWRBdHRyaWJ1dGVzIiwiYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrIiwiYXR0ck5hbWUiLCJtaXhlZCIsIkhUTUxGb3JtRWxlbWVudCIsIkhUTUxTdG9yYWdlRm9ybUVsZW1lbnQiLCJleHRlbmRzIiwiZG9jdW1lbnQiLCJyZWdpc3RlckVsZW1lbnQiLCJoYXNBdHRyaWJ1dGUiLCJuZXdFbGVtZW50IiwicXVlcnlTZWxlY3RvckFsbCIsImF0dHJpYnV0ZXMiLCJhdHJpYnV0ZUZpbHRlciIsImRpc2Nvbm5lY3QiLCJjb21wb25lbnQiLCJ0eXBlIiwiY2hlY2tlZCIsImVycm9yIiwiZ2V0QXR0cmlidXRlIiwic2V0QXR0cmlidXRlIiwiaXRlcml0ZXIiLCJpdGVyIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7O0FDdENBOzs7Ozs7QUFFQSx1QkFBbUJBLFFBQW5CLEc7Ozs7Ozs7OztTQ2dCZ0JDLEssR0FBQUEsSztTQVlBQyxLLEdBQUFBLEs7U0FRQUMsVyxHQUFBQSxXO0FBdENULE9BQU1DLGtCQUFOLFNBQW9DQyxPQUFwQyxDQUErQztBQUVwREMsZUFDRUMsUUFERixFQUtFQyxPQUxGLEVBTUU7QUFDQSxXQUFNRCxRQUFOO0FBQ0EsVUFBS0UsZUFBTCxHQUF1QkQsT0FBdkI7QUFDRDs7QUFFREEsYUFBVTtBQUNSLFVBQUtDLGVBQUw7QUFDRDtBQWZtRDs7U0FBekNMLGtCLEdBQUFBLGtCO0FBa0JOLFVBQVNILEtBQVQsQ0FBZVMsSUFBZixFQUF1RDtBQUM1RCxPQUFJQyxrQkFBSjtBQUNBLFVBQU8sSUFBSVAsa0JBQUosQ0FDSlEsT0FBRCxJQUFhO0FBQ1hELGlCQUFZRSxXQUFXLE1BQU1ELFNBQWpCLEVBQTRCRixJQUE1QixDQUFaO0FBQ0QsSUFISSxFQUlMLE1BQU07QUFDSkksa0JBQWFILFNBQWI7QUFDRCxJQU5JLENBQVA7QUFRRDs7QUFFTSxVQUFTVCxLQUFULENBQWtCYSxLQUFs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RCxVQUFTWSxPQUFULENBQWlCekMsSUFBakIsRUFBb0NiLElBQXBDLEVBQTBEO0FBQ3hELE9BQU1uQixJQUFJZ0MsS0FBS3VGLFlBQUwsQ0FBa0JwRyxJQUFsQixDQUFWO0FBQ0EsVUFBT25CLElBQUlBLENBQUosR0FBUSxFQUFmO0FBQ0Q7QUFDRCxVQUFTMEUsT0FBVCxDQUFpQjFDLElBQWpCLEVBQW9DYixJQUFwQyxFQUFrRGYsS0FBbEQsRUFBd0U7QUFDdEUsT0FBSUEsU0FBUyxJQUFiLEVBQW1CO0FBQ25CNEIsUUFBS3dGLFlBQUwsQ0FBa0JyRyxJQUFsQixFQUF3QmYsS0FBeEI7QUFDRDs7QUFFRCxVQUFTbUYsT0FBVCxDQUFvQmtDLFFBQXBCLEVBQStEO0FBQzdELFVBQU9uSSxNQUFNQyxJQUFOLENBQVksYUFBYTtBQUM5QiwyQkFBbUJrSSxRQUFuQjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUEsV0FBV0MsSUFBWDtBQUE2Qiw2QkFBZ0JBLElBQWhCO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxhQUFXL0ksQ0FBWDtBQUFzQixlQUFNQSxDQUFOO0FBQXRCO0FBQTdCO0FBQ0QsSUFGaUIsRUFBWCxDQUFQO0FBR0QsRSIsImZpbGUiOiJzdG9yYWdlLWVsZW1lbnRzLWRlYnVnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgMDk2YTBjMzg5ZmFkODcwMWM1YTciLCJpbXBvcnQgU3RvcmFnZUZvcm1FbGVtZW50IGZyb20gXCIuL3N0b3JhZ2UtZm9ybVwiO1xuXG5TdG9yYWdlRm9ybUVsZW1lbnQucmVnaXN0ZXIoKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9zdG9yYWdlLWVsZW1lbnRzLXJlZ2lzdGVyZXIuanMiLCJleHBvcnQgY2xhc3MgQ2FuY2VsbGFibGVQcm9taXNlPFI+IGV4dGVuZHMgUHJvbWlzZTxSPiB7XG4gIGNhbmNlbGxGdW5jdGlvbjogKCkgPT4gdm9pZDtcbiAgY29uc3RydWN0b3IoXG4gICAgY2FsbGJhY2s6IChcbiAgICAgIHJlc29sdmU6IChyZXN1bHQ6IFByb21pc2U8Uj4gfCBSKSA9PiB2b2lkLFxuICAgICAgcmVqZWN0OiAoZXJyb3I6IGFueSkgPT4gdm9pZFxuICAgICkgPT4gbWl4ZWQsXG4gICAgY2FuY2VsbDogKCkgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihjYWxsYmFjayk7XG4gICAgdGhpcy5jYW5jZWxsRnVuY3Rpb24gPSBjYW5jZWxsO1xuICB9XG5cbiAgY2FuY2VsbCgpIHtcbiAgICB0aGlzLmNhbmNlbGxGdW5jdGlvbigpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzbGVlcChtc2VjOiBudW1iZXIpOiBDYW5jZWxsYWJsZVByb21pc2U8dm9pZD4ge1xuICBsZXQgdGltZW91dElkOiA/bnVtYmVyO1xuICByZXR1cm4gbmV3IENhbmNlbGxhYmxlUHJvbWlzZShcbiAgICAocmVzb2x2ZSkgPT4ge1xuICAgICAgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiByZXNvbHZlKCksIG1zZWMpO1xuICAgIH0sXG4gICAgKCkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgfVxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVkdXA8VD4oYXJyYXk6IEFycmF5PFQ+LFxuICAgICAgICAgICAgICAgICAgICAgICAgIHByZWRpY2F0ZT86ICh0OiBULCBvOiBUKSA9PiBib29sZWFuID0gKHQsIG8pID0+IHQgPT09IG8pOiBBcnJheTxUPiB7XG4gIHJldHVybiBhcnJheS5yZWR1Y2UoKHJlc3VsdDogQXJyYXk8VD4sIGVsZW1lbnQpID0+IHtcbiAgICBpZiAocmVzdWx0LnNvbWUoKGkpID0+IHByZWRpY2F0ZShpLCBlbGVtZW50KSkpIHJlc3VsdDtcbiAgICByZXR1cm4gcmVzdWx0LmNvbmNhdChlbGVtZW50KTtcbiAgfSxbXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdWJ0cmFjdFNldDxUPih0YXJnZXRTZXQ6IFNldDxUPiwgcmVtb3ZlZFNldDogU2V0PFQ+KTogU2V0PFQ+IHtcbiAgcmV0dXJuIG5ldyBTZXQoQXJyYXkuZnJvbSh0YXJnZXRTZXQpLmZpbHRlcigoZSkgPT4gIXJlbW92ZWRTZXQuaGFzKGUpKSk7XG59XG5cbmNsYXNzIE11bHRpVmFsdWVNYXA8SywgViwgSTogSXRlcmFibGU8Vj4+IGV4dGVuZHMgTWFwPEssIEk+IHtcbiAgKiBmbGF0dGVuVmFsdWVzKCk6IEl0ZXJhdG9yPFY+IHtcbiAgICBmb3IgKGNvbnN0IGFyciBvZiB0aGlzLnZhbHVlcygpKSB7XG4gICAgICBmb3IgKGNvbnN0IHYgb2YgYXJyKSB7XG4gICAgICAgIHlpZWxkIHY7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBcnJheVZhbHVlTWFwPEssIFY+IGV4dGVuZHMgTXVsdGlWYWx1ZU1hcDxLLCBWLCBBcnJheTxWPj4ge1xuICBhZGQoa2V5OiBLLCB2YWx1ZTogVik6IHRoaXMge1xuICAgIGxldCBhID0gdGhpcy5nZXQoa2V5KTtcbiAgICBpZiAoIWEpIHtcbiAgICAgIGEgPSBbXTtcbiAgICAgIHRoaXMuc2V0KGtleSwgYSk7XG4gICAgfVxuICAgIGEucHVzaCh2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNldFZhbHVlTWFwPEssIFY+IGV4dGVuZHMgTXVsdGlWYWx1ZU1hcDxLLCBWLCBTZXQ8Vj4+IHtcbiAgYWRkKGtleTogSywgdmFsdWU6IFYpOiB0aGlzIHtcbiAgICBsZXQgYSA9IHRoaXMuZ2V0KGtleSk7XG4gICAgaWYgKCFhKSB7XG4gICAgICBhID0gbmV3IFNldCgpO1xuICAgICAgdGhpcy5zZXQoa2V5LCBhKTtcbiAgICB9XG4gICAgYS5hZGQodmFsdWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvdXRpbHMuanMiLCIvKiBnbG9iYWwgY2hyb21lICovXG5cbmV4cG9ydCB0eXBlIEFyZWEgPSBzdHJpbmc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXJlYUhhbmRsZXIge1xuICByZWFkKG5hbWU6IHN0cmluZyk6IFByb21pc2U8P3N0cmluZz47XG4gIHdyaXRlKG5hbWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG4gIHJlbW92ZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5jb25zdCBoYW5kbGVyczogeyBbYXJlYTogQXJlYV06IEFyZWFIYW5kbGVyIH0gPSB7fTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySGFuZGxlcihhcmVhOiBBcmVhLCBoYW5kbGVyOiBBcmVhSGFuZGxlcik6IHZvaWQge1xuICBpZiAoaGFuZGxlcnNbYXJlYV0pIHtcbiAgICB0aHJvdyBFcnJvcihgQWxyZWFkeSByZWdpc3RlcmVkIGhhbmRsZXIgZm9yIFwiJHthcmVhfVwiYCk7XG4gIH1cbiAgaGFuZGxlcnNbYXJlYV0gPSBoYW5kbGVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZEhhbmRsZXIoYXJlYTogQXJlYSk6ID9BcmVhSGFuZGxlciB7XG4gIHJldHVybiBoYW5kbGVyc1thcmVhXTtcbn1cblxuLy9cblxuZXhwb3J0IGNsYXNzIFdlYlN0b3JhZ2VBcmVhSGFuZGxlciB7XG4gIHN0b3JhZ2U6IFN0b3JhZ2U7XG5cbiAgY29uc3RydWN0b3Ioc3RvcmFnZTogU3RvcmFnZSkge1xuICAgIHRoaXMuc3RvcmFnZSA9IHN0b3JhZ2U7XG4gIH1cblxuICByZWFkKG5hbWU6IHN0cmluZyk6IFByb21pc2U8P3N0cmluZz4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5zdG9yYWdlLmdldEl0ZW0obmFtZSkpO1xuICB9XG5cbiAgd3JpdGUobmFtZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zdG9yYWdlLnNldEl0ZW0obmFtZSwgbmV3VmFsdWUpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIHJlbW92ZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnN0b3JhZ2UucmVtb3ZlSXRlbShuYW1lKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cbn1cblxuaWYgKGxvY2FsU3RvcmFnZSlcbiAgcmVnaXN0ZXJIYW5kbGVyKFwibG9jYWwtc3RvcmFnZVwiLCBuZXcgV2ViU3RvcmFnZUFyZWFIYW5kbGVyKGxvY2FsU3RvcmFnZSkpO1xuaWYgKHNlc3Npb25TdG9yYWdlKVxuICByZWdpc3RlckhhbmRsZXIoXCJzZXNzaW9uLXN0b3JhZ2VcIiwgbmV3IFdlYlN0b3JhZ2VBcmVhSGFuZGxlcihzZXNzaW9uU3RvcmFnZSkpO1xuXG4vL1xuXG5leHBvcnQgY2xhc3MgQ2hyb21lU3RvcmFnZUFyZWFIYW5kbGVyIHtcbiAgc3RvcmFnZTogQ2hyb21lU3RvcmFnZUFyZWE7XG5cbiAgY29uc3RydWN0b3Ioc3RvcmFnZTogQ2hyb21lU3RvcmFnZUFyZWEpIHtcbiAgICB0aGlzLnN0b3JhZ2UgPSBzdG9yYWdlO1xuICB9XG5cbiAgcmVhZChuYW1lOiBzdHJpbmcpOiBQcm9taXNlPD9zdHJpbmc+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHRoaXMuc3RvcmFnZS5nZXQobmFtZSwgKHYpID0+IHJlc29sdmUodltuYW1lXSkpKTtcbiAgfVxuXG4gIHdyaXRlKG5hbWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gdGhpcy5zdG9yYWdlLnNldCh7IFtuYW1lXTogbmV3VmFsdWUgfSwgcmVzb2x2ZSkpO1xuICB9XG5cbiAgcmVtb3ZlKG5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gdGhpcy5zdG9yYWdlLnJlbW92ZShuYW1lLCByZXNvbHZlKSk7XG4gIH1cbn1cblxuaWYgKGNocm9tZSAmJiBjaHJvbWUuc3RvcmFnZSkge1xuICBpZiAoY2hyb21lLnN0b3JhZ2UubG9jYWwpXG4gICAgcmVnaXN0ZXJIYW5kbGVyKFwiY2hyb21lLWxvY2FsXCIsIG5ldyBDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIoY2hyb21lLnN0b3JhZ2UubG9jYWwpKTtcbiAgaWYgKGNocm9tZS5zdG9yYWdlLnN5bmMpXG4gICAgcmVnaXN0ZXJIYW5kbGVyKFwiY2hyb21lLXN5bmNcIiwgbmV3IENocm9tZVN0b3JhZ2VBcmVhSGFuZGxlcihjaHJvbWUuc3RvcmFnZS5zeW5jKSk7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvYXJlYS1oYW5kbGVyLmpzIiwiaW1wb3J0ICogYXMgdSBmcm9tIFwiLi91dGlsc1wiO1xuXG5kZWNsYXJlIHR5cGUgTmFtZSA9IHN0cmluZztcbmRlY2xhcmUgdHlwZSBWYWx1ZSA9IHN0cmluZztcbmRlY2xhcmUgdHlwZSBOYW1lVmFsdWUgPSB7IG5hbWU6IE5hbWUsIHZhbHVlOiA/VmFsdWUgfTtcbmRlY2xhcmUgdHlwZSBWYWx1ZXMgPSBNYXA8RWxlbWVudCwgTmFtZVZhbHVlPjtcbmV4cG9ydCBpbnRlcmZhY2UgRWxlbWVudCB7XG4gIG5hbWU6IE5hbWU7XG59XG5kZWNsYXJlIGludGVyZmFjZSBTdG9yYWdlSGFuZGxlciB7XG4gIHJlYWQobjogTmFtZSk6IFByb21pc2U8P1ZhbHVlPjtcbiAgd3JpdGUobjogTmFtZSwgdjogVmFsdWUpOiBQcm9taXNlPHZvaWQ+O1xuICByZW1vdmUobjogTmFtZSk6UHJvbWlzZTx2b2lkPjtcbn1cbmRlY2xhcmUgaW50ZXJmYWNlIEZvcm1IYW5kbGVyIHtcbiAgd3JpdGUoZTogRWxlbWVudCwgdjogP1ZhbHVlKTogdm9pZDtcbiAgcmVhZChlOiBFbGVtZW50KTogP1ZhbHVlO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCaW5kZXIge1xuICB2OiBWYWx1ZXM7XG4gIHM6IFN0b3JhZ2VIYW5kbGVyO1xuICBmOiBGb3JtSGFuZGxlcjtcbiAgbG9jazogP1Byb21pc2U8bWl4ZWQ+O1xuXG4gIGNvbnN0cnVjdG9yKHM6IFN0b3JhZ2VIYW5kbGVyLCBmOiBGb3JtSGFuZGxlcikge1xuICAgIHRoaXMudiA9IG5ldyBNYXA7XG4gICAgdGhpcy5zID0gcztcbiAgICB0aGlzLmYgPSBmO1xuICAgIHRoaXMubG9jayA9IG51bGw7XG4gIH1cblxuICBhc3luYyBzeW5jKHRhcmdldHM6IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsICgpID0+IGRvU3luYyh0aGlzLCB0YXJnZXRzKSk7XG4gIH1cblxuICAvLy8gRm9yY2Ugd3JpdGUgZm9ybSB2YWx1ZXMgdG8gdGhlIHN0b3JhZ2VcbiAgYXN5bmMgc3VibWl0KHRhcmdldHM6IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsICgpID0+IFByb21pc2UuYWxsKHRhcmdldHMubWFwKGFzeW5jIChlKSA9PiB7XG4gICAgICBhd2FpdCBzdG9yZSh0aGlzLCBlKTtcbiAgICB9KSkpO1xuICB9XG5cbiAgLy8vIFN5bmMgb25seSBuZXcgZWxlbWVudHNcbiAgYXN5bmMgc2Nhbih0YXJnZXRzOiBBcnJheTxFbGVtZW50Pik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN5bmNCbG9jayh0aGlzLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBuZXdFbGVtZW50cyA9IHUuc3VidHJhY3RTZXQobmV3IFNldCh0YXJnZXRzKSwgbmV3IFNldCh0aGlzLnYua2V5cygpKSk7XG4gICAgICBhd2FpdCBkb1N5bmModGhpcywgQXJyYXkuZnJvbShuZXdFbGVtZW50cykpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8vIEludm9yayBpZiBhbiBlbGVtZW50IHdhcyByZW1vdmVkIGZyb20gYSBmb3JtLlxuICBhc3luYyByZW1vdmUoZWxlbWVudHM6IEFycmF5PEVsZW1lbnQ+KSB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsIGFzeW5jICgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgZSBvZiBlbGVtZW50cykgdGhpcy52LmRlbGV0ZShlKTtcbiAgICB9KTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBkb1N5bmMoc2VsZjogQmluZGVyLCB0YXJnZXRzOiBBcnJheTxFbGVtZW50Pikge1xuICBhd2FpdCBQcm9taXNlLmFsbCh0YXJnZXRzLm1hcChhc3luYyAoZSkgPT4ge1xuICAgIGF3YWl0IGxvYWQoc2VsZiwgZSk7XG4gICAgYXdhaXQgc3RvcmUoc2VsZiwgZSk7XG4gIH0pKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc3luY0Jsb2NrKHNlbGY6IEJpbmRlciwgZm46ICgpID0+IFByb21pc2U8bWl4ZWQ+KSB7XG4gIHdoaWxlIChzZWxmLmxvY2spIGF3YWl0IHNlbGYubG9jaztcbiAgc2VsZi5sb2NrID0gZm4oKTtcbiAgYXdhaXQgc2VsZi5sb2NrO1xuICBzZWxmLmxvY2sgPSBudWxsO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkKHNlbGY6IEJpbmRlciwgZWxlbTogRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBuZXdOID0gZWxlbS5uYW1lO1xuICBjb25zdCBuZXdWID0gYXdhaXQgc2VsZi5zLnJlYWQobmV3Tik7XG4gIGxldCBudjogP05hbWVWYWx1ZSA9IHNlbGYudi5nZXQoZWxlbSk7XG4gIGlmICghbnYpIHtcbiAgICBudiA9IHsgbmFtZTogZWxlbS5uYW1lLCB2YWx1ZTogbnVsbCB9O1xuICAgIHNlbGYudi5zZXQoZWxlbSwgbnYpO1xuICB9XG4gIGlmIChudi5uYW1lICE9PSBuZXdOIHx8IG52LnZhbHVlICE9PSBuZXdWKSB7XG4gICAgc2VsZi5mLndyaXRlKGVsZW0sIG5ld1YpO1xuICAgIG52Lm5hbWUgPSAgbmV3TjtcbiAgICBudi52YWx1ZSA9ICBuZXdWO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN0b3JlKHNlbGY6IEJpbmRlciwgZWxlbTogRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBuZXdOID0gZWxlbS5uYW1lO1xuICBjb25zdCBuZXdWID0gZmFsbGJhY2tJZk51bGwoKCkgPT4gc2VsZi5mLnJlYWQoZWxlbSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKSA9PiBnZXRWYWx1ZUJ5TmFtZShzZWxmLCBuZXdOKSk7XG4gIGxldCBudjogP05hbWVWYWx1ZSA9IHNlbGYudi5nZXQoZWxlbSk7XG4gIGlmICghbnYpIHtcbiAgICBudiA9IHsgbmFtZTogZWxlbS5uYW1lLCB2YWx1ZTogbnVsbCB9O1xuICAgIHNlbGYudi5zZXQoZWxlbSwgbnYpO1xuICB9XG4gIGlmIChudi5uYW1lICE9PSBuZXdOIHx8IG52LnZhbHVlICE9PSBuZXdWKSB7XG4gICAgaWYgKG5ld1YgPT0gbnVsbCkge1xuICAgICAgYXdhaXQgc2VsZi5zLnJlbW92ZShuZXdOKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgc2VsZi5zLndyaXRlKG5ld04sIG5ld1YpO1xuICAgIH1cbiAgICBudi5uYW1lID0gIG5ld047XG4gICAgbnYudmFsdWUgPSAgbmV3VjtcbiAgfVxufVxuXG5mdW5jdGlvbiBmYWxsYmFja0lmTnVsbDxUPiguLi5mbnM6IEFycmF5PCgpID0+IFQ+KTogP1Qge1xuICBmb3IgKGNvbnN0IGZuIG9mIGZucykge1xuICAgIGNvbnN0IHYgPSBmbigpO1xuICAgIGlmICh2ICE9IG51bGwpIHJldHVybiB2O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRWYWx1ZUJ5TmFtZShzZWxmOiBCaW5kZXIsIG5hbWU6IE5hbWUpOiA/VmFsdWUge1xuICBmb3IgKGNvbnN0IG52IG9mIHNlbGYudi52YWx1ZXMoKSkge1xuICAgIGlmIChudi5uYW1lID09PSBuYW1lKSByZXR1cm4gbnYudmFsdWU7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvYmluZGVyLmpzIiwiaW1wb3J0ICogYXMgdSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0ICogYXMgYWggZnJvbSBcIi4vYXJlYS1oYW5kbGVyXCI7XG5pbXBvcnQgQmluZGVyIGZyb20gXCIuL2JpbmRlclwiO1xuaW1wb3J0IHR5cGUgeyBFbGVtZW50IH0gZnJvbSBcIi4vYmluZGVyXCI7XG5cbmRlY2xhcmUgdHlwZSBOYW1lID0gc3RyaW5nO1xuZGVjbGFyZSB0eXBlIFZhbHVlID0gc3RyaW5nO1xuXG5kZWNsYXJlIGludGVyZmFjZSBGb3JtQ29tcG9uZW50RWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgbmFtZTogTmFtZTtcbiAgdmFsdWU/OiBWYWx1ZTtcbiAgdHlwZT86IHN0cmluZztcbiAgY2hlY2tlZD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RvcmFnZUZvcm0gZXh0ZW5kcyBIVE1MRm9ybUVsZW1lbnQge1xuICBhdXRvc3luYzogbnVtYmVyO1xuICBhcmVhOiBzdHJpbmc7XG59XG5cbmRlY2xhcmUgaW50ZXJmYWNlIEludGVybmFsU3RvcmFnZUZvcm0gZXh0ZW5kcyBTdG9yYWdlRm9ybSB7XG4gIGJpbmRlcjogP0JpbmRlcjtcbiAgY29tcG9uZW50T2JzZXJ2ZXJzOiBNYXA8Rm9ybUNvbXBvbmVudEVsZW1lbnQsIE11dGF0aW9uT2JzZXJ2ZXI+O1xufVxuXG5jb25zdCBERUZBVUxUX1NZTkNfSU5URVJWQUwgPSA3MDA7XG5cbmV4cG9ydCBmdW5jdGlvbiBtaXhpblN0b3JhZ2VGb3JtPFQ6IEhUTUxGb3JtRWxlbWVudD4oYzogQ2xhc3M8VD4pOiBDbGFzczxUICYgU3RvcmFnZUZvcm0+IHtcbiAgLy8gJEZsb3dGaXhNZSBGb3JjZSBjYXN0IHRvIHRoZSByZXR1cm5lZCB0eXBlLlxuICByZXR1cm4gY2xhc3MgZXh0ZW5kcyBjIHtcbiAgICBiaW5kZXI6ID9CaW5kZXI7XG4gICAgY29tcG9uZW50T2JzZXJ2ZXJzOiBNYXA8Rm9ybUNvbXBvbmVudEVsZW1lbnQsIE11dGF0aW9uT2JzZXJ2ZXI+O1xuXG4gICAgZ2V0IGF1dG9zeW5jKCk6IG51bWJlciB7XG4gICAgICBjb25zdCBuID0gcGFyc2VJbnQoZ2V0QXR0cih0aGlzLCBcImF1dG9zeW5jXCIpKTtcbiAgICAgIHJldHVybiBuID4gMCA/IG4gOiBERUZBVUxUX1NZTkNfSU5URVJWQUw7XG4gICAgfVxuICAgIHNldCBhdXRvc3luYyh2OiBhbnkpIHsgc2V0QXR0cih0aGlzLCBcImF1dG9zeW5jXCIsIHYpOyB9XG4gICAgZ2V0IGFyZWEoKTogYWguQXJlYSB7IHJldHVybiBnZXRBdHRyKHRoaXMsIFwiYXJlYVwiKTsgfVxuICAgIHNldCBhcmVhKHY6IGFueSkgeyBzZXRBdHRyKHRoaXMsIFwiYXJlYVwiLCB2KTsgfVxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgIGluaXRCaW5kZXIodGhpcyk7XG4gICAgICB0aGlzLmNvbXBvbmVudE9ic2VydmVycyA9IG5ldyBNYXAoKTtcblxuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBzdWJtaXQodGhpcyk7XG4gICAgICB9KTtcblxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmxvYWRcIiwgKCkgPT4ge1xuICAgICAgICBpZiAoaXNBdXRvU3luY0VuYWJsZWQodGhpcykpIHtcbiAgICAgICAgICBzeW5jKHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKHJlY29yZHMpID0+IHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcInNjYW4gYnkgZm9ybSBNdXRhdGlvbk9ic2VydmVyOiBcIiwgdGhpcyk7XG4gICAgICAgIHNjYW4odGhpcyk7XG5cbiAgICAgICAgY29uc3QgYWRkZWQ6IEFycmF5PEhUTUxFbGVtZW50PiA9XG4gICAgICAgICAgICAgIGZsYXR0ZW4ocmVjb3Jkcy5tYXAociA9PiAoci5hZGRlZE5vZGVzOiBJdGVyYWJsZTxhbnk+KSkpXG4gICAgICAgICAgICAgIC5maWx0ZXIoKGUpID0+IGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCk7XG4gICAgICAgIGlmIChhZGRlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBlIG9mIGFkZGVkKSB7XG4gICAgICAgICAgICBvYnNlcnZlQ29tcG9uZW50KHRoaXMsIGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlbW92ZWQ6IEFycmF5PEhUTUxFbGVtZW50PiA9XG4gICAgICAgICAgICAgIGZsYXR0ZW4ocmVjb3Jkcy5tYXAoKHIpID0+IChyLnJlbW92ZWROb2RlczogSXRlcmFibGU8YW55PikpKVxuICAgICAgICAgICAgICAuZmlsdGVyKChlKSA9PiBlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpO1xuICAgICAgICBpZiAocmVtb3ZlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy8gVXNlIGFueSB0byBmb3JjZSBjYXN0IHRvIEFycmF5PEZvcm1Db21wb25lbnRFbGVtZW50cz5cbiAgICAgICAgICByZW1vdmUodGhpcywgKHJlbW92ZWQuZmlsdGVyKChlKSA9PiAoZTogYW55KS5uYW1lKTogQXJyYXk8YW55PikpO1xuICAgICAgICAgIGZvciAoY29uc3QgZSBvZiByZW1vdmVkKSB7XG4gICAgICAgICAgICBkaXNjb25uZWN0Q29tcG9uZW50KHRoaXMsIGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkub2JzZXJ2ZSh0aGlzLCB7IGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZSB9KTtcblxuICAgICAgc2Nhbih0aGlzKTtcblxuICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICBhd2FpdCB1LnNsZWVwKHRoaXMuYXV0b3N5bmMpO1xuICAgICAgICAgIGlmIChpc0F1dG9TeW5jRW5hYmxlZCh0aGlzKSkge1xuICAgICAgICAgICAgYXdhaXQgc3luYyh0aGlzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXdhaXQgc2Nhbih0aGlzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pKCk7XG4gICAgfVxuXG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgIHNjYW4odGhpcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICBcImF1dG9zeW5jXCIsXG4gICAgICAgIFwiYXJlYVwiLFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ck5hbWU6IHN0cmluZykge1xuICAgICAgc3dpdGNoIChhdHRyTmFtZSkge1xuICAgICAgY2FzZSBcImF1dG9zeW5jXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFyZWFcIjpcbiAgICAgICAgaW5pdEJpbmRlcih0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG5jb25zdCBtaXhlZCA9IG1peGluU3RvcmFnZUZvcm0oSFRNTEZvcm1FbGVtZW50KTtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhUTUxTdG9yYWdlRm9ybUVsZW1lbnQgZXh0ZW5kcyBtaXhlZCB7XG4gIHN0YXRpYyBnZXQgZXh0ZW5kcygpIHsgcmV0dXJuIFwiZm9ybVwiOyB9XG5cbiAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgIC8vIEN1c3RvbSBFbGVtZW50IHYxIHNlZW1zIG5vdCB0byB3b3JrcyByaWdodCB0byBleHRlbmQgPGZvcm0+IGluIEdvb2dsZSBDaHJvbWUgNTVcbiAgICAvLyBTZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNDE0NTg2OTIvMzg2NDM1MVxuICAgIC8vIGN1c3RvbUVsZW1lbnRzLmRlZmluZShcInN0b3JhZ2UtZm9ybVwiLCBTdG9yYWdlRm9ybUVsZW1lbnQsIHsgZXh0ZW5kczogXCJmb3JtXCIgfSk7XG4gICAgLy8gd2luZG93LlN0b3JhZ2VGb3JtRWxlbWVudCA9IFN0b3JhZ2VGb3JtRWxlbWVudDtcblxuICAgIC8vIEN1c3RvbSBFbGVtZW50IHYwXG4gICAgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwic3RvcmFnZS1mb3JtXCIsIEhUTUxTdG9yYWdlRm9ybUVsZW1lbnQpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXV0b1N5bmNFbmFibGVkKHNlbGY6IEhUTUxGb3JtRWxlbWVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gc2VsZi5oYXNBdHRyaWJ1dGUoXCJhdXRvc3luY1wiKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc3VibWl0KHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbGYuYmluZGVyKSBhd2FpdCBzZWxmLmJpbmRlci5zdWJtaXQoZWxlbWVudHMoc2VsZikpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzeW5jKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0sIHRhcmdldHM/OiBBcnJheTxFbGVtZW50Pik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnN5bmModGFyZ2V0cyA/IHRhcmdldHMgOiBlbGVtZW50cyhzZWxmKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNjYW4oc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnNjYW4oZWxlbWVudHMoc2VsZikpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZW1vdmUoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSwgZWxlbXM6IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZWxmLmJpbmRlcikgYXdhaXQgc2VsZi5iaW5kZXIucmVtb3ZlKGVsZW1zKTtcbn1cblxuZnVuY3Rpb24gb2JzZXJ2ZUNvbXBvbmVudChzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtLCBuZXdFbGVtZW50OiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBjb25zdCBlbGVtZW50czogQXJyYXk8Rm9ybUNvbXBvbmVudEVsZW1lbnQ+ID1cbiAgICAgICAgLy8gZm9yY2UgY2FzdFxuICAgICAgICAoW25ld0VsZW1lbnQsIC4uLkFycmF5LmZyb20obmV3RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiKlwiKSldXG4gICAgICAgICAuZmlsdGVyKChlKSA9PiAoZTogYW55KS52YWx1ZSAhPSBudWxsICYmIChlOiBhbnkpLm5hbWUgIT0gbnVsbCk6IGFueSk7XG5cbiAgZm9yIChjb25zdCBlIG9mIGVsZW1lbnRzKSB7XG4gICAgY29uc3QgbyA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHN5bmMoc2VsZiwgW2VdKSk7XG4gICAgby5vYnNlcnZlKGUsIHsgYXR0cmlidXRlczogdHJ1ZSwgYXRyaWJ1dGVGaWx0ZXI6IFtcIm5hbWVcIl0gfSk7XG4gICAgc2VsZi5jb21wb25lbnRPYnNlcnZlcnMuc2V0KGUsIG8pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRpc2Nvbm5lY3RDb21wb25lbnQoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSwgZWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3QgZWxlbWVudHMgPSBbZWxlbWVudCwgLi4uQXJyYXkuZnJvbShlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIqXCIpKV07XG4gIGZvciAoY29uc3QgZSBvZiBlbGVtZW50cykge1xuICAgIGNvbnN0IG8gPSBzZWxmLmNvbXBvbmVudE9ic2VydmVycy5nZXQoKGU6IGFueSkpO1xuICAgIGlmIChvID09IG51bGwpIGNvbnRpbnVlO1xuICAgIHNlbGYuY29tcG9uZW50T2JzZXJ2ZXJzLmRlbGV0ZSgoZTogYW55KSk7XG4gICAgby5kaXNjb25uZWN0KCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZWxlbWVudHMoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSk6IEFycmF5PEVsZW1lbnQ+IHtcbiAgcmV0dXJuIEFycmF5LmZyb20oKChzZWxmLmVsZW1lbnRzKTogSXRlcmFibGU8YW55PikpLmZpbHRlcihlID0+IGUubmFtZSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRCaW5kZXIoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSk6IFByb21pc2U8dm9pZD4ge1xuICBzZWxmLmJpbmRlciA9IG51bGw7XG5cbiAgY29uc3QgaCA9IGdldEFyZWFIYW5kbGVyKHNlbGYpO1xuICBpZiAoIWgpIHJldHVybjtcblxuICBzZWxmLmJpbmRlciA9IG5ldyBCaW5kZXIoXG4gICAgaCxcbiAgICB7IHdyaXRlOiB3cml0ZUZvcm0sXG4gICAgICByZWFkOiByZWFkRm9ybSB9XG4gICk7XG4gIGF3YWl0IHN5bmMoc2VsZik7XG59XG5cbmZ1bmN0aW9uIHdyaXRlRm9ybShjb21wb25lbnQ6IGFueSwgbmV3VmFsdWU6ID9WYWx1ZSk6IHZvaWQge1xuICAoY29tcG9uZW50OiBGb3JtQ29tcG9uZW50RWxlbWVudCk7XG4gIGNvbnN0IHR5cGUgPSBjb21wb25lbnQudHlwZTtcbiAgaWYgKHR5cGUgPT09IFwiY2hlY2tib3hcIiB8fCB0eXBlID09PSBcInJhZGlvXCIpIHtcbiAgICBjb21wb25lbnQuY2hlY2tlZCA9IG5ld1ZhbHVlID09PSBjb21wb25lbnQudmFsdWU7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKG5ld1ZhbHVlID09IG51bGwgfHwgY29tcG9uZW50LnZhbHVlID09IG51bGwpXG4gICAgcmV0dXJuO1xuXG4gIGNvbXBvbmVudC52YWx1ZSA9IG5ld1ZhbHVlO1xufVxuXG5mdW5jdGlvbiByZWFkRm9ybShjb21wb25lbnQ6IGFueSk6ID9WYWx1ZSB7XG4gIChjb21wb25lbnQ6IEZvcm1Db21wb25lbnRFbGVtZW50KTtcbiAgY29uc3QgdHlwZSA9IGNvbXBvbmVudC50eXBlO1xuICBpZiAodHlwZSA9PT0gXCJjaGVja2JveFwiIHx8IHR5cGUgPT09IFwicmFkaW9cIikge1xuICAgIHJldHVybiBjb21wb25lbnQuY2hlY2tlZCA/IGNvbXBvbmVudC52YWx1ZSA6IG51bGw7XG4gIH1cbiAgcmV0dXJuIGNvbXBvbmVudC52YWx1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0QXJlYUhhbmRsZXIoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSk6ID9haC5BcmVhSGFuZGxlciB7XG4gIGNvbnN0IGEgPSBzZWxmLmFyZWE7XG4gIGlmICghYSkge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJSZXF1aXJlICdhcmVhJyBhdHRyaWJ1dGVcIik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgY29uc3QgaCA9IGFoLmZpbmRIYW5kbGVyKGEpO1xuICBpZiAoIWgpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiTm8gc3VjaCBhcmVhIGhhbmRsZXI6IGFyZWE9JXNcIiwgc2VsZi5hcmVhKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gaDtcbn1cblxuZnVuY3Rpb24gZ2V0QXR0cihzZWxmOiBIVE1MRWxlbWVudCwgbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdiA9IHNlbGYuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICByZXR1cm4gdiA/IHYgOiBcIlwiO1xufVxuZnVuY3Rpb24gc2V0QXR0cihzZWxmOiBIVE1MRWxlbWVudCwgbmFtZTogc3RyaW5nLCB2YWx1ZTogP3N0cmluZyk6IHZvaWQge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuO1xuICBzZWxmLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW48VD4oaXRlcml0ZXI6IEl0ZXJhYmxlPEl0ZXJhYmxlPFQ+Pik6IEFycmF5PFQ+IHtcbiAgcmV0dXJuIEFycmF5LmZyb20oKGZ1bmN0aW9uKiAoKSB7XG4gICAgZm9yIChjb25zdCBpdGVyIG9mIGl0ZXJpdGVyKSBmb3IgKGNvbnN0IHQgb2YgaXRlcikgeWllbGQgdDtcbiAgfSkoKSk7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvc3RvcmFnZS1mb3JtLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==