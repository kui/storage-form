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
	    var newV = self.f.read(elem);
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
	          // Use "any" to force cast to Array<FormComponentElements>
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
	    if (component.checked) {
	      return component.value;
	    }
	    var uncheckedValue = component.dataset.uncheckedValue;
	    if (uncheckedValue) {
	      return uncheckedValue;
	    }
	    return "";
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNjZjMzc1NWJmOGQ4OWEwN2NkNmYiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0b3JhZ2UtZWxlbWVudHMtcmVnaXN0ZXJlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FyZWEtaGFuZGxlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYmluZGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9hcmVhLXNlbGVjdC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc3RvcmFnZS1mb3JtLmpzIl0sIm5hbWVzIjpbInJlZ2lzdGVyIiwic2xlZXAiLCJkZWR1cCIsInN1YnRyYWN0U2V0IiwiQ2FuY2VsbGFibGVQcm9taXNlIiwiUHJvbWlzZSIsImNvbnN0cnVjdG9yIiwiY2FsbGJhY2siLCJjYW5jZWxsIiwiY2FuY2VsbEZ1bmN0aW9uIiwibXNlYyIsInRpbWVvdXRJZCIsInJlc29sdmUiLCJzZXRUaW1lb3V0IiwiY2xlYXJUaW1lb3V0IiwiYXJyYXkiLCJwcmVkaWNhdGUiLCJ0IiwibyIsInJlZHVjZSIsInJlc3VsdCIsImVsZW1lbnQiLCJzb21lIiwiaSIsImNvbmNhdCIsInRhcmdldFNldCIsInJlbW92ZWRTZXQiLCJTZXQiLCJBcnJheSIsImZyb20iLCJmaWx0ZXIiLCJlIiwiaGFzIiwiTXVsdGlWYWx1ZU1hcCIsIk1hcCIsImZsYXR0ZW5WYWx1ZXMiLCJ2YWx1ZXMiLCJhcnIiLCJ2IiwiQXJyYXlWYWx1ZU1hcCIsImFkZCIsImtleSIsInZhbHVlIiwiYSIsImdldCIsInNldCIsInB1c2giLCJTZXRWYWx1ZU1hcCIsInJlZ2lzdGVySGFuZGxlciIsImZpbmRIYW5kbGVyIiwibGlzdEhhbmRsZXJzIiwiaGFuZGxlcnMiLCJhcmVhIiwiaGFuZGxlciIsIkVycm9yIiwiT2JqZWN0IiwiZW50cmllcyIsIldlYlN0b3JhZ2VBcmVhSGFuZGxlciIsInN0b3JhZ2UiLCJyZWFkIiwibmFtZSIsImdldEl0ZW0iLCJ3cml0ZSIsIm5ld1ZhbHVlIiwic2V0SXRlbSIsInJlbW92ZSIsInJlbW92ZUl0ZW0iLCJsb2NhbFN0b3JhZ2UiLCJzZXNzaW9uU3RvcmFnZSIsIkNocm9tZVN0b3JhZ2VBcmVhSGFuZGxlciIsIkJhdGNoV3JpdGVDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIiLCJkZWxheU1pbGxpcyIsIk1BWF9XUklURV9PUEVSQVRJT05TX1BFUl9IT1VSIiwidXBkYXRlZEVudHJpZXMiLCJjaHJvbWUiLCJsb2NhbCIsInN5bmMiLCJzZWxmIiwidGFyZ2V0cyIsImFsbCIsIm1hcCIsImxvYWQiLCJzdG9yZSIsImRvU3luYyIsImZuIiwibG9jayIsInN5bmNCbG9jayIsImVsZW0iLCJuZXdOIiwibmV3ViIsInMiLCJudiIsImYiLCJ1IiwiQmluZGVyIiwic3VibWl0Iiwic2NhbiIsIm5ld0VsZW1lbnRzIiwia2V5cyIsImVsZW1lbnRzIiwiZGVsZXRlIiwib3B0aW9ucyIsImxlbmd0aCIsImJpbmRlciIsImgiLCJnZXRBcmVhSGFuZGxlciIsIndyaXRlU2VsZWN0IiwicmVhZFNlbGVjdCIsImlzSW5pdExvYWQiLCJpbml0QmluZGVyIiwibWl4aW5BcmVhU2VsZWN0IiwiYWgiLCJTWU5DX0lOVEVSVkFMIiwiYyIsImdldEF0dHIiLCJzZXRBdHRyIiwiY3JlYXRlZENhbGxiYWNrIiwiYWRkRXZlbnRMaXN0ZW5lciIsIndpbmRvdyIsIndyaXRlQXJlYSIsImF0dGFjaGVkQ2FsbGJhY2siLCJhZGRBbGxIYW5kbGVycyIsIm9ic2VydmVkQXR0cmlidXRlcyIsImF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayIsImF0dHJOYW1lIiwibWl4ZWRTZWxlY3QiLCJIVE1MU2VsZWN0RWxlbWVudCIsIkhUTUxBcmVhU2VsZWN0RWxlbWVudCIsImV4dGVuZHMiLCJmb3JtIiwic2V0QXR0cmlidXRlIiwiY29uc29sZSIsImRlYnVnIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwiYXBwZW5kQ2hpbGQiLCJnZXRBdHRyaWJ1dGUiLCJlbGVtcyIsIndyaXRlRm9ybSIsInJlYWRGb3JtIiwiZGlzcGF0Y2hFdmVudCIsIkN1c3RvbUV2ZW50IiwiZGV0YWlsIiwidGFyZ2V0IiwibWl4aW5TdG9yYWdlRm9ybSIsIkRFRkFVTFRfU1lOQ19JTlRFUlZBTCIsImF1dG9zeW5jIiwibiIsInBhcnNlSW50IiwiY29tcG9uZW50T2JzZXJ2ZXJzIiwiZXZlbnQiLCJwcmV2ZW50RGVmYXVsdCIsImlzQXV0b1N5bmNFbmFibGVkIiwiTXV0YXRpb25PYnNlcnZlciIsInJlY29yZHMiLCJhZGRlZCIsImZsYXR0ZW4iLCJyIiwiYWRkZWROb2RlcyIsIkhUTUxFbGVtZW50Iiwib2JzZXJ2ZUNvbXBvbmVudCIsInJlbW92ZWQiLCJyZW1vdmVkTm9kZXMiLCJkaXNjb25uZWN0Q29tcG9uZW50Iiwib2JzZXJ2ZSIsImNoaWxkTGlzdCIsInN1YnRyZWUiLCJtaXhlZEZvcm0iLCJIVE1MRm9ybUVsZW1lbnQiLCJIVE1MU3RvcmFnZUZvcm1FbGVtZW50IiwicmVnaXN0ZXJFbGVtZW50IiwiaGFzQXR0cmlidXRlIiwibmV3RWxlbWVudCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJhdHRyaWJ1dGVzIiwiYXRyaWJ1dGVGaWx0ZXIiLCJkaXNjb25uZWN0IiwiY29tcG9uZW50IiwidHlwZSIsImNoZWNrZWQiLCJ1bmNoZWNrZWRWYWx1ZSIsImRhdGFzZXQiLCJpdGVyaXRlciIsIml0ZXIiXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7QUNyQ0E7Ozs7OztBQUVBLHVCQUFtQkEsUUFBbkIsRzs7Ozs7Ozs7O1NDaUJnQkMsSyxHQUFBQSxLO1NBWUFDLEssR0FBQUEsSztT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UUFBbkI7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLFdBQVdDLElBQVg7QUFBNkIsNkJBQWdCQSxJQUFoQjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUEsYUFBV3ZLLENBQVg7QUFBc0IsZUFBTUEsQ0FBTjtBQUF0QjtBQUE3QjtBQUNELElBRmlCLEVBQVgsQ0FBUDtBQUdELEUiLCJmaWxlIjoic3RvcmFnZS1lbGVtZW50cy1kZWJ1Zy5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHdlYnBhY2svYm9vdHN0cmFwIDY2YzM3NTViZjhkODlhMDdjZDZmIiwiLy8gQGZsb3dcbmltcG9ydCBTdG9yYWdlRm9ybUVsZW1lbnQgZnJvbSBcIi4vc3RvcmFnZS1mb3JtXCI7XG5cblN0b3JhZ2VGb3JtRWxlbWVudC5yZWdpc3RlcigpO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3N0b3JhZ2UtZWxlbWVudHMtcmVnaXN0ZXJlci5qcyIsIi8vIEBmbG93XG5cbmV4cG9ydCBjbGFzcyBDYW5jZWxsYWJsZVByb21pc2U8Uj4gZXh0ZW5kcyBQcm9taXNlPFI+IHtcbiAgY2FuY2VsbEZ1bmN0aW9uOiAoKSA9PiB2b2lkO1xuICBjb25zdHJ1Y3RvcihcbiAgICBjYWxsYmFjazogKFxuICAgICAgcmVzb2x2ZTogKHJlc3VsdDogUHJvbWlzZTxSPiB8IFIpID0+IHZvaWQsXG4gICAgICByZWplY3Q6IChlcnJvcjogYW55KSA9PiB2b2lkXG4gICAgKSA9PiBtaXhlZCxcbiAgICBjYW5jZWxsOiAoKSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGNhbGxiYWNrKTtcbiAgICB0aGlzLmNhbmNlbGxGdW5jdGlvbiA9IGNhbmNlbGw7XG4gIH1cblxuICBjYW5jZWxsKCkge1xuICAgIHRoaXMuY2FuY2VsbEZ1bmN0aW9uKCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNsZWVwKG1zZWM6IG51bWJlcik6IENhbmNlbGxhYmxlUHJvbWlzZTx2b2lkPiB7XG4gIGxldCB0aW1lb3V0SWQ6ID9udW1iZXI7XG4gIHJldHVybiBuZXcgQ2FuY2VsbGFibGVQcm9taXNlKFxuICAgIChyZXNvbHZlKSA9PiB7XG4gICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoKSwgbXNlYyk7XG4gICAgfSxcbiAgICAoKSA9PiB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWR1cDxUPihhcnJheTogQXJyYXk8VD4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgcHJlZGljYXRlPzogKHQ6IFQsIG86IFQpID0+IGJvb2xlYW4gPSAodCwgbykgPT4gdCA9PT0gbyk6IEFycmF5PFQ+IHtcbiAgcmV0dXJuIGFycmF5LnJlZHVjZSgocmVzdWx0OiBBcnJheTxUPiwgZWxlbWVudCkgPT4ge1xuICAgIGlmIChyZXN1bHQuc29tZSgoaSkgPT4gcHJlZGljYXRlKGksIGVsZW1lbnQpKSkgcmVzdWx0O1xuICAgIHJldHVybiByZXN1bHQuY29uY2F0KGVsZW1lbnQpO1xuICB9LFtdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN1YnRyYWN0U2V0PFQ+KHRhcmdldFNldDogU2V0PFQ+LCByZW1vdmVkU2V0OiBTZXQ8VD4pOiBTZXQ8VD4ge1xuICByZXR1cm4gbmV3IFNldChBcnJheS5mcm9tKHRhcmdldFNldCkuZmlsdGVyKChlKSA9PiAhcmVtb3ZlZFNldC5oYXMoZSkpKTtcbn1cblxuY2xhc3MgTXVsdGlWYWx1ZU1hcDxLLCBWLCBJOiBJdGVyYWJsZTxWPj4gZXh0ZW5kcyBNYXA8SywgST4ge1xuICAqIGZsYXR0ZW5WYWx1ZXMoKTogSXRlcmF0b3I8Vj4ge1xuICAgIGZvciAoY29uc3QgYXJyIG9mIHRoaXMudmFsdWVzKCkpIHtcbiAgICAgIGZvciAoY29uc3QgdiBvZiBhcnIpIHtcbiAgICAgICAgeWllbGQgdjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFycmF5VmFsdWVNYXA8SywgVj4gZXh0ZW5kcyBNdWx0aVZhbHVlTWFwPEssIFYsIEFycmF5PFY+PiB7XG4gIGFkZChrZXk6IEssIHZhbHVlOiBWKTogdGhpcyB7XG4gICAgbGV0IGEgPSB0aGlzLmdldChrZXkpO1xuICAgIGlmICghYSkge1xuICAgICAgYSA9IFtdO1xuICAgICAgdGhpcy5zZXQoa2V5LCBhKTtcbiAgICB9XG4gICAgYS5wdXNoKHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2V0VmFsdWVNYXA8SywgVj4gZXh0ZW5kcyBNdWx0aVZhbHVlTWFwPEssIFYsIFNldDxWPj4ge1xuICBhZGQoa2V5OiBLLCB2YWx1ZTogVik6IHRoaXMge1xuICAgIGxldCBhID0gdGhpcy5nZXQoa2V5KTtcbiAgICBpZiAoIWEpIHtcbiAgICAgIGEgPSBuZXcgU2V0KCk7XG4gICAgICB0aGlzLnNldChrZXksIGEpO1xuICAgIH1cbiAgICBhLmFkZCh2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy91dGlscy5qcyIsIi8vIEBmbG93XG4vKiBnbG9iYWwgY2hyb21lICovXG5cbmV4cG9ydCB0eXBlIEFyZWEgPSBzdHJpbmc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXJlYUhhbmRsZXIge1xuICByZWFkKG5hbWU6IHN0cmluZyk6IFByb21pc2U8P3N0cmluZz47XG4gIHdyaXRlKG5hbWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG4gIHJlbW92ZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5jb25zdCBoYW5kbGVyczogeyBbYXJlYTogQXJlYV06IEFyZWFIYW5kbGVyIH0gPSB7fTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySGFuZGxlcihhcmVhOiBBcmVhLCBoYW5kbGVyOiBBcmVhSGFuZGxlcik6IHZvaWQge1xuICBpZiAoaGFuZGxlcnNbYXJlYV0pIHtcbiAgICB0aHJvdyBFcnJvcihgQWxyZWFkeSByZWdpc3RlcmVkIGhhbmRsZXIgZm9yIFwiJHthcmVhfVwiYCk7XG4gIH1cbiAgaGFuZGxlcnNbYXJlYV0gPSBoYW5kbGVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZEhhbmRsZXIoYXJlYTogQXJlYSk6ID9BcmVhSGFuZGxlciB7XG4gIHJldHVybiBoYW5kbGVyc1thcmVhXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RIYW5kbGVycygpOiBBcnJheTxbQXJlYSwgQXJlYUhhbmRsZXJdPiB7XG4gIHJldHVybiBPYmplY3QuZW50cmllcyhoYW5kbGVycyk7XG59XG5cbi8vXG5cbmV4cG9ydCBjbGFzcyBXZWJTdG9yYWdlQXJlYUhhbmRsZXIge1xuICBzdG9yYWdlOiBTdG9yYWdlO1xuXG4gIGNvbnN0cnVjdG9yKHN0b3JhZ2U6IFN0b3JhZ2UpIHtcbiAgICB0aGlzLnN0b3JhZ2UgPSBzdG9yYWdlO1xuICB9XG5cbiAgcmVhZChuYW1lOiBzdHJpbmcpOiBQcm9taXNlPD9zdHJpbmc+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuc3RvcmFnZS5nZXRJdGVtKG5hbWUpKTtcbiAgfVxuXG4gIHdyaXRlKG5hbWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc3RvcmFnZS5zZXRJdGVtKG5hbWUsIG5ld1ZhbHVlKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICByZW1vdmUobmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zdG9yYWdlLnJlbW92ZUl0ZW0obmFtZSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG59XG5cbmlmICh0eXBlb2YgbG9jYWxTdG9yYWdlICE9PSBcInVuZGVmaW5lZFwiKVxuICByZWdpc3RlckhhbmRsZXIoXCJsb2NhbC1zdG9yYWdlXCIsIG5ldyBXZWJTdG9yYWdlQXJlYUhhbmRsZXIobG9jYWxTdG9yYWdlKSk7XG5pZiAodHlwZW9mIHNlc3Npb25TdG9yYWdlICE9PSBcInVuZGVmaW5lZFwiKVxuICByZWdpc3RlckhhbmRsZXIoXCJzZXNzaW9uLXN0b3JhZ2VcIiwgbmV3IFdlYlN0b3JhZ2VBcmVhSGFuZGxlcihzZXNzaW9uU3RvcmFnZSkpO1xuXG4vL1xuXG5leHBvcnQgY2xhc3MgQ2hyb21lU3RvcmFnZUFyZWFIYW5kbGVyIHtcbiAgc3RvcmFnZTogQ2hyb21lU3RvcmFnZUFyZWE7XG5cbiAgY29uc3RydWN0b3Ioc3RvcmFnZTogQ2hyb21lU3RvcmFnZUFyZWEpIHtcbiAgICB0aGlzLnN0b3JhZ2UgPSBzdG9yYWdlO1xuICB9XG5cbiAgcmVhZChuYW1lOiBzdHJpbmcpOiBQcm9taXNlPD9zdHJpbmc+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHRoaXMuc3RvcmFnZS5nZXQobmFtZSwgKHYpID0+IHJlc29sdmUodltuYW1lXSkpKTtcbiAgfVxuXG4gIHdyaXRlKG5hbWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gdGhpcy5zdG9yYWdlLnNldCh7IFtuYW1lXTogbmV3VmFsdWUgfSwgcmVzb2x2ZSkpO1xuICB9XG5cbiAgcmVtb3ZlKG5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gdGhpcy5zdG9yYWdlLnJlbW92ZShuYW1lLCByZXNvbHZlKSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEJhdGNoV3JpdGVDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIgZXh0ZW5kcyBDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIge1xuICBkZWxheU1pbGxpczogbnVtYmVyO1xuICB1cGRhdGVkRW50cmllczogP3sgW2s6IHN0cmluZ106IHN0cmluZyB9O1xuXG4gIGNvbnN0cnVjdG9yKHN0b3JhZ2U6IENocm9tZVN0b3JhZ2VBcmVhICYgeyBNQVhfV1JJVEVfT1BFUkFUSU9OU19QRVJfSE9VUjogbnVtYmVyIH0pIHtcbiAgICBzdXBlcihzdG9yYWdlKTtcbiAgICAvLyB3aGF0IGludGVydmFsIHdlIHNob3VsZCBrZWVwIGZvciBhIHdyaXRlIG9wZXJhdGlvbi5cbiAgICB0aGlzLmRlbGF5TWlsbGlzID0gKDYwICogNjAgKiAxMDAwIC8gc3RvcmFnZS5NQVhfV1JJVEVfT1BFUkFUSU9OU19QRVJfSE9VUikgKyA1MDA7XG4gICAgdGhpcy51cGRhdGVkRW50cmllcyA9IG51bGw7XG4gIH1cblxuICB3cml0ZShuYW1lOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy51cGRhdGVkRW50cmllcyAhPSBudWxsKSB7XG4gICAgICB0aGlzLnVwZGF0ZWRFbnRyaWVzW25hbWVdID0gbmV3VmFsdWU7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfVxuXG4gICAgdGhpcy51cGRhdGVkRW50cmllcyA9IHsgW25hbWVdOiBuZXdWYWx1ZSB9O1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgaWYgKHRoaXMudXBkYXRlZEVudHJpZXMgPT0gbnVsbCkgcmV0dXJuO1xuICAgICAgdGhpcy5zdG9yYWdlLnNldCh0aGlzLnVwZGF0ZWRFbnRyaWVzKTtcbiAgICAgIHRoaXMudXBkYXRlZEVudHJpZXMgPSBudWxsO1xuICAgIH0sIHRoaXMuZGVsYXlNaWxsaXMpO1xuXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG59XG5cbmlmICh0eXBlb2YgY2hyb21lICE9PSBcInVuZGVmaW5lZFwiICYmIGNocm9tZS5zdG9yYWdlKSB7XG4gIGlmIChjaHJvbWUuc3RvcmFnZS5sb2NhbClcbiAgICByZWdpc3RlckhhbmRsZXIoXCJjaHJvbWUtbG9jYWxcIiwgbmV3IENocm9tZVN0b3JhZ2VBcmVhSGFuZGxlcihjaHJvbWUuc3RvcmFnZS5sb2NhbCkpO1xuICBpZiAoY2hyb21lLnN0b3JhZ2Uuc3luYylcbiAgICByZWdpc3RlckhhbmRsZXIoXCJjaHJvbWUtc3luY1wiLCBuZXcgQmF0Y2hXcml0ZUNocm9tZVN0b3JhZ2VBcmVhSGFuZGxlcihjaHJvbWUuc3RvcmFnZS5zeW5jKSk7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvYXJlYS1oYW5kbGVyLmpzIiwiLy8gQGZsb3dcblxuaW1wb3J0ICogYXMgdSBmcm9tIFwiLi91dGlsc1wiO1xuXG5kZWNsYXJlIHR5cGUgTmFtZSA9IHN0cmluZztcbmRlY2xhcmUgdHlwZSBWYWx1ZSA9IHN0cmluZztcbmRlY2xhcmUgdHlwZSBOYW1lVmFsdWUgPSB7IG5hbWU6IE5hbWUsIHZhbHVlOiA/VmFsdWUgfTtcbmRlY2xhcmUgdHlwZSBWYWx1ZXMgPSBNYXA8RWxlbWVudCwgTmFtZVZhbHVlPjtcbmV4cG9ydCBpbnRlcmZhY2UgRWxlbWVudCB7XG4gIG5hbWU6IE5hbWU7XG59XG5kZWNsYXJlIGludGVyZmFjZSBTdG9yYWdlSGFuZGxlciB7XG4gIHJlYWQobjogTmFtZSk6IFByb21pc2U8P1ZhbHVlPjtcbiAgd3JpdGUobjogTmFtZSwgdjogVmFsdWUpOiBQcm9taXNlPHZvaWQ+O1xuICByZW1vdmUobjogTmFtZSk6IFByb21pc2U8dm9pZD47XG59XG5kZWNsYXJlIGludGVyZmFjZSBGb3JtSGFuZGxlciB7XG4gIHdyaXRlKGU6IEVsZW1lbnQsIHY6ID9WYWx1ZSk6IHZvaWQ7XG4gIHJlYWQoZTogRWxlbWVudCk6IFZhbHVlO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCaW5kZXIge1xuICB2OiBWYWx1ZXM7XG4gIHM6IFN0b3JhZ2VIYW5kbGVyO1xuICBmOiBGb3JtSGFuZGxlcjtcbiAgbG9jazogP1Byb21pc2U8bWl4ZWQ+O1xuXG4gIGNvbnN0cnVjdG9yKHM6IFN0b3JhZ2VIYW5kbGVyLCBmOiBGb3JtSGFuZGxlcikge1xuICAgIHRoaXMudiA9IG5ldyBNYXA7XG4gICAgdGhpcy5zID0gcztcbiAgICB0aGlzLmYgPSBmO1xuICAgIHRoaXMubG9jayA9IG51bGw7XG4gIH1cblxuICBhc3luYyBzeW5jKHRhcmdldHM6IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsICgpID0+IGRvU3luYyh0aGlzLCB0YXJnZXRzKSk7XG4gIH1cblxuICAvLy8gRm9yY2Ugd3JpdGUgZm9ybSB2YWx1ZXMgdG8gdGhlIHN0b3JhZ2VcbiAgYXN5bmMgc3VibWl0KHRhcmdldHM6IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsICgpID0+IFByb21pc2UuYWxsKHRhcmdldHMubWFwKGFzeW5jIChlKSA9PiB7XG4gICAgICBhd2FpdCBzdG9yZSh0aGlzLCBlKTtcbiAgICB9KSkpO1xuICB9XG5cbiAgLy8vIFN5bmMgb25seSBuZXcgZWxlbWVudHNcbiAgYXN5bmMgc2Nhbih0YXJnZXRzOiBBcnJheTxFbGVtZW50Pik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN5bmNCbG9jayh0aGlzLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBuZXdFbGVtZW50cyA9IHUuc3VidHJhY3RTZXQobmV3IFNldCh0YXJnZXRzKSwgbmV3IFNldCh0aGlzLnYua2V5cygpKSk7XG4gICAgICBhd2FpdCBkb1N5bmModGhpcywgQXJyYXkuZnJvbShuZXdFbGVtZW50cykpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8vIEludm9yayBpZiBhbiBlbGVtZW50IHdhcyByZW1vdmVkIGZyb20gYSBmb3JtLlxuICBhc3luYyByZW1vdmUoZWxlbWVudHM6IEFycmF5PEVsZW1lbnQ+KSB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsIGFzeW5jICgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgZSBvZiBlbGVtZW50cykgdGhpcy52LmRlbGV0ZShlKTtcbiAgICB9KTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBkb1N5bmMoc2VsZjogQmluZGVyLCB0YXJnZXRzOiBBcnJheTxFbGVtZW50Pikge1xuICBhd2FpdCBQcm9taXNlLmFsbCh0YXJnZXRzLm1hcChhc3luYyAoZSkgPT4ge1xuICAgIGF3YWl0IGxvYWQoc2VsZiwgZSk7XG4gICAgYXdhaXQgc3RvcmUoc2VsZiwgZSk7XG4gIH0pKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc3luY0Jsb2NrKHNlbGY6IEJpbmRlciwgZm46ICgpID0+IFByb21pc2U8bWl4ZWQ+KSB7XG4gIHdoaWxlIChzZWxmLmxvY2spIGF3YWl0IHNlbGYubG9jaztcbiAgc2VsZi5sb2NrID0gZm4oKTtcbiAgYXdhaXQgc2VsZi5sb2NrO1xuICBzZWxmLmxvY2sgPSBudWxsO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkKHNlbGY6IEJpbmRlciwgZWxlbTogRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBuZXdOID0gZWxlbS5uYW1lO1xuICBjb25zdCBuZXdWID0gYXdhaXQgc2VsZi5zLnJlYWQobmV3Tik7XG4gIGxldCBudjogP05hbWVWYWx1ZSA9IHNlbGYudi5nZXQoZWxlbSk7XG4gIGlmICghbnYpIHtcbiAgICBudiA9IHsgbmFtZTogZWxlbS5uYW1lLCB2YWx1ZTogbnVsbCB9O1xuICAgIHNlbGYudi5zZXQoZWxlbSwgbnYpO1xuICB9XG4gIGlmIChudi5uYW1lICE9PSBuZXdOIHx8IG52LnZhbHVlICE9PSBuZXdWKSB7XG4gICAgc2VsZi5mLndyaXRlKGVsZW0sIG5ld1YpO1xuICAgIG52Lm5hbWUgPSAgbmV3TjtcbiAgICBudi52YWx1ZSA9ICBuZXdWO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN0b3JlKHNlbGY6IEJpbmRlciwgZWxlbTogRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBuZXdOID0gZWxlbS5uYW1lO1xuICBjb25zdCBuZXdWID0gc2VsZi5mLnJlYWQoZWxlbSk7XG4gIGxldCBudjogP05hbWVWYWx1ZSA9IHNlbGYudi5nZXQoZWxlbSk7XG4gIGlmICghbnYpIHtcbiAgICBudiA9IHsgbmFtZTogZWxlbS5uYW1lLCB2YWx1ZTogbnVsbCB9O1xuICAgIHNlbGYudi5zZXQoZWxlbSwgbnYpO1xuICB9XG4gIGlmIChudi5uYW1lICE9PSBuZXdOIHx8IG52LnZhbHVlICE9PSBuZXdWKSB7XG4gICAgaWYgKG5ld1YgPT0gbnVsbCkge1xuICAgICAgYXdhaXQgc2VsZi5zLnJlbW92ZShuZXdOKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgc2VsZi5zLndyaXRlKG5ld04sIG5ld1YpO1xuICAgIH1cbiAgICBudi5uYW1lID0gIG5ld047XG4gICAgbnYudmFsdWUgPSAgbmV3VjtcbiAgfVxufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2JpbmRlci5qcyIsIi8vIEBmbG93XG5cbmltcG9ydCAqIGFzIHUgZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCAqIGFzIGFoIGZyb20gXCIuL2FyZWEtaGFuZGxlclwiO1xuaW1wb3J0IEJpbmRlciBmcm9tIFwiLi9iaW5kZXJcIjtcblxuZGVjbGFyZSB0eXBlIFZhbHVlID0gc3RyaW5nO1xuXG5pbnRlcmZhY2UgQXJlYVNlbGVjdCBleHRlbmRzIEhUTUxTZWxlY3RFbGVtZW50IHtcbiAgYXJlYTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgSW50ZXJuYWxBcmVhU2VsZWN0IGV4dGVuZHMgQXJlYVNlbGVjdCB7XG4gIGlzSW5pdExvYWQ6IGJvb2xlYW47XG4gIGJpbmRlcjogP0JpbmRlcjtcbn1cblxuY29uc3QgU1lOQ19JTlRFUlZBTCA9IDUwMDtcblxuZXhwb3J0IGZ1bmN0aW9uIG1peGluQXJlYVNlbGVjdDxUOiBIVE1MU2VsZWN0RWxlbWVudD4oYzogQ2xhc3M8VD4pOiBDbGFzczxUICYgQXJlYVNlbGVjdD4ge1xuICAvLyAkRmxvd0ZpeE1lIEZvcmNlIGNhc3QgdG8gdGhlIHJldHVybmVkIHR5cGUuXG4gIHJldHVybiBjbGFzcyBleHRlbmRzIGMge1xuICAgIGlzSW5pdExvYWQ6IGJvb2xlYW47XG4gICAgYmluZGVyOiA/QmluZGVyO1xuXG4gICAgZ2V0IGFyZWEoKTogYWguQXJlYSB7IHJldHVybiBnZXRBdHRyKHRoaXMsIFwiYXJlYVwiKTsgfVxuICAgIHNldCBhcmVhKHY6IGFueSkgeyBzZXRBdHRyKHRoaXMsIFwiYXJlYVwiLCB2KTsgfVxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgIHRoaXMuaXNJbml0TG9hZCA9IHRydWU7XG5cbiAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiBzeW5jKHRoaXMpKTtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwidW5sb2FkXCIsICgpID0+IHN5bmModGhpcykpO1xuXG4gICAgICAvLyBQZXJpb2RpY2FsIHN5bmNcbiAgICAgIC8vIFRvIG9ic2VydmUgc3RvcmFnZSBjaGFuZ2luZ3MgYW5kIGAudmFsdWVgIGNoYW5naW5ncyBieSBhbiBleHRlcm5hbCBqYXZhc2NyaXB0c1xuICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICBhd2FpdCB1LnNsZWVwKFNZTkNfSU5URVJWQUwpO1xuICAgICAgICAgIGF3YWl0IHN5bmModGhpcyk7XG4gICAgICAgICAgd3JpdGVBcmVhKHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9KSgpO1xuICAgIH1cblxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICBpZiAodGhpcy5sZW5ndGggPT09IDApIGFkZEFsbEhhbmRsZXJzKHRoaXMpO1xuICAgICAgaW5pdEJpbmRlcih0aGlzKTtcbiAgICAgIHdyaXRlQXJlYSh0aGlzKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImFyZWFcIl07IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhhdHRyTmFtZTogc3RyaW5nKSB7XG4gICAgICBzd2l0Y2ggKGF0dHJOYW1lKSB7XG4gICAgICBjYXNlIFwiYXJlYVwiOlxuICAgICAgICBpbml0QmluZGVyKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbmNvbnN0IG1peGVkU2VsZWN0ID0gbWl4aW5BcmVhU2VsZWN0KEhUTUxTZWxlY3RFbGVtZW50KTtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhUTUxBcmVhU2VsZWN0RWxlbWVudCBleHRlbmRzIG1peGVkU2VsZWN0IHtcbiAgc3RhdGljIGdldCBleHRlbmRzKCkgeyByZXR1cm4gXCJzZWxlY3RcIjsgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0QmluZGVyKHNlbGY6IEludGVybmFsQXJlYVNlbGVjdCk6IFByb21pc2U8dm9pZD4ge1xuICAvLyBBdm9pZCB0byBpbml0YWxpemUgdW50aWwgPG9wdGlvbj4gZWxlbWVudHMgYXJlIGFwcGVuZGVkXG4gIGlmIChzZWxmLm9wdGlvbnMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgc2VsZi5iaW5kZXIgPSBudWxsO1xuXG4gIGNvbnN0IGggPSBnZXRBcmVhSGFuZGxlcihzZWxmKTtcbiAgaWYgKCFoKSByZXR1cm47XG5cbiAgc2VsZi5iaW5kZXIgPSBuZXcgQmluZGVyKGgsIHsgd3JpdGU6IHdyaXRlU2VsZWN0LCByZWFkOiByZWFkU2VsZWN0IH0pO1xuXG4gIGlmIChzZWxmLmlzSW5pdExvYWQpIHtcbiAgICBzZWxmLmlzSW5pdExvYWQgPSBmYWxzZTtcbiAgICBhd2FpdCBzeW5jKHNlbGYpO1xuICB9IGVsc2Uge1xuICAgIGF3YWl0IHN1Ym1pdChzZWxmKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3cml0ZVNlbGVjdChzZWxmOiBhbnksIG5ld1ZhbHVlOiA/VmFsdWUpOiB2b2lkIHtcbiAgaWYgKHNlbGYudmFsdWUgPT09IG5ld1ZhbHVlKSByZXR1cm47XG4gIHNlbGYudmFsdWUgPSBuZXdWYWx1ZTtcbiAgd3JpdGVBcmVhKHNlbGYpO1xufVxuXG5mdW5jdGlvbiByZWFkU2VsZWN0KHNlbGY6IGFueSk6IFZhbHVlIHsgcmV0dXJuIHNlbGYudmFsdWU7IH1cblxuYXN5bmMgZnVuY3Rpb24gc3VibWl0KHNlbGY6IEludGVybmFsQXJlYVNlbGVjdCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnN1Ym1pdChbc2VsZl0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzeW5jKHNlbGY6IEludGVybmFsQXJlYVNlbGVjdCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnN5bmMoW3NlbGZdKTtcbn1cblxuZnVuY3Rpb24gd3JpdGVBcmVhKHNlbGY6IEludGVybmFsQXJlYVNlbGVjdCkge1xuICBjb25zdCBmb3JtID0gc2VsZi5mb3JtO1xuICBpZiAoZm9ybSA9PSBudWxsKSByZXR1cm47XG4gIGZvcm0uc2V0QXR0cmlidXRlKFwiYXJlYVwiLCBzZWxmLnZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZ2V0QXJlYUhhbmRsZXIoc2VsZjogSW50ZXJuYWxBcmVhU2VsZWN0KTogP2FoLkFyZWFIYW5kbGVyIHtcbiAgY29uc3QgYSA9IHNlbGYuYXJlYTtcbiAgaWYgKCFhKSB7XG4gICAgY29uc29sZS5kZWJ1ZyhcIlJlcXVpcmUgJ2FyZWEnIGF0dHJpYnV0ZVwiLCBzZWxmKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb25zdCBoID0gYWguZmluZEhhbmRsZXIoYSk7XG4gIGlmICghaCkge1xuICAgIGNvbnNvbGUuZGVidWcoXCJObyBzdWNoIGFyZWEgaGFuZGxlcjogYXJlYT0lcywgdGhpcz0lc1wiLCBzZWxmLmFyZWEsIHNlbGYpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBoO1xufVxuXG5mdW5jdGlvbiBhZGRBbGxIYW5kbGVycyhzZWxmOiBJbnRlcm5hbEFyZWFTZWxlY3QpIHtcbiAgZm9yIChjb25zdCBbYXJlYV0gb2YgYWgubGlzdEhhbmRsZXJzKCkpIHtcbiAgICBjb25zdCBvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIm9wdGlvblwiKTtcbiAgICBvLmlubmVySFRNTCA9IGFyZWE7XG4gICAgc2VsZi5hcHBlbmRDaGlsZChvKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRBdHRyKHNlbGY6IEhUTUxFbGVtZW50LCBuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB2ID0gc2VsZi5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gIHJldHVybiB2ID8gdiA6IFwiXCI7XG59XG5mdW5jdGlvbiBzZXRBdHRyKHNlbGY6IEhUTUxFbGVtZW50LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiA/c3RyaW5nKTogdm9pZCB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm47XG4gIHNlbGYuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9hcmVhLXNlbGVjdC5qcyIsIi8vIEBmbG93XG5cbmltcG9ydCAqIGFzIHUgZnJvbSBcIi4vdXRpbHNcIjtcblxuaW1wb3J0IEJpbmRlciBmcm9tIFwiLi9iaW5kZXJcIjtcbmltcG9ydCB0eXBlIHsgRWxlbWVudCB9IGZyb20gXCIuL2JpbmRlclwiO1xuXG5pbXBvcnQgKiBhcyBhaCBmcm9tIFwiLi9hcmVhLWhhbmRsZXJcIjtcbmltcG9ydCBBcmVhU2VsZWN0IGZyb20gXCIuL2FyZWEtc2VsZWN0XCI7XG5cbmRlY2xhcmUgdHlwZSBOYW1lID0gc3RyaW5nO1xuZGVjbGFyZSB0eXBlIFZhbHVlID0gc3RyaW5nO1xuXG5kZWNsYXJlIGludGVyZmFjZSBGb3JtQ29tcG9uZW50RWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgbmFtZTogTmFtZTtcbiAgdmFsdWU/OiBWYWx1ZTtcbiAgdHlwZT86IHN0cmluZztcbiAgY2hlY2tlZD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RvcmFnZUZvcm0gZXh0ZW5kcyBIVE1MRm9ybUVsZW1lbnQge1xuICBhdXRvc3luYzogbnVtYmVyO1xuICBhcmVhOiBzdHJpbmc7XG59XG5cbmRlY2xhcmUgaW50ZXJmYWNlIEludGVybmFsU3RvcmFnZUZvcm0gZXh0ZW5kcyBTdG9yYWdlRm9ybSB7XG4gIGlzSW5pdExvYWQ6IGJvb2xlYW47XG4gIGJpbmRlcjogP0JpbmRlcjtcbiAgY29tcG9uZW50T2JzZXJ2ZXJzOiBNYXA8Rm9ybUNvbXBvbmVudEVsZW1lbnQsIE11dGF0aW9uT2JzZXJ2ZXI+O1xufVxuXG5jb25zdCBERUZBVUxUX1NZTkNfSU5URVJWQUwgPSA3MDA7XG5cbmV4cG9ydCBmdW5jdGlvbiBtaXhpblN0b3JhZ2VGb3JtPFQ6IEhUTUxGb3JtRWxlbWVudD4oYzogQ2xhc3M8VD4pOiBDbGFzczxUICYgU3RvcmFnZUZvcm0+IHtcbiAgLy8gJEZsb3dGaXhNZSBGb3JjZSBjYXN0IHRvIHRoZSByZXR1cm5lZCB0eXBlLlxuICByZXR1cm4gY2xhc3MgZXh0ZW5kcyBjIHtcbiAgICBpc0luaXRMb2FkOiBib29sZWFuO1xuICAgIGJpbmRlcjogP0JpbmRlcjtcbiAgICBjb21wb25lbnRPYnNlcnZlcnM6IE1hcDxGb3JtQ29tcG9uZW50RWxlbWVudCwgTXV0YXRpb25PYnNlcnZlcj47XG5cbiAgICBnZXQgYXV0b3N5bmMoKTogbnVtYmVyIHtcbiAgICAgIGNvbnN0IG4gPSBwYXJzZUludChnZXRBdHRyKHRoaXMsIFwiYXV0b3N5bmNcIikpO1xuICAgICAgcmV0dXJuIG4gPiAwID8gbiA6IERFRkFVTFRfU1lOQ19JTlRFUlZBTDtcbiAgICB9XG4gICAgc2V0IGF1dG9zeW5jKHY6IGFueSkgeyBzZXRBdHRyKHRoaXMsIFwiYXV0b3N5bmNcIiwgdik7IH1cbiAgICBnZXQgYXJlYSgpOiBhaC5BcmVhIHsgcmV0dXJuIGdldEF0dHIodGhpcywgXCJhcmVhXCIpOyB9XG4gICAgc2V0IGFyZWEodjogYW55KSB7IHNldEF0dHIodGhpcywgXCJhcmVhXCIsIHYpOyB9XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgdGhpcy5pc0luaXRMb2FkID0gdHJ1ZTtcbiAgICAgIHRoaXMuY29tcG9uZW50T2JzZXJ2ZXJzID0gbmV3IE1hcCgpO1xuXG4gICAgICBpbml0QmluZGVyKHRoaXMpO1xuXG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHN1Ym1pdCh0aGlzKTtcbiAgICAgIH0pO1xuXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInVubG9hZFwiLCAoKSA9PiB7XG4gICAgICAgIGlmIChpc0F1dG9TeW5jRW5hYmxlZCh0aGlzKSkge1xuICAgICAgICAgIHN5bmModGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBuZXcgTXV0YXRpb25PYnNlcnZlcigocmVjb3JkcykgPT4ge1xuICAgICAgICBjb25zb2xlLmRlYnVnKFwic2NhbiBieSBmb3JtIE11dGF0aW9uT2JzZXJ2ZXI6IFwiLCB0aGlzKTtcbiAgICAgICAgc2Nhbih0aGlzKTtcblxuICAgICAgICBjb25zdCBhZGRlZDogQXJyYXk8SFRNTEVsZW1lbnQ+ID1cbiAgICAgICAgICAgICAgZmxhdHRlbihyZWNvcmRzLm1hcChyID0+IChyLmFkZGVkTm9kZXM6IEl0ZXJhYmxlPGFueT4pKSlcbiAgICAgICAgICAgICAgLmZpbHRlcigoZSkgPT4gZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KTtcbiAgICAgICAgaWYgKGFkZGVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGUgb2YgYWRkZWQpIHtcbiAgICAgICAgICAgIG9ic2VydmVDb21wb25lbnQodGhpcywgZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVtb3ZlZDogQXJyYXk8SFRNTEVsZW1lbnQ+ID1cbiAgICAgICAgICAgICAgZmxhdHRlbihyZWNvcmRzLm1hcCgocikgPT4gKHIucmVtb3ZlZE5vZGVzOiBJdGVyYWJsZTxhbnk+KSkpXG4gICAgICAgICAgICAgIC5maWx0ZXIoKGUpID0+IGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCk7XG4gICAgICAgIGlmIChyZW1vdmVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvLyBVc2UgXCJhbnlcIiB0byBmb3JjZSBjYXN0IHRvIEFycmF5PEZvcm1Db21wb25lbnRFbGVtZW50cz5cbiAgICAgICAgICByZW1vdmUodGhpcywgKHJlbW92ZWQuZmlsdGVyKChlKSA9PiAoZTogYW55KS5uYW1lKTogQXJyYXk8YW55PikpO1xuICAgICAgICAgIGZvciAoY29uc3QgZSBvZiByZW1vdmVkKSB7XG4gICAgICAgICAgICBkaXNjb25uZWN0Q29tcG9uZW50KHRoaXMsIGUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkub2JzZXJ2ZSh0aGlzLCB7IGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZSB9KTtcblxuICAgICAgc2Nhbih0aGlzKTtcblxuICAgICAgLy8gUGVyaW9kaWNhbCBzY2FuL3N5bmNcbiAgICAgIC8vIFRvIG9ic2VydmU6XG4gICAgICAvLyAgICogc3RvcmFnZSB2YWx1ZSBjaGFuZ2luZ3NcbiAgICAgIC8vICAgKiBleHRlcm5hbCBmb3JtIGNvbXBvbmVudHMgKHN1Y2ggYXMgYSA8aW5wdXQgZm9ybT1cIi4uLlwiIC4uLj4pXG4gICAgICAvLyAgICogZm9ybSB2YWx1ZSBjaGFuZ2luZ3MgYnkgYW4gZXh0ZXJuYWwgamF2YXNjcmlwdFxuICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICBhd2FpdCB1LnNsZWVwKHRoaXMuYXV0b3N5bmMpO1xuICAgICAgICAgIGlmIChpc0F1dG9TeW5jRW5hYmxlZCh0aGlzKSkge1xuICAgICAgICAgICAgYXdhaXQgc3luYyh0aGlzKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXdhaXQgc2Nhbih0aGlzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pKCk7XG4gICAgfVxuXG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgIHNjYW4odGhpcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICBcImF1dG9zeW5jXCIsXG4gICAgICAgIFwiYXJlYVwiLFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ck5hbWU6IHN0cmluZykge1xuICAgICAgc3dpdGNoIChhdHRyTmFtZSkge1xuICAgICAgY2FzZSBcImF1dG9zeW5jXCI6XG4gICAgICAgIGJyZWFrO1xuICAgICAgY2FzZSBcImFyZWFcIjpcbiAgICAgICAgaW5pdEJpbmRlcih0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9O1xufVxuXG5jb25zdCBtaXhlZEZvcm0gPSBtaXhpblN0b3JhZ2VGb3JtKEhUTUxGb3JtRWxlbWVudCk7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIVE1MU3RvcmFnZUZvcm1FbGVtZW50IGV4dGVuZHMgbWl4ZWRGb3JtIHtcbiAgc3RhdGljIGdldCBleHRlbmRzKCkgeyByZXR1cm4gXCJmb3JtXCI7IH1cblxuICBzdGF0aWMgcmVnaXN0ZXIoKSB7XG4gICAgLy8gQ3VzdG9tIEVsZW1lbnQgdjEgc2VlbXMgbm90IHRvIHdvcmtzIHJpZ2h0IHRvIGV4dGVuZCA8Zm9ybT4gaW4gR29vZ2xlIENocm9tZSA1NVxuICAgIC8vIFNlZSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vYS80MTQ1ODY5Mi8zODY0MzUxXG4gICAgLy8gUG9seWZpbGwgdG9vOiBodHRwczovL2dpdGh1Yi5jb20vd2ViY29tcG9uZW50cy9jdXN0b20tZWxlbWVudHMvdHJlZS9tYXN0ZXIvc3JjXG4gICAgLy8gPiBUbyBkbzogSW1wbGVtZW50IGJ1aWx0LWluIGVsZW1lbnQgZXh0ZW5zaW9uIChpcz0pXG4gICAgLy8gY3VzdG9tRWxlbWVudHMuZGVmaW5lKFwic3RvcmFnZS1mb3JtXCIsIFN0b3JhZ2VGb3JtRWxlbWVudCwgeyBleHRlbmRzOiBcImZvcm1cIiB9KTtcbiAgICAvLyB3aW5kb3cuU3RvcmFnZUZvcm1FbGVtZW50ID0gU3RvcmFnZUZvcm1FbGVtZW50O1xuXG4gICAgLy8gQ3VzdG9tIEVsZW1lbnQgdjBcbiAgICBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJzdG9yYWdlLWZvcm1cIiwgSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCk7XG4gICAgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwiYXJlYS1zZWxlY3RcIiwgQXJlYVNlbGVjdCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXNBdXRvU3luY0VuYWJsZWQoc2VsZjogSFRNTEZvcm1FbGVtZW50KTogYm9vbGVhbiB7XG4gIHJldHVybiBzZWxmLmhhc0F0dHJpYnV0ZShcImF1dG9zeW5jXCIpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzdWJtaXQoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnN1Ym1pdChlbGVtZW50cyhzZWxmKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN5bmMoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSwgdGFyZ2V0cz86IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZWxmLmJpbmRlcikgYXdhaXQgc2VsZi5iaW5kZXIuc3luYyh0YXJnZXRzID8gdGFyZ2V0cyA6IGVsZW1lbnRzKHNlbGYpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc2NhbihzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZWxmLmJpbmRlcikgYXdhaXQgc2VsZi5iaW5kZXIuc2NhbihlbGVtZW50cyhzZWxmKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlbW92ZShzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtLCBlbGVtczogQXJyYXk8RWxlbWVudD4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbGYuYmluZGVyKSBhd2FpdCBzZWxmLmJpbmRlci5yZW1vdmUoZWxlbXMpO1xufVxuXG5mdW5jdGlvbiBvYnNlcnZlQ29tcG9uZW50KHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0sIG5ld0VsZW1lbnQ6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGNvbnN0IGVsZW1lbnRzOiBBcnJheTxGb3JtQ29tcG9uZW50RWxlbWVudD4gPVxuICAgICAgICAvLyBmb3JjZSBjYXN0XG4gICAgICAgIChbbmV3RWxlbWVudCwgLi4uQXJyYXkuZnJvbShuZXdFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIqXCIpKV1cbiAgICAgICAgIC5maWx0ZXIoKGUpID0+IChlOiBhbnkpLnZhbHVlICE9IG51bGwgJiYgKGU6IGFueSkubmFtZSAhPSBudWxsKTogYW55KTtcblxuICBmb3IgKGNvbnN0IGUgb2YgZWxlbWVudHMpIHtcbiAgICBjb25zdCBvID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4gc3luYyhzZWxmLCBbZV0pKTtcbiAgICBvLm9ic2VydmUoZSwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBhdHJpYnV0ZUZpbHRlcjogW1wibmFtZVwiXSB9KTtcbiAgICBzZWxmLmNvbXBvbmVudE9ic2VydmVycy5zZXQoZSwgbyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZGlzY29ubmVjdENvbXBvbmVudChzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtLCBlbGVtZW50OiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBjb25zdCBlbGVtZW50cyA9IFtlbGVtZW50LCAuLi5BcnJheS5mcm9tKGVsZW1lbnQucXVlcnlTZWxlY3RvckFsbChcIipcIikpXTtcbiAgZm9yIChjb25zdCBlIG9mIGVsZW1lbnRzKSB7XG4gICAgY29uc3QgbyA9IHNlbGYuY29tcG9uZW50T2JzZXJ2ZXJzLmdldCgoZTogYW55KSk7XG4gICAgaWYgKG8gPT0gbnVsbCkgY29udGludWU7XG4gICAgc2VsZi5jb21wb25lbnRPYnNlcnZlcnMuZGVsZXRlKChlOiBhbnkpKTtcbiAgICBvLmRpc2Nvbm5lY3QoKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBlbGVtZW50cyhzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtKTogQXJyYXk8RWxlbWVudD4ge1xuICByZXR1cm4gQXJyYXkuZnJvbSgoKHNlbGYuZWxlbWVudHMpOiBJdGVyYWJsZTxhbnk+KSlcbiAgICAuZmlsdGVyKGUgPT4gZS5uYW1lKVxuICAgIC5maWx0ZXIoZSA9PiAhKGUgaW5zdGFuY2VvZiBBcmVhU2VsZWN0KSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRCaW5kZXIoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSk6IFByb21pc2U8dm9pZD4ge1xuICBzZWxmLmJpbmRlciA9IG51bGw7XG5cbiAgY29uc3QgaCA9IGdldEFyZWFIYW5kbGVyKHNlbGYpO1xuICBpZiAoIWgpIHJldHVybjtcblxuICBzZWxmLmJpbmRlciA9IG5ldyBCaW5kZXIoaCwgeyB3cml0ZTogd3JpdGVGb3JtLCByZWFkOiByZWFkRm9ybSB9KTtcbiAgaWYgKHNlbGYuaXNJbml0TG9hZCkge1xuICAgIHNlbGYuaXNJbml0TG9hZCA9IGZhbHNlO1xuICAgIGF3YWl0IHN5bmMoc2VsZik7XG4gIH0gZWxzZSB7XG4gICAgYXdhaXQgc3VibWl0KHNlbGYpO1xuICB9XG5cbiAgc2VsZi5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChcInN0b3JhZ2UtZm9ybS1pbml0XCIsIHsgZGV0YWlsOiB7IHRhcmdldDogc2VsZiB9fSkpO1xufVxuXG5mdW5jdGlvbiB3cml0ZUZvcm0oY29tcG9uZW50OiBhbnksIG5ld1ZhbHVlOiA/VmFsdWUpOiB2b2lkIHtcbiAgY29uc3QgdHlwZSA9IGNvbXBvbmVudC50eXBlO1xuICBpZiAodHlwZSA9PT0gXCJjaGVja2JveFwiIHx8IHR5cGUgPT09IFwicmFkaW9cIikge1xuICAgIGNvbXBvbmVudC5jaGVja2VkID0gbmV3VmFsdWUgPT09IGNvbXBvbmVudC52YWx1ZTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAobmV3VmFsdWUgPT0gbnVsbCB8fCBjb21wb25lbnQudmFsdWUgPT0gbnVsbClcbiAgICByZXR1cm47XG5cbiAgY29tcG9uZW50LnZhbHVlID0gbmV3VmFsdWU7XG59XG5cbmZ1bmN0aW9uIHJlYWRGb3JtKGNvbXBvbmVudDogYW55KTogVmFsdWUge1xuICBjb25zdCB0eXBlID0gY29tcG9uZW50LnR5cGU7XG4gIGlmICh0eXBlID09PSBcImNoZWNrYm94XCIgfHwgdHlwZSA9PT0gXCJyYWRpb1wiKSB7XG4gICAgaWYgKGNvbXBvbmVudC5jaGVja2VkKSB7XG4gICAgICByZXR1cm4gY29tcG9uZW50LnZhbHVlO1xuICAgIH1cbiAgICBjb25zdCB1bmNoZWNrZWRWYWx1ZSA9IGNvbXBvbmVudC5kYXRhc2V0LnVuY2hlY2tlZFZhbHVlO1xuICAgIGlmICh1bmNoZWNrZWRWYWx1ZSkge1xuICAgICAgcmV0dXJuIHVuY2hlY2tlZFZhbHVlO1xuICAgIH1cbiAgICByZXR1cm4gXCJcIjtcbiAgfVxuICByZXR1cm4gY29tcG9uZW50LnZhbHVlO1xufVxuXG5mdW5jdGlvbiBnZXRBcmVhSGFuZGxlcihzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtKTogP2FoLkFyZWFIYW5kbGVyIHtcbiAgY29uc3QgYSA9IHNlbGYuYXJlYTtcbiAgaWYgKCFhKSB7XG4gICAgY29uc29sZS5kZWJ1ZyhcIlJlcXVpcmUgJ2FyZWEnIGF0dHJpYnV0ZVwiLCBzZWxmKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb25zdCBoID0gYWguZmluZEhhbmRsZXIoYSk7XG4gIGlmICghaCkge1xuICAgIGNvbnNvbGUuZGVidWcoXCJObyBzdWNoIGFyZWEgaGFuZGxlcjogYXJlYT0lcywgdGhpcz0lb1wiLCBzZWxmLmFyZWEsIHNlbGYpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBoO1xufVxuXG5mdW5jdGlvbiBnZXRBdHRyKHNlbGY6IEhUTUxFbGVtZW50LCBuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB2ID0gc2VsZi5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gIHJldHVybiB2ID8gdiA6IFwiXCI7XG59XG5mdW5jdGlvbiBzZXRBdHRyKHNlbGY6IEhUTUxFbGVtZW50LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiA/c3RyaW5nKTogdm9pZCB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm47XG4gIHNlbGYuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZmxhdHRlbjxUPihpdGVyaXRlcjogSXRlcmFibGU8SXRlcmFibGU8VD4+KTogQXJyYXk8VD4ge1xuICByZXR1cm4gQXJyYXkuZnJvbSgoZnVuY3Rpb24qICgpIHtcbiAgICBmb3IgKGNvbnN0IGl0ZXIgb2YgaXRlcml0ZXIpIGZvciAoY29uc3QgdCBvZiBpdGVyKSB5aWVsZCB0O1xuICB9KSgpKTtcbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9zdG9yYWdlLWZvcm0uanMiXSwic291cmNlUm9vdCI6IiJ9