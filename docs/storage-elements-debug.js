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
	if (typeof localStorage !== "undefined") registerHandler("local-storage", new WebStorageAreaHandler(localStorage));
	if (typeof sessionStorage !== "undefined") registerHandler("session-storage", new WebStorageAreaHandler(sessionStorage));
	
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
	class BatchWriteChromeStorageAreaHandler extends ChromeStorageAreaHandler {
	
	  constructor(storage) {
	    super(storage);
	    // what interval we should keep for a write operation.
	    this.delayMillis = 60 * 60 * 1000 / storage.MAX_WRITE_OPERATIONS_PER_HOUR + 500;
	    this.updatedEntries = null;
	  }
	
	  write(name, newValue) {
	    if (this.updatedEntries != null) {
	      this.updatedEntries[name] = newValue;
	      return Promise.resolve();
	    }
	
	    this.updatedEntries = { [name]: newValue };
	    setTimeout(() => {
	      if (this.updatedEntries == null) return;
	      this.storage.set(this.updatedEntries);
	      this.updatedEntries = null;
	    }, this.delayMillis);
	
	    return Promise.resolve();
	  }
	}
	
	exports.BatchWriteChromeStorageAreaHandler = BatchWriteChromeStorageAreaHandler;
	if (typeof chrome !== "undefined" && chrome.storage) {
	  if (chrome.storage.local) registerHandler("chrome-local", new ChromeStorageAreaHandler(chrome.storage.local));
	  if (chrome.storage.sync) registerHandler("chrome-sync", new BatchWriteChromeStorageAreaHandler(chrome.storage.sync));
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMmIxMTEwNzlhYjQ4NjYyZjYxYmMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0b3JhZ2UtZWxlbWVudHMtcmVnaXN0ZXJlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FyZWEtaGFuZGxlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYmluZGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9hcmVhLXNlbGVjdC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc3RvcmFnZS1mb3JtLmpzIl0sIm5hbWVzIjpbInJlZ2lzdGVyIiwic2xlZXAiLCJkZWR1cCIsInN1YnRyYWN0U2V0IiwiQ2FuY2VsbGFibGVQcm9taXNlIiwiUHJvbWlzZSIsImNvbnN0cnVjdG9yIiwiY2FsbGJhY2siLCJjYW5jZWxsIiwiY2FuY2VsbEZ1bmN0aW9uIiwibXNlYyIsInRpbWVvdXRJZCIsInJlc29sdmUiLCJzZXRUaW1lb3V0IiwiY2xlYXJUaW1lb3V0IiwiYXJyYXkiLCJwcmVkaWNhdGUiLCJ0IiwibyIsInJlZHVjZSIsInJlc3VsdCIsImVsZW1lbnQiLCJzb21lIiwiaSIsImNvbmNhdCIsInRhcmdldFNldCIsInJlbW92ZWRTZXQiLCJTZXQiLCJBcnJheSIsImZyb20iLCJmaWx0ZXIiLCJlIiwiaGFzIiwiTXVsdGlWYWx1ZU1hcCIsIk1hcCIsImZsYXR0ZW5WYWx1ZXMiLCJ2YWx1ZXMiLCJhcnIiLCJ2IiwiQXJyYXlWYWx1ZU1hcCIsImFkZCIsImtleSIsInZhbHVlIiwiYSIsImdldCIsInNldCIsInB1c2giLCJTZXRWYWx1ZU1hcCIsInJlZ2lzdGVySGFuZGxlciIsImZpbmRIYW5kbGVyIiwibGlzdEhhbmRsZXJzIiwiaGFuZGxlcnMiLCJhcmVhIiwiaGFuZGxlciIsIkVycm9yIiwiT2JqZWN0IiwiZW50cmllcyIsIldlYlN0b3JhZ2VBcmVhSGFuZGxlciIsInN0b3JhZ2UiLCJyZWFkIiwibmFtZSIsImdldEl0ZW0iLCJ3cml0ZSIsIm5ld1ZhbHVlIiwic2V0SXRlbSIsInJlbW92ZSIsInJlbW92ZUl0ZW0iLCJsb2NhbFN0b3JhZ2UiLCJzZXNzaW9uU3RvcmFnZSIsIkNocm9tZVN0b3JhZ2VBcmVhSGFuZGxlciIsIkJhdGNoV3JpdGVDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIiLCJkZWxheU1pbGxpcyIsIk1BWF9XUklURV9PUEVSQVRJT05TX1BFUl9IT1VSIiwidXBkYXRlZEVudHJpZXMiLCJjaHJvbWUiLCJsb2NhbCIsInN5bmMiLCJzZWxmIiwidGFyZ2V0cyIsImFsbCIsIm1hcCIsImxvYWQiLCJzdG9yZSIsImRvU3luYyIsImZuIiwibG9jayIsInN5bmNCbG9jayIsImVsZW0iLCJuZXdOIiwibmV3ViIsInMiLCJudiIsImYiLCJmYWxsYmFja0lmTnVsbCIsImdldFZhbHVlQnlOYW1lIiwidSIsIkJpbmRlciIsInN1Ym1pdCIsInNjYW4iLCJuZXdFbGVtZW50cyIsImtleXMiLCJlbGVtZW50cyIsImRlbGV0ZSIsImZucyIsIm9wdGlvbnMiLCJsZW5ndGgiLCJiaW5kZXIiLCJoIiwiZ2V0QXJlYUhhbmRsZXIiLCJ3cml0ZVNlbGVjdCIsInJlYWRTZWxlY3QiLCJpc0luaXRMb2FkIiwiaW5pdEJpbmRlciIsIm1peGluQXJlYVNlbGVjdCIsImFoIiwiU1lOQ19JTlRFUlZBTCIsImMiLCJnZXRBdHRyIiwic2V0QXR0ciIsImNyZWF0ZWRDYWxsYmFjayIsImFkZEV2ZW50TGlzdGVuZXIiLCJ3aW5kb3ciLCJ3cml0ZUFyZWEiLCJhdHRhY2hlZENhbGxiYWNrIiwiYWRkQWxsSGFuZGxlcnMiLCJvYnNlcnZlZEF0dHJpYnV0ZXMiLCJhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2siLCJhdHRyTmFtZSIsIm1peGVkU2VsZWN0IiwiSFRNTFNlbGVjdEVsZW1lbnQiLCJIVE1MQXJlYVNlbGVjdEVsZW1lbnQiLCJleHRlbmRzIiwiZm9ybSIsInNldEF0dHJpYnV0ZSIsImNvbnNvbGUiLCJkZWJ1ZyIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImlubmVySFRNTCIsImFwcGVuZENoaWxkIiwiZ2V0QXR0cmlidXRlIiwiZWxlbXMiLCJ3cml0ZUZvcm0iLCJyZWFkRm9ybSIsImRpc3BhdGNoRXZlbnQiLCJDdXN0b21FdmVudCIsImRldGFpbCIsInRhcmdldCIsIm1peGluU3RvcmFnZUZvcm0iLCJERUZBVUxUX1NZTkNfSU5URVJWQUwiLCJhdXRvc3luYyIsIm4iLCJwYXJzZUludCIsImNvbXBvbmVudE9ic2VydmVycyIsImV2ZW50IiwicHJldmVudERlZmF1bHQiLCJpc0F1dG9TeW5jRW5hYmxlZCIsIk11dGF0aW9uT2JzZXJ2ZXIiLCJyZWNvcmRzIiwiYWRkZWQiLCJmbGF0dGVuIiwiciIsImFkZGVkTm9kZXMiLCJIVE1MRWxlbWVudCIsIm9ic2VydmVDb21wb25lbnQiLCJyZW1vdmVkIiwicmVtb3ZlZE5vZGVzIiwiZGlzY29ubmVjdENvbXBvbmVudCIsIm9ic2VydmUiLCJjaGlsZExpc3QiLCJzdWJ0cmVlIiwibWl4ZWRGb3JtIiwiSFRNTEZvcm1FbGVtZW50IiwiSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCIsInJlZ2lzdGVyRWxlbWVudCIsImhhc0F0dHJpYnV0ZSIsIm5ld0VsZW1lbnQiLCJxdWVyeVNlbGVjdG9yQWxsIiwiYXR0cmlidXRlcyIsImF0cmlidXRlRmlsdGVyIiwiZGlzY29ubmVjdCIsImNvbXBvbmVudCIsInR5cGUiLCJjaGVja2VkIiwiaXRlcml0ZXIiLCJpdGVyIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7O0FDckNBOzs7Ozs7QUFFQSx1QkFBbUJBLFFBQW5CLEc7Ozs7Ozs7OztTQ2lCZ0JDLEssR0FBQUEsSztTQVlB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QUksQ0FBQ2dFLENBQUwsRUFBUTtBQUNOMkIsYUFBUUMsS0FBUixDQUFjLHdDQUFkLEVBQXdEMUQsS0FBS3pCLElBQTdELEVBQW1FeUIsSUFBbkU7QUFDQSxZQUFPLElBQVA7QUFDRDtBQUNELFVBQU84QixDQUFQO0FBQ0Q7O0FBRUQsVUFBU1UsT0FBVCxDQUFpQnhDLElBQWpCLEVBQW9DakIsSUFBcEMsRUFBMEQ7QUFDeEQsT0FBTXRCLElBQUl1QyxLQUFLK0QsWUFBTCxDQUFrQmhGLElBQWxCLENBQVY7QUFDQSxVQUFPdEIsSUFBSUEsQ0FBSixHQUFRLEVBQWY7QUFDRDtBQUNELFVBQVNnRixPQUFULENBQWlCekMsSUFBakIsRUFBb0NqQixJQUFwQyxFQUFrRGxCLEtBQWxELEVBQXdFO0FBQ3RFLE9BQUlBLFNBQVMsSUFBYixFQUFtQjtBQUNuQm1DLFFBQUt3RCxZQUFMLENBQWtCekUsSUFBbEIsRUFBd0JsQixLQUF4QjtBQUNEOztBQUVELFVBQVNzSCxPQUFULENBQW9Cd0IsUUFBcEIsRUFBK0Q7QUFDN0QsVUFBTzVKLE1BQU1DLElBQU4sQ0FBWSxhQUFhO0FBQzlCLDJCQUFtQjJKLFFBQW5CO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxXQUFXQyxJQUFYO0FBQTZCLDZCQUFnQkEsSUFBaEI7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLGFBQVd4SyxDQUFYO0FBQXNCLGVBQU1BLENBQU47QUFBdEI7QUFBN0I7QUFDRCxJQUZpQixFQUFYLENBQVA7QUFHRCxFIiwiZmlsZSI6InN0b3JhZ2UtZWxlbWVudHMtZGVidWcuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSlcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcblxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0ZXhwb3J0czoge30sXG4gXHRcdFx0aWQ6IG1vZHVsZUlkLFxuIFx0XHRcdGxvYWRlZDogZmFsc2VcbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubG9hZGVkID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXygwKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyB3ZWJwYWNrL2Jvb3RzdHJhcCAyYjExMTA3OWFiNDg2NjJmNjFiYyIsIi8vIEBmbG93XG5pbXBvcnQgU3RvcmFnZUZvcm1FbGVtZW50IGZyb20gXCIuL3N0b3JhZ2UtZm9ybVwiO1xuXG5TdG9yYWdlRm9ybUVsZW1lbnQucmVnaXN0ZXIoKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9zdG9yYWdlLWVsZW1lbnRzLXJlZ2lzdGVyZXIuanMiLCIvLyBAZmxvd1xuXG5leHBvcnQgY2xhc3MgQ2FuY2VsbGFibGVQcm9taXNlPFI+IGV4dGVuZHMgUHJvbWlzZTxSPiB7XG4gIGNhbmNlbGxGdW5jdGlvbjogKCkgPT4gdm9pZDtcbiAgY29uc3RydWN0b3IoXG4gICAgY2FsbGJhY2s6IChcbiAgICAgIHJlc29sdmU6IChyZXN1bHQ6IFByb21pc2U8Uj4gfCBSKSA9PiB2b2lkLFxuICAgICAgcmVqZWN0OiAoZXJyb3I6IGFueSkgPT4gdm9pZFxuICAgICkgPT4gbWl4ZWQsXG4gICAgY2FuY2VsbDogKCkgPT4gdm9pZFxuICApIHtcbiAgICBzdXBlcihjYWxsYmFjayk7XG4gICAgdGhpcy5jYW5jZWxsRnVuY3Rpb24gPSBjYW5jZWxsO1xuICB9XG5cbiAgY2FuY2VsbCgpIHtcbiAgICB0aGlzLmNhbmNlbGxGdW5jdGlvbigpO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzbGVlcChtc2VjOiBudW1iZXIpOiBDYW5jZWxsYWJsZVByb21pc2U8dm9pZD4ge1xuICBsZXQgdGltZW91dElkOiA/bnVtYmVyO1xuICByZXR1cm4gbmV3IENhbmNlbGxhYmxlUHJvbWlzZShcbiAgICAocmVzb2x2ZSkgPT4ge1xuICAgICAgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiByZXNvbHZlKCksIG1zZWMpO1xuICAgIH0sXG4gICAgKCkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgfVxuICApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZGVkdXA8VD4oYXJyYXk6IEFycmF5PFQ+LFxuICAgICAgICAgICAgICAgICAgICAgICAgIHByZWRpY2F0ZT86ICh0OiBULCBvOiBUKSA9PiBib29sZWFuID0gKHQsIG8pID0+IHQgPT09IG8pOiBBcnJheTxUPiB7XG4gIHJldHVybiBhcnJheS5yZWR1Y2UoKHJlc3VsdDogQXJyYXk8VD4sIGVsZW1lbnQpID0+IHtcbiAgICBpZiAocmVzdWx0LnNvbWUoKGkpID0+IHByZWRpY2F0ZShpLCBlbGVtZW50KSkpIHJlc3VsdDtcbiAgICByZXR1cm4gcmVzdWx0LmNvbmNhdChlbGVtZW50KTtcbiAgfSxbXSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdWJ0cmFjdFNldDxUPih0YXJnZXRTZXQ6IFNldDxUPiwgcmVtb3ZlZFNldDogU2V0PFQ+KTogU2V0PFQ+IHtcbiAgcmV0dXJuIG5ldyBTZXQoQXJyYXkuZnJvbSh0YXJnZXRTZXQpLmZpbHRlcigoZSkgPT4gIXJlbW92ZWRTZXQuaGFzKGUpKSk7XG59XG5cbmNsYXNzIE11bHRpVmFsdWVNYXA8SywgViwgSTogSXRlcmFibGU8Vj4+IGV4dGVuZHMgTWFwPEssIEk+IHtcbiAgKiBmbGF0dGVuVmFsdWVzKCk6IEl0ZXJhdG9yPFY+IHtcbiAgICBmb3IgKGNvbnN0IGFyciBvZiB0aGlzLnZhbHVlcygpKSB7XG4gICAgICBmb3IgKGNvbnN0IHYgb2YgYXJyKSB7XG4gICAgICAgIHlpZWxkIHY7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBcnJheVZhbHVlTWFwPEssIFY+IGV4dGVuZHMgTXVsdGlWYWx1ZU1hcDxLLCBWLCBBcnJheTxWPj4ge1xuICBhZGQoa2V5OiBLLCB2YWx1ZTogVik6IHRoaXMge1xuICAgIGxldCBhID0gdGhpcy5nZXQoa2V5KTtcbiAgICBpZiAoIWEpIHtcbiAgICAgIGEgPSBbXTtcbiAgICAgIHRoaXMuc2V0KGtleSwgYSk7XG4gICAgfVxuICAgIGEucHVzaCh2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNldFZhbHVlTWFwPEssIFY+IGV4dGVuZHMgTXVsdGlWYWx1ZU1hcDxLLCBWLCBTZXQ8Vj4+IHtcbiAgYWRkKGtleTogSywgdmFsdWU6IFYpOiB0aGlzIHtcbiAgICBsZXQgYSA9IHRoaXMuZ2V0KGtleSk7XG4gICAgaWYgKCFhKSB7XG4gICAgICBhID0gbmV3IFNldCgpO1xuICAgICAgdGhpcy5zZXQoa2V5LCBhKTtcbiAgICB9XG4gICAgYS5hZGQodmFsdWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvdXRpbHMuanMiLCIvLyBAZmxvd1xuLyogZ2xvYmFsIGNocm9tZSAqL1xuXG5leHBvcnQgdHlwZSBBcmVhID0gc3RyaW5nO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFyZWFIYW5kbGVyIHtcbiAgcmVhZChuYW1lOiBzdHJpbmcpOiBQcm9taXNlPD9zdHJpbmc+O1xuICB3cml0ZShuYW1lOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xuICByZW1vdmUobmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcbn1cblxuY29uc3QgaGFuZGxlcnM6IHsgW2FyZWE6IEFyZWFdOiBBcmVhSGFuZGxlciB9ID0ge307XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckhhbmRsZXIoYXJlYTogQXJlYSwgaGFuZGxlcjogQXJlYUhhbmRsZXIpOiB2b2lkIHtcbiAgaWYgKGhhbmRsZXJzW2FyZWFdKSB7XG4gICAgdGhyb3cgRXJyb3IoYEFscmVhZHkgcmVnaXN0ZXJlZCBoYW5kbGVyIGZvciBcIiR7YXJlYX1cImApO1xuICB9XG4gIGhhbmRsZXJzW2FyZWFdID0gaGFuZGxlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRIYW5kbGVyKGFyZWE6IEFyZWEpOiA/QXJlYUhhbmRsZXIge1xuICByZXR1cm4gaGFuZGxlcnNbYXJlYV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaXN0SGFuZGxlcnMoKTogQXJyYXk8W0FyZWEsIEFyZWFIYW5kbGVyXT4ge1xuICByZXR1cm4gT2JqZWN0LmVudHJpZXMoaGFuZGxlcnMpO1xufVxuXG4vL1xuXG5leHBvcnQgY2xhc3MgV2ViU3RvcmFnZUFyZWFIYW5kbGVyIHtcbiAgc3RvcmFnZTogU3RvcmFnZTtcblxuICBjb25zdHJ1Y3RvcihzdG9yYWdlOiBTdG9yYWdlKSB7XG4gICAgdGhpcy5zdG9yYWdlID0gc3RvcmFnZTtcbiAgfVxuXG4gIHJlYWQobmFtZTogc3RyaW5nKTogUHJvbWlzZTw/c3RyaW5nPiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLnN0b3JhZ2UuZ2V0SXRlbShuYW1lKSk7XG4gIH1cblxuICB3cml0ZShuYW1lOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnN0b3JhZ2Uuc2V0SXRlbShuYW1lLCBuZXdWYWx1ZSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgcmVtb3ZlKG5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc3RvcmFnZS5yZW1vdmVJdGVtKG5hbWUpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxufVxuXG5pZiAodHlwZW9mIGxvY2FsU3RvcmFnZSAhPT0gXCJ1bmRlZmluZWRcIilcbiAgcmVnaXN0ZXJIYW5kbGVyKFwibG9jYWwtc3RvcmFnZVwiLCBuZXcgV2ViU3RvcmFnZUFyZWFIYW5kbGVyKGxvY2FsU3RvcmFnZSkpO1xuaWYgKHR5cGVvZiBzZXNzaW9uU3RvcmFnZSAhPT0gXCJ1bmRlZmluZWRcIilcbiAgcmVnaXN0ZXJIYW5kbGVyKFwic2Vzc2lvbi1zdG9yYWdlXCIsIG5ldyBXZWJTdG9yYWdlQXJlYUhhbmRsZXIoc2Vzc2lvblN0b3JhZ2UpKTtcblxuLy9cblxuZXhwb3J0IGNsYXNzIENocm9tZVN0b3JhZ2VBcmVhSGFuZGxlciB7XG4gIHN0b3JhZ2U6IENocm9tZVN0b3JhZ2VBcmVhO1xuXG4gIGNvbnN0cnVjdG9yKHN0b3JhZ2U6IENocm9tZVN0b3JhZ2VBcmVhKSB7XG4gICAgdGhpcy5zdG9yYWdlID0gc3RvcmFnZTtcbiAgfVxuXG4gIHJlYWQobmFtZTogc3RyaW5nKTogUHJvbWlzZTw/c3RyaW5nPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB0aGlzLnN0b3JhZ2UuZ2V0KG5hbWUsICh2KSA9PiByZXNvbHZlKHZbbmFtZV0pKSk7XG4gIH1cblxuICB3cml0ZShuYW1lOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHRoaXMuc3RvcmFnZS5zZXQoeyBbbmFtZV06IG5ld1ZhbHVlIH0sIHJlc29sdmUpKTtcbiAgfVxuXG4gIHJlbW92ZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHRoaXMuc3RvcmFnZS5yZW1vdmUobmFtZSwgcmVzb2x2ZSkpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBCYXRjaFdyaXRlQ2hyb21lU3RvcmFnZUFyZWFIYW5kbGVyIGV4dGVuZHMgQ2hyb21lU3RvcmFnZUFyZWFIYW5kbGVyIHtcbiAgZGVsYXlNaWxsaXM6IG51bWJlcjtcbiAgdXBkYXRlZEVudHJpZXM6ID97IFtrOiBzdHJpbmddOiBzdHJpbmcgfTtcblxuICBjb25zdHJ1Y3RvcihzdG9yYWdlOiBDaHJvbWVTdG9yYWdlQXJlYSAmIHsgTUFYX1dSSVRFX09QRVJBVElPTlNfUEVSX0hPVVI6IG51bWJlciB9KSB7XG4gICAgc3VwZXIoc3RvcmFnZSk7XG4gICAgLy8gd2hhdCBpbnRlcnZhbCB3ZSBzaG91bGQga2VlcCBmb3IgYSB3cml0ZSBvcGVyYXRpb24uXG4gICAgdGhpcy5kZWxheU1pbGxpcyA9ICg2MCAqIDYwICogMTAwMCAvIHN0b3JhZ2UuTUFYX1dSSVRFX09QRVJBVElPTlNfUEVSX0hPVVIpICsgNTAwO1xuICAgIHRoaXMudXBkYXRlZEVudHJpZXMgPSBudWxsO1xuICB9XG5cbiAgd3JpdGUobmFtZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMudXBkYXRlZEVudHJpZXMgIT0gbnVsbCkge1xuICAgICAgdGhpcy51cGRhdGVkRW50cmllc1tuYW1lXSA9IG5ld1ZhbHVlO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH1cblxuICAgIHRoaXMudXBkYXRlZEVudHJpZXMgPSB7IFtuYW1lXTogbmV3VmFsdWUgfTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIGlmICh0aGlzLnVwZGF0ZWRFbnRyaWVzID09IG51bGwpIHJldHVybjtcbiAgICAgIHRoaXMuc3RvcmFnZS5zZXQodGhpcy51cGRhdGVkRW50cmllcyk7XG4gICAgICB0aGlzLnVwZGF0ZWRFbnRyaWVzID0gbnVsbDtcbiAgICB9LCB0aGlzLmRlbGF5TWlsbGlzKTtcblxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxufVxuXG5pZiAodHlwZW9mIGNocm9tZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjaHJvbWUuc3RvcmFnZSkge1xuICBpZiAoY2hyb21lLnN0b3JhZ2UubG9jYWwpXG4gICAgcmVnaXN0ZXJIYW5kbGVyKFwiY2hyb21lLWxvY2FsXCIsIG5ldyBDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIoY2hyb21lLnN0b3JhZ2UubG9jYWwpKTtcbiAgaWYgKGNocm9tZS5zdG9yYWdlLnN5bmMpXG4gICAgcmVnaXN0ZXJIYW5kbGVyKFwiY2hyb21lLXN5bmNcIiwgbmV3IEJhdGNoV3JpdGVDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIoY2hyb21lLnN0b3JhZ2Uuc3luYykpO1xufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2FyZWEtaGFuZGxlci5qcyIsIi8vIEBmbG93XG5cbmltcG9ydCAqIGFzIHUgZnJvbSBcIi4vdXRpbHNcIjtcblxuZGVjbGFyZSB0eXBlIE5hbWUgPSBzdHJpbmc7XG5kZWNsYXJlIHR5cGUgVmFsdWUgPSBzdHJpbmc7XG5kZWNsYXJlIHR5cGUgTmFtZVZhbHVlID0geyBuYW1lOiBOYW1lLCB2YWx1ZTogP1ZhbHVlIH07XG5kZWNsYXJlIHR5cGUgVmFsdWVzID0gTWFwPEVsZW1lbnQsIE5hbWVWYWx1ZT47XG5leHBvcnQgaW50ZXJmYWNlIEVsZW1lbnQge1xuICBuYW1lOiBOYW1lO1xufVxuZGVjbGFyZSBpbnRlcmZhY2UgU3RvcmFnZUhhbmRsZXIge1xuICByZWFkKG46IE5hbWUpOiBQcm9taXNlPD9WYWx1ZT47XG4gIHdyaXRlKG46IE5hbWUsIHY6IFZhbHVlKTogUHJvbWlzZTx2b2lkPjtcbiAgcmVtb3ZlKG46IE5hbWUpOiBQcm9taXNlPHZvaWQ+O1xufVxuZGVjbGFyZSBpbnRlcmZhY2UgRm9ybUhhbmRsZXIge1xuICB3cml0ZShlOiBFbGVtZW50LCB2OiA/VmFsdWUpOiB2b2lkO1xuICByZWFkKGU6IEVsZW1lbnQpOiA/VmFsdWU7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEJpbmRlciB7XG4gIHY6IFZhbHVlcztcbiAgczogU3RvcmFnZUhhbmRsZXI7XG4gIGY6IEZvcm1IYW5kbGVyO1xuICBsb2NrOiA/UHJvbWlzZTxtaXhlZD47XG5cbiAgY29uc3RydWN0b3IoczogU3RvcmFnZUhhbmRsZXIsIGY6IEZvcm1IYW5kbGVyKSB7XG4gICAgdGhpcy52ID0gbmV3IE1hcDtcbiAgICB0aGlzLnMgPSBzO1xuICAgIHRoaXMuZiA9IGY7XG4gICAgdGhpcy5sb2NrID0gbnVsbDtcbiAgfVxuXG4gIGFzeW5jIHN5bmModGFyZ2V0czogQXJyYXk8RWxlbWVudD4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzeW5jQmxvY2sodGhpcywgKCkgPT4gZG9TeW5jKHRoaXMsIHRhcmdldHMpKTtcbiAgfVxuXG4gIC8vLyBGb3JjZSB3cml0ZSBmb3JtIHZhbHVlcyB0byB0aGUgc3RvcmFnZVxuICBhc3luYyBzdWJtaXQodGFyZ2V0czogQXJyYXk8RWxlbWVudD4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzeW5jQmxvY2sodGhpcywgKCkgPT4gUHJvbWlzZS5hbGwodGFyZ2V0cy5tYXAoYXN5bmMgKGUpID0+IHtcbiAgICAgIGF3YWl0IHN0b3JlKHRoaXMsIGUpO1xuICAgIH0pKSk7XG4gIH1cblxuICAvLy8gU3luYyBvbmx5IG5ldyBlbGVtZW50c1xuICBhc3luYyBzY2FuKHRhcmdldHM6IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsIGFzeW5jICgpID0+IHtcbiAgICAgIGNvbnN0IG5ld0VsZW1lbnRzID0gdS5zdWJ0cmFjdFNldChuZXcgU2V0KHRhcmdldHMpLCBuZXcgU2V0KHRoaXMudi5rZXlzKCkpKTtcbiAgICAgIGF3YWl0IGRvU3luYyh0aGlzLCBBcnJheS5mcm9tKG5ld0VsZW1lbnRzKSk7XG4gICAgfSk7XG4gIH1cblxuICAvLy8gSW52b3JrIGlmIGFuIGVsZW1lbnQgd2FzIHJlbW92ZWQgZnJvbSBhIGZvcm0uXG4gIGFzeW5jIHJlbW92ZShlbGVtZW50czogQXJyYXk8RWxlbWVudD4pIHtcbiAgICBhd2FpdCBzeW5jQmxvY2sodGhpcywgYXN5bmMgKCkgPT4ge1xuICAgICAgZm9yIChjb25zdCBlIG9mIGVsZW1lbnRzKSB0aGlzLnYuZGVsZXRlKGUpO1xuICAgIH0pO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGRvU3luYyhzZWxmOiBCaW5kZXIsIHRhcmdldHM6IEFycmF5PEVsZW1lbnQ+KSB7XG4gIGF3YWl0IFByb21pc2UuYWxsKHRhcmdldHMubWFwKGFzeW5jIChlKSA9PiB7XG4gICAgYXdhaXQgbG9hZChzZWxmLCBlKTtcbiAgICBhd2FpdCBzdG9yZShzZWxmLCBlKTtcbiAgfSkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzeW5jQmxvY2soc2VsZjogQmluZGVyLCBmbjogKCkgPT4gUHJvbWlzZTxtaXhlZD4pIHtcbiAgd2hpbGUgKHNlbGYubG9jaykgYXdhaXQgc2VsZi5sb2NrO1xuICBzZWxmLmxvY2sgPSBmbigpO1xuICBhd2FpdCBzZWxmLmxvY2s7XG4gIHNlbGYubG9jayA9IG51bGw7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWQoc2VsZjogQmluZGVyLCBlbGVtOiBFbGVtZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IG5ld04gPSBlbGVtLm5hbWU7XG4gIGNvbnN0IG5ld1YgPSBhd2FpdCBzZWxmLnMucmVhZChuZXdOKTtcbiAgbGV0IG52OiA/TmFtZVZhbHVlID0gc2VsZi52LmdldChlbGVtKTtcbiAgaWYgKCFudikge1xuICAgIG52ID0geyBuYW1lOiBlbGVtLm5hbWUsIHZhbHVlOiBudWxsIH07XG4gICAgc2VsZi52LnNldChlbGVtLCBudik7XG4gIH1cbiAgaWYgKG52Lm5hbWUgIT09IG5ld04gfHwgbnYudmFsdWUgIT09IG5ld1YpIHtcbiAgICBzZWxmLmYud3JpdGUoZWxlbSwgbmV3Vik7XG4gICAgbnYubmFtZSA9ICBuZXdOO1xuICAgIG52LnZhbHVlID0gIG5ld1Y7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gc3RvcmUoc2VsZjogQmluZGVyLCBlbGVtOiBFbGVtZW50KTogUHJvbWlzZTx2b2lkPiB7XG4gIGNvbnN0IG5ld04gPSBlbGVtLm5hbWU7XG4gIGNvbnN0IG5ld1YgPSBmYWxsYmFja0lmTnVsbCgoKSA9PiBzZWxmLmYucmVhZChlbGVtKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICgpID0+IGdldFZhbHVlQnlOYW1lKHNlbGYsIG5ld04pKTtcbiAgbGV0IG52OiA/TmFtZVZhbHVlID0gc2VsZi52LmdldChlbGVtKTtcbiAgaWYgKCFudikge1xuICAgIG52ID0geyBuYW1lOiBlbGVtLm5hbWUsIHZhbHVlOiBudWxsIH07XG4gICAgc2VsZi52LnNldChlbGVtLCBudik7XG4gIH1cbiAgaWYgKG52Lm5hbWUgIT09IG5ld04gfHwgbnYudmFsdWUgIT09IG5ld1YpIHtcbiAgICBpZiAobmV3ViA9PSBudWxsKSB7XG4gICAgICBhd2FpdCBzZWxmLnMucmVtb3ZlKG5ld04pO1xuICAgIH0gZWxzZSB7XG4gICAgICBhd2FpdCBzZWxmLnMud3JpdGUobmV3TiwgbmV3Vik7XG4gICAgfVxuICAgIG52Lm5hbWUgPSAgbmV3TjtcbiAgICBudi52YWx1ZSA9ICBuZXdWO1xuICB9XG59XG5cbmZ1bmN0aW9uIGZhbGxiYWNrSWZOdWxsPFQ+KC4uLmZuczogQXJyYXk8KCkgPT4gVD4pOiA/VCB7XG4gIGZvciAoY29uc3QgZm4gb2YgZm5zKSB7XG4gICAgY29uc3QgdiA9IGZuKCk7XG4gICAgaWYgKHYgIT0gbnVsbCkgcmV0dXJuIHY7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbmZ1bmN0aW9uIGdldFZhbHVlQnlOYW1lKHNlbGY6IEJpbmRlciwgbmFtZTogTmFtZSk6ID9WYWx1ZSB7XG4gIGZvciAoY29uc3QgbnYgb2Ygc2VsZi52LnZhbHVlcygpKSB7XG4gICAgaWYgKG52Lm5hbWUgPT09IG5hbWUpIHJldHVybiBudi52YWx1ZTtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9iaW5kZXIuanMiLCIvLyBAZmxvd1xuXG5pbXBvcnQgKiBhcyB1IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgKiBhcyBhaCBmcm9tIFwiLi9hcmVhLWhhbmRsZXJcIjtcbmltcG9ydCBCaW5kZXIgZnJvbSBcIi4vYmluZGVyXCI7XG5cbmRlY2xhcmUgdHlwZSBWYWx1ZSA9IHN0cmluZztcblxuaW50ZXJmYWNlIEFyZWFTZWxlY3QgZXh0ZW5kcyBIVE1MU2VsZWN0RWxlbWVudCB7XG4gIGFyZWE6IHN0cmluZztcbn1cblxuaW50ZXJmYWNlIEludGVybmFsQXJlYVNlbGVjdCBleHRlbmRzIEFyZWFTZWxlY3Qge1xuICBpc0luaXRMb2FkOiBib29sZWFuO1xuICBiaW5kZXI6ID9CaW5kZXI7XG59XG5cbmNvbnN0IFNZTkNfSU5URVJWQUwgPSA1MDA7XG5cbmV4cG9ydCBmdW5jdGlvbiBtaXhpbkFyZWFTZWxlY3Q8VDogSFRNTFNlbGVjdEVsZW1lbnQ+KGM6IENsYXNzPFQ+KTogQ2xhc3M8VCAmIEFyZWFTZWxlY3Q+IHtcbiAgLy8gJEZsb3dGaXhNZSBGb3JjZSBjYXN0IHRvIHRoZSByZXR1cm5lZCB0eXBlLlxuICByZXR1cm4gY2xhc3MgZXh0ZW5kcyBjIHtcbiAgICBpc0luaXRMb2FkOiBib29sZWFuO1xuICAgIGJpbmRlcjogP0JpbmRlcjtcblxuICAgIGdldCBhcmVhKCk6IGFoLkFyZWEgeyByZXR1cm4gZ2V0QXR0cih0aGlzLCBcImFyZWFcIik7IH1cbiAgICBzZXQgYXJlYSh2OiBhbnkpIHsgc2V0QXR0cih0aGlzLCBcImFyZWFcIiwgdik7IH1cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICB0aGlzLmlzSW5pdExvYWQgPSB0cnVlO1xuXG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJjaGFuZ2VcIiwgKCkgPT4gc3luYyh0aGlzKSk7XG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInVubG9hZFwiLCAoKSA9PiBzeW5jKHRoaXMpKTtcblxuICAgICAgLy8gUGVyaW9kaWNhbCBzeW5jXG4gICAgICAvLyBUbyBvYnNlcnZlIHN0b3JhZ2UgY2hhbmdpbmdzIGFuZCBgLnZhbHVlYCBjaGFuZ2luZ3MgYnkgYW4gZXh0ZXJuYWwgamF2YXNjcmlwdHNcbiAgICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgYXdhaXQgdS5zbGVlcChTWU5DX0lOVEVSVkFMKTtcbiAgICAgICAgICBhd2FpdCBzeW5jKHRoaXMpO1xuICAgICAgICAgIHdyaXRlQXJlYSh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSkoKTtcbiAgICB9XG5cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgaWYgKHRoaXMubGVuZ3RoID09PSAwKSBhZGRBbGxIYW5kbGVycyh0aGlzKTtcbiAgICAgIGluaXRCaW5kZXIodGhpcyk7XG4gICAgICB3cml0ZUFyZWEodGhpcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJhcmVhXCJdOyB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ck5hbWU6IHN0cmluZykge1xuICAgICAgc3dpdGNoIChhdHRyTmFtZSkge1xuICAgICAgY2FzZSBcImFyZWFcIjpcbiAgICAgICAgaW5pdEJpbmRlcih0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG5jb25zdCBtaXhlZFNlbGVjdCA9IG1peGluQXJlYVNlbGVjdChIVE1MU2VsZWN0RWxlbWVudCk7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIVE1MQXJlYVNlbGVjdEVsZW1lbnQgZXh0ZW5kcyBtaXhlZFNlbGVjdCB7XG4gIHN0YXRpYyBnZXQgZXh0ZW5kcygpIHsgcmV0dXJuIFwic2VsZWN0XCI7IH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5pdEJpbmRlcihzZWxmOiBJbnRlcm5hbEFyZWFTZWxlY3QpOiBQcm9taXNlPHZvaWQ+IHtcbiAgLy8gQXZvaWQgdG8gaW5pdGFsaXplIHVudGlsIDxvcHRpb24+IGVsZW1lbnRzIGFyZSBhcHBlbmRlZFxuICBpZiAoc2VsZi5vcHRpb25zLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gIHNlbGYuYmluZGVyID0gbnVsbDtcblxuICBjb25zdCBoID0gZ2V0QXJlYUhhbmRsZXIoc2VsZik7XG4gIGlmICghaCkgcmV0dXJuO1xuXG4gIHNlbGYuYmluZGVyID0gbmV3IEJpbmRlcihoLCB7IHdyaXRlOiB3cml0ZVNlbGVjdCwgcmVhZDogcmVhZFNlbGVjdCB9KTtcblxuICBpZiAoc2VsZi5pc0luaXRMb2FkKSB7XG4gICAgc2VsZi5pc0luaXRMb2FkID0gZmFsc2U7XG4gICAgYXdhaXQgc3luYyhzZWxmKTtcbiAgfSBlbHNlIHtcbiAgICBhd2FpdCBzdWJtaXQoc2VsZik7XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JpdGVTZWxlY3Qoc2VsZjogYW55LCBuZXdWYWx1ZTogP1ZhbHVlKTogdm9pZCB7XG4gIGlmIChzZWxmLnZhbHVlID09PSBuZXdWYWx1ZSkgcmV0dXJuO1xuICBzZWxmLnZhbHVlID0gbmV3VmFsdWU7XG4gIHdyaXRlQXJlYShzZWxmKTtcbn1cblxuZnVuY3Rpb24gcmVhZFNlbGVjdChzZWxmOiBhbnkpOiBWYWx1ZSB7IHJldHVybiBzZWxmLnZhbHVlOyB9XG5cbmFzeW5jIGZ1bmN0aW9uIHN1Ym1pdChzZWxmOiBJbnRlcm5hbEFyZWFTZWxlY3QpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbGYuYmluZGVyKSBhd2FpdCBzZWxmLmJpbmRlci5zdWJtaXQoW3NlbGZdKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc3luYyhzZWxmOiBJbnRlcm5hbEFyZWFTZWxlY3QpOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbGYuYmluZGVyKSBhd2FpdCBzZWxmLmJpbmRlci5zeW5jKFtzZWxmXSk7XG59XG5cbmZ1bmN0aW9uIHdyaXRlQXJlYShzZWxmOiBJbnRlcm5hbEFyZWFTZWxlY3QpIHtcbiAgY29uc3QgZm9ybSA9IHNlbGYuZm9ybTtcbiAgaWYgKGZvcm0gPT0gbnVsbCkgcmV0dXJuO1xuICBmb3JtLnNldEF0dHJpYnV0ZShcImFyZWFcIiwgc2VsZi52YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGdldEFyZWFIYW5kbGVyKHNlbGY6IEludGVybmFsQXJlYVNlbGVjdCk6ID9haC5BcmVhSGFuZGxlciB7XG4gIGNvbnN0IGEgPSBzZWxmLmFyZWE7XG4gIGlmICghYSkge1xuICAgIGNvbnNvbGUuZGVidWcoXCJSZXF1aXJlICdhcmVhJyBhdHRyaWJ1dGVcIiwgc2VsZik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgY29uc3QgaCA9IGFoLmZpbmRIYW5kbGVyKGEpO1xuICBpZiAoIWgpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiTm8gc3VjaCBhcmVhIGhhbmRsZXI6IGFyZWE9JXMsIHRoaXM9JXNcIiwgc2VsZi5hcmVhLCBzZWxmKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gaDtcbn1cblxuZnVuY3Rpb24gYWRkQWxsSGFuZGxlcnMoc2VsZjogSW50ZXJuYWxBcmVhU2VsZWN0KSB7XG4gIGZvciAoY29uc3QgW2FyZWFdIG9mIGFoLmxpc3RIYW5kbGVycygpKSB7XG4gICAgY29uc3QgbyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJvcHRpb25cIik7XG4gICAgby5pbm5lckhUTUwgPSBhcmVhO1xuICAgIHNlbGYuYXBwZW5kQ2hpbGQobyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0QXR0cihzZWxmOiBIVE1MRWxlbWVudCwgbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdiA9IHNlbGYuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICByZXR1cm4gdiA/IHYgOiBcIlwiO1xufVxuZnVuY3Rpb24gc2V0QXR0cihzZWxmOiBIVE1MRWxlbWVudCwgbmFtZTogc3RyaW5nLCB2YWx1ZTogP3N0cmluZyk6IHZvaWQge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuO1xuICBzZWxmLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvYXJlYS1zZWxlY3QuanMiLCIvLyBAZmxvd1xuXG5pbXBvcnQgKiBhcyB1IGZyb20gXCIuL3V0aWxzXCI7XG5cbmltcG9ydCBCaW5kZXIgZnJvbSBcIi4vYmluZGVyXCI7XG5pbXBvcnQgdHlwZSB7IEVsZW1lbnQgfSBmcm9tIFwiLi9iaW5kZXJcIjtcblxuaW1wb3J0ICogYXMgYWggZnJvbSBcIi4vYXJlYS1oYW5kbGVyXCI7XG5pbXBvcnQgQXJlYVNlbGVjdCBmcm9tIFwiLi9hcmVhLXNlbGVjdFwiO1xuXG5kZWNsYXJlIHR5cGUgTmFtZSA9IHN0cmluZztcbmRlY2xhcmUgdHlwZSBWYWx1ZSA9IHN0cmluZztcblxuZGVjbGFyZSBpbnRlcmZhY2UgRm9ybUNvbXBvbmVudEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIG5hbWU6IE5hbWU7XG4gIHZhbHVlPzogVmFsdWU7XG4gIHR5cGU/OiBzdHJpbmc7XG4gIGNoZWNrZWQ/OiBib29sZWFuO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFN0b3JhZ2VGb3JtIGV4dGVuZHMgSFRNTEZvcm1FbGVtZW50IHtcbiAgYXV0b3N5bmM6IG51bWJlcjtcbiAgYXJlYTogc3RyaW5nO1xufVxuXG5kZWNsYXJlIGludGVyZmFjZSBJbnRlcm5hbFN0b3JhZ2VGb3JtIGV4dGVuZHMgU3RvcmFnZUZvcm0ge1xuICBpc0luaXRMb2FkOiBib29sZWFuO1xuICBiaW5kZXI6ID9CaW5kZXI7XG4gIGNvbXBvbmVudE9ic2VydmVyczogTWFwPEZvcm1Db21wb25lbnRFbGVtZW50LCBNdXRhdGlvbk9ic2VydmVyPjtcbn1cblxuY29uc3QgREVGQVVMVF9TWU5DX0lOVEVSVkFMID0gNzAwO1xuXG5leHBvcnQgZnVuY3Rpb24gbWl4aW5TdG9yYWdlRm9ybTxUOiBIVE1MRm9ybUVsZW1lbnQ+KGM6IENsYXNzPFQ+KTogQ2xhc3M8VCAmIFN0b3JhZ2VGb3JtPiB7XG4gIC8vICRGbG93Rml4TWUgRm9yY2UgY2FzdCB0byB0aGUgcmV0dXJuZWQgdHlwZS5cbiAgcmV0dXJuIGNsYXNzIGV4dGVuZHMgYyB7XG4gICAgaXNJbml0TG9hZDogYm9vbGVhbjtcbiAgICBiaW5kZXI6ID9CaW5kZXI7XG4gICAgY29tcG9uZW50T2JzZXJ2ZXJzOiBNYXA8Rm9ybUNvbXBvbmVudEVsZW1lbnQsIE11dGF0aW9uT2JzZXJ2ZXI+O1xuXG4gICAgZ2V0IGF1dG9zeW5jKCk6IG51bWJlciB7XG4gICAgICBjb25zdCBuID0gcGFyc2VJbnQoZ2V0QXR0cih0aGlzLCBcImF1dG9zeW5jXCIpKTtcbiAgICAgIHJldHVybiBuID4gMCA/IG4gOiBERUZBVUxUX1NZTkNfSU5URVJWQUw7XG4gICAgfVxuICAgIHNldCBhdXRvc3luYyh2OiBhbnkpIHsgc2V0QXR0cih0aGlzLCBcImF1dG9zeW5jXCIsIHYpOyB9XG4gICAgZ2V0IGFyZWEoKTogYWguQXJlYSB7IHJldHVybiBnZXRBdHRyKHRoaXMsIFwiYXJlYVwiKTsgfVxuICAgIHNldCBhcmVhKHY6IGFueSkgeyBzZXRBdHRyKHRoaXMsIFwiYXJlYVwiLCB2KTsgfVxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgIHRoaXMuaXNJbml0TG9hZCA9IHRydWU7XG4gICAgICB0aGlzLmNvbXBvbmVudE9ic2VydmVycyA9IG5ldyBNYXAoKTtcblxuICAgICAgaW5pdEJpbmRlcih0aGlzKTtcblxuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBzdWJtaXQodGhpcyk7XG4gICAgICB9KTtcblxuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmxvYWRcIiwgKCkgPT4ge1xuICAgICAgICBpZiAoaXNBdXRvU3luY0VuYWJsZWQodGhpcykpIHtcbiAgICAgICAgICBzeW5jKHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKHJlY29yZHMpID0+IHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcInNjYW4gYnkgZm9ybSBNdXRhdGlvbk9ic2VydmVyOiBcIiwgdGhpcyk7XG4gICAgICAgIHNjYW4odGhpcyk7XG5cbiAgICAgICAgY29uc3QgYWRkZWQ6IEFycmF5PEhUTUxFbGVtZW50PiA9XG4gICAgICAgICAgICAgIGZsYXR0ZW4ocmVjb3Jkcy5tYXAociA9PiAoci5hZGRlZE5vZGVzOiBJdGVyYWJsZTxhbnk+KSkpXG4gICAgICAgICAgICAgIC5maWx0ZXIoKGUpID0+IGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCk7XG4gICAgICAgIGlmIChhZGRlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBlIG9mIGFkZGVkKSB7XG4gICAgICAgICAgICBvYnNlcnZlQ29tcG9uZW50KHRoaXMsIGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHJlbW92ZWQ6IEFycmF5PEhUTUxFbGVtZW50PiA9XG4gICAgICAgICAgICAgIGZsYXR0ZW4ocmVjb3Jkcy5tYXAoKHIpID0+IChyLnJlbW92ZWROb2RlczogSXRlcmFibGU8YW55PikpKVxuICAgICAgICAgICAgICAuZmlsdGVyKChlKSA9PiBlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpO1xuICAgICAgICBpZiAocmVtb3ZlZC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgLy8gVXNlIGFueSB0byBmb3JjZSBjYXN0IHRvIEFycmF5PEZvcm1Db21wb25lbnRFbGVtZW50cz5cbiAgICAgICAgICByZW1vdmUodGhpcywgKHJlbW92ZWQuZmlsdGVyKChlKSA9PiAoZTogYW55KS5uYW1lKTogQXJyYXk8YW55PikpO1xuICAgICAgICAgIGZvciAoY29uc3QgZSBvZiByZW1vdmVkKSB7XG4gICAgICAgICAgICBkaXNjb25uZWN0Q29tcG9uZW50KHRoaXMsIGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkub2JzZXJ2ZSh0aGlzLCB7IGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZSB9KTtcblxuICAgICAgc2Nhbih0aGlzKTtcblxuICAgICAgLy8gUGVyaW9kaWNhbCBzY2FuL3N5bmNcbiAgICAgIC8vIFRvIG9ic2VydmU6XG4gICAgICAvLyAgICogc3RvcmFnZSB2YWx1ZSBjaGFuZ2luZ3NcbiAgICAgIC8vICAgKiBleHRlcm5hbCBmb3JtIGNvbXBvbmVudHMgKHN1Y2ggYXMgYSA8aW5wdXQgZm9ybT1cIi4uLlwiIC4uLj4pXG4gICAgICAvLyAgICogZm9ybSB2YWx1ZSBjaGFuZ2luZ3MgYnkgYW4gZXh0ZXJuYWwgamF2YXNjcmlwdFxuICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICBhd2FpdCB1LnNsZWVwKHRoaXMuYXV0b3N5bmMpO1xuICAgICAgICAgIGlmIChpc0F1dG9TeW5jRW5hYmxlZCh0aGlzKSkge1xuICAgICAgICAgICAgYXdhaXQgc3luYyh0aGlzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXdhaXQgc2Nhbih0aGlzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pKCk7XG4gICAgfVxuXG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgIHNjYW4odGhpcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICBcImF1dG9zeW5jXCIsXG4gICAgICAgIFwiYXJlYVwiLFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ck5hbWU6IHN0cmluZykge1xuICAgICAgc3dpdGNoIChhdHRyTmFtZSkge1xuICAgICAgY2FzZSBcImF1dG9zeW5jXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFyZWFcIjpcbiAgICAgICAgaW5pdEJpbmRlcih0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG5jb25zdCBtaXhlZEZvcm0gPSBtaXhpblN0b3JhZ2VGb3JtKEhUTUxGb3JtRWxlbWVudCk7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIVE1MU3RvcmFnZUZvcm1FbGVtZW50IGV4dGVuZHMgbWl4ZWRGb3JtIHtcbiAgc3RhdGljIGdldCBleHRlbmRzKCkgeyByZXR1cm4gXCJmb3JtXCI7IH1cblxuICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgLy8gQ3VzdG9tIEVsZW1lbnQgdjEgc2VlbXMgbm90IHRvIHdvcmtzIHJpZ2h0IHRvIGV4dGVuZCA8Zm9ybT4gaW4gR29vZ2xlIENocm9tZSA1NVxuICAgIC8vIFNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS80MTQ1ODY5Mi8zODY0MzUxXG4gICAgLy8gUG9seWZpbGwgdG9vOiBodHRwczovL2dpdGh1Yi5jb20vd2ViY29tcG9uZW50cy9jdXN0b20tZWxlbWVudHMvdHJlZS9tYXN0ZXIvc3JjXG4gICAgLy8gPiBUbyBkbzogSW1wbGVtZW50IGJ1aWx0LWluIGVsZW1lbnQgZXh0ZW5zaW9uIChpcz0pXG4gICAgLy8gY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwic3RvcmFnZS1mb3JtXCIsIFN0b3JhZ2VGb3JtRWxlbWVudCwgeyBleHRlbmRzOiBcImZvcm1cIiB9KTtcbiAgICAvLyB3aW5kb3cuU3RvcmFnZUZvcm1FbGVtZW50ID0gU3RvcmFnZUZvcm1FbGVtZW50O1xuXG4gICAgLy8gQ3VzdG9tIEVsZW1lbnQgdjBcbiAgICBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJzdG9yYWdlLWZvcm1cIiwgSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCk7XG4gICAgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwiYXJlYS1zZWxlY3RcIiwgQXJlYVNlbGVjdCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBdXRvU3luY0VuYWJsZWQoc2VsZjogSFRNTEZvcm1FbGVtZW50KTogYm9vbGVhbiB7XG4gIHJldHVybiBzZWxmLmhhc0F0dHJpYnV0ZShcImF1dG9zeW5jXCIpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzdWJtaXQoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnN1Ym1pdChlbGVtZW50cyhzZWxmKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN5bmMoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSwgdGFyZ2V0cz86IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZWxmLmJpbmRlcikgYXdhaXQgc2VsZi5iaW5kZXIuc3luYyh0YXJnZXRzID8gdGFyZ2V0cyA6IGVsZW1lbnRzKHNlbGYpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc2NhbihzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZWxmLmJpbmRlcikgYXdhaXQgc2VsZi5iaW5kZXIuc2NhbihlbGVtZW50cyhzZWxmKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlbW92ZShzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtLCBlbGVtczogQXJyYXk8RWxlbWVudD4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbGYuYmluZGVyKSBhd2FpdCBzZWxmLmJpbmRlci5yZW1vdmUoZWxlbXMpO1xufVxuXG5mdW5jdGlvbiBvYnNlcnZlQ29tcG9uZW50KHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0sIG5ld0VsZW1lbnQ6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGNvbnN0IGVsZW1lbnRzOiBBcnJheTxGb3JtQ29tcG9uZW50RWxlbWVudD4gPVxuICAgICAgICAvLyBmb3JjZSBjYXN0XG4gICAgICAgIChbbmV3RWxlbWVudCwgLi4uQXJyYXkuZnJvbShuZXdFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIqXCIpKV1cbiAgICAgICAgIC5maWx0ZXIoKGUpID0+IChlOiBhbnkpLnZhbHVlICE9IG51bGwgJiYgKGU6IGFueSkubmFtZSAhPSBudWxsKTogYW55KTtcblxuICBmb3IgKGNvbnN0IGUgb2YgZWxlbWVudHMpIHtcbiAgICBjb25zdCBvID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4gc3luYyhzZWxmLCBbZV0pKTtcbiAgICBvLm9ic2VydmUoZSwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBhdHJpYnV0ZUZpbHRlcjogW1wibmFtZVwiXSB9KTtcbiAgICBzZWxmLmNvbXBvbmVudE9ic2VydmVycy5zZXQoZSwgbyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGlzY29ubmVjdENvbXBvbmVudChzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtLCBlbGVtZW50OiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBjb25zdCBlbGVtZW50cyA9IFtlbGVtZW50LCAuLi5BcnJheS5mcm9tKGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChcIipcIikpXTtcbiAgZm9yIChjb25zdCBlIG9mIGVsZW1lbnRzKSB7XG4gICAgY29uc3QgbyA9IHNlbGYuY29tcG9uZW50T2JzZXJ2ZXJzLmdldCgoZTogYW55KSk7XG4gICAgaWYgKG8gPT0gbnVsbCkgY29udGludWU7XG4gICAgc2VsZi5jb21wb25lbnRPYnNlcnZlcnMuZGVsZXRlKChlOiBhbnkpKTtcbiAgICBvLmRpc2Nvbm5lY3QoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBlbGVtZW50cyhzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtKTogQXJyYXk8RWxlbWVudD4ge1xuICByZXR1cm4gQXJyYXkuZnJvbSgoKHNlbGYuZWxlbWVudHMpOiBJdGVyYWJsZTxhbnk+KSlcbiAgICAuZmlsdGVyKGUgPT4gZS5uYW1lKVxuICAgIC5maWx0ZXIoZSA9PiAhKGUgaW5zdGFuY2VvZiBBcmVhU2VsZWN0KSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRCaW5kZXIoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSk6IFByb21pc2U8dm9pZD4ge1xuICBzZWxmLmJpbmRlciA9IG51bGw7XG5cbiAgY29uc3QgaCA9IGdldEFyZWFIYW5kbGVyKHNlbGYpO1xuICBpZiAoIWgpIHJldHVybjtcblxuICBzZWxmLmJpbmRlciA9IG5ldyBCaW5kZXIoaCwgeyB3cml0ZTogd3JpdGVGb3JtLCByZWFkOiByZWFkRm9ybSB9KTtcbiAgaWYgKHNlbGYuaXNJbml0TG9hZCkge1xuICAgIHNlbGYuaXNJbml0TG9hZCA9IGZhbHNlO1xuICAgIGF3YWl0IHN5bmMoc2VsZik7XG4gIH0gZWxzZSB7XG4gICAgYXdhaXQgc3VibWl0KHNlbGYpO1xuICB9XG5cbiAgc2VsZi5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcInN0b3JhZ2UtZm9ybS1pbml0XCIsIHsgZGV0YWlsOiB7IHRhcmdldDogc2VsZiB9fSkpO1xufVxuXG5mdW5jdGlvbiB3cml0ZUZvcm0oY29tcG9uZW50OiBhbnksIG5ld1ZhbHVlOiA/VmFsdWUpOiB2b2lkIHtcbiAgY29uc3QgdHlwZSA9IGNvbXBvbmVudC50eXBlO1xuICBpZiAodHlwZSA9PT0gXCJjaGVja2JveFwiIHx8IHR5cGUgPT09IFwicmFkaW9cIikge1xuICAgIGNvbXBvbmVudC5jaGVja2VkID0gbmV3VmFsdWUgPT09IGNvbXBvbmVudC52YWx1ZTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAobmV3VmFsdWUgPT0gbnVsbCB8fCBjb21wb25lbnQudmFsdWUgPT0gbnVsbClcbiAgICByZXR1cm47XG5cbiAgY29tcG9uZW50LnZhbHVlID0gbmV3VmFsdWU7XG59XG5cbmZ1bmN0aW9uIHJlYWRGb3JtKGNvbXBvbmVudDogYW55KTogP1ZhbHVlIHtcbiAgY29uc3QgdHlwZSA9IGNvbXBvbmVudC50eXBlO1xuICBpZiAodHlwZSA9PT0gXCJjaGVja2JveFwiIHx8IHR5cGUgPT09IFwicmFkaW9cIikge1xuICAgIHJldHVybiBjb21wb25lbnQuY2hlY2tlZCA/IGNvbXBvbmVudC52YWx1ZSA6IG51bGw7XG4gIH1cbiAgcmV0dXJuIGNvbXBvbmVudC52YWx1ZTtcbn1cblxuZnVuY3Rpb24gZ2V0QXJlYUhhbmRsZXIoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSk6ID9haC5BcmVhSGFuZGxlciB7XG4gIGNvbnN0IGEgPSBzZWxmLmFyZWE7XG4gIGlmICghYSkge1xuICAgIGNvbnNvbGUuZGVidWcoXCJSZXF1aXJlICdhcmVhJyBhdHRyaWJ1dGVcIiwgc2VsZik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgY29uc3QgaCA9IGFoLmZpbmRIYW5kbGVyKGEpO1xuICBpZiAoIWgpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiTm8gc3VjaCBhcmVhIGhhbmRsZXI6IGFyZWE9JXMsIHRoaXM9JW9cIiwgc2VsZi5hcmVhLCBzZWxmKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICByZXR1cm4gaDtcbn1cblxuZnVuY3Rpb24gZ2V0QXR0cihzZWxmOiBIVE1MRWxlbWVudCwgbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdiA9IHNlbGYuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICByZXR1cm4gdiA/IHYgOiBcIlwiO1xufVxuZnVuY3Rpb24gc2V0QXR0cihzZWxmOiBIVE1MRWxlbWVudCwgbmFtZTogc3RyaW5nLCB2YWx1ZTogP3N0cmluZyk6IHZvaWQge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuO1xuICBzZWxmLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGZsYXR0ZW48VD4oaXRlcml0ZXI6IEl0ZXJhYmxlPEl0ZXJhYmxlPFQ+Pik6IEFycmF5PFQ+IHtcbiAgcmV0dXJuIEFycmF5LmZyb20oKGZ1bmN0aW9uKiAoKSB7XG4gICAgZm9yIChjb25zdCBpdGVyIG9mIGl0ZXJpdGVyKSBmb3IgKGNvbnN0IHQgb2YgaXRlcikgeWllbGQgdDtcbiAgfSkoKSk7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvc3RvcmFnZS1mb3JtLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==