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
	
	var _areaHandler = __webpack_require__(1);
	
	var ah = _interopRequireWildcard(_areaHandler);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	// Register area handlers
	/* global chrome */
	
	if (localStorage) ah.registerHandler("local-storage", new ah.WebStorageAreaHandler(localStorage));
	if (sessionStorage) ah.registerHandler("session-storage", new ah.WebStorageAreaHandler(sessionStorage));
	if (chrome && chrome.storage) {
	  if (chrome.storage.local) ah.registerHandler("chrome-local", new ah.ChromeStorageAreaHandler(chrome.storage.local));
	  if (chrome.storage.sync) ah.registerHandler("chrome-sync", new ah.ChromeStorageAreaHandler(chrome.storage.sync));
	}
	
	// Custom Element v1 seems not to working right on Google Chrome 55
	// customElements.define(name, ce, { extends: ex });
	
	// Custom Element v0
	// $FlowFixMe Avoid to affect code of `storage-form.js` by Custom Element v0
	Object.defineProperty(_storageForm2.default, "extends", { get: () => "form" });
	document.registerElement("storage-form", _storageForm2.default);

/***/ },
/* 1 */
/***/ function(module, exports) {

	"use strict";
	
	exports.__esModule = true;
	exports.registerHandler = registerHandler;
	exports.findHandler = findHandler;
	
	
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

/***/ },
/* 2 */
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
	
	var _utils = __webpack_require__(2);
	
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
	
	var _utils = __webpack_require__(2);
	
	var u = _interopRequireWildcard(_utils);
	
	var _areaHandler = __webpack_require__(1);
	
	var ah = _interopRequireWildcard(_areaHandler);
	
	var _binder = __webpack_require__(3);
	
	var _binder2 = _interopRequireDefault(_binder);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
	
	var DEFAULT_SYNC_INTERVAL = 700;
	
	class HTMLStorageFormElement extends HTMLFormElement {
	
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
	        // force cast to Array<FormComponentElements>
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNGMxOGQ4YjUzOTRlMjE5NjgxNDIiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0b3JhZ2UtZWxlbWVudHMtcmVnaXN0ZXJlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYXJlYS1oYW5kbGVyLmpzIiwid2VicGFjazovLy8uL3NyYy91dGlscy5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYmluZGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9zdG9yYWdlLWZvcm0uanMiXSwibmFtZXMiOlsiYWgiLCJsb2NhbFN0b3JhZ2UiLCJyZWdpc3RlckhhbmRsZXIiLCJXZWJTdG9yYWdlQXJlYUhhbmRsZXIiLCJzZXNzaW9uU3RvcmFnZSIsImNocm9tZSIsInN0b3JhZ2UiLCJsb2NhbCIsIkNocm9tZVN0b3JhZ2VBcmVhSGFuZGxlciIsInN5bmMiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsImRvY3VtZW50IiwicmVnaXN0ZXJFbGVtZW50IiwiZmluZEhhbmRsZXIiLCJoYW5kbGVycyIsImFyZWEiLCJoYW5kbGVyIiwiRXJyb3IiLCJjb25zdHJ1Y3RvciIsInJlYWQiLCJuYW1lIiwiUHJvbWlzZSIsInJlc29sdmUiLCJnZXRJdGVtIiwid3JpdGUiLCJuZXdWYWx1ZSIsInNldEl0ZW0iLCJyZW1vdmUiLCJyZW1vdmVJdGVtIiwidiIsInNldCIsInNsZWVwIiwiZGVkdXAiLCJzdWJ0cmFjdFNldCIsIkNhbmNlbGxhYmxlUHJvbWlzZSIsImNhbGxiYWNrIiwiY2FuY2VsbCIsImNhbmNlbGxGdW5jdGlvbiIsIm1zZWMiLCJ0aW1lb3V0SWQiLCJzZXRUaW1lb3V0IiwiY2xlYXJUaW1lb3V0IiwiYXJyYXkiLCJwcmVkaWNhdGUiLCJ0IiwibyIsInJlZHVjZSIsInJlc3VsdCIsImVsZW1lbnQiLCJzb21lIiwiaSIsImNvbmNhdCIsInRhcmdldFNldCIsInJlbW92ZWRTZXQiLCJTZXQiLCJBcnJheSIsImZyb20iLCJmaWx0ZXIiLCJlIiwiaGFzIiwiTXVsdGlWYWx1ZU1hcCIsIk1hcCIsImZsYXR0ZW5WYWx1ZXMiLCJ2YWx1ZXMiLCJhcnIiLCJBcnJheVZhbHVlTWFwIiwiYWRkIiwia2V5IiwidmFsdWUiLCJhIiwicHVzaCIsIlNldFZhbHVlTWFwIiwic2VsZiIsInRhcmdldHMiLCJhbGwiLCJtYXAiLCJsb2FkIiwic3RvcmUiLCJkb1N5bmMiLCJmbiIsImxvY2siLCJzeW5jQmxvY2siLCJlbGVtIiwibmV3TiIsIm5ld1YiLCJzIiwibnYiLCJmIiwiZmFsbGJhY2tJZk51bGwiLCJnZXRWYWx1ZUJ5TmFtZSIsInUiLCJCaW5kZXIiLCJzdWJtaXQiLCJzY2FuIiwibmV3RWxlbWVudHMiLCJrZXlzIiwiZWxlbWVudHMiLCJkZWxldGUiLCJmbnMiLCJiaW5kZXIiLCJlbGVtcyIsImgiLCJnZXRBcmVhSGFuZGxlciIsIndyaXRlRm9ybSIsInJlYWRGb3JtIiwiaW5pdEJpbmRlciIsIkRFRkFVTFRfU1lOQ19JTlRFUlZBTCIsIkhUTUxTdG9yYWdlRm9ybUVsZW1lbnQiLCJIVE1MRm9ybUVsZW1lbnQiLCJhdXRvc3luYyIsIm4iLCJwYXJzZUludCIsImdldEF0dHIiLCJzZXRBdHRyIiwiY3JlYXRlZENhbGxiYWNrIiwiY29tcG9uZW50T2JzZXJ2ZXJzIiwiYWRkRXZlbnRMaXN0ZW5lciIsImV2ZW50IiwicHJldmVudERlZmF1bHQiLCJ3aW5kb3ciLCJpc0F1dG9TeW5jRW5hYmxlZCIsIk11dGF0aW9uT2JzZXJ2ZXIiLCJyZWNvcmRzIiwiY29uc29sZSIsImRlYnVnIiwiYWRkZWQiLCJmbGF0dGVuIiwiciIsImFkZGVkTm9kZXMiLCJIVE1MRWxlbWVudCIsImxlbmd0aCIsIm9ic2VydmVDb21wb25lbnQiLCJyZW1vdmVkIiwicmVtb3ZlZE5vZGVzIiwiZGlzY29ubmVjdENvbXBvbmVudCIsIm9ic2VydmUiLCJjaGlsZExpc3QiLCJzdWJ0cmVlIiwiYXR0YWNoZWRDYWxsYmFjayIsIm9ic2VydmVkQXR0cmlidXRlcyIsImF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayIsImF0dHJOYW1lIiwiaGFzQXR0cmlidXRlIiwibmV3RWxlbWVudCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJhdHRyaWJ1dGVzIiwiYXRyaWJ1dGVGaWx0ZXIiLCJkaXNjb25uZWN0IiwiY29tcG9uZW50IiwidHlwZSIsImNoZWNrZWQiLCJlcnJvciIsImdldEF0dHJpYnV0ZSIsInNldEF0dHJpYnV0ZSIsIml0ZXJpdGVyIiwiaXRlciJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7OztBQ3BDQTs7OztBQUNBOztLQUFZQSxFOzs7Ozs7QUFFWjtBQUxBOztBQU1BLEtBQUlDLFlBQUosRUFDRUQsR0FBR0UsZUFBSCxDQUFtQixlQUFuQixFQUFvQyxJQUFJRixHQUFHRyxxQkFBUCxDQUE2QkYsWUFBN0IsQ0FBcEM7QUFDRixLQUFJRyxjQUFKLEVBQ0VKLEdBQUdFLGVBQUgsQ0FBbUIsaUJBQW5CLEVBQXNDLElBQUlGLEdBQUdHLHFCQUFQLENBQTZCQyxjQUE3QixDQUF0QztBQUNGLEtBQUlDLFVBQVVBLE9BQU9DLE9BQXJCLEVBQThCO0FBQzVCLE9BQUlELE9BQU9DLE9BQVAsQ0FBZUMsS0FBbkIsRUFDRVAsR0FBR0UsZUFBSCxDQUFtQixjQUFuQixFQUFtQyxJQUFJRixHQUFHUSx3QkFBUCxDQUFnQ0gsT0FBT0MsT0FBUCxDQUFlQyxLQUEvQyxDQUFuQztBQUNGLE9BQUlGLE9BQU9DLE9BQVAsQ0FBZUcsSUFBbkIsRUFDRVQsR0FBR0UsZUFBSCxDQUFtQixhQUFuQixFQUFrQyxJQUFJRixHQUFHUSx3QkFBUCxDQUFnQ0gsT0FBT0MsT0FBUCxDQUFlRyxJQUEvQyxDQUFsQztBQUNIOztBQUVEO0FBQ0E7O0FBRUE7QUFDQTtBQUNBQyxRQUFPQyxjQUFQLHdCQUFtQyxTQUFuQyxFQUE4QyxFQUFFQyxLQUFLLE1BQU0sTUFBYixFQUE5QztBQUNBQyxVQUFTQyxlQUFULENBQXlCLGNBQXpCLHlCOzs7Ozs7Ozs7U0NiZ0JaLGUsR0FBQUEsZTtTQU9BYSxXLEdBQUFBLFc7OztBQVRoQixLQUFNQyxXQUEwQyxFQUFoRDs7QUFFTyxVQUFTZCxlQUFULENBQXlCZSxJQUF6QixFQUFxQ0MsT0FBckMsRUFBaUU7QUFDdEUsT0FBSUYsU0FBU0MsSUFBVCxDQUFKLEVBQW9CO0FBQ2xCLFdBQU1FLE1BQU8sb0NBQWtDRixJQUFLLElBQTlDLENBQU47QUFDRDtBQUNERCxZQUFTQyxJQUFULElBQWlCQyxPQUFqQjtBQUNEOztBQUVNLFVBQVNILFdBQVQsQ0FBcUJFLElBQXJCLEVBQStDO0FBQ3BELFVBQU9ELFNBQVNDLElBQVQsQ0FBUDtBQUNEOztBQUVNLE9BQU1kLHFCQUFOLENBQTRCOztBQUdqQ2lCLGVBQVlkLE9BQVosRUFBOEI7QUFDNUIsVUFBS0EsT0FBTCxHQUFlQSxPQUFmO0FBQ0Q7O0FBRURlLFFBQUtDLElBQUwsRUFBcUM7QUFDbkMsWUFBT0MsUUFBUUMsT0FBUixDQUFnQixLQUFLbEIsT0FBTCxDQUFhbUIsT0FBYixDQUFxQkgsSUFBckIsQ0FBaEIsQ0FBUDtBQUNEOztBQUVESSxTQUFNSixJQUFOLEVBQW9CSyxRQUFwQixFQUFxRDtBQUNuRCxVQUFLckIsT0FBTCxDQUFhc0IsT0FBYixDQUFxQk4sSUFBckIsRUFBMkJLLFFBQTNCO0FBQ0EsWUFBT0osUUFBUUMsT0FBUixFQUFQO0FBQ0Q7O0FBRURLLFVBQU9QLElBQVAsRUFBb0M7QUFDbEMsVUFBS2hCLE9BQUwsQ0FBYXdCLFVBQWIsQ0FBd0JSLElBQXhCO0FBQ0EsWUFBT0MsUUFBUUMsT0FBUixFQUFQO0FBQ0Q7QUFuQmdDOztTQUF0QnJCLHFCLEdBQUFBLHFCO0FBc0JOLE9BQU1LLHdCQUFOLENBQStCOztBQUdwQ1ksZUFBWWQsT0FBWixFQUF3QztBQUN0QyxVQUFLQSxPQUFMLEdBQWVBLE9BQWY7QUFDRDs7QUFFRGUsUUFBS0MsSUFBTCxFQUFxQztBQUNuQyxZQUFPLElBQUlDLE9BQUosQ0FBYUMsT0FBRCxJQUFhLEtBQUtsQixPQUFMLENBQWFNLEdBQWIsQ0FBaUJVLElBQWpCLEVBQXdCUyxDQUFELElBQU9QLFFBQVFPLEVBQUVULElBQUYsQ0FBUixDQUE5QixDQUF6QixDQUFQO0FBQ0Q7O0FBRURJLFNBQU1KLElBQU4sRUFBb0JLLFFBQXBCLEVBQXFEO0FBQ25ELFlBQU8sSUFBSUosT0FBSixDQUFhQyxPQUFELElBQWEsS0FBS2xCLE9BQUwsQ0FBYTBCLEdBQWIsQ0FBaUIsRUFBRSxDQUFDVixJQUFELEdBQVFLLFFBQVYsRUFBakIsRUFBdUNILE9BQXZDLENBQXpCLENBQVA7QUFDRDs7QUFFREssVUFBT1AsSUFBUCxFQUFvQztBQUNsQyxZQUFPLElBQUlDLE9BQUosQ0FBYUMsT0FBRCxJQUFhLEtBQUtsQixPQUFMLENBQWF1QixNQUFiLENBQW9CUCxJQUFwQixFQUEwQkUsT0FBMUIsQ0FBekIsQ0FBUDtBQUNEO0FBakJtQztTQUF6QmhCLHdCLEdBQUFBLHdCOzs7Ozs7Ozs7U0N6Qkd5QixLLEdBQUFBLEs7U0FZQUMsSyxHQUFBQSxLO1NBUUFDLFcsR0FBQUEsVztBQXRDVCxPQUFNQyxrQkFBTixTQUFvQ2IsT0FBcEMsQ0FBK0M7QUFFcERILGVBQ0VpQixRQURGLEVBS0VDLE9BTEYsRUFNRTtBQUNBLFdBQU1ELFFBQU47QUFDQSxVQUFLRSxlQUFMLEdBQXVCRCxPQUF2QjtBQUNEOztBQUVEQSxhQUFVO0FBQ1IsVUFBS0MsZUFBTDtBQUNEO0FBZm1EOztTQUF6Q0gsa0IsR0FBQUEsa0I7QUFrQk4sVUFBU0gsS0FBVCxDQUFlTyxJQUFmLEVBQXVEO0FBQzVELE9BQUlDLGtCQUFKO0FBQ0EsVUFBTyxJQUFJTCxrQkFBSixDQUNKWixPQUFELElBQWE7QUFDWGlCLGlCQUFZQyxXQUFXLE1BQU1sQixTQUFqQixFQUE0QmdCLElBQTVCLENBQVo7QUFDRCxJQUhJLEVBSUwsTUFBTTtBQUNKRyxrQkFBYUYsU0FBYjtBQUNELElBTkksQ0FBUDtBQVFEOztBQUVNLFVBQVNQLEtBQVQsQ0FBa0JVLEtBQWxCLEVBQ3FGO0FBQUEsT0FBbkVDLFNBQW1FLHVFQUE3QixDQUFDQyxDQUFELEVBQUlDLENBQUosS0FBVUQsTUFBTUMsQ0FBYTs7QUFDMUYsVUFBT0gsTUFBTUksTUFBTixDQUFhLENBQUNDLE1BQUQsRUFBbUJDLE9BQW5CLEtBQStCO0FBQ2pELFNBQUlELE9BQU9FLElBQVAsQ0FBYUMsQ0FBRCxJQUFPUCxVQUFVTyxDQUFWLEVBQWFGLE9BQWIsQ0FBbkIsQ0FBSixFQUErQ0Q7QUFDL0MsWUFBT0EsT0FBT0ksTUFBUCxDQUFjSCxPQUFkLENBQVA7QUFDRCxJQUhNLEVBR0wsRUFISyxDQUFQO0FBSUQ7O0FBRU0sVUFBU2YsV0FBVCxDQUF3Qm1CLFNBQXhCLEVBQTJDQyxVQUEzQyxFQUF1RTtBQUM1RSxVQUFPLElBQUlDLEdBQUosQ0FBUUMsTUFBTUMsSUFBTixDQUFXSixTQUFYLEVBQXNCSyxNQUF0QixDQUE4QkMsQ0FBRCxJQUFPLENBQUNMLFdBQVdNLEdBQVgsQ0FBZUQsQ0FBZixDQUFyQyxDQUFSLENBQVA7QUFDRDs7QUFFRCxPQUFNRSxhQUFOLFNBQWtEQyxHQUFsRCxDQUE0RDtBQUMxRCxJQUFFQyxhQUFGLEdBQStCO0FBQzdCLDBCQUFrQixLQUFLQyxNQUFMLEVBQWxCLGtIQUFpQztBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUEsV0FBdEJDLEdBQXNCOztBQUMvQiw2QkFBZ0JBLEdBQWhCLHlIQUFxQjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUEsYUFBVm5DLENBQVU7O0FBQ25CLGVBQU1BLENBQU47QUFDRDtBQUNGO0FBQ0Y7QUFQeUQ7O0FBVXJELE9BQU1vQyxhQUFOLFNBQWtDTCxhQUFsQyxDQUFnRTtBQUNyRU0sT0FBSUMsR0FBSixFQUFZQyxLQUFaLEVBQTRCO0FBQzFCLFNBQUlDLElBQUksS0FBSzNELEdBQUwsQ0FBU3lELEdBQVQsQ0FBUjtBQUNBLFNBQUksQ0FBQ0UsQ0FBTCxFQUFRO0FBQ05BLFdBQUksRUFBSjtBQUNBLFlBQUt2QyxHQUFMLENBQVNxQyxHQUFULEVBQWNFLENBQWQ7QUFDRDtBQUNEQSxPQUFFQyxJQUFGLENBQU9GLEtBQVA7QUFDQSxZQUFPLElBQVA7QUFDRDtBQVRvRTs7U0FBMURILGEsR0FBQUEsYTtBQVlOLE9BQU1NLFdBQU4sU0FBZ0NYLGFBQWhDLENBQTREO0FBQ2pFTSxPQUFJQyxHQUFKLEVBQVlDLEtBQVosRUFBNEI7QUFDMUIsU0FBSUMsSUFBSSxLQUFLM0QsR0FBTCxDQUFTeUQsR0FBVCxDQUFSO0FBQ0EsU0FBSSxDQUFDRSxDQUFMLEVBQVE7QUFDTkEsV0FBSSxJQUFJZixHQUFKLEVBQUo7QUFDQSxZQUFLeEIsR0FBTCxDQUFTcUMsR0FBVCxFQUFjRSxDQUFkO0FBQ0Q7QUFDREEsT0FBRUgsR0FBRixDQUFNRSxLQUFOO0FBQ0EsWUFBTyxJQUFQO0FBQ0Q7QUFUZ0U7U0FBdERHLFcsR0FBQUEsVzs7Ozs7Ozs7Ozs7aUNDTGIsV0FBc0JDLElBQXRCLEVBQW9DQyxPQUFwQyxFQUE2RDtBQUMzRCxXQUFNcEQsUUFBUXFELEdBQVIsQ0FBWUQsUUFBUUUsR0FBUjtBQUFBLHFDQUFZLFdBQU9qQixDQUFQLEVBQWE7QUFDekMsZUFBTWtCLEtBQUtKLElBQUwsRUFBV2QsQ0FBWCxDQUFOO0FBQ0EsZUFBTW1CLE1BQU1MLElBQU4sRUFBWWQsQ0FBWixDQUFOO0FBQ0QsUUFIaUI7O0FBQUE7QUFBQTtBQUFBO0FBQUEsVUFBWixDQUFOO0FBSUQsSTs7bUJBTGNvQixNOzs7Ozs7aUNBT2YsV0FBeUJOLElBQXpCLEVBQXVDTyxFQUF2QyxFQUFpRTtBQUMvRCxZQUFPUCxLQUFLUSxJQUFaO0FBQWtCLGFBQU1SLEtBQUtRLElBQVg7QUFBbEIsTUFDQVIsS0FBS1EsSUFBTCxHQUFZRCxJQUFaO0FBQ0EsV0FBTVAsS0FBS1EsSUFBWDtBQUNBUixVQUFLUSxJQUFMLEdBQVksSUFBWjtBQUNELEk7O21CQUxjQyxTOzs7Ozs7aUNBT2YsV0FBb0JULElBQXBCLEVBQWtDVSxJQUFsQyxFQUFnRTtBQUM5RCxTQUFNQyxPQUFPRCxLQUFLOUQsSUFBbEI7QUFDQSxTQUFNZ0UsT0FBTyxNQUFNWixLQUFLYSxDQUFMLENBQU9sRSxJQUFQLENBQVlnRSxJQUFaLENBQW5CO0FBQ0EsU0FBSUcsS0FBaUJkLEtBQUszQyxDQUFMLENBQU9uQixHQUFQLENBQVd3RSxJQUFYLENBQXJCO0FBQ0EsU0FBSSxDQUFDSSxFQUFMLEVBQVM7QUFDUEEsWUFBSyxFQUFFbEUsTUFBTThELEtBQUs5RCxJQUFiLEVBQW1CZ0QsT0FBTyxJQUExQixFQUFMO0FBQ0FJLFlBQUszQyxDQUFMLENBQU9DLEdBQVAsQ0FBV29ELElBQVgsRUFBaUJJLEVBQWpCO0FBQ0Q7QUFDRCxTQUFJQSxHQUFHbEUsSUFBSCxLQUFZK0QsSUFBWixJQUFvQkcsR0FBR2xCLEtBQUgsS0FBYWdCLElBQXJDLEVBQTJDO0FBQ3pDWixZQUFLZSxDQUFMLENBQU8vRCxLQUFQLENBQWEwRCxJQUFiLEVBQW1CRSxJQUFuQjtBQUNBRSxVQUFHbEUsSUFBSCxHQUFXK0QsSUFBWDtBQUNBRyxVQUFHbEIsS0FBSCxHQUFZZ0IsSUFBWjtBQUNEO0FBQ0YsSTs7bUJBYmNSLEk7Ozs7OztpQ0FlZixXQUFxQkosSUFBckIsRUFBbUNVLElBQW5DLEVBQWlFO0FBQy9ELFNBQU1DLE9BQU9ELEtBQUs5RCxJQUFsQjtBQUNBLFNBQU1nRSxPQUFPSSxlQUFlO0FBQUEsY0FBTWhCLEtBQUtlLENBQUwsQ0FBT3BFLElBQVAsQ0FBWStELElBQVosQ0FBTjtBQUFBLE1BQWYsRUFDZTtBQUFBLGNBQU1PLGVBQWVqQixJQUFmLEVBQXFCVyxJQUFyQixDQUFOO0FBQUEsTUFEZixDQUFiO0FBRUEsU0FBSUcsS0FBaUJkLEtBQUszQyxDQUFMLENBQU9uQixHQUFQLENBQVd3RSxJQUFYLENBQXJCO0FBQ0EsU0FBSSxDQUFDSSxFQUFMLEVBQVM7QUFDUEEsWUFBSyxFQUFFbEUsTUFBTThELEtBQUs5RCxJQUFiLEVBQW1CZ0QsT0FBTyxJQUExQixFQUFMO0FBQ0FJLFlBQUszQyxDQUFMLENBQU9DLEdBQVAsQ0FBV29ELElBQVgsRUFBaUJJLEVBQWpCO0FBQ0Q7QUFDRCxTQUFJQSxHQUFHbEUsSUFBSCxLQUFZK0QsSUFBWixJQUFvQkcsR0FBR2xCLEtBQUgsS0FBYWdCLElBQXJDLEVBQTJDO0FBQ3pDLFdBQUlBLFFBQVEsSUFBWixFQUFrQjtBQUNoQixlQUFNWixLQUFLYSxDQUFMLENBQU8xRCxNQUFQLENBQWN3RCxJQUFkLENBQU47QUFDRCxRQUZELE1BRU87QUFDTCxlQUFNWCxLQUFLYSxDQUFMLENBQU83RCxLQUFQLENBQWEyRCxJQUFiLEVBQW1CQyxJQUFuQixDQUFOO0FBQ0Q7QUFDREUsVUFBR2xFLElBQUgsR0FBVytELElBQVg7QUFDQUcsVUFBR2xCLEtBQUgsR0FBWWdCLElBQVo7QUFDRDtBQUNGLEk7O21CQWxCY1AsSzs7Ozs7QUF4RmY7O0tBQVlhLEM7Ozs7OztBQW1CRyxPQUFNQyxNQUFOLENBQWE7O0FBTTFCekUsZUFBWW1FLENBQVosRUFBK0JFLENBQS9CLEVBQStDO0FBQzdDLFVBQUsxRCxDQUFMLEdBQVMsSUFBSWdDLEdBQUosRUFBVDtBQUNBLFVBQUt3QixDQUFMLEdBQVNBLENBQVQ7QUFDQSxVQUFLRSxDQUFMLEdBQVNBLENBQVQ7QUFDQSxVQUFLUCxJQUFMLEdBQVksSUFBWjtBQUNEOztBQUVLekUsT0FBTixDQUFXa0UsT0FBWCxFQUFtRDtBQUFBOztBQUFBO0FBQ2pELGFBQU1RLGlCQUFnQjtBQUFBLGdCQUFNSCxjQUFhTCxPQUFiLENBQU47QUFBQSxRQUFoQixDQUFOO0FBRGlEO0FBRWxEOztBQUVEO0FBQ01tQixTQUFOLENBQWFuQixPQUFiLEVBQXFEO0FBQUE7O0FBQUE7QUFDbkQsYUFBTVEsa0JBQWdCO0FBQUEsZ0JBQU01RCxRQUFRcUQsR0FBUixDQUFZRCxRQUFRRSxHQUFSO0FBQUEsd0NBQVksV0FBT2pCLENBQVAsRUFBYTtBQUMvRCxtQkFBTW1CLGNBQVluQixDQUFaLENBQU47QUFDRCxZQUZ1Qzs7QUFBQTtBQUFBO0FBQUE7QUFBQSxjQUFaLENBQU47QUFBQSxRQUFoQixDQUFOO0FBRG1EO0FBSXBEOztBQUVEO0FBQ01tQyxPQUFOLENBQVdwQixPQUFYLEVBQW1EO0FBQUE7O0FBQUE7QUFDakQsYUFBTVEsb0NBQWdCLGFBQVk7QUFDaEMsYUFBTWEsY0FBY0osRUFBRXpELFdBQUYsQ0FBYyxJQUFJcUIsR0FBSixDQUFRbUIsT0FBUixDQUFkLEVBQWdDLElBQUluQixHQUFKLENBQVEsT0FBS3pCLENBQUwsQ0FBT2tFLElBQVAsRUFBUixDQUFoQyxDQUFwQjtBQUNBLGVBQU1qQixlQUFhdkIsTUFBTUMsSUFBTixDQUFXc0MsV0FBWCxDQUFiLENBQU47QUFDRCxRQUhLLEVBQU47QUFEaUQ7QUFLbEQ7O0FBRUQ7QUFDTW5FLFNBQU4sQ0FBYXFFLFFBQWIsRUFBdUM7QUFBQTs7QUFBQTtBQUNyQyxhQUFNZixvQ0FBZ0IsYUFBWTtBQUNoQyw4QkFBZ0JlLFFBQWhCO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxlQUFXdEMsRUFBWDtBQUEwQixrQkFBSzdCLENBQUwsQ0FBT29FLE1BQVAsQ0FBY3ZDLEVBQWQ7QUFBMUI7QUFDRCxRQUZLLEVBQU47QUFEcUM7QUFJdEM7QUFyQ3lCOzttQkFBUGlDLE07OztBQXlGckIsVUFBU0gsY0FBVCxHQUF1RDtBQUFBLHFDQUF6QlUsR0FBeUI7QUFBekJBLFFBQXlCO0FBQUE7O0FBQ3JELHlCQUFpQkEsR0FBakIseUhBQXNCO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxTQUFYbkIsRUFBVzs7QUFDcEIsU0FBTWxELEtBQUlrRCxJQUFWO0FBQ0EsU0FBSWxELE1BQUssSUFBVCxFQUFlLE9BQU9BLEVBQVA7QUFDaEI7QUFDRCxVQUFPLElBQVA7QUFDRDs7QUFFRCxVQUFTNEQsY0FBVCxDQUF3QmpCLElBQXhCLEVBQXNDcEQsSUFBdEMsRUFBMEQ7QUFDeEQseUJBQWlCb0QsS0FBSzNDLENBQUwsQ0FBT2tDLE1BQVAsRUFBakIseUhBQWtDO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxTQUF2QnVCLEVBQXVCOztBQUNoQyxTQUFJQSxHQUFHbEUsSUFBSCxLQUFZQSxJQUFoQixFQUFzQixPQUFPa0UsR0FBR2xCLEtBQVY7QUFDdkI7QUFDRCxVQUFPLElBQVA7QUFDRCxFOzs7Ozs7Ozs7OztpQ0NSRCxXQUFzQkksSUFBdEIsRUFBbUU7QUFDakUsU0FBSUEsS0FBSzJCLE1BQVQsRUFBaUIsTUFBTTNCLEtBQUsyQixNQUFMLENBQVlQLE1BQVosQ0FBbUJJLFNBQVN4QixJQUFULENBQW5CLENBQU47QUFDbEIsSTs7bUJBRmNvQixNOzs7Ozs7aUNBSWYsV0FBb0JwQixJQUFwQixFQUFrREMsT0FBbEQsRUFBMkY7QUFDekYsU0FBSUQsS0FBSzJCLE1BQVQsRUFBaUIsTUFBTTNCLEtBQUsyQixNQUFMLENBQVk1RixJQUFaLENBQWlCa0UsVUFBVUEsT0FBVixHQUFvQnVCLFNBQVN4QixJQUFULENBQXJDLENBQU47QUFDbEIsSTs7bUJBRmNqRSxJOzs7Ozs7aUNBSWYsV0FBb0JpRSxJQUFwQixFQUFpRTtBQUMvRCxTQUFJQSxLQUFLMkIsTUFBVCxFQUFpQixNQUFNM0IsS0FBSzJCLE1BQUwsQ0FBWU4sSUFBWixDQUFpQkcsU0FBU3hCLElBQVQsQ0FBakIsQ0FBTjtBQUNsQixJOzttQkFGY3FCLEk7Ozs7OztpQ0FJZixXQUFzQnJCLElBQXRCLEVBQW9ENEIsS0FBcEQsRUFBMEY7QUFDeEYsU0FBSTVCLEtBQUsyQixNQUFULEVBQWlCLE1BQU0zQixLQUFLMkIsTUFBTCxDQUFZeEUsTUFBWixDQUFtQnlFLEtBQW5CLENBQU47QUFDbEIsSTs7bUJBRmN6RSxNOzs7Ozs7a0NBK0JmLFdBQTBCNkMsSUFBMUIsRUFBdUU7QUFDckVBLFVBQUsyQixNQUFMLEdBQWMsSUFBZDs7QUFFQSxTQUFNRSxJQUFJQyxlQUFlOUIsSUFBZixDQUFWO0FBQ0EsU0FBSSxDQUFDNkIsQ0FBTCxFQUFROztBQUVSN0IsVUFBSzJCLE1BQUwsR0FBYyxxQkFDWkUsQ0FEWSxFQUVaLEVBQUU3RSxPQUFPK0UsU0FBVDtBQUNFcEYsYUFBTXFGLFFBRFIsRUFGWSxDQUFkO0FBS0EsV0FBTWpHLEtBQUtpRSxJQUFMLENBQU47QUFDRCxJOzttQkFaY2lDLFU7Ozs7O0FBNUpmOztLQUFZZixDOztBQUNaOztLQUFZNUYsRTs7QUFDWjs7Ozs7Ozs7OztBQWFBLEtBQU00Ryx3QkFBd0IsR0FBOUI7O0FBRWUsT0FBTUMsc0JBQU4sU0FBcUNDLGVBQXJDLENBQXFEOztBQUlsRSxPQUFJQyxRQUFKLEdBQXVCO0FBQ3JCLFNBQU1DLElBQUlDLFNBQVNDLFFBQVEsSUFBUixFQUFjLFVBQWQsQ0FBVCxDQUFWO0FBQ0EsWUFBT0YsSUFBSSxDQUFKLEdBQVFBLENBQVIsR0FBWUoscUJBQW5CO0FBQ0Q7QUFDRCxPQUFJRyxRQUFKLENBQWFoRixDQUFiLEVBQXFCO0FBQUVvRixhQUFRLElBQVIsRUFBYyxVQUFkLEVBQTBCcEYsQ0FBMUI7QUFBK0I7QUFDdEQsT0FBSWQsSUFBSixHQUFvQjtBQUFFLFlBQU9pRyxRQUFRLElBQVIsRUFBYyxNQUFkLENBQVA7QUFBK0I7QUFDckQsT0FBSWpHLElBQUosQ0FBU2MsQ0FBVCxFQUFpQjtBQUFFb0YsYUFBUSxJQUFSLEVBQWMsTUFBZCxFQUFzQnBGLENBQXRCO0FBQTJCOztBQUU5Q1gsaUJBQWM7QUFDWjtBQUNEOztBQUVEZ0cscUJBQWtCO0FBQUE7O0FBQ2hCVCxnQkFBVyxJQUFYO0FBQ0EsVUFBS1Usa0JBQUwsR0FBMEIsSUFBSXRELEdBQUosRUFBMUI7O0FBRUEsVUFBS3VELGdCQUFMLENBQXNCLFFBQXRCLEVBQWlDQyxLQUFELElBQVc7QUFDekNBLGFBQU1DLGNBQU47QUFDQTFCLGNBQU8sSUFBUDtBQUNELE1BSEQ7O0FBS0EyQixZQUFPSCxnQkFBUCxDQUF3QixRQUF4QixFQUFrQyxNQUFNO0FBQ3RDLFdBQUlJLGtCQUFrQixJQUFsQixDQUFKLEVBQTZCO0FBQzNCakgsY0FBSyxJQUFMO0FBQ0Q7QUFDRixNQUpEOztBQU1BLFNBQUlrSCxnQkFBSixDQUFzQkMsT0FBRCxJQUFhO0FBQ2hDQyxlQUFRQyxLQUFSLENBQWMsaUNBQWQsRUFBaUQsSUFBakQ7QUFDQS9CLFlBQUssSUFBTDs7QUFFQSxXQUFNZ0MsUUFDQUMsUUFBUUosUUFBUS9DLEdBQVIsQ0FBWW9ELEtBQU1BLEVBQUVDLFVBQXBCLENBQVIsRUFDQ3ZFLE1BREQsQ0FDU0MsQ0FBRCxJQUFPQSxhQUFhdUUsV0FENUIsQ0FETjtBQUdBLFdBQUlKLE1BQU1LLE1BQU4sR0FBZSxDQUFuQixFQUFzQjtBQUNwQiw4QkFBZ0JMLEtBQWhCLGtIQUF1QjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUEsZUFBWm5FLENBQVk7O0FBQ3JCeUUsNEJBQWlCLElBQWpCLEVBQXVCekUsQ0FBdkI7QUFDRDtBQUNGOztBQUVELFdBQU0wRSxVQUNBTixRQUFRSixRQUFRL0MsR0FBUixDQUFhb0QsQ0FBRCxJQUFRQSxFQUFFTSxZQUF0QixDQUFSLEVBQ0M1RSxNQURELENBQ1NDLENBQUQsSUFBT0EsYUFBYXVFLFdBRDVCLENBRE47QUFHQSxXQUFJRyxRQUFRRixNQUFSLEdBQWlCLENBQXJCLEVBQXdCO0FBQ3RCO0FBQ0F2RyxnQkFBTyxJQUFQLEVBQWN5RyxRQUFRM0UsTUFBUixDQUFnQkMsQ0FBRCxJQUFRQSxDQUFELENBQVN0QyxJQUEvQixDQUFkO0FBQ0EsK0JBQWdCZ0gsT0FBaEIseUhBQXlCO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxlQUFkMUUsRUFBYzs7QUFDdkI0RSwrQkFBb0IsSUFBcEIsRUFBMEI1RSxFQUExQjtBQUNEO0FBQ0Y7QUFDRixNQXZCRCxFQXVCRzZFLE9BdkJILENBdUJXLElBdkJYLEVBdUJpQixFQUFFQyxXQUFXLElBQWIsRUFBbUJDLFNBQVMsSUFBNUIsRUF2QmpCOztBQXlCQTVDLFVBQUssSUFBTDs7QUFFQSx1QkFBQyxhQUFZO0FBQ1gsY0FBTyxJQUFQLEVBQWE7QUFDWCxlQUFNSCxFQUFFM0QsS0FBRixDQUFRLE1BQUs4RSxRQUFiLENBQU47QUFDQSxhQUFJVyx3QkFBSixFQUE2QjtBQUMzQixpQkFBTWpILFdBQU47QUFDRCxVQUZELE1BRU87QUFDTCxpQkFBTXNGLFdBQU47QUFDRDtBQUNGO0FBQ0YsTUFURDtBQVVEOztBQUVENkMsc0JBQW1CO0FBQ2pCN0MsVUFBSyxJQUFMO0FBQ0Q7O0FBRUQsY0FBVzhDLGtCQUFYLEdBQWdDO0FBQzlCLFlBQU8sQ0FDTCxVQURLLEVBRUwsTUFGSyxDQUFQO0FBSUQ7O0FBRURDLDRCQUF5QkMsUUFBekIsRUFBMkM7QUFDekMsYUFBUUEsUUFBUjtBQUNBLFlBQUssVUFBTDtBQUNFO0FBQ0YsWUFBSyxNQUFMO0FBQ0VwQyxvQkFBVyxJQUFYO0FBQ0E7QUFMRjtBQU9EO0FBekZpRTs7bUJBQS9DRSxzQjtBQTRGckIsVUFBU2EsaUJBQVQsQ0FBMkJoRCxJQUEzQixFQUFrRTtBQUNoRSxVQUFPQSxLQUFLc0UsWUFBTCxDQUFrQixVQUFsQixDQUFQO0FBQ0Q7O0FBa0JELFVBQVNYLGdCQUFULENBQTBCM0QsSUFBMUIsRUFBd0R1RSxVQUF4RCxFQUF1RjtBQUNyRixPQUFNL0M7QUFDQTtBQUNDLElBQUMrQyxVQUFELEVBQWEsR0FBR3hGLE1BQU1DLElBQU4sQ0FBV3VGLFdBQVdDLGdCQUFYLENBQTRCLEdBQTVCLENBQVgsQ0FBaEIsRUFDQ3ZGLE1BREQsQ0FDU0MsQ0FBRCxJQUFRQSxDQUFELENBQVNVLEtBQVQsSUFBa0IsSUFBbEIsSUFBMkJWLENBQUQsQ0FBU3RDLElBQVQsSUFBaUIsSUFEMUQsQ0FGUDs7QUFEcUYsOEJBTTFFc0MsQ0FOMEU7QUFPbkYsU0FBTWIsSUFBSSxJQUFJNEUsZ0JBQUosQ0FBcUIsTUFBTWxILEtBQUtpRSxJQUFMLEVBQVcsQ0FBQ2QsQ0FBRCxDQUFYLENBQTNCLENBQVY7QUFDQWIsT0FBRTBGLE9BQUYsQ0FBVTdFLENBQVYsRUFBYSxFQUFFdUYsWUFBWSxJQUFkLEVBQW9CQyxnQkFBZ0IsQ0FBQyxNQUFELENBQXBDLEVBQWI7QUFDQTFFLFVBQUsyQyxrQkFBTCxDQUF3QnJGLEdBQXhCLENBQTRCNEIsQ0FBNUIsRUFBK0JiLENBQS9CO0FBVG1GOztBQU1yRix5QkFBZ0JtRCxRQUFoQix5SEFBMEI7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLFNBQWZ0QyxDQUFlOztBQUFBLFdBQWZBLENBQWU7QUFJekI7QUFDRjs7QUFFRCxVQUFTNEUsbUJBQVQsQ0FBNkI5RCxJQUE3QixFQUEyRHhCLE9BQTNELEVBQXVGO0FBQ3JGLE9BQU1nRCxXQUFXLENBQUNoRCxPQUFELEVBQVUsR0FBR08sTUFBTUMsSUFBTixDQUFXUixRQUFRZ0csZ0JBQVIsQ0FBeUIsR0FBekIsQ0FBWCxDQUFiLENBQWpCO0FBQ0EseUJBQWdCaEQsUUFBaEIseUhBQTBCO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxTQUFmdEMsQ0FBZTs7QUFDeEIsU0FBTWIsSUFBSTJCLEtBQUsyQyxrQkFBTCxDQUF3QnpHLEdBQXhCLENBQTZCZ0QsQ0FBN0IsQ0FBVjtBQUNBLFNBQUliLEtBQUssSUFBVCxFQUFlO0FBQ2YyQixVQUFLMkMsa0JBQUwsQ0FBd0JsQixNQUF4QixDQUFnQ3ZDLENBQWhDO0FBQ0FiLE9BQUVzRyxVQUFGO0FBQ0Q7QUFDRjs7QUFFRCxVQUFTbkQsUUFBVCxDQUFrQnhCLElBQWxCLEVBQWdFO0FBQzlELFVBQU9qQixNQUFNQyxJQUFOLENBQWFnQixLQUFLd0IsUUFBbEIsRUFBNkN2QyxNQUE3QyxDQUFvREMsS0FBS0EsRUFBRXRDLElBQTNELENBQVA7QUFDRDs7QUFnQkQsVUFBU21GLFNBQVQsQ0FBbUI2QyxTQUFuQixFQUFtQzNILFFBQW5DLEVBQTJEO0FBQ3hEMkgsWUFBRDtBQUNBLE9BQU1DLE9BQU9ELFVBQVVDLElBQXZCO0FBQ0EsT0FBSUEsU0FBUyxVQUFULElBQXVCQSxTQUFTLE9BQXBDLEVBQTZDO0FBQzNDRCxlQUFVRSxPQUFWLEdBQW9CN0gsYUFBYTJILFVBQVVoRixLQUEzQztBQUNBO0FBQ0Q7O0FBRUQsT0FBSTNDLFlBQVksSUFBWixJQUFvQjJILFVBQVVoRixLQUFWLElBQW1CLElBQTNDLEVBQ0U7O0FBRUZnRixhQUFVaEYsS0FBVixHQUFrQjNDLFFBQWxCO0FBQ0Q7O0FBRUQsVUFBUytFLFFBQVQsQ0FBa0I0QyxTQUFsQixFQUEwQztBQUN2Q0EsWUFBRDtBQUNBLE9BQU1DLE9BQU9ELFVBQVVDLElBQXZCO0FBQ0EsT0FBSUEsU0FBUyxVQUFULElBQXVCQSxTQUFTLE9BQXBDLEVBQTZDO0FBQzNDLFlBQU9ELFVBQVVFLE9BQVYsR0FBb0JGLFVBQVVoRixLQUE5QixHQUFzQyxJQUE3QztBQUNEO0FBQ0QsVUFBT2dGLFVBQVVoRixLQUFqQjtBQUNEOztBQUVELFVBQVNrQyxjQUFULENBQXdCOUIsSUFBeEIsRUFBdUU7QUFDckUsT0FBTUgsSUFBSUcsS0FBS3pELElBQWY7QUFDQSxPQUFJLENBQUNzRCxDQUFMLEVBQVE7QUFDTnNELGFBQVE0QixLQUFSLENBQWMsMEJBQWQ7QUFDQSxZQUFPLElBQVA7QUFDRDtBQUNELE9BQU1sRCxJQUFJdkcsR0FBR2UsV0FBSCxDQUFld0QsQ0FBZixDQUFWO0FBQ0EsT0FBSSxDQUFDZ0MsQ0FBTCxFQUFRO0FBQ05zQixhQUFRNEIsS0FBUixDQUFjLCtCQUFkLEVBQStDL0UsS0FBS3pELElBQXBEO0FBQ0EsWUFBTyxJQUFQO0FBQ0Q7QUFDRCxVQUFPc0YsQ0FBUDtBQUNEOztBQUVELFVBQVNXLE9BQVQsQ0FBaUJ4QyxJQUFqQixFQUFvQ3BELElBQXBDLEVBQTBEO0FBQ3hELE9BQU1TLElBQUkyQyxLQUFLZ0YsWUFBTCxDQUFrQnBJLElBQWxCLENBQVY7QUFDQSxVQUFPUyxJQUFJQSxDQUFKLEdBQVEsRUFBZjtBQUNEO0FBQ0QsVUFBU29GLE9BQVQsQ0FBaUJ6QyxJQUFqQixFQUFvQ3BELElBQXBDLEVBQWtEZ0QsS0FBbEQsRUFBd0U7QUFDdEUsT0FBSUEsU0FBUyxJQUFiLEVBQW1CO0FBQ25CSSxRQUFLaUYsWUFBTCxDQUFrQnJJLElBQWxCLEVBQXdCZ0QsS0FBeEI7QUFDRDs7QUFFRCxVQUFTMEQsT0FBVCxDQUFvQjRCLFFBQXBCLEVBQStEO0FBQzdELFVBQU9uRyxNQUFNQyxJQUFOLENBQVksYUFBYTtBQUM5QiwyQkFBbUJrRyxRQUFuQjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUEsV0FBV0MsSUFBWDtBQUE2Qiw2QkFBZ0JBLElBQWhCO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxhQUFXL0csQ0FBWDtBQUFzQixlQUFNQSxDQUFOO0FBQXRCO0FBQTdCO0FBQ0QsSUFGaUIsRUFBWCxDQUFQO0FBR0QsRSIsImZpbGUiOiJzdG9yYWdlLWVsZW1lbnRzLWRlYnVnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgNGMxOGQ4YjUzOTRlMjE5NjgxNDIiLCIvKiBnbG9iYWwgY2hyb21lICovXG5cbmltcG9ydCBTdG9yYWdlRm9ybSBmcm9tIFwiLi9zdG9yYWdlLWZvcm1cIjtcbmltcG9ydCAqIGFzIGFoIGZyb20gXCIuL2FyZWEtaGFuZGxlclwiO1xuXG4vLyBSZWdpc3RlciBhcmVhIGhhbmRsZXJzXG5pZiAobG9jYWxTdG9yYWdlKVxuICBhaC5yZWdpc3RlckhhbmRsZXIoXCJsb2NhbC1zdG9yYWdlXCIsIG5ldyBhaC5XZWJTdG9yYWdlQXJlYUhhbmRsZXIobG9jYWxTdG9yYWdlKSk7XG5pZiAoc2Vzc2lvblN0b3JhZ2UpXG4gIGFoLnJlZ2lzdGVySGFuZGxlcihcInNlc3Npb24tc3RvcmFnZVwiLCBuZXcgYWguV2ViU3RvcmFnZUFyZWFIYW5kbGVyKHNlc3Npb25TdG9yYWdlKSk7XG5pZiAoY2hyb21lICYmIGNocm9tZS5zdG9yYWdlKSB7XG4gIGlmIChjaHJvbWUuc3RvcmFnZS5sb2NhbClcbiAgICBhaC5yZWdpc3RlckhhbmRsZXIoXCJjaHJvbWUtbG9jYWxcIiwgbmV3IGFoLkNocm9tZVN0b3JhZ2VBcmVhSGFuZGxlcihjaHJvbWUuc3RvcmFnZS5sb2NhbCkpO1xuICBpZiAoY2hyb21lLnN0b3JhZ2Uuc3luYylcbiAgICBhaC5yZWdpc3RlckhhbmRsZXIoXCJjaHJvbWUtc3luY1wiLCBuZXcgYWguQ2hyb21lU3RvcmFnZUFyZWFIYW5kbGVyKGNocm9tZS5zdG9yYWdlLnN5bmMpKTtcbn1cblxuLy8gQ3VzdG9tIEVsZW1lbnQgdjEgc2VlbXMgbm90IHRvIHdvcmtpbmcgcmlnaHQgb24gR29vZ2xlIENocm9tZSA1NVxuLy8gY3VzdG9tRWxlbWVudHMuZGVmaW5lKG5hbWUsIGNlLCB7IGV4dGVuZHM6IGV4IH0pO1xuXG4vLyBDdXN0b20gRWxlbWVudCB2MFxuLy8gJEZsb3dGaXhNZSBBdm9pZCB0byBhZmZlY3QgY29kZSBvZiBgc3RvcmFnZS1mb3JtLmpzYCBieSBDdXN0b20gRWxlbWVudCB2MFxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JhZ2VGb3JtLCBcImV4dGVuZHNcIiwgeyBnZXQ6ICgpID0+IFwiZm9ybVwiIH0pO1xuZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwic3RvcmFnZS1mb3JtXCIsIFN0b3JhZ2VGb3JtKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9zdG9yYWdlLWVsZW1lbnRzLXJlZ2lzdGVyZXIuanMiLCJleHBvcnQgdHlwZSBBcmVhID0gc3RyaW5nO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFyZWFIYW5kbGVyIHtcbiAgcmVhZChuYW1lOiBzdHJpbmcpOiBQcm9taXNlPD9zdHJpbmc+O1xuICB3cml0ZShuYW1lOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xuICByZW1vdmUobmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcbn1cblxuY29uc3QgaGFuZGxlcnM6IHsgW2FyZWE6IEFyZWFdOiBBcmVhSGFuZGxlciB9ID0ge307XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckhhbmRsZXIoYXJlYTogQXJlYSwgaGFuZGxlcjogQXJlYUhhbmRsZXIpOiB2b2lkIHtcbiAgaWYgKGhhbmRsZXJzW2FyZWFdKSB7XG4gICAgdGhyb3cgRXJyb3IoYEFscmVhZHkgcmVnaXN0ZXJlZCBoYW5kbGVyIGZvciBcIiR7YXJlYX1cImApO1xuICB9XG4gIGhhbmRsZXJzW2FyZWFdID0gaGFuZGxlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRIYW5kbGVyKGFyZWE6IEFyZWEpOiA/QXJlYUhhbmRsZXIge1xuICByZXR1cm4gaGFuZGxlcnNbYXJlYV07XG59XG5cbmV4cG9ydCBjbGFzcyBXZWJTdG9yYWdlQXJlYUhhbmRsZXIge1xuICBzdG9yYWdlOiBTdG9yYWdlO1xuXG4gIGNvbnN0cnVjdG9yKHN0b3JhZ2U6IFN0b3JhZ2UpIHtcbiAgICB0aGlzLnN0b3JhZ2UgPSBzdG9yYWdlO1xuICB9XG5cbiAgcmVhZChuYW1lOiBzdHJpbmcpOiBQcm9taXNlPD9zdHJpbmc+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuc3RvcmFnZS5nZXRJdGVtKG5hbWUpKTtcbiAgfVxuXG4gIHdyaXRlKG5hbWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc3RvcmFnZS5zZXRJdGVtKG5hbWUsIG5ld1ZhbHVlKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICByZW1vdmUobmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zdG9yYWdlLnJlbW92ZUl0ZW0obmFtZSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIge1xuICBzdG9yYWdlOiBDaHJvbWVTdG9yYWdlQXJlYTtcblxuICBjb25zdHJ1Y3RvcihzdG9yYWdlOiBDaHJvbWVTdG9yYWdlQXJlYSkge1xuICAgIHRoaXMuc3RvcmFnZSA9IHN0b3JhZ2U7XG4gIH1cblxuICByZWFkKG5hbWU6IHN0cmluZyk6IFByb21pc2U8P3N0cmluZz4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gdGhpcy5zdG9yYWdlLmdldChuYW1lLCAodikgPT4gcmVzb2x2ZSh2W25hbWVdKSkpO1xuICB9XG5cbiAgd3JpdGUobmFtZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB0aGlzLnN0b3JhZ2Uuc2V0KHsgW25hbWVdOiBuZXdWYWx1ZSB9LCByZXNvbHZlKSk7XG4gIH1cblxuICByZW1vdmUobmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB0aGlzLnN0b3JhZ2UucmVtb3ZlKG5hbWUsIHJlc29sdmUpKTtcbiAgfVxufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2FyZWEtaGFuZGxlci5qcyIsImV4cG9ydCBjbGFzcyBDYW5jZWxsYWJsZVByb21pc2U8Uj4gZXh0ZW5kcyBQcm9taXNlPFI+IHtcbiAgY2FuY2VsbEZ1bmN0aW9uOiAoKSA9PiB2b2lkO1xuICBjb25zdHJ1Y3RvcihcbiAgICBjYWxsYmFjazogKFxuICAgICAgcmVzb2x2ZTogKHJlc3VsdDogUHJvbWlzZTxSPiB8IFIpID0+IHZvaWQsXG4gICAgICByZWplY3Q6IChlcnJvcjogYW55KSA9PiB2b2lkXG4gICAgKSA9PiBtaXhlZCxcbiAgICBjYW5jZWxsOiAoKSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGNhbGxiYWNrKTtcbiAgICB0aGlzLmNhbmNlbGxGdW5jdGlvbiA9IGNhbmNlbGw7XG4gIH1cblxuICBjYW5jZWxsKCkge1xuICAgIHRoaXMuY2FuY2VsbEZ1bmN0aW9uKCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNsZWVwKG1zZWM6IG51bWJlcik6IENhbmNlbGxhYmxlUHJvbWlzZTx2b2lkPiB7XG4gIGxldCB0aW1lb3V0SWQ6ID9udW1iZXI7XG4gIHJldHVybiBuZXcgQ2FuY2VsbGFibGVQcm9taXNlKFxuICAgIChyZXNvbHZlKSA9PiB7XG4gICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoKSwgbXNlYyk7XG4gICAgfSxcbiAgICAoKSA9PiB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWR1cDxUPihhcnJheTogQXJyYXk8VD4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgcHJlZGljYXRlPzogKHQ6IFQsIG86IFQpID0+IGJvb2xlYW4gPSAodCwgbykgPT4gdCA9PT0gbyk6IEFycmF5PFQ+IHtcbiAgcmV0dXJuIGFycmF5LnJlZHVjZSgocmVzdWx0OiBBcnJheTxUPiwgZWxlbWVudCkgPT4ge1xuICAgIGlmIChyZXN1bHQuc29tZSgoaSkgPT4gcHJlZGljYXRlKGksIGVsZW1lbnQpKSkgcmVzdWx0O1xuICAgIHJldHVybiByZXN1bHQuY29uY2F0KGVsZW1lbnQpO1xuICB9LFtdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN1YnRyYWN0U2V0PFQ+KHRhcmdldFNldDogU2V0PFQ+LCByZW1vdmVkU2V0OiBTZXQ8VD4pOiBTZXQ8VD4ge1xuICByZXR1cm4gbmV3IFNldChBcnJheS5mcm9tKHRhcmdldFNldCkuZmlsdGVyKChlKSA9PiAhcmVtb3ZlZFNldC5oYXMoZSkpKTtcbn1cblxuY2xhc3MgTXVsdGlWYWx1ZU1hcDxLLCBWLCBJOiBJdGVyYWJsZTxWPj4gZXh0ZW5kcyBNYXA8SywgST4ge1xuICAqIGZsYXR0ZW5WYWx1ZXMoKTogSXRlcmF0b3I8Vj4ge1xuICAgIGZvciAoY29uc3QgYXJyIG9mIHRoaXMudmFsdWVzKCkpIHtcbiAgICAgIGZvciAoY29uc3QgdiBvZiBhcnIpIHtcbiAgICAgICAgeWllbGQgdjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFycmF5VmFsdWVNYXA8SywgVj4gZXh0ZW5kcyBNdWx0aVZhbHVlTWFwPEssIFYsIEFycmF5PFY+PiB7XG4gIGFkZChrZXk6IEssIHZhbHVlOiBWKTogdGhpcyB7XG4gICAgbGV0IGEgPSB0aGlzLmdldChrZXkpO1xuICAgIGlmICghYSkge1xuICAgICAgYSA9IFtdO1xuICAgICAgdGhpcy5zZXQoa2V5LCBhKTtcbiAgICB9XG4gICAgYS5wdXNoKHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2V0VmFsdWVNYXA8SywgVj4gZXh0ZW5kcyBNdWx0aVZhbHVlTWFwPEssIFYsIFNldDxWPj4ge1xuICBhZGQoa2V5OiBLLCB2YWx1ZTogVik6IHRoaXMge1xuICAgIGxldCBhID0gdGhpcy5nZXQoa2V5KTtcbiAgICBpZiAoIWEpIHtcbiAgICAgIGEgPSBuZXcgU2V0KCk7XG4gICAgICB0aGlzLnNldChrZXksIGEpO1xuICAgIH1cbiAgICBhLmFkZCh2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy91dGlscy5qcyIsImltcG9ydCAqIGFzIHUgZnJvbSBcIi4vdXRpbHNcIjtcblxuZGVjbGFyZSB0eXBlIE5hbWUgPSBzdHJpbmc7XG5kZWNsYXJlIHR5cGUgVmFsdWUgPSBzdHJpbmc7XG5kZWNsYXJlIHR5cGUgTmFtZVZhbHVlID0geyBuYW1lOiBOYW1lLCB2YWx1ZTogP1ZhbHVlIH07XG5kZWNsYXJlIHR5cGUgVmFsdWVzID0gTWFwPEVsZW1lbnQsIE5hbWVWYWx1ZT47XG5leHBvcnQgaW50ZXJmYWNlIEVsZW1lbnQge1xuICBuYW1lOiBOYW1lO1xufVxuZGVjbGFyZSBpbnRlcmZhY2UgU3RvcmFnZUhhbmRsZXIge1xuICByZWFkKG46IE5hbWUpOiBQcm9taXNlPD9WYWx1ZT47XG4gIHdyaXRlKG46IE5hbWUsIHY6IFZhbHVlKTogUHJvbWlzZTx2b2lkPjtcbiAgcmVtb3ZlKG46IE5hbWUpOlByb21pc2U8dm9pZD47XG59XG5kZWNsYXJlIGludGVyZmFjZSBGb3JtSGFuZGxlciB7XG4gIHdyaXRlKGU6IEVsZW1lbnQsIHY6ID9WYWx1ZSk6IHZvaWQ7XG4gIHJlYWQoZTogRWxlbWVudCk6ID9WYWx1ZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQmluZGVyIHtcbiAgdjogVmFsdWVzO1xuICBzOiBTdG9yYWdlSGFuZGxlcjtcbiAgZjogRm9ybUhhbmRsZXI7XG4gIGxvY2s6ID9Qcm9taXNlPG1peGVkPjtcblxuICBjb25zdHJ1Y3RvcihzOiBTdG9yYWdlSGFuZGxlciwgZjogRm9ybUhhbmRsZXIpIHtcbiAgICB0aGlzLnYgPSBuZXcgTWFwO1xuICAgIHRoaXMucyA9IHM7XG4gICAgdGhpcy5mID0gZjtcbiAgICB0aGlzLmxvY2sgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgc3luYyh0YXJnZXRzOiBBcnJheTxFbGVtZW50Pik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN5bmNCbG9jayh0aGlzLCAoKSA9PiBkb1N5bmModGhpcywgdGFyZ2V0cykpO1xuICB9XG5cbiAgLy8vIEZvcmNlIHdyaXRlIGZvcm0gdmFsdWVzIHRvIHRoZSBzdG9yYWdlXG4gIGFzeW5jIHN1Ym1pdCh0YXJnZXRzOiBBcnJheTxFbGVtZW50Pik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN5bmNCbG9jayh0aGlzLCAoKSA9PiBQcm9taXNlLmFsbCh0YXJnZXRzLm1hcChhc3luYyAoZSkgPT4ge1xuICAgICAgYXdhaXQgc3RvcmUodGhpcywgZSk7XG4gICAgfSkpKTtcbiAgfVxuXG4gIC8vLyBTeW5jIG9ubHkgbmV3IGVsZW1lbnRzXG4gIGFzeW5jIHNjYW4odGFyZ2V0czogQXJyYXk8RWxlbWVudD4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzeW5jQmxvY2sodGhpcywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbmV3RWxlbWVudHMgPSB1LnN1YnRyYWN0U2V0KG5ldyBTZXQodGFyZ2V0cyksIG5ldyBTZXQodGhpcy52LmtleXMoKSkpO1xuICAgICAgYXdhaXQgZG9TeW5jKHRoaXMsIEFycmF5LmZyb20obmV3RWxlbWVudHMpKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vLyBJbnZvcmsgaWYgYW4gZWxlbWVudCB3YXMgcmVtb3ZlZCBmcm9tIGEgZm9ybS5cbiAgYXN5bmMgcmVtb3ZlKGVsZW1lbnRzOiBBcnJheTxFbGVtZW50Pikge1xuICAgIGF3YWl0IHN5bmNCbG9jayh0aGlzLCBhc3luYyAoKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGUgb2YgZWxlbWVudHMpIHRoaXMudi5kZWxldGUoZSk7XG4gICAgfSk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZG9TeW5jKHNlbGY6IEJpbmRlciwgdGFyZ2V0czogQXJyYXk8RWxlbWVudD4pIHtcbiAgYXdhaXQgUHJvbWlzZS5hbGwodGFyZ2V0cy5tYXAoYXN5bmMgKGUpID0+IHtcbiAgICBhd2FpdCBsb2FkKHNlbGYsIGUpO1xuICAgIGF3YWl0IHN0b3JlKHNlbGYsIGUpO1xuICB9KSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN5bmNCbG9jayhzZWxmOiBCaW5kZXIsIGZuOiAoKSA9PiBQcm9taXNlPG1peGVkPikge1xuICB3aGlsZSAoc2VsZi5sb2NrKSBhd2FpdCBzZWxmLmxvY2s7XG4gIHNlbGYubG9jayA9IGZuKCk7XG4gIGF3YWl0IHNlbGYubG9jaztcbiAgc2VsZi5sb2NrID0gbnVsbDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZChzZWxmOiBCaW5kZXIsIGVsZW06IEVsZW1lbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgbmV3TiA9IGVsZW0ubmFtZTtcbiAgY29uc3QgbmV3ViA9IGF3YWl0IHNlbGYucy5yZWFkKG5ld04pO1xuICBsZXQgbnY6ID9OYW1lVmFsdWUgPSBzZWxmLnYuZ2V0KGVsZW0pO1xuICBpZiAoIW52KSB7XG4gICAgbnYgPSB7IG5hbWU6IGVsZW0ubmFtZSwgdmFsdWU6IG51bGwgfTtcbiAgICBzZWxmLnYuc2V0KGVsZW0sIG52KTtcbiAgfVxuICBpZiAobnYubmFtZSAhPT0gbmV3TiB8fCBudi52YWx1ZSAhPT0gbmV3Vikge1xuICAgIHNlbGYuZi53cml0ZShlbGVtLCBuZXdWKTtcbiAgICBudi5uYW1lID0gIG5ld047XG4gICAgbnYudmFsdWUgPSAgbmV3VjtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBzdG9yZShzZWxmOiBCaW5kZXIsIGVsZW06IEVsZW1lbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgbmV3TiA9IGVsZW0ubmFtZTtcbiAgY29uc3QgbmV3ViA9IGZhbGxiYWNrSWZOdWxsKCgpID0+IHNlbGYuZi5yZWFkKGVsZW0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCkgPT4gZ2V0VmFsdWVCeU5hbWUoc2VsZiwgbmV3TikpO1xuICBsZXQgbnY6ID9OYW1lVmFsdWUgPSBzZWxmLnYuZ2V0KGVsZW0pO1xuICBpZiAoIW52KSB7XG4gICAgbnYgPSB7IG5hbWU6IGVsZW0ubmFtZSwgdmFsdWU6IG51bGwgfTtcbiAgICBzZWxmLnYuc2V0KGVsZW0sIG52KTtcbiAgfVxuICBpZiAobnYubmFtZSAhPT0gbmV3TiB8fCBudi52YWx1ZSAhPT0gbmV3Vikge1xuICAgIGlmIChuZXdWID09IG51bGwpIHtcbiAgICAgIGF3YWl0IHNlbGYucy5yZW1vdmUobmV3Tik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IHNlbGYucy53cml0ZShuZXdOLCBuZXdWKTtcbiAgICB9XG4gICAgbnYubmFtZSA9ICBuZXdOO1xuICAgIG52LnZhbHVlID0gIG5ld1Y7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmFsbGJhY2tJZk51bGw8VD4oLi4uZm5zOiBBcnJheTwoKSA9PiBUPik6ID9UIHtcbiAgZm9yIChjb25zdCBmbiBvZiBmbnMpIHtcbiAgICBjb25zdCB2ID0gZm4oKTtcbiAgICBpZiAodiAhPSBudWxsKSByZXR1cm4gdjtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0VmFsdWVCeU5hbWUoc2VsZjogQmluZGVyLCBuYW1lOiBOYW1lKTogP1ZhbHVlIHtcbiAgZm9yIChjb25zdCBudiBvZiBzZWxmLnYudmFsdWVzKCkpIHtcbiAgICBpZiAobnYubmFtZSA9PT0gbmFtZSkgcmV0dXJuIG52LnZhbHVlO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2JpbmRlci5qcyIsImltcG9ydCAqIGFzIHUgZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCAqIGFzIGFoIGZyb20gXCIuL2FyZWEtaGFuZGxlclwiO1xuaW1wb3J0IEJpbmRlciBmcm9tIFwiLi9iaW5kZXJcIjtcbmltcG9ydCB0eXBlIHsgRWxlbWVudCB9IGZyb20gXCIuL2JpbmRlclwiO1xuXG5kZWNsYXJlIHR5cGUgTmFtZSA9IHN0cmluZztcbmRlY2xhcmUgdHlwZSBWYWx1ZSA9IHN0cmluZztcblxuZGVjbGFyZSBpbnRlcmZhY2UgRm9ybUNvbXBvbmVudEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIG5hbWU6IE5hbWU7XG4gIHZhbHVlPzogVmFsdWU7XG4gIHR5cGU/OiBzdHJpbmc7XG4gIGNoZWNrZWQ/OiBib29sZWFuO1xufVxuXG5jb25zdCBERUZBVUxUX1NZTkNfSU5URVJWQUwgPSA3MDA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhUTUxTdG9yYWdlRm9ybUVsZW1lbnQgZXh0ZW5kcyBIVE1MRm9ybUVsZW1lbnQge1xuICBiaW5kZXI6ID9CaW5kZXI7XG4gIGNvbXBvbmVudE9ic2VydmVyczogTWFwPEZvcm1Db21wb25lbnRFbGVtZW50LCBNdXRhdGlvbk9ic2VydmVyPjtcblxuICBnZXQgYXV0b3N5bmMoKTogbnVtYmVyIHtcbiAgICBjb25zdCBuID0gcGFyc2VJbnQoZ2V0QXR0cih0aGlzLCBcImF1dG9zeW5jXCIpKTtcbiAgICByZXR1cm4gbiA+IDAgPyBuIDogREVGQVVMVF9TWU5DX0lOVEVSVkFMO1xuICB9XG4gIHNldCBhdXRvc3luYyh2OiBhbnkpIHsgc2V0QXR0cih0aGlzLCBcImF1dG9zeW5jXCIsIHYpOyB9XG4gIGdldCBhcmVhKCk6IGFoLkFyZWEgeyByZXR1cm4gZ2V0QXR0cih0aGlzLCBcImFyZWFcIik7IH1cbiAgc2V0IGFyZWEodjogYW55KSB7IHNldEF0dHIodGhpcywgXCJhcmVhXCIsIHYpOyB9XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICBpbml0QmluZGVyKHRoaXMpO1xuICAgIHRoaXMuY29tcG9uZW50T2JzZXJ2ZXJzID0gbmV3IE1hcCgpO1xuXG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHN1Ym1pdCh0aGlzKTtcbiAgICB9KTtcblxuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwidW5sb2FkXCIsICgpID0+IHtcbiAgICAgIGlmIChpc0F1dG9TeW5jRW5hYmxlZCh0aGlzKSkge1xuICAgICAgICBzeW5jKHRoaXMpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKHJlY29yZHMpID0+IHtcbiAgICAgIGNvbnNvbGUuZGVidWcoXCJzY2FuIGJ5IGZvcm0gTXV0YXRpb25PYnNlcnZlcjogXCIsIHRoaXMpO1xuICAgICAgc2Nhbih0aGlzKTtcblxuICAgICAgY29uc3QgYWRkZWQ6IEFycmF5PEhUTUxFbGVtZW50PiA9XG4gICAgICAgICAgICBmbGF0dGVuKHJlY29yZHMubWFwKHIgPT4gKHIuYWRkZWROb2RlczogSXRlcmFibGU8YW55PikpKVxuICAgICAgICAgICAgLmZpbHRlcigoZSkgPT4gZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KTtcbiAgICAgIGlmIChhZGRlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAoY29uc3QgZSBvZiBhZGRlZCkge1xuICAgICAgICAgIG9ic2VydmVDb21wb25lbnQodGhpcywgZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY29uc3QgcmVtb3ZlZDogQXJyYXk8SFRNTEVsZW1lbnQ+ID1cbiAgICAgICAgICAgIGZsYXR0ZW4ocmVjb3Jkcy5tYXAoKHIpID0+IChyLnJlbW92ZWROb2RlczogSXRlcmFibGU8YW55PikpKVxuICAgICAgICAgICAgLmZpbHRlcigoZSkgPT4gZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KTtcbiAgICAgIGlmIChyZW1vdmVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgLy8gZm9yY2UgY2FzdCB0byBBcnJheTxGb3JtQ29tcG9uZW50RWxlbWVudHM+XG4gICAgICAgIHJlbW92ZSh0aGlzLCAocmVtb3ZlZC5maWx0ZXIoKGUpID0+IChlOiBhbnkpLm5hbWUpOiBBcnJheTxhbnk+KSk7XG4gICAgICAgIGZvciAoY29uc3QgZSBvZiByZW1vdmVkKSB7XG4gICAgICAgICAgZGlzY29ubmVjdENvbXBvbmVudCh0aGlzLCBlKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pLm9ic2VydmUodGhpcywgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XG5cbiAgICBzY2FuKHRoaXMpO1xuXG4gICAgKGFzeW5jICgpID0+IHtcbiAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgIGF3YWl0IHUuc2xlZXAodGhpcy5hdXRvc3luYyk7XG4gICAgICAgIGlmIChpc0F1dG9TeW5jRW5hYmxlZCh0aGlzKSkge1xuICAgICAgICAgIGF3YWl0IHN5bmModGhpcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgYXdhaXQgc2Nhbih0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pKCk7XG4gIH1cblxuICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgIHNjYW4odGhpcyk7XG4gIH1cblxuICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICByZXR1cm4gW1xuICAgICAgXCJhdXRvc3luY1wiLFxuICAgICAgXCJhcmVhXCIsXG4gICAgXTtcbiAgfVxuXG4gIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhhdHRyTmFtZTogc3RyaW5nKSB7XG4gICAgc3dpdGNoIChhdHRyTmFtZSkge1xuICAgIGNhc2UgXCJhdXRvc3luY1wiOlxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImFyZWFcIjpcbiAgICAgIGluaXRCaW5kZXIodGhpcyk7XG4gICAgICBicmVhaztcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBdXRvU3luY0VuYWJsZWQoc2VsZjogSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gc2VsZi5oYXNBdHRyaWJ1dGUoXCJhdXRvc3luY1wiKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc3VibWl0KHNlbGY6IEhUTUxTdG9yYWdlRm9ybUVsZW1lbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbGYuYmluZGVyKSBhd2FpdCBzZWxmLmJpbmRlci5zdWJtaXQoZWxlbWVudHMoc2VsZikpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzeW5jKHNlbGY6IEhUTUxTdG9yYWdlRm9ybUVsZW1lbnQsIHRhcmdldHM/OiBBcnJheTxFbGVtZW50Pik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnN5bmModGFyZ2V0cyA/IHRhcmdldHMgOiBlbGVtZW50cyhzZWxmKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNjYW4oc2VsZjogSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnNjYW4oZWxlbWVudHMoc2VsZikpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZW1vdmUoc2VsZjogSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCwgZWxlbXM6IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZWxmLmJpbmRlcikgYXdhaXQgc2VsZi5iaW5kZXIucmVtb3ZlKGVsZW1zKTtcbn1cblxuZnVuY3Rpb24gb2JzZXJ2ZUNvbXBvbmVudChzZWxmOiBIVE1MU3RvcmFnZUZvcm1FbGVtZW50LCBuZXdFbGVtZW50OiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBjb25zdCBlbGVtZW50czogQXJyYXk8Rm9ybUNvbXBvbmVudEVsZW1lbnQ+ID1cbiAgICAgICAgLy8gZm9yY2UgY2FzdFxuICAgICAgICAoW25ld0VsZW1lbnQsIC4uLkFycmF5LmZyb20obmV3RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiKlwiKSldXG4gICAgICAgICAuZmlsdGVyKChlKSA9PiAoZTogYW55KS52YWx1ZSAhPSBudWxsICYmIChlOiBhbnkpLm5hbWUgIT0gbnVsbCk6IGFueSk7XG5cbiAgZm9yIChjb25zdCBlIG9mIGVsZW1lbnRzKSB7XG4gICAgY29uc3QgbyA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHN5bmMoc2VsZiwgW2VdKSk7XG4gICAgby5vYnNlcnZlKGUsIHsgYXR0cmlidXRlczogdHJ1ZSwgYXRyaWJ1dGVGaWx0ZXI6IFtcIm5hbWVcIl0gfSk7XG4gICAgc2VsZi5jb21wb25lbnRPYnNlcnZlcnMuc2V0KGUsIG8pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRpc2Nvbm5lY3RDb21wb25lbnQoc2VsZjogSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCwgZWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3QgZWxlbWVudHMgPSBbZWxlbWVudCwgLi4uQXJyYXkuZnJvbShlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIqXCIpKV07XG4gIGZvciAoY29uc3QgZSBvZiBlbGVtZW50cykge1xuICAgIGNvbnN0IG8gPSBzZWxmLmNvbXBvbmVudE9ic2VydmVycy5nZXQoKGU6IGFueSkpO1xuICAgIGlmIChvID09IG51bGwpIGNvbnRpbnVlO1xuICAgIHNlbGYuY29tcG9uZW50T2JzZXJ2ZXJzLmRlbGV0ZSgoZTogYW55KSk7XG4gICAgby5kaXNjb25uZWN0KCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZWxlbWVudHMoc2VsZjogSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCk6IEFycmF5PEVsZW1lbnQ+IHtcbiAgcmV0dXJuIEFycmF5LmZyb20oKChzZWxmLmVsZW1lbnRzKTogSXRlcmFibGU8YW55PikpLmZpbHRlcihlID0+IGUubmFtZSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRCaW5kZXIoc2VsZjogSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBzZWxmLmJpbmRlciA9IG51bGw7XG5cbiAgY29uc3QgaCA9IGdldEFyZWFIYW5kbGVyKHNlbGYpO1xuICBpZiAoIWgpIHJldHVybjtcblxuICBzZWxmLmJpbmRlciA9IG5ldyBCaW5kZXIoXG4gICAgaCxcbiAgICB7IHdyaXRlOiB3cml0ZUZvcm0sXG4gICAgICByZWFkOiByZWFkRm9ybSB9XG4gICk7XG4gIGF3YWl0IHN5bmMoc2VsZik7XG59XG5cbmZ1bmN0aW9uIHdyaXRlRm9ybShjb21wb25lbnQ6IGFueSwgbmV3VmFsdWU6ID9WYWx1ZSk6IHZvaWQge1xuICAoY29tcG9uZW50OiBGb3JtQ29tcG9uZW50RWxlbWVudCk7XG4gIGNvbnN0IHR5cGUgPSBjb21wb25lbnQudHlwZTtcbiAgaWYgKHR5cGUgPT09IFwiY2hlY2tib3hcIiB8fCB0eXBlID09PSBcInJhZGlvXCIpIHtcbiAgICBjb21wb25lbnQuY2hlY2tlZCA9IG5ld1ZhbHVlID09PSBjb21wb25lbnQudmFsdWU7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKG5ld1ZhbHVlID09IG51bGwgfHwgY29tcG9uZW50LnZhbHVlID09IG51bGwpXG4gICAgcmV0dXJuO1xuXG4gIGNvbXBvbmVudC52YWx1ZSA9IG5ld1ZhbHVlO1xufVxuXG5mdW5jdGlvbiByZWFkRm9ybShjb21wb25lbnQ6IGFueSk6ID9WYWx1ZSB7XG4gIChjb21wb25lbnQ6IEZvcm1Db21wb25lbnRFbGVtZW50KTtcbiAgY29uc3QgdHlwZSA9IGNvbXBvbmVudC50eXBlO1xuICBpZiAodHlwZSA9PT0gXCJjaGVja2JveFwiIHx8IHR5cGUgPT09IFwicmFkaW9cIikge1xuICAgIHJldHVybiBjb21wb25lbnQuY2hlY2tlZCA/IGNvbXBvbmVudC52YWx1ZSA6IG51bGw7XG4gIH1cbiAgcmV0dXJuIGNvbXBvbmVudC52YWx1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0QXJlYUhhbmRsZXIoc2VsZjogSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCk6ID9haC5BcmVhSGFuZGxlciB7XG4gIGNvbnN0IGEgPSBzZWxmLmFyZWE7XG4gIGlmICghYSkge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJSZXF1aXJlICdhcmVhJyBhdHRyaWJ1dGVcIik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgY29uc3QgaCA9IGFoLmZpbmRIYW5kbGVyKGEpO1xuICBpZiAoIWgpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiTm8gc3VjaCBhcmVhIGhhbmRsZXI6IGFyZWE9JXNcIiwgc2VsZi5hcmVhKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gaDtcbn1cblxuZnVuY3Rpb24gZ2V0QXR0cihzZWxmOiBIVE1MRWxlbWVudCwgbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdiA9IHNlbGYuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICByZXR1cm4gdiA/IHYgOiBcIlwiO1xufVxuZnVuY3Rpb24gc2V0QXR0cihzZWxmOiBIVE1MRWxlbWVudCwgbmFtZTogc3RyaW5nLCB2YWx1ZTogP3N0cmluZyk6IHZvaWQge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuO1xuICBzZWxmLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW48VD4oaXRlcml0ZXI6IEl0ZXJhYmxlPEl0ZXJhYmxlPFQ+Pik6IEFycmF5PFQ+IHtcbiAgcmV0dXJuIEFycmF5LmZyb20oKGZ1bmN0aW9uKiAoKSB7XG4gICAgZm9yIChjb25zdCBpdGVyIG9mIGl0ZXJpdGVyKSBmb3IgKGNvbnN0IHQgb2YgaXRlcikgeWllbGQgdDtcbiAgfSkoKSk7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvc3RvcmFnZS1mb3JtLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==