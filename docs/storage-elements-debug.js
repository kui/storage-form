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
	
	var _storageForm = __webpack_require__(5);
	
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
	exports.listHandlers = listHandlers;
	
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
	
	function listHandlers() {
	  return Object.entries(handlers);
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
	
	var _utils = __webpack_require__(1);
	
	var u = _interopRequireWildcard(_utils);
	
	var _areaHandler = __webpack_require__(2);
	
	var ah = _interopRequireWildcard(_areaHandler);
	
	var _binder = __webpack_require__(3);
	
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

/***/ },
/* 5 */
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
	
	var _utils = __webpack_require__(1);
	
	var u = _interopRequireWildcard(_utils);
	
	var _binder = __webpack_require__(3);
	
	var _binder2 = _interopRequireDefault(_binder);
	
	var _areaHandler = __webpack_require__(2);
	
	var ah = _interopRequireWildcard(_areaHandler);
	
	var _areaSelect = __webpack_require__(4);
	
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

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMTQ0Mjk3NzhiOWZjMDk4ZjA5ZGUiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0b3JhZ2UtZWxlbWVudHMtcmVnaXN0ZXJlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FyZWEtaGFuZGxlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYmluZGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9hcmVhLXNlbGVjdC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc3RvcmFnZS1mb3JtLmpzIl0sIm5hbWVzIjpbInJlZ2lzdGVyIiwic2xlZXAiLCJkZWR1cCIsInN1YnRyYWN0U2V0IiwiQ2FuY2VsbGFibGVQcm9taXNlIiwiUHJvbWlzZSIsImNvbnN0cnVjdG9yIiwiY2FsbGJhY2siLCJjYW5jZWxsIiwiY2FuY2VsbEZ1bmN0aW9uIiwibXNlYyIsInRpbWVvdXRJZCIsInJlc29sdmUiLCJzZXRUaW1lb3V0IiwiY2xlYXJUaW1lb3V0IiwiYXJyYXkiLCJwcmVkaWNhdGUiLCJ0IiwibyIsInJlZHVjZSIsInJlc3VsdCIsImVsZW1lbnQiLCJzb21lIiwiaSIsImNvbmNhdCIsInRhcmdldFNldCIsInJlbW92ZWRTZXQiLCJTZXQiLCJBcnJheSIsImZyb20iLCJmaWx0ZXIiLCJlIiwiaGFzIiwiTXVsdGlWYWx1ZU1hcCIsIk1hcCIsImZsYXR0ZW5WYWx1ZXMiLCJ2YWx1ZXMiLCJhcnIiLCJ2IiwiQXJyYXlWYWx1ZU1hcCIsImFkZCIsImtleSIsInZhbHVlIiwiYSIsImdldCIsInNldCIsInB1c2giLCJTZXRWYWx1ZU1hcCIsInJlZ2lzdGVySGFuZGxlciIsImZpbmRIYW5kbGVyIiwibGlzdEhhbmRsZXJzIiwiaGFuZGxlcnMiLCJhcmVhIiwiaGFuZGxlciIsIkVycm9yIiwiT2JqZWN0IiwiZW50cmllcyIsIldlYlN0b3JhZ2VBcmVhSGFuZGxlciIsInN0b3JhZ2UiLCJyZWFkIiwibmFtZSIsImdldEl0ZW0iLCJ3cml0ZSIsIm5ld1ZhbHVlIiwic2V0SXRlbSIsInJlbW92ZSIsInJlbW92ZUl0ZW0iLCJsb2NhbFN0b3JhZ2UiLCJzZXNzaW9uU3RvcmFnZSIsIkNocm9tZVN0b3JhZ2VBcmVhSGFuZGxlciIsImNocm9tZSIsImxvY2FsIiwic3luYyIsInNlbGYiLCJ0YXJnZXRzIiwiYWxsIiwibWFwIiwibG9hZCIsInN0b3JlIiwiZG9TeW5jIiwiZm4iLCJsb2NrIiwic3luY0Jsb2NrIiwiZWxlbSIsIm5ld04iLCJuZXdWIiwicyIsIm52IiwiZiIsImZhbGxiYWNrSWZOdWxsIiwiZ2V0VmFsdWVCeU5hbWUiLCJ1IiwiQmluZGVyIiwic3VibWl0Iiwic2NhbiIsIm5ld0VsZW1lbnRzIiwia2V5cyIsImVsZW1lbnRzIiwiZGVsZXRlIiwiZm5zIiwib3B0aW9ucyIsImxlbmd0aCIsImJpbmRlciIsImgiLCJnZXRBcmVhSGFuZGxlciIsIndyaXRlU2VsZWN0IiwicmVhZFNlbGVjdCIsImlzSW5pdExvYWQiLCJpbml0QmluZGVyIiwibWl4aW5BcmVhU2VsZWN0IiwiYWgiLCJTWU5DX0lOVEVSVkFMIiwiYyIsImdldEF0dHIiLCJzZXRBdHRyIiwiY3JlYXRlZENhbGxiYWNrIiwiYWRkRXZlbnRMaXN0ZW5lciIsIndpbmRvdyIsIndyaXRlQXJlYSIsImF0dGFjaGVkQ2FsbGJhY2siLCJhZGRBbGxIYW5kbGVycyIsIm9ic2VydmVkQXR0cmlidXRlcyIsImF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayIsImF0dHJOYW1lIiwibWl4ZWRTZWxlY3QiLCJIVE1MU2VsZWN0RWxlbWVudCIsIkhUTUxBcmVhU2VsZWN0RWxlbWVudCIsImV4dGVuZHMiLCJmb3JtIiwic2V0QXR0cmlidXRlIiwiY29uc29sZSIsImRlYnVnIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwiYXBwZW5kQ2hpbGQiLCJnZXRBdHRyaWJ1dGUiLCJlbGVtcyIsIndyaXRlRm9ybSIsInJlYWRGb3JtIiwiZGlzcGF0Y2hFdmVudCIsIkN1c3RvbUV2ZW50IiwiZGV0YWlsIiwidGFyZ2V0IiwibWl4aW5TdG9yYWdlRm9ybSIsIkRFRkFVTFRfU1lOQ19JTlRFUlZBTCIsImF1dG9zeW5jIiwibiIsInBhcnNlSW50IiwiY29tcG9uZW50T2JzZXJ2ZXJzIiwiZXZlbnQiLCJwcmV2ZW50RGVmYXVsdCIsImlzQXV0b1N5bmNFbmFibGVkIiwiTXV0YXRpb25PYnNlcnZlciIsInJlY29yZHMiLCJhZGRlZCIsImZsYXR0ZW4iLCJyIiwiYWRkZWROb2RlcyIsIkhUTUxFbGVtZW50Iiwib2JzZXJ2ZUNvbXBvbmVudCIsInJlbW92ZWQiLCJyZW1vdmVkTm9kZXMiLCJkaXNjb25uZWN0Q29tcG9uZW50Iiwib2JzZXJ2ZSIsImNoaWxkTGlzdCIsInN1YnRyZWUiLCJtaXhlZEZvcm0iLCJIVE1MRm9ybUVsZW1lbnQiLCJIVE1MU3RvcmFnZUZvcm1FbGVtZW50IiwicmVnaXN0ZXJFbGVtZW50IiwiaGFzQXR0cmlidXRlIiwibmV3RWxlbWVudCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJhdHRyaWJ1dGVzIiwiYXRyaWJ1dGVGaWx0ZXIiLCJkaXNjb25uZWN0IiwiY29tcG9uZW50IiwidHlwZSIsImNoZWNrZWQiLCJpdGVyaXRlciIsIml0ZXIiXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7QUNyQ0E7Ozs7OztBQUVBLHVCQUFtQkEsUUFBbkIsRzs7Ozs7Ozs7O1NDaUJnQkMsSyxHQUFBQSxLO1NBWUFDLEssR0FBQUEsSztTQVFBQyxXLEdBQUFBLFc7QUF0Q1QsT0FBTUMsa0JBQU4sU0FBb0NDLE9BQXBDLENBQStDO0FBRXBEQyxlQUNFQyxRQURGLEVBS0VDLE9BTEYsRUFNRTtB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LEtBQVIsQ0FBYywwQkFBZCxFQUEwQzFELElBQTFDO0FBQ0EsWUFBTyxJQUFQO0FBQ0Q7QUFDRCxPQUFNOEIsSUFBSU8sR0FBRzdELFdBQUgsQ0FBZU4sQ0FBZixDQUFWO0FBQ0EsT0FBSSxDQUFDNEQsQ0FBTCxFQUFRO0FBQ04yQixhQUFRQyxLQUFSLENBQWMsd0NBQWQsRUFBd0QxRCxLQUFLckIsSUFBN0QsRUFBbUVxQixJQUFuRTtBQUNBLFlBQU8sSUFBUDtBQUNEO0FBQ0QsVUFBTzhCLENBQVA7QUFDRDs7QUFFRCxVQUFTVSxPQUFULENBQWlCeEMsSUFBakIsRUFBb0NiLElBQXBDLEVBQTBEO0FBQ3hELE9BQU10QixJQUFJbUMsS0FBSytELFlBQUwsQ0FBa0I1RSxJQUFsQixDQUFWO0FBQ0EsVUFBT3RCLElBQUlBLENBQUosR0FBUSxFQUFmO0FBQ0Q7QUFDRCxVQUFTNEUsT0FBVCxDQUFpQnpDLElBQWpCLEVBQW9DYixJQUFwQyxFQUFrRGxCLEtBQWxELEVBQXdFO0FBQ3RFLE9BQUlBLFNBQVMsSUFBYixFQUFtQjtBQUNuQitCLFFBQUt3RCxZQUFMLENBQWtCckUsSUFBbEIsRUFBd0JsQixLQUF4QjtBQUNEOztBQUVELFVBQVNrSCxPQUFULENBQW9Cd0IsUUFBcEIsRUFBK0Q7QUFDN0QsVUFBT3hKLE1BQU1DLElBQU4sQ0FBWSxhQUFhO0FBQzlCLDJCQUFtQnVKLFFBQW5CO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxXQUFXQyxJQUFYO0FBQTZCLDZCQUFnQkEsSUFBaEI7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLGFBQVdwSyxDQUFYO0FBQXNCLGVBQU1BLENBQU47QUFBdEI7QUFBN0I7QUFDRCxJQUZpQixFQUFYLENBQVA7QUFHRCxFIiwiZmlsZSI6InN0b3JhZ2UtZWxlbWVudHMtZGVidWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyB3ZWJwYWNrL2Jvb3RzdHJhcCAxNDQyOTc3OGI5ZmMwOThmMDlkZSIsIi8vIEBmbG93XG5pbXBvcnQgU3RvcmFnZUZvcm1FbGVtZW50IGZyb20gXCIuL3N0b3JhZ2UtZm9ybVwiO1xuXG5TdG9yYWdlRm9ybUVsZW1lbnQucmVnaXN0ZXIoKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9zdG9yYWdlLWVsZW1lbnRzLXJlZ2lzdGVyZXIuanMiLCIvLyBAZmxvd1xuXG5leHBvcnQgY2xhc3MgQ2FuY2VsbGFibGVQcm9taXNlPFI+IGV4dGVuZHMgUHJvbWlzZTxSPiB7XG4gIGNhbmNlbGxGdW5jdGlvbjogKCkgPT4gdm9pZDtcbiAgY29uc3RydWN0b3IoXG4gICAgY2FsbGJhY2s6IChcbiAgICAgIHJlc29sdmU6IChyZXN1bHQ6IFByb21pc2U8Uj4gfCBSKSA9PiB2b2lkLFxuICAgICAgcmVqZWN0OiAoZXJyb3I6IGFueSkgPT4gdm9pZFxuICAgICkgPT4gbWl4ZWQsXG4gICAgY2FuY2VsbDogKCkgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihjYWxsYmFjayk7XG4gICAgdGhpcy5jYW5jZWxsRnVuY3Rpb24gPSBjYW5jZWxsO1xuICB9XG5cbiAgY2FuY2VsbCgpIHtcbiAgICB0aGlzLmNhbmNlbGxGdW5jdGlvbigpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzbGVlcChtc2VjOiBudW1iZXIpOiBDYW5jZWxsYWJsZVByb21pc2U8dm9pZD4ge1xuICBsZXQgdGltZW91dElkOiA/bnVtYmVyO1xuICByZXR1cm4gbmV3IENhbmNlbGxhYmxlUHJvbWlzZShcbiAgICAocmVzb2x2ZSkgPT4ge1xuICAgICAgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiByZXNvbHZlKCksIG1zZWMpO1xuICAgIH0sXG4gICAgKCkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgfVxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVkdXA8VD4oYXJyYXk6IEFycmF5PFQ+LFxuICAgICAgICAgICAgICAgICAgICAgICAgIHByZWRpY2F0ZT86ICh0OiBULCBvOiBUKSA9PiBib29sZWFuID0gKHQsIG8pID0+IHQgPT09IG8pOiBBcnJheTxUPiB7XG4gIHJldHVybiBhcnJheS5yZWR1Y2UoKHJlc3VsdDogQXJyYXk8VD4sIGVsZW1lbnQpID0+IHtcbiAgICBpZiAocmVzdWx0LnNvbWUoKGkpID0+IHByZWRpY2F0ZShpLCBlbGVtZW50KSkpIHJlc3VsdDtcbiAgICByZXR1cm4gcmVzdWx0LmNvbmNhdChlbGVtZW50KTtcbiAgfSxbXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdWJ0cmFjdFNldDxUPih0YXJnZXRTZXQ6IFNldDxUPiwgcmVtb3ZlZFNldDogU2V0PFQ+KTogU2V0PFQ+IHtcbiAgcmV0dXJuIG5ldyBTZXQoQXJyYXkuZnJvbSh0YXJnZXRTZXQpLmZpbHRlcigoZSkgPT4gIXJlbW92ZWRTZXQuaGFzKGUpKSk7XG59XG5cbmNsYXNzIE11bHRpVmFsdWVNYXA8SywgViwgSTogSXRlcmFibGU8Vj4+IGV4dGVuZHMgTWFwPEssIEk+IHtcbiAgKiBmbGF0dGVuVmFsdWVzKCk6IEl0ZXJhdG9yPFY+IHtcbiAgICBmb3IgKGNvbnN0IGFyciBvZiB0aGlzLnZhbHVlcygpKSB7XG4gICAgICBmb3IgKGNvbnN0IHYgb2YgYXJyKSB7XG4gICAgICAgIHlpZWxkIHY7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBcnJheVZhbHVlTWFwPEssIFY+IGV4dGVuZHMgTXVsdGlWYWx1ZU1hcDxLLCBWLCBBcnJheTxWPj4ge1xuICBhZGQoa2V5OiBLLCB2YWx1ZTogVik6IHRoaXMge1xuICAgIGxldCBhID0gdGhpcy5nZXQoa2V5KTtcbiAgICBpZiAoIWEpIHtcbiAgICAgIGEgPSBbXTtcbiAgICAgIHRoaXMuc2V0KGtleSwgYSk7XG4gICAgfVxuICAgIGEucHVzaCh2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNldFZhbHVlTWFwPEssIFY+IGV4dGVuZHMgTXVsdGlWYWx1ZU1hcDxLLCBWLCBTZXQ8Vj4+IHtcbiAgYWRkKGtleTogSywgdmFsdWU6IFYpOiB0aGlzIHtcbiAgICBsZXQgYSA9IHRoaXMuZ2V0KGtleSk7XG4gICAgaWYgKCFhKSB7XG4gICAgICBhID0gbmV3IFNldCgpO1xuICAgICAgdGhpcy5zZXQoa2V5LCBhKTtcbiAgICB9XG4gICAgYS5hZGQodmFsdWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvdXRpbHMuanMiLCIvLyBAZmxvd1xuLyogZ2xvYmFsIGNocm9tZSAqL1xuXG5leHBvcnQgdHlwZSBBcmVhID0gc3RyaW5nO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFyZWFIYW5kbGVyIHtcbiAgcmVhZChuYW1lOiBzdHJpbmcpOiBQcm9taXNlPD9zdHJpbmc+O1xuICB3cml0ZShuYW1lOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xuICByZW1vdmUobmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcbn1cblxuY29uc3QgaGFuZGxlcnM6IHsgW2FyZWE6IEFyZWFdOiBBcmVhSGFuZGxlciB9ID0ge307XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckhhbmRsZXIoYXJlYTogQXJlYSwgaGFuZGxlcjogQXJlYUhhbmRsZXIpOiB2b2lkIHtcbiAgaWYgKGhhbmRsZXJzW2FyZWFdKSB7XG4gICAgdGhyb3cgRXJyb3IoYEFscmVhZHkgcmVnaXN0ZXJlZCBoYW5kbGVyIGZvciBcIiR7YXJlYX1cImApO1xuICB9XG4gIGhhbmRsZXJzW2FyZWFdID0gaGFuZGxlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRIYW5kbGVyKGFyZWE6IEFyZWEpOiA/QXJlYUhhbmRsZXIge1xuICByZXR1cm4gaGFuZGxlcnNbYXJlYV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaXN0SGFuZGxlcnMoKTogQXJyYXk8W0FyZWEsIEFyZWFIYW5kbGVyXT4ge1xuICByZXR1cm4gT2JqZWN0LmVudHJpZXMoaGFuZGxlcnMpO1xufVxuXG4vL1xuXG5leHBvcnQgY2xhc3MgV2ViU3RvcmFnZUFyZWFIYW5kbGVyIHtcbiAgc3RvcmFnZTogU3RvcmFnZTtcblxuICBjb25zdHJ1Y3RvcihzdG9yYWdlOiBTdG9yYWdlKSB7XG4gICAgdGhpcy5zdG9yYWdlID0gc3RvcmFnZTtcbiAgfVxuXG4gIHJlYWQobmFtZTogc3RyaW5nKTogUHJvbWlzZTw/c3RyaW5nPiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLnN0b3JhZ2UuZ2V0SXRlbShuYW1lKSk7XG4gIH1cblxuICB3cml0ZShuYW1lOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnN0b3JhZ2Uuc2V0SXRlbShuYW1lLCBuZXdWYWx1ZSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgcmVtb3ZlKG5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc3RvcmFnZS5yZW1vdmVJdGVtKG5hbWUpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxufVxuXG5pZiAobG9jYWxTdG9yYWdlKVxuICByZWdpc3RlckhhbmRsZXIoXCJsb2NhbC1zdG9yYWdlXCIsIG5ldyBXZWJTdG9yYWdlQXJlYUhhbmRsZXIobG9jYWxTdG9yYWdlKSk7XG5pZiAoc2Vzc2lvblN0b3JhZ2UpXG4gIHJlZ2lzdGVySGFuZGxlcihcInNlc3Npb24tc3RvcmFnZVwiLCBuZXcgV2ViU3RvcmFnZUFyZWFIYW5kbGVyKHNlc3Npb25TdG9yYWdlKSk7XG5cbi8vXG5cbmV4cG9ydCBjbGFzcyBDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIge1xuICBzdG9yYWdlOiBDaHJvbWVTdG9yYWdlQXJlYTtcblxuICBjb25zdHJ1Y3RvcihzdG9yYWdlOiBDaHJvbWVTdG9yYWdlQXJlYSkge1xuICAgIHRoaXMuc3RvcmFnZSA9IHN0b3JhZ2U7XG4gIH1cblxuICByZWFkKG5hbWU6IHN0cmluZyk6IFByb21pc2U8P3N0cmluZz4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gdGhpcy5zdG9yYWdlLmdldChuYW1lLCAodikgPT4gcmVzb2x2ZSh2W25hbWVdKSkpO1xuICB9XG5cbiAgd3JpdGUobmFtZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB0aGlzLnN0b3JhZ2Uuc2V0KHsgW25hbWVdOiBuZXdWYWx1ZSB9LCByZXNvbHZlKSk7XG4gIH1cblxuICByZW1vdmUobmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB0aGlzLnN0b3JhZ2UucmVtb3ZlKG5hbWUsIHJlc29sdmUpKTtcbiAgfVxufVxuXG5pZiAoY2hyb21lICYmIGNocm9tZS5zdG9yYWdlKSB7XG4gIGlmIChjaHJvbWUuc3RvcmFnZS5sb2NhbClcbiAgICByZWdpc3RlckhhbmRsZXIoXCJjaHJvbWUtbG9jYWxcIiwgbmV3IENocm9tZVN0b3JhZ2VBcmVhSGFuZGxlcihjaHJvbWUuc3RvcmFnZS5sb2NhbCkpO1xuICBpZiAoY2hyb21lLnN0b3JhZ2Uuc3luYylcbiAgICByZWdpc3RlckhhbmRsZXIoXCJjaHJvbWUtc3luY1wiLCBuZXcgQ2hyb21lU3RvcmFnZUFyZWFIYW5kbGVyKGNocm9tZS5zdG9yYWdlLnN5bmMpKTtcbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9hcmVhLWhhbmRsZXIuanMiLCIvLyBAZmxvd1xuXG5pbXBvcnQgKiBhcyB1IGZyb20gXCIuL3V0aWxzXCI7XG5cbmRlY2xhcmUgdHlwZSBOYW1lID0gc3RyaW5nO1xuZGVjbGFyZSB0eXBlIFZhbHVlID0gc3RyaW5nO1xuZGVjbGFyZSB0eXBlIE5hbWVWYWx1ZSA9IHsgbmFtZTogTmFtZSwgdmFsdWU6ID9WYWx1ZSB9O1xuZGVjbGFyZSB0eXBlIFZhbHVlcyA9IE1hcDxFbGVtZW50LCBOYW1lVmFsdWU+O1xuZXhwb3J0IGludGVyZmFjZSBFbGVtZW50IHtcbiAgbmFtZTogTmFtZTtcbn1cbmRlY2xhcmUgaW50ZXJmYWNlIFN0b3JhZ2VIYW5kbGVyIHtcbiAgcmVhZChuOiBOYW1lKTogUHJvbWlzZTw/VmFsdWU+O1xuICB3cml0ZShuOiBOYW1lLCB2OiBWYWx1ZSk6IFByb21pc2U8dm9pZD47XG4gIHJlbW92ZShuOiBOYW1lKTogUHJvbWlzZTx2b2lkPjtcbn1cbmRlY2xhcmUgaW50ZXJmYWNlIEZvcm1IYW5kbGVyIHtcbiAgd3JpdGUoZTogRWxlbWVudCwgdjogP1ZhbHVlKTogdm9pZDtcbiAgcmVhZChlOiBFbGVtZW50KTogP1ZhbHVlO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCaW5kZXIge1xuICB2OiBWYWx1ZXM7XG4gIHM6IFN0b3JhZ2VIYW5kbGVyO1xuICBmOiBGb3JtSGFuZGxlcjtcbiAgbG9jazogP1Byb21pc2U8bWl4ZWQ+O1xuXG4gIGNvbnN0cnVjdG9yKHM6IFN0b3JhZ2VIYW5kbGVyLCBmOiBGb3JtSGFuZGxlcikge1xuICAgIHRoaXMudiA9IG5ldyBNYXA7XG4gICAgdGhpcy5zID0gcztcbiAgICB0aGlzLmYgPSBmO1xuICAgIHRoaXMubG9jayA9IG51bGw7XG4gIH1cblxuICBhc3luYyBzeW5jKHRhcmdldHM6IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsICgpID0+IGRvU3luYyh0aGlzLCB0YXJnZXRzKSk7XG4gIH1cblxuICAvLy8gRm9yY2Ugd3JpdGUgZm9ybSB2YWx1ZXMgdG8gdGhlIHN0b3JhZ2VcbiAgYXN5bmMgc3VibWl0KHRhcmdldHM6IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsICgpID0+IFByb21pc2UuYWxsKHRhcmdldHMubWFwKGFzeW5jIChlKSA9PiB7XG4gICAgICBhd2FpdCBzdG9yZSh0aGlzLCBlKTtcbiAgICB9KSkpO1xuICB9XG5cbiAgLy8vIFN5bmMgb25seSBuZXcgZWxlbWVudHNcbiAgYXN5bmMgc2Nhbih0YXJnZXRzOiBBcnJheTxFbGVtZW50Pik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN5bmNCbG9jayh0aGlzLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBuZXdFbGVtZW50cyA9IHUuc3VidHJhY3RTZXQobmV3IFNldCh0YXJnZXRzKSwgbmV3IFNldCh0aGlzLnYua2V5cygpKSk7XG4gICAgICBhd2FpdCBkb1N5bmModGhpcywgQXJyYXkuZnJvbShuZXdFbGVtZW50cykpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8vIEludm9yayBpZiBhbiBlbGVtZW50IHdhcyByZW1vdmVkIGZyb20gYSBmb3JtLlxuICBhc3luYyByZW1vdmUoZWxlbWVudHM6IEFycmF5PEVsZW1lbnQ+KSB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsIGFzeW5jICgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgZSBvZiBlbGVtZW50cykgdGhpcy52LmRlbGV0ZShlKTtcbiAgICB9KTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBkb1N5bmMoc2VsZjogQmluZGVyLCB0YXJnZXRzOiBBcnJheTxFbGVtZW50Pikge1xuICBhd2FpdCBQcm9taXNlLmFsbCh0YXJnZXRzLm1hcChhc3luYyAoZSkgPT4ge1xuICAgIGF3YWl0IGxvYWQoc2VsZiwgZSk7XG4gICAgYXdhaXQgc3RvcmUoc2VsZiwgZSk7XG4gIH0pKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc3luY0Jsb2NrKHNlbGY6IEJpbmRlciwgZm46ICgpID0+IFByb21pc2U8bWl4ZWQ+KSB7XG4gIHdoaWxlIChzZWxmLmxvY2spIGF3YWl0IHNlbGYubG9jaztcbiAgc2VsZi5sb2NrID0gZm4oKTtcbiAgYXdhaXQgc2VsZi5sb2NrO1xuICBzZWxmLmxvY2sgPSBudWxsO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkKHNlbGY6IEJpbmRlciwgZWxlbTogRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBuZXdOID0gZWxlbS5uYW1lO1xuICBjb25zdCBuZXdWID0gYXdhaXQgc2VsZi5zLnJlYWQobmV3Tik7XG4gIGxldCBudjogP05hbWVWYWx1ZSA9IHNlbGYudi5nZXQoZWxlbSk7XG4gIGlmICghbnYpIHtcbiAgICBudiA9IHsgbmFtZTogZWxlbS5uYW1lLCB2YWx1ZTogbnVsbCB9O1xuICAgIHNlbGYudi5zZXQoZWxlbSwgbnYpO1xuICB9XG4gIGlmIChudi5uYW1lICE9PSBuZXdOIHx8IG52LnZhbHVlICE9PSBuZXdWKSB7XG4gICAgc2VsZi5mLndyaXRlKGVsZW0sIG5ld1YpO1xuICAgIG52Lm5hbWUgPSAgbmV3TjtcbiAgICBudi52YWx1ZSA9ICBuZXdWO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN0b3JlKHNlbGY6IEJpbmRlciwgZWxlbTogRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBuZXdOID0gZWxlbS5uYW1lO1xuICBjb25zdCBuZXdWID0gZmFsbGJhY2tJZk51bGwoKCkgPT4gc2VsZi5mLnJlYWQoZWxlbSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKSA9PiBnZXRWYWx1ZUJ5TmFtZShzZWxmLCBuZXdOKSk7XG4gIGxldCBudjogP05hbWVWYWx1ZSA9IHNlbGYudi5nZXQoZWxlbSk7XG4gIGlmICghbnYpIHtcbiAgICBudiA9IHsgbmFtZTogZWxlbS5uYW1lLCB2YWx1ZTogbnVsbCB9O1xuICAgIHNlbGYudi5zZXQoZWxlbSwgbnYpO1xuICB9XG4gIGlmIChudi5uYW1lICE9PSBuZXdOIHx8IG52LnZhbHVlICE9PSBuZXdWKSB7XG4gICAgaWYgKG5ld1YgPT0gbnVsbCkge1xuICAgICAgYXdhaXQgc2VsZi5zLnJlbW92ZShuZXdOKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgc2VsZi5zLndyaXRlKG5ld04sIG5ld1YpO1xuICAgIH1cbiAgICBudi5uYW1lID0gIG5ld047XG4gICAgbnYudmFsdWUgPSAgbmV3VjtcbiAgfVxufVxuXG5mdW5jdGlvbiBmYWxsYmFja0lmTnVsbDxUPiguLi5mbnM6IEFycmF5PCgpID0+IFQ+KTogP1Qge1xuICBmb3IgKGNvbnN0IGZuIG9mIGZucykge1xuICAgIGNvbnN0IHYgPSBmbigpO1xuICAgIGlmICh2ICE9IG51bGwpIHJldHVybiB2O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRWYWx1ZUJ5TmFtZShzZWxmOiBCaW5kZXIsIG5hbWU6IE5hbWUpOiA/VmFsdWUge1xuICBmb3IgKGNvbnN0IG52IG9mIHNlbGYudi52YWx1ZXMoKSkge1xuICAgIGlmIChudi5uYW1lID09PSBuYW1lKSByZXR1cm4gbnYudmFsdWU7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvYmluZGVyLmpzIiwiLy8gQGZsb3dcblxuaW1wb3J0ICogYXMgdSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0ICogYXMgYWggZnJvbSBcIi4vYXJlYS1oYW5kbGVyXCI7XG5pbXBvcnQgQmluZGVyIGZyb20gXCIuL2JpbmRlclwiO1xuXG5kZWNsYXJlIHR5cGUgVmFsdWUgPSBzdHJpbmc7XG5cbmludGVyZmFjZSBBcmVhU2VsZWN0IGV4dGVuZHMgSFRNTFNlbGVjdEVsZW1lbnQge1xuICBhcmVhOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJbnRlcm5hbEFyZWFTZWxlY3QgZXh0ZW5kcyBBcmVhU2VsZWN0IHtcbiAgaXNJbml0TG9hZDogYm9vbGVhbjtcbiAgYmluZGVyOiA/QmluZGVyO1xufVxuXG5jb25zdCBTWU5DX0lOVEVSVkFMID0gNTAwO1xuXG5leHBvcnQgZnVuY3Rpb24gbWl4aW5BcmVhU2VsZWN0PFQ6IEhUTUxTZWxlY3RFbGVtZW50PihjOiBDbGFzczxUPik6IENsYXNzPFQgJiBBcmVhU2VsZWN0PiB7XG4gIC8vICRGbG93Rml4TWUgRm9yY2UgY2FzdCB0byB0aGUgcmV0dXJuZWQgdHlwZS5cbiAgcmV0dXJuIGNsYXNzIGV4dGVuZHMgYyB7XG4gICAgaXNJbml0TG9hZDogYm9vbGVhbjtcbiAgICBiaW5kZXI6ID9CaW5kZXI7XG5cbiAgICBnZXQgYXJlYSgpOiBhaC5BcmVhIHsgcmV0dXJuIGdldEF0dHIodGhpcywgXCJhcmVhXCIpOyB9XG4gICAgc2V0IGFyZWEodjogYW55KSB7IHNldEF0dHIodGhpcywgXCJhcmVhXCIsIHYpOyB9XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgdGhpcy5pc0luaXRMb2FkID0gdHJ1ZTtcblxuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHN5bmModGhpcykpO1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmxvYWRcIiwgKCkgPT4gc3luYyh0aGlzKSk7XG5cbiAgICAgIC8vIFBlcmlvZGljYWwgc3luY1xuICAgICAgLy8gVG8gb2JzZXJ2ZSBzdG9yYWdlIGNoYW5naW5ncyBhbmQgYC52YWx1ZWAgY2hhbmdpbmdzIGJ5IGFuIGV4dGVybmFsIGphdmFzY3JpcHRzXG4gICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIGF3YWl0IHUuc2xlZXAoU1lOQ19JTlRFUlZBTCk7XG4gICAgICAgICAgYXdhaXQgc3luYyh0aGlzKTtcbiAgICAgICAgICB3cml0ZUFyZWEodGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0pKCk7XG4gICAgfVxuXG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgYWRkQWxsSGFuZGxlcnModGhpcyk7XG4gICAgICBpbml0QmluZGVyKHRoaXMpO1xuICAgICAgd3JpdGVBcmVhKHRoaXMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiYXJlYVwiXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHJOYW1lOiBzdHJpbmcpIHtcbiAgICAgIHN3aXRjaCAoYXR0ck5hbWUpIHtcbiAgICAgIGNhc2UgXCJhcmVhXCI6XG4gICAgICAgIGluaXRCaW5kZXIodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuY29uc3QgbWl4ZWRTZWxlY3QgPSBtaXhpbkFyZWFTZWxlY3QoSFRNTFNlbGVjdEVsZW1lbnQpO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSFRNTEFyZWFTZWxlY3RFbGVtZW50IGV4dGVuZHMgbWl4ZWRTZWxlY3Qge1xuICBzdGF0aWMgZ2V0IGV4dGVuZHMoKSB7IHJldHVybiBcInNlbGVjdFwiOyB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRCaW5kZXIoc2VsZjogSW50ZXJuYWxBcmVhU2VsZWN0KTogUHJvbWlzZTx2b2lkPiB7XG4gIC8vIEF2b2lkIHRvIGluaXRhbGl6ZSB1bnRpbCA8b3B0aW9uPiBlbGVtZW50cyBhcmUgYXBwZW5kZWRcbiAgaWYgKHNlbGYub3B0aW9ucy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICBzZWxmLmJpbmRlciA9IG51bGw7XG5cbiAgY29uc3QgaCA9IGdldEFyZWFIYW5kbGVyKHNlbGYpO1xuICBpZiAoIWgpIHJldHVybjtcblxuICBzZWxmLmJpbmRlciA9IG5ldyBCaW5kZXIoaCwgeyB3cml0ZTogd3JpdGVTZWxlY3QsIHJlYWQ6IHJlYWRTZWxlY3QgfSk7XG5cbiAgaWYgKHNlbGYuaXNJbml0TG9hZCkge1xuICAgIHNlbGYuaXNJbml0TG9hZCA9IGZhbHNlO1xuICAgIGF3YWl0IHN5bmMoc2VsZik7XG4gIH0gZWxzZSB7XG4gICAgYXdhaXQgc3VibWl0KHNlbGYpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyaXRlU2VsZWN0KHNlbGY6IGFueSwgbmV3VmFsdWU6ID9WYWx1ZSk6IHZvaWQge1xuICBpZiAoc2VsZi52YWx1ZSA9PT0gbmV3VmFsdWUpIHJldHVybjtcbiAgc2VsZi52YWx1ZSA9IG5ld1ZhbHVlO1xuICB3cml0ZUFyZWEoc2VsZik7XG59XG5cbmZ1bmN0aW9uIHJlYWRTZWxlY3Qoc2VsZjogYW55KTogVmFsdWUgeyByZXR1cm4gc2VsZi52YWx1ZTsgfVxuXG5hc3luYyBmdW5jdGlvbiBzdWJtaXQoc2VsZjogSW50ZXJuYWxBcmVhU2VsZWN0KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZWxmLmJpbmRlcikgYXdhaXQgc2VsZi5iaW5kZXIuc3VibWl0KFtzZWxmXSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN5bmMoc2VsZjogSW50ZXJuYWxBcmVhU2VsZWN0KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZWxmLmJpbmRlcikgYXdhaXQgc2VsZi5iaW5kZXIuc3luYyhbc2VsZl0pO1xufVxuXG5mdW5jdGlvbiB3cml0ZUFyZWEoc2VsZjogSW50ZXJuYWxBcmVhU2VsZWN0KSB7XG4gIGNvbnN0IGZvcm0gPSBzZWxmLmZvcm07XG4gIGlmIChmb3JtID09IG51bGwpIHJldHVybjtcbiAgZm9ybS5zZXRBdHRyaWJ1dGUoXCJhcmVhXCIsIHNlbGYudmFsdWUpO1xufVxuXG5mdW5jdGlvbiBnZXRBcmVhSGFuZGxlcihzZWxmOiBJbnRlcm5hbEFyZWFTZWxlY3QpOiA/YWguQXJlYUhhbmRsZXIge1xuICBjb25zdCBhID0gc2VsZi5hcmVhO1xuICBpZiAoIWEpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiUmVxdWlyZSAnYXJlYScgYXR0cmlidXRlXCIsIHNlbGYpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGggPSBhaC5maW5kSGFuZGxlcihhKTtcbiAgaWYgKCFoKSB7XG4gICAgY29uc29sZS5kZWJ1ZyhcIk5vIHN1Y2ggYXJlYSBoYW5kbGVyOiBhcmVhPSVzLCB0aGlzPSVzXCIsIHNlbGYuYXJlYSwgc2VsZik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIGg7XG59XG5cbmZ1bmN0aW9uIGFkZEFsbEhhbmRsZXJzKHNlbGY6IEludGVybmFsQXJlYVNlbGVjdCkge1xuICBmb3IgKGNvbnN0IFthcmVhXSBvZiBhaC5saXN0SGFuZGxlcnMoKSkge1xuICAgIGNvbnN0IG8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpO1xuICAgIG8uaW5uZXJIVE1MID0gYXJlYTtcbiAgICBzZWxmLmFwcGVuZENoaWxkKG8pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldEF0dHIoc2VsZjogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHYgPSBzZWxmLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgcmV0dXJuIHYgPyB2IDogXCJcIjtcbn1cbmZ1bmN0aW9uIHNldEF0dHIoc2VsZjogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZywgdmFsdWU6ID9zdHJpbmcpOiB2b2lkIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybjtcbiAgc2VsZi5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2FyZWEtc2VsZWN0LmpzIiwiLy8gQGZsb3dcblxuaW1wb3J0ICogYXMgdSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbXBvcnQgQmluZGVyIGZyb20gXCIuL2JpbmRlclwiO1xuaW1wb3J0IHR5cGUgeyBFbGVtZW50IH0gZnJvbSBcIi4vYmluZGVyXCI7XG5cbmltcG9ydCAqIGFzIGFoIGZyb20gXCIuL2FyZWEtaGFuZGxlclwiO1xuaW1wb3J0IEFyZWFTZWxlY3QgZnJvbSBcIi4vYXJlYS1zZWxlY3RcIjtcblxuZGVjbGFyZSB0eXBlIE5hbWUgPSBzdHJpbmc7XG5kZWNsYXJlIHR5cGUgVmFsdWUgPSBzdHJpbmc7XG5cbmRlY2xhcmUgaW50ZXJmYWNlIEZvcm1Db21wb25lbnRFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBuYW1lOiBOYW1lO1xuICB2YWx1ZT86IFZhbHVlO1xuICB0eXBlPzogc3RyaW5nO1xuICBjaGVja2VkPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdG9yYWdlRm9ybSBleHRlbmRzIEhUTUxGb3JtRWxlbWVudCB7XG4gIGF1dG9zeW5jOiBudW1iZXI7XG4gIGFyZWE6IHN0cmluZztcbn1cblxuZGVjbGFyZSBpbnRlcmZhY2UgSW50ZXJuYWxTdG9yYWdlRm9ybSBleHRlbmRzIFN0b3JhZ2VGb3JtIHtcbiAgaXNJbml0TG9hZDogYm9vbGVhbjtcbiAgYmluZGVyOiA/QmluZGVyO1xuICBjb21wb25lbnRPYnNlcnZlcnM6IE1hcDxGb3JtQ29tcG9uZW50RWxlbWVudCwgTXV0YXRpb25PYnNlcnZlcj47XG59XG5cbmNvbnN0IERFRkFVTFRfU1lOQ19JTlRFUlZBTCA9IDcwMDtcblxuZXhwb3J0IGZ1bmN0aW9uIG1peGluU3RvcmFnZUZvcm08VDogSFRNTEZvcm1FbGVtZW50PihjOiBDbGFzczxUPik6IENsYXNzPFQgJiBTdG9yYWdlRm9ybT4ge1xuICAvLyAkRmxvd0ZpeE1lIEZvcmNlIGNhc3QgdG8gdGhlIHJldHVybmVkIHR5cGUuXG4gIHJldHVybiBjbGFzcyBleHRlbmRzIGMge1xuICAgIGlzSW5pdExvYWQ6IGJvb2xlYW47XG4gICAgYmluZGVyOiA/QmluZGVyO1xuICAgIGNvbXBvbmVudE9ic2VydmVyczogTWFwPEZvcm1Db21wb25lbnRFbGVtZW50LCBNdXRhdGlvbk9ic2VydmVyPjtcblxuICAgIGdldCBhdXRvc3luYygpOiBudW1iZXIge1xuICAgICAgY29uc3QgbiA9IHBhcnNlSW50KGdldEF0dHIodGhpcywgXCJhdXRvc3luY1wiKSk7XG4gICAgICByZXR1cm4gbiA+IDAgPyBuIDogREVGQVVMVF9TWU5DX0lOVEVSVkFMO1xuICAgIH1cbiAgICBzZXQgYXV0b3N5bmModjogYW55KSB7IHNldEF0dHIodGhpcywgXCJhdXRvc3luY1wiLCB2KTsgfVxuICAgIGdldCBhcmVhKCk6IGFoLkFyZWEgeyByZXR1cm4gZ2V0QXR0cih0aGlzLCBcImFyZWFcIik7IH1cbiAgICBzZXQgYXJlYSh2OiBhbnkpIHsgc2V0QXR0cih0aGlzLCBcImFyZWFcIiwgdik7IH1cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICB0aGlzLmlzSW5pdExvYWQgPSB0cnVlO1xuICAgICAgdGhpcy5jb21wb25lbnRPYnNlcnZlcnMgPSBuZXcgTWFwKCk7XG5cbiAgICAgIGluaXRCaW5kZXIodGhpcyk7XG5cbiAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgc3VibWl0KHRoaXMpO1xuICAgICAgfSk7XG5cbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwidW5sb2FkXCIsICgpID0+IHtcbiAgICAgICAgaWYgKGlzQXV0b1N5bmNFbmFibGVkKHRoaXMpKSB7XG4gICAgICAgICAgc3luYyh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBNdXRhdGlvbk9ic2VydmVyKChyZWNvcmRzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJzY2FuIGJ5IGZvcm0gTXV0YXRpb25PYnNlcnZlcjogXCIsIHRoaXMpO1xuICAgICAgICBzY2FuKHRoaXMpO1xuXG4gICAgICAgIGNvbnN0IGFkZGVkOiBBcnJheTxIVE1MRWxlbWVudD4gPVxuICAgICAgICAgICAgICBmbGF0dGVuKHJlY29yZHMubWFwKHIgPT4gKHIuYWRkZWROb2RlczogSXRlcmFibGU8YW55PikpKVxuICAgICAgICAgICAgICAuZmlsdGVyKChlKSA9PiBlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpO1xuICAgICAgICBpZiAoYWRkZWQubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGZvciAoY29uc3QgZSBvZiBhZGRlZCkge1xuICAgICAgICAgICAgb2JzZXJ2ZUNvbXBvbmVudCh0aGlzLCBlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZW1vdmVkOiBBcnJheTxIVE1MRWxlbWVudD4gPVxuICAgICAgICAgICAgICBmbGF0dGVuKHJlY29yZHMubWFwKChyKSA9PiAoci5yZW1vdmVkTm9kZXM6IEl0ZXJhYmxlPGFueT4pKSlcbiAgICAgICAgICAgICAgLmZpbHRlcigoZSkgPT4gZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KTtcbiAgICAgICAgaWYgKHJlbW92ZWQubGVuZ3RoID4gMCkge1xuICAgICAgICAgIC8vIFVzZSBhbnkgdG8gZm9yY2UgY2FzdCB0byBBcnJheTxGb3JtQ29tcG9uZW50RWxlbWVudHM+XG4gICAgICAgICAgcmVtb3ZlKHRoaXMsIChyZW1vdmVkLmZpbHRlcigoZSkgPT4gKGU6IGFueSkubmFtZSk6IEFycmF5PGFueT4pKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGUgb2YgcmVtb3ZlZCkge1xuICAgICAgICAgICAgZGlzY29ubmVjdENvbXBvbmVudCh0aGlzLCBlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pLm9ic2VydmUodGhpcywgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XG5cbiAgICAgIHNjYW4odGhpcyk7XG5cbiAgICAgIC8vIFBlcmlvZGljYWwgc2Nhbi9zeW5jXG4gICAgICAvLyBUbyBvYnNlcnZlOlxuICAgICAgLy8gICAqIHN0b3JhZ2UgdmFsdWUgY2hhbmdpbmdzXG4gICAgICAvLyAgICogZXh0ZXJuYWwgZm9ybSBjb21wb25lbnRzIChzdWNoIGFzIGEgPGlucHV0IGZvcm09XCIuLi5cIiAuLi4+KVxuICAgICAgLy8gICAqIGZvcm0gdmFsdWUgY2hhbmdpbmdzIGJ5IGFuIGV4dGVybmFsIGphdmFzY3JpcHRcbiAgICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgYXdhaXQgdS5zbGVlcCh0aGlzLmF1dG9zeW5jKTtcbiAgICAgICAgICBpZiAoaXNBdXRvU3luY0VuYWJsZWQodGhpcykpIHtcbiAgICAgICAgICAgIGF3YWl0IHN5bmModGhpcyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF3YWl0IHNjYW4odGhpcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KSgpO1xuICAgIH1cblxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICBzY2FuKHRoaXMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAgXCJhdXRvc3luY1wiLFxuICAgICAgICBcImFyZWFcIixcbiAgICAgIF07XG4gICAgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHJOYW1lOiBzdHJpbmcpIHtcbiAgICAgIHN3aXRjaCAoYXR0ck5hbWUpIHtcbiAgICAgIGNhc2UgXCJhdXRvc3luY1wiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJhcmVhXCI6XG4gICAgICAgIGluaXRCaW5kZXIodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuY29uc3QgbWl4ZWRGb3JtID0gbWl4aW5TdG9yYWdlRm9ybShIVE1MRm9ybUVsZW1lbnQpO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCBleHRlbmRzIG1peGVkRm9ybSB7XG4gIHN0YXRpYyBnZXQgZXh0ZW5kcygpIHsgcmV0dXJuIFwiZm9ybVwiOyB9XG5cbiAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgIC8vIEN1c3RvbSBFbGVtZW50IHYxIHNlZW1zIG5vdCB0byB3b3JrcyByaWdodCB0byBleHRlbmQgPGZvcm0+IGluIEdvb2dsZSBDaHJvbWUgNTVcbiAgICAvLyBTZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNDE0NTg2OTIvMzg2NDM1MVxuICAgIC8vIFBvbHlmaWxsIHRvbzogaHR0cHM6Ly9naXRodWIuY29tL3dlYmNvbXBvbmVudHMvY3VzdG9tLWVsZW1lbnRzL3RyZWUvbWFzdGVyL3NyY1xuICAgIC8vID4gVG8gZG86IEltcGxlbWVudCBidWlsdC1pbiBlbGVtZW50IGV4dGVuc2lvbiAoaXM9KVxuICAgIC8vIGN1c3RvbUVsZW1lbnRzLmRlZmluZShcInN0b3JhZ2UtZm9ybVwiLCBTdG9yYWdlRm9ybUVsZW1lbnQsIHsgZXh0ZW5kczogXCJmb3JtXCIgfSk7XG4gICAgLy8gd2luZG93LlN0b3JhZ2VGb3JtRWxlbWVudCA9IFN0b3JhZ2VGb3JtRWxlbWVudDtcblxuICAgIC8vIEN1c3RvbSBFbGVtZW50IHYwXG4gICAgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwic3RvcmFnZS1mb3JtXCIsIEhUTUxTdG9yYWdlRm9ybUVsZW1lbnQpO1xuICAgIGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcImFyZWEtc2VsZWN0XCIsIEFyZWFTZWxlY3QpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXV0b1N5bmNFbmFibGVkKHNlbGY6IEhUTUxGb3JtRWxlbWVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gc2VsZi5oYXNBdHRyaWJ1dGUoXCJhdXRvc3luY1wiKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc3VibWl0KHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbGYuYmluZGVyKSBhd2FpdCBzZWxmLmJpbmRlci5zdWJtaXQoZWxlbWVudHMoc2VsZikpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzeW5jKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0sIHRhcmdldHM/OiBBcnJheTxFbGVtZW50Pik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnN5bmModGFyZ2V0cyA/IHRhcmdldHMgOiBlbGVtZW50cyhzZWxmKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNjYW4oc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnNjYW4oZWxlbWVudHMoc2VsZikpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZW1vdmUoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSwgZWxlbXM6IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZWxmLmJpbmRlcikgYXdhaXQgc2VsZi5iaW5kZXIucmVtb3ZlKGVsZW1zKTtcbn1cblxuZnVuY3Rpb24gb2JzZXJ2ZUNvbXBvbmVudChzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtLCBuZXdFbGVtZW50OiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBjb25zdCBlbGVtZW50czogQXJyYXk8Rm9ybUNvbXBvbmVudEVsZW1lbnQ+ID1cbiAgICAgICAgLy8gZm9yY2UgY2FzdFxuICAgICAgICAoW25ld0VsZW1lbnQsIC4uLkFycmF5LmZyb20obmV3RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiKlwiKSldXG4gICAgICAgICAuZmlsdGVyKChlKSA9PiAoZTogYW55KS52YWx1ZSAhPSBudWxsICYmIChlOiBhbnkpLm5hbWUgIT0gbnVsbCk6IGFueSk7XG5cbiAgZm9yIChjb25zdCBlIG9mIGVsZW1lbnRzKSB7XG4gICAgY29uc3QgbyA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHN5bmMoc2VsZiwgW2VdKSk7XG4gICAgby5vYnNlcnZlKGUsIHsgYXR0cmlidXRlczogdHJ1ZSwgYXRyaWJ1dGVGaWx0ZXI6IFtcIm5hbWVcIl0gfSk7XG4gICAgc2VsZi5jb21wb25lbnRPYnNlcnZlcnMuc2V0KGUsIG8pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRpc2Nvbm5lY3RDb21wb25lbnQoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSwgZWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3QgZWxlbWVudHMgPSBbZWxlbWVudCwgLi4uQXJyYXkuZnJvbShlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIqXCIpKV07XG4gIGZvciAoY29uc3QgZSBvZiBlbGVtZW50cykge1xuICAgIGNvbnN0IG8gPSBzZWxmLmNvbXBvbmVudE9ic2VydmVycy5nZXQoKGU6IGFueSkpO1xuICAgIGlmIChvID09IG51bGwpIGNvbnRpbnVlO1xuICAgIHNlbGYuY29tcG9uZW50T2JzZXJ2ZXJzLmRlbGV0ZSgoZTogYW55KSk7XG4gICAgby5kaXNjb25uZWN0KCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZWxlbWVudHMoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSk6IEFycmF5PEVsZW1lbnQ+IHtcbiAgcmV0dXJuIEFycmF5LmZyb20oKChzZWxmLmVsZW1lbnRzKTogSXRlcmFibGU8YW55PikpXG4gICAgLmZpbHRlcihlID0+IGUubmFtZSlcbiAgICAuZmlsdGVyKGUgPT4gIShlIGluc3RhbmNlb2YgQXJlYVNlbGVjdCkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0QmluZGVyKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgc2VsZi5iaW5kZXIgPSBudWxsO1xuXG4gIGNvbnN0IGggPSBnZXRBcmVhSGFuZGxlcihzZWxmKTtcbiAgaWYgKCFoKSByZXR1cm47XG5cbiAgc2VsZi5iaW5kZXIgPSBuZXcgQmluZGVyKGgsIHsgd3JpdGU6IHdyaXRlRm9ybSwgcmVhZDogcmVhZEZvcm0gfSk7XG4gIGlmIChzZWxmLmlzSW5pdExvYWQpIHtcbiAgICBzZWxmLmlzSW5pdExvYWQgPSBmYWxzZTtcbiAgICBhd2FpdCBzeW5jKHNlbGYpO1xuICB9IGVsc2Uge1xuICAgIGF3YWl0IHN1Ym1pdChzZWxmKTtcbiAgfVxuXG4gIHNlbGYuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoXCJzdG9yYWdlLWZvcm0taW5pdFwiLCB7IGRldGFpbDogeyB0YXJnZXQ6IHNlbGYgfX0pKTtcbn1cblxuZnVuY3Rpb24gd3JpdGVGb3JtKGNvbXBvbmVudDogYW55LCBuZXdWYWx1ZTogP1ZhbHVlKTogdm9pZCB7XG4gIGNvbnN0IHR5cGUgPSBjb21wb25lbnQudHlwZTtcbiAgaWYgKHR5cGUgPT09IFwiY2hlY2tib3hcIiB8fCB0eXBlID09PSBcInJhZGlvXCIpIHtcbiAgICBjb21wb25lbnQuY2hlY2tlZCA9IG5ld1ZhbHVlID09PSBjb21wb25lbnQudmFsdWU7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKG5ld1ZhbHVlID09IG51bGwgfHwgY29tcG9uZW50LnZhbHVlID09IG51bGwpXG4gICAgcmV0dXJuO1xuXG4gIGNvbXBvbmVudC52YWx1ZSA9IG5ld1ZhbHVlO1xufVxuXG5mdW5jdGlvbiByZWFkRm9ybShjb21wb25lbnQ6IGFueSk6ID9WYWx1ZSB7XG4gIGNvbnN0IHR5cGUgPSBjb21wb25lbnQudHlwZTtcbiAgaWYgKHR5cGUgPT09IFwiY2hlY2tib3hcIiB8fCB0eXBlID09PSBcInJhZGlvXCIpIHtcbiAgICByZXR1cm4gY29tcG9uZW50LmNoZWNrZWQgPyBjb21wb25lbnQudmFsdWUgOiBudWxsO1xuICB9XG4gIHJldHVybiBjb21wb25lbnQudmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldEFyZWFIYW5kbGVyKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pOiA/YWguQXJlYUhhbmRsZXIge1xuICBjb25zdCBhID0gc2VsZi5hcmVhO1xuICBpZiAoIWEpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiUmVxdWlyZSAnYXJlYScgYXR0cmlidXRlXCIsIHNlbGYpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGggPSBhaC5maW5kSGFuZGxlcihhKTtcbiAgaWYgKCFoKSB7XG4gICAgY29uc29sZS5kZWJ1ZyhcIk5vIHN1Y2ggYXJlYSBoYW5kbGVyOiBhcmVhPSVzLCB0aGlzPSVvXCIsIHNlbGYuYXJlYSwgc2VsZik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIGg7XG59XG5cbmZ1bmN0aW9uIGdldEF0dHIoc2VsZjogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHYgPSBzZWxmLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgcmV0dXJuIHYgPyB2IDogXCJcIjtcbn1cbmZ1bmN0aW9uIHNldEF0dHIoc2VsZjogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZywgdmFsdWU6ID9zdHJpbmcpOiB2b2lkIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybjtcbiAgc2VsZi5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuPFQ+KGl0ZXJpdGVyOiBJdGVyYWJsZTxJdGVyYWJsZTxUPj4pOiBBcnJheTxUPiB7XG4gIHJldHVybiBBcnJheS5mcm9tKChmdW5jdGlvbiogKCkge1xuICAgIGZvciAoY29uc3QgaXRlciBvZiBpdGVyaXRlcikgZm9yIChjb25zdCB0IG9mIGl0ZXIpIHlpZWxkIHQ7XG4gIH0pKCkpO1xufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3N0b3JhZ2UtZm9ybS5qcyJdLCJzb3VyY2VSb290IjoiIn0=