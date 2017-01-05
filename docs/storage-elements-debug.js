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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMmVmMjNjMDg0Yzc0ODFjZmUxYTAiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0b3JhZ2UtZWxlbWVudHMtcmVnaXN0ZXJlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FyZWEtaGFuZGxlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYmluZGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9hcmVhLXNlbGVjdC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc3RvcmFnZS1mb3JtLmpzIl0sIm5hbWVzIjpbInJlZ2lzdGVyIiwic2xlZXAiLCJkZWR1cCIsInN1YnRyYWN0U2V0IiwiQ2FuY2VsbGFibGVQcm9taXNlIiwiUHJvbWlzZSIsImNvbnN0cnVjdG9yIiwiY2FsbGJhY2siLCJjYW5jZWxsIiwiY2FuY2VsbEZ1bmN0aW9uIiwibXNlYyIsInRpbWVvdXRJZCIsInJlc29sdmUiLCJzZXRUaW1lb3V0IiwiY2xlYXJUaW1lb3V0IiwiYXJyYXkiLCJwcmVkaWNhdGUiLCJ0IiwibyIsInJlZHVjZSIsInJlc3VsdCIsImVsZW1lbnQiLCJzb21lIiwiaSIsImNvbmNhdCIsInRhcmdldFNldCIsInJlbW92ZWRTZXQiLCJTZXQiLCJBcnJheSIsImZyb20iLCJmaWx0ZXIiLCJlIiwiaGFzIiwiTXVsdGlWYWx1ZU1hcCIsIk1hcCIsImZsYXR0ZW5WYWx1ZXMiLCJ2YWx1ZXMiLCJhcnIiLCJ2IiwiQXJyYXlWYWx1ZU1hcCIsImFkZCIsImtleSIsInZhbHVlIiwiYSIsImdldCIsInNldCIsInB1c2giLCJTZXRWYWx1ZU1hcCIsInJlZ2lzdGVySGFuZGxlciIsImZpbmRIYW5kbGVyIiwibGlzdEhhbmRsZXJzIiwiaGFuZGxlcnMiLCJhcmVhIiwiaGFuZGxlciIsIkVycm9yIiwiT2JqZWN0IiwiZW50cmllcyIsIldlYlN0b3JhZ2VBcmVhSGFuZGxlciIsInN0b3JhZ2UiLCJyZWFkIiwibmFtZSIsImdldEl0ZW0iLCJ3cml0ZSIsIm5ld1ZhbHVlIiwic2V0SXRlbSIsInJlbW92ZSIsInJlbW92ZUl0ZW0iLCJsb2NhbFN0b3JhZ2UiLCJzZXNzaW9uU3RvcmFnZSIsIkNocm9tZVN0b3JhZ2VBcmVhSGFuZGxlciIsImNocm9tZSIsImxvY2FsIiwic3luYyIsInNlbGYiLCJ0YXJnZXRzIiwiYWxsIiwibWFwIiwibG9hZCIsInN0b3JlIiwiZG9TeW5jIiwiZm4iLCJsb2NrIiwic3luY0Jsb2NrIiwiZWxlbSIsIm5ld04iLCJuZXdWIiwicyIsIm52IiwiZiIsImZhbGxiYWNrSWZOdWxsIiwiZ2V0VmFsdWVCeU5hbWUiLCJ1IiwiQmluZGVyIiwic3VibWl0Iiwic2NhbiIsIm5ld0VsZW1lbnRzIiwia2V5cyIsImVsZW1lbnRzIiwiZGVsZXRlIiwiZm5zIiwib3B0aW9ucyIsImxlbmd0aCIsImJpbmRlciIsImgiLCJnZXRBcmVhSGFuZGxlciIsIndyaXRlU2VsZWN0IiwicmVhZFNlbGVjdCIsImlzSW5pdExvYWQiLCJpbml0QmluZGVyIiwibWl4aW5BcmVhU2VsZWN0IiwiYWgiLCJTWU5DX0lOVEVSVkFMIiwiYyIsImdldEF0dHIiLCJzZXRBdHRyIiwiY3JlYXRlZENhbGxiYWNrIiwiYWRkRXZlbnRMaXN0ZW5lciIsIndpbmRvdyIsIndyaXRlQXJlYSIsImF0dGFjaGVkQ2FsbGJhY2siLCJhZGRBbGxIYW5kbGVycyIsIm9ic2VydmVkQXR0cmlidXRlcyIsImF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayIsImF0dHJOYW1lIiwibWl4ZWRTZWxlY3QiLCJIVE1MU2VsZWN0RWxlbWVudCIsIkhUTUxBcmVhU2VsZWN0RWxlbWVudCIsImV4dGVuZHMiLCJmb3JtIiwic2V0QXR0cmlidXRlIiwiY29uc29sZSIsImVycm9yIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwiYXBwZW5kQ2hpbGQiLCJnZXRBdHRyaWJ1dGUiLCJlbGVtcyIsIndyaXRlRm9ybSIsInJlYWRGb3JtIiwibWl4aW5TdG9yYWdlRm9ybSIsIkRFRkFVTFRfU1lOQ19JTlRFUlZBTCIsImF1dG9zeW5jIiwibiIsInBhcnNlSW50IiwiY29tcG9uZW50T2JzZXJ2ZXJzIiwiZXZlbnQiLCJwcmV2ZW50RGVmYXVsdCIsImlzQXV0b1N5bmNFbmFibGVkIiwiTXV0YXRpb25PYnNlcnZlciIsInJlY29yZHMiLCJkZWJ1ZyIsImFkZGVkIiwiZmxhdHRlbiIsInIiLCJhZGRlZE5vZGVzIiwiSFRNTEVsZW1lbnQiLCJvYnNlcnZlQ29tcG9uZW50IiwicmVtb3ZlZCIsInJlbW92ZWROb2RlcyIsImRpc2Nvbm5lY3RDb21wb25lbnQiLCJvYnNlcnZlIiwiY2hpbGRMaXN0Iiwic3VidHJlZSIsIm1peGVkRm9ybSIsIkhUTUxGb3JtRWxlbWVudCIsIkhUTUxTdG9yYWdlRm9ybUVsZW1lbnQiLCJyZWdpc3RlckVsZW1lbnQiLCJoYXNBdHRyaWJ1dGUiLCJuZXdFbGVtZW50IiwicXVlcnlTZWxlY3RvckFsbCIsImF0dHJpYnV0ZXMiLCJhdHJpYnV0ZUZpbHRlciIsImRpc2Nvbm5lY3QiLCJjb21wb25lbnQiLCJ0eXBlIiwiY2hlY2tlZCIsIml0ZXJpdGVyIiwiaXRlciJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7OztBQ3RDQTs7Ozs7O0FBRUEsdUJBQW1CQSxRQUFuQixHOzs7Ozs7Ozs7U0NnQmdCQyxLLEdBQUFBLEs7U0FZQUMsSyxHQUFBQSxLO1NBUUFDLFcsR0FBQUEsVztBQXRDVCxPQUFNQyxrQkFBTixTQUFvQ0MsT0FBcEMsQ0FBK0M7QUFFcERDLGVBQ0VDLFFBREYsRUFLRUMsT0FMRixFQU1FO0FBQ0EsV0FBTUQsUUFBTjtBQUNBLFVBQUtFLGVBQUwsR0FBdUJELE9B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O0FBQ0EsWUFBTyxJQUFQO0FBQ0Q7QUFDRCxVQUFPbUQsQ0FBUDtBQUNEOztBQUVELFVBQVNVLE9BQVQsQ0FBaUJ4QyxJQUFqQixFQUFvQ2IsSUFBcEMsRUFBMEQ7QUFDeEQsT0FBTXRCLElBQUltQyxLQUFLK0QsWUFBTCxDQUFrQjVFLElBQWxCLENBQVY7QUFDQSxVQUFPdEIsSUFBSUEsQ0FBSixHQUFRLEVBQWY7QUFDRDtBQUNELFVBQVM0RSxPQUFULENBQWlCekMsSUFBakIsRUFBb0NiLElBQXBDLEVBQWtEbEIsS0FBbEQsRUFBd0U7QUFDdEUsT0FBSUEsU0FBUyxJQUFiLEVBQW1CO0FBQ25CK0IsUUFBS3dELFlBQUwsQ0FBa0JyRSxJQUFsQixFQUF3QmxCLEtBQXhCO0FBQ0Q7O0FBRUQsVUFBUytHLE9BQVQsQ0FBb0J3QixRQUFwQixFQUErRDtBQUM3RCxVQUFPckosTUFBTUMsSUFBTixDQUFZLGFBQWE7QUFDOUIsMkJBQW1Cb0osUUFBbkI7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLFdBQVdDLElBQVg7QUFBNkIsNkJBQWdCQSxJQUFoQjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUEsYUFBV2pLLENBQVg7QUFBc0IsZUFBTUEsQ0FBTjtBQUF0QjtBQUE3QjtBQUNELElBRmlCLEVBQVgsQ0FBUDtBQUdELEUiLCJmaWxlIjoic3RvcmFnZS1lbGVtZW50cy1kZWJ1Zy5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHdlYnBhY2svYm9vdHN0cmFwIDJlZjIzYzA4NGM3NDgxY2ZlMWEwIiwiaW1wb3J0IFN0b3JhZ2VGb3JtRWxlbWVudCBmcm9tIFwiLi9zdG9yYWdlLWZvcm1cIjtcblxuU3RvcmFnZUZvcm1FbGVtZW50LnJlZ2lzdGVyKCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvc3RvcmFnZS1lbGVtZW50cy1yZWdpc3RlcmVyLmpzIiwiZXhwb3J0IGNsYXNzIENhbmNlbGxhYmxlUHJvbWlzZTxSPiBleHRlbmRzIFByb21pc2U8Uj4ge1xuICBjYW5jZWxsRnVuY3Rpb246ICgpID0+IHZvaWQ7XG4gIGNvbnN0cnVjdG9yKFxuICAgIGNhbGxiYWNrOiAoXG4gICAgICByZXNvbHZlOiAocmVzdWx0OiBQcm9taXNlPFI+IHwgUikgPT4gdm9pZCxcbiAgICAgIHJlamVjdDogKGVycm9yOiBhbnkpID0+IHZvaWRcbiAgICApID0+IG1peGVkLFxuICAgIGNhbmNlbGw6ICgpID0+IHZvaWRcbiAgKSB7XG4gICAgc3VwZXIoY2FsbGJhY2spO1xuICAgIHRoaXMuY2FuY2VsbEZ1bmN0aW9uID0gY2FuY2VsbDtcbiAgfVxuXG4gIGNhbmNlbGwoKSB7XG4gICAgdGhpcy5jYW5jZWxsRnVuY3Rpb24oKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2xlZXAobXNlYzogbnVtYmVyKTogQ2FuY2VsbGFibGVQcm9taXNlPHZvaWQ+IHtcbiAgbGV0IHRpbWVvdXRJZDogP251bWJlcjtcbiAgcmV0dXJuIG5ldyBDYW5jZWxsYWJsZVByb21pc2UoXG4gICAgKHJlc29sdmUpID0+IHtcbiAgICAgIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZSgpLCBtc2VjKTtcbiAgICB9LFxuICAgICgpID0+IHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgIH1cbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZHVwPFQ+KGFycmF5OiBBcnJheTxUPixcbiAgICAgICAgICAgICAgICAgICAgICAgICBwcmVkaWNhdGU/OiAodDogVCwgbzogVCkgPT4gYm9vbGVhbiA9ICh0LCBvKSA9PiB0ID09PSBvKTogQXJyYXk8VD4ge1xuICByZXR1cm4gYXJyYXkucmVkdWNlKChyZXN1bHQ6IEFycmF5PFQ+LCBlbGVtZW50KSA9PiB7XG4gICAgaWYgKHJlc3VsdC5zb21lKChpKSA9PiBwcmVkaWNhdGUoaSwgZWxlbWVudCkpKSByZXN1bHQ7XG4gICAgcmV0dXJuIHJlc3VsdC5jb25jYXQoZWxlbWVudCk7XG4gIH0sW10pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3VidHJhY3RTZXQ8VD4odGFyZ2V0U2V0OiBTZXQ8VD4sIHJlbW92ZWRTZXQ6IFNldDxUPik6IFNldDxUPiB7XG4gIHJldHVybiBuZXcgU2V0KEFycmF5LmZyb20odGFyZ2V0U2V0KS5maWx0ZXIoKGUpID0+ICFyZW1vdmVkU2V0LmhhcyhlKSkpO1xufVxuXG5jbGFzcyBNdWx0aVZhbHVlTWFwPEssIFYsIEk6IEl0ZXJhYmxlPFY+PiBleHRlbmRzIE1hcDxLLCBJPiB7XG4gICogZmxhdHRlblZhbHVlcygpOiBJdGVyYXRvcjxWPiB7XG4gICAgZm9yIChjb25zdCBhcnIgb2YgdGhpcy52YWx1ZXMoKSkge1xuICAgICAgZm9yIChjb25zdCB2IG9mIGFycikge1xuICAgICAgICB5aWVsZCB2O1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQXJyYXlWYWx1ZU1hcDxLLCBWPiBleHRlbmRzIE11bHRpVmFsdWVNYXA8SywgViwgQXJyYXk8Vj4+IHtcbiAgYWRkKGtleTogSywgdmFsdWU6IFYpOiB0aGlzIHtcbiAgICBsZXQgYSA9IHRoaXMuZ2V0KGtleSk7XG4gICAgaWYgKCFhKSB7XG4gICAgICBhID0gW107XG4gICAgICB0aGlzLnNldChrZXksIGEpO1xuICAgIH1cbiAgICBhLnB1c2godmFsdWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTZXRWYWx1ZU1hcDxLLCBWPiBleHRlbmRzIE11bHRpVmFsdWVNYXA8SywgViwgU2V0PFY+PiB7XG4gIGFkZChrZXk6IEssIHZhbHVlOiBWKTogdGhpcyB7XG4gICAgbGV0IGEgPSB0aGlzLmdldChrZXkpO1xuICAgIGlmICghYSkge1xuICAgICAgYSA9IG5ldyBTZXQoKTtcbiAgICAgIHRoaXMuc2V0KGtleSwgYSk7XG4gICAgfVxuICAgIGEuYWRkKHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3V0aWxzLmpzIiwiLyogZ2xvYmFsIGNocm9tZSAqL1xuXG5leHBvcnQgdHlwZSBBcmVhID0gc3RyaW5nO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFyZWFIYW5kbGVyIHtcbiAgcmVhZChuYW1lOiBzdHJpbmcpOiBQcm9taXNlPD9zdHJpbmc+O1xuICB3cml0ZShuYW1lOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xuICByZW1vdmUobmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcbn1cblxuY29uc3QgaGFuZGxlcnM6IHsgW2FyZWE6IEFyZWFdOiBBcmVhSGFuZGxlciB9ID0ge307XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckhhbmRsZXIoYXJlYTogQXJlYSwgaGFuZGxlcjogQXJlYUhhbmRsZXIpOiB2b2lkIHtcbiAgaWYgKGhhbmRsZXJzW2FyZWFdKSB7XG4gICAgdGhyb3cgRXJyb3IoYEFscmVhZHkgcmVnaXN0ZXJlZCBoYW5kbGVyIGZvciBcIiR7YXJlYX1cImApO1xuICB9XG4gIGhhbmRsZXJzW2FyZWFdID0gaGFuZGxlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRIYW5kbGVyKGFyZWE6IEFyZWEpOiA/QXJlYUhhbmRsZXIge1xuICByZXR1cm4gaGFuZGxlcnNbYXJlYV07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBsaXN0SGFuZGxlcnMoKTogQXJyYXk8W0FyZWEsIEFyZWFIYW5kbGVyXT4ge1xuICByZXR1cm4gT2JqZWN0LmVudHJpZXMoaGFuZGxlcnMpO1xufVxuXG4vL1xuXG5leHBvcnQgY2xhc3MgV2ViU3RvcmFnZUFyZWFIYW5kbGVyIHtcbiAgc3RvcmFnZTogU3RvcmFnZTtcblxuICBjb25zdHJ1Y3RvcihzdG9yYWdlOiBTdG9yYWdlKSB7XG4gICAgdGhpcy5zdG9yYWdlID0gc3RvcmFnZTtcbiAgfVxuXG4gIHJlYWQobmFtZTogc3RyaW5nKTogUHJvbWlzZTw/c3RyaW5nPiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLnN0b3JhZ2UuZ2V0SXRlbShuYW1lKSk7XG4gIH1cblxuICB3cml0ZShuYW1lOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnN0b3JhZ2Uuc2V0SXRlbShuYW1lLCBuZXdWYWx1ZSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgcmVtb3ZlKG5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc3RvcmFnZS5yZW1vdmVJdGVtKG5hbWUpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxufVxuXG5pZiAobG9jYWxTdG9yYWdlKVxuICByZWdpc3RlckhhbmRsZXIoXCJsb2NhbC1zdG9yYWdlXCIsIG5ldyBXZWJTdG9yYWdlQXJlYUhhbmRsZXIobG9jYWxTdG9yYWdlKSk7XG5pZiAoc2Vzc2lvblN0b3JhZ2UpXG4gIHJlZ2lzdGVySGFuZGxlcihcInNlc3Npb24tc3RvcmFnZVwiLCBuZXcgV2ViU3RvcmFnZUFyZWFIYW5kbGVyKHNlc3Npb25TdG9yYWdlKSk7XG5cbi8vXG5cbmV4cG9ydCBjbGFzcyBDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIge1xuICBzdG9yYWdlOiBDaHJvbWVTdG9yYWdlQXJlYTtcblxuICBjb25zdHJ1Y3RvcihzdG9yYWdlOiBDaHJvbWVTdG9yYWdlQXJlYSkge1xuICAgIHRoaXMuc3RvcmFnZSA9IHN0b3JhZ2U7XG4gIH1cblxuICByZWFkKG5hbWU6IHN0cmluZyk6IFByb21pc2U8P3N0cmluZz4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gdGhpcy5zdG9yYWdlLmdldChuYW1lLCAodikgPT4gcmVzb2x2ZSh2W25hbWVdKSkpO1xuICB9XG5cbiAgd3JpdGUobmFtZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB0aGlzLnN0b3JhZ2Uuc2V0KHsgW25hbWVdOiBuZXdWYWx1ZSB9LCByZXNvbHZlKSk7XG4gIH1cblxuICByZW1vdmUobmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB0aGlzLnN0b3JhZ2UucmVtb3ZlKG5hbWUsIHJlc29sdmUpKTtcbiAgfVxufVxuXG5pZiAoY2hyb21lICYmIGNocm9tZS5zdG9yYWdlKSB7XG4gIGlmIChjaHJvbWUuc3RvcmFnZS5sb2NhbClcbiAgICByZWdpc3RlckhhbmRsZXIoXCJjaHJvbWUtbG9jYWxcIiwgbmV3IENocm9tZVN0b3JhZ2VBcmVhSGFuZGxlcihjaHJvbWUuc3RvcmFnZS5sb2NhbCkpO1xuICBpZiAoY2hyb21lLnN0b3JhZ2Uuc3luYylcbiAgICByZWdpc3RlckhhbmRsZXIoXCJjaHJvbWUtc3luY1wiLCBuZXcgQ2hyb21lU3RvcmFnZUFyZWFIYW5kbGVyKGNocm9tZS5zdG9yYWdlLnN5bmMpKTtcbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9hcmVhLWhhbmRsZXIuanMiLCJpbXBvcnQgKiBhcyB1IGZyb20gXCIuL3V0aWxzXCI7XG5cbmRlY2xhcmUgdHlwZSBOYW1lID0gc3RyaW5nO1xuZGVjbGFyZSB0eXBlIFZhbHVlID0gc3RyaW5nO1xuZGVjbGFyZSB0eXBlIE5hbWVWYWx1ZSA9IHsgbmFtZTogTmFtZSwgdmFsdWU6ID9WYWx1ZSB9O1xuZGVjbGFyZSB0eXBlIFZhbHVlcyA9IE1hcDxFbGVtZW50LCBOYW1lVmFsdWU+O1xuZXhwb3J0IGludGVyZmFjZSBFbGVtZW50IHtcbiAgbmFtZTogTmFtZTtcbn1cbmRlY2xhcmUgaW50ZXJmYWNlIFN0b3JhZ2VIYW5kbGVyIHtcbiAgcmVhZChuOiBOYW1lKTogUHJvbWlzZTw/VmFsdWU+O1xuICB3cml0ZShuOiBOYW1lLCB2OiBWYWx1ZSk6IFByb21pc2U8dm9pZD47XG4gIHJlbW92ZShuOiBOYW1lKTogUHJvbWlzZTx2b2lkPjtcbn1cbmRlY2xhcmUgaW50ZXJmYWNlIEZvcm1IYW5kbGVyIHtcbiAgd3JpdGUoZTogRWxlbWVudCwgdjogP1ZhbHVlKTogdm9pZDtcbiAgcmVhZChlOiBFbGVtZW50KTogP1ZhbHVlO1xufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBCaW5kZXIge1xuICB2OiBWYWx1ZXM7XG4gIHM6IFN0b3JhZ2VIYW5kbGVyO1xuICBmOiBGb3JtSGFuZGxlcjtcbiAgbG9jazogP1Byb21pc2U8bWl4ZWQ+O1xuXG4gIGNvbnN0cnVjdG9yKHM6IFN0b3JhZ2VIYW5kbGVyLCBmOiBGb3JtSGFuZGxlcikge1xuICAgIHRoaXMudiA9IG5ldyBNYXA7XG4gICAgdGhpcy5zID0gcztcbiAgICB0aGlzLmYgPSBmO1xuICAgIHRoaXMubG9jayA9IG51bGw7XG4gIH1cblxuICBhc3luYyBzeW5jKHRhcmdldHM6IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsICgpID0+IGRvU3luYyh0aGlzLCB0YXJnZXRzKSk7XG4gIH1cblxuICAvLy8gRm9yY2Ugd3JpdGUgZm9ybSB2YWx1ZXMgdG8gdGhlIHN0b3JhZ2VcbiAgYXN5bmMgc3VibWl0KHRhcmdldHM6IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsICgpID0+IFByb21pc2UuYWxsKHRhcmdldHMubWFwKGFzeW5jIChlKSA9PiB7XG4gICAgICBhd2FpdCBzdG9yZSh0aGlzLCBlKTtcbiAgICB9KSkpO1xuICB9XG5cbiAgLy8vIFN5bmMgb25seSBuZXcgZWxlbWVudHNcbiAgYXN5bmMgc2Nhbih0YXJnZXRzOiBBcnJheTxFbGVtZW50Pik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN5bmNCbG9jayh0aGlzLCBhc3luYyAoKSA9PiB7XG4gICAgICBjb25zdCBuZXdFbGVtZW50cyA9IHUuc3VidHJhY3RTZXQobmV3IFNldCh0YXJnZXRzKSwgbmV3IFNldCh0aGlzLnYua2V5cygpKSk7XG4gICAgICBhd2FpdCBkb1N5bmModGhpcywgQXJyYXkuZnJvbShuZXdFbGVtZW50cykpO1xuICAgIH0pO1xuICB9XG5cbiAgLy8vIEludm9yayBpZiBhbiBlbGVtZW50IHdhcyByZW1vdmVkIGZyb20gYSBmb3JtLlxuICBhc3luYyByZW1vdmUoZWxlbWVudHM6IEFycmF5PEVsZW1lbnQ+KSB7XG4gICAgYXdhaXQgc3luY0Jsb2NrKHRoaXMsIGFzeW5jICgpID0+IHtcbiAgICAgIGZvciAoY29uc3QgZSBvZiBlbGVtZW50cykgdGhpcy52LmRlbGV0ZShlKTtcbiAgICB9KTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBkb1N5bmMoc2VsZjogQmluZGVyLCB0YXJnZXRzOiBBcnJheTxFbGVtZW50Pikge1xuICBhd2FpdCBQcm9taXNlLmFsbCh0YXJnZXRzLm1hcChhc3luYyAoZSkgPT4ge1xuICAgIGF3YWl0IGxvYWQoc2VsZiwgZSk7XG4gICAgYXdhaXQgc3RvcmUoc2VsZiwgZSk7XG4gIH0pKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc3luY0Jsb2NrKHNlbGY6IEJpbmRlciwgZm46ICgpID0+IFByb21pc2U8bWl4ZWQ+KSB7XG4gIHdoaWxlIChzZWxmLmxvY2spIGF3YWl0IHNlbGYubG9jaztcbiAgc2VsZi5sb2NrID0gZm4oKTtcbiAgYXdhaXQgc2VsZi5sb2NrO1xuICBzZWxmLmxvY2sgPSBudWxsO1xufVxuXG5hc3luYyBmdW5jdGlvbiBsb2FkKHNlbGY6IEJpbmRlciwgZWxlbTogRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBuZXdOID0gZWxlbS5uYW1lO1xuICBjb25zdCBuZXdWID0gYXdhaXQgc2VsZi5zLnJlYWQobmV3Tik7XG4gIGxldCBudjogP05hbWVWYWx1ZSA9IHNlbGYudi5nZXQoZWxlbSk7XG4gIGlmICghbnYpIHtcbiAgICBudiA9IHsgbmFtZTogZWxlbS5uYW1lLCB2YWx1ZTogbnVsbCB9O1xuICAgIHNlbGYudi5zZXQoZWxlbSwgbnYpO1xuICB9XG4gIGlmIChudi5uYW1lICE9PSBuZXdOIHx8IG52LnZhbHVlICE9PSBuZXdWKSB7XG4gICAgc2VsZi5mLndyaXRlKGVsZW0sIG5ld1YpO1xuICAgIG52Lm5hbWUgPSAgbmV3TjtcbiAgICBudi52YWx1ZSA9ICBuZXdWO1xuICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN0b3JlKHNlbGY6IEJpbmRlciwgZWxlbTogRWxlbWVudCk6IFByb21pc2U8dm9pZD4ge1xuICBjb25zdCBuZXdOID0gZWxlbS5uYW1lO1xuICBjb25zdCBuZXdWID0gZmFsbGJhY2tJZk51bGwoKCkgPT4gc2VsZi5mLnJlYWQoZWxlbSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoKSA9PiBnZXRWYWx1ZUJ5TmFtZShzZWxmLCBuZXdOKSk7XG4gIGxldCBudjogP05hbWVWYWx1ZSA9IHNlbGYudi5nZXQoZWxlbSk7XG4gIGlmICghbnYpIHtcbiAgICBudiA9IHsgbmFtZTogZWxlbS5uYW1lLCB2YWx1ZTogbnVsbCB9O1xuICAgIHNlbGYudi5zZXQoZWxlbSwgbnYpO1xuICB9XG4gIGlmIChudi5uYW1lICE9PSBuZXdOIHx8IG52LnZhbHVlICE9PSBuZXdWKSB7XG4gICAgaWYgKG5ld1YgPT0gbnVsbCkge1xuICAgICAgYXdhaXQgc2VsZi5zLnJlbW92ZShuZXdOKTtcbiAgICB9IGVsc2Uge1xuICAgICAgYXdhaXQgc2VsZi5zLndyaXRlKG5ld04sIG5ld1YpO1xuICAgIH1cbiAgICBudi5uYW1lID0gIG5ld047XG4gICAgbnYudmFsdWUgPSAgbmV3VjtcbiAgfVxufVxuXG5mdW5jdGlvbiBmYWxsYmFja0lmTnVsbDxUPiguLi5mbnM6IEFycmF5PCgpID0+IFQ+KTogP1Qge1xuICBmb3IgKGNvbnN0IGZuIG9mIGZucykge1xuICAgIGNvbnN0IHYgPSBmbigpO1xuICAgIGlmICh2ICE9IG51bGwpIHJldHVybiB2O1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBnZXRWYWx1ZUJ5TmFtZShzZWxmOiBCaW5kZXIsIG5hbWU6IE5hbWUpOiA/VmFsdWUge1xuICBmb3IgKGNvbnN0IG52IG9mIHNlbGYudi52YWx1ZXMoKSkge1xuICAgIGlmIChudi5uYW1lID09PSBuYW1lKSByZXR1cm4gbnYudmFsdWU7XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvYmluZGVyLmpzIiwiaW1wb3J0ICogYXMgdSBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0ICogYXMgYWggZnJvbSBcIi4vYXJlYS1oYW5kbGVyXCI7XG5pbXBvcnQgQmluZGVyIGZyb20gXCIuL2JpbmRlclwiO1xuXG5kZWNsYXJlIHR5cGUgVmFsdWUgPSBzdHJpbmc7XG5cbmludGVyZmFjZSBBcmVhU2VsZWN0IGV4dGVuZHMgSFRNTFNlbGVjdEVsZW1lbnQge1xuICBhcmVhOiBzdHJpbmc7XG59XG5cbmludGVyZmFjZSBJbnRlcm5hbEFyZWFTZWxlY3QgZXh0ZW5kcyBBcmVhU2VsZWN0IHtcbiAgaXNJbml0TG9hZDogYm9vbGVhbjtcbiAgYmluZGVyOiA/QmluZGVyO1xufVxuXG5jb25zdCBTWU5DX0lOVEVSVkFMID0gNTAwO1xuXG5leHBvcnQgZnVuY3Rpb24gbWl4aW5BcmVhU2VsZWN0PFQ6IEhUTUxTZWxlY3RFbGVtZW50PihjOiBDbGFzczxUPik6IENsYXNzPFQgJiBBcmVhU2VsZWN0PiB7XG4gIC8vICRGbG93Rml4TWUgRm9yY2UgY2FzdCB0byB0aGUgcmV0dXJuZWQgdHlwZS5cbiAgcmV0dXJuIGNsYXNzIGV4dGVuZHMgYyB7XG4gICAgaXNJbml0TG9hZDogYm9vbGVhbjtcbiAgICBiaW5kZXI6ID9CaW5kZXI7XG5cbiAgICBnZXQgYXJlYSgpOiBhaC5BcmVhIHsgcmV0dXJuIGdldEF0dHIodGhpcywgXCJhcmVhXCIpOyB9XG4gICAgc2V0IGFyZWEodjogYW55KSB7IHNldEF0dHIodGhpcywgXCJhcmVhXCIsIHYpOyB9XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgdGhpcy5pc0luaXRMb2FkID0gdHJ1ZTtcblxuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsICgpID0+IHN5bmModGhpcykpO1xuICAgICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJ1bmxvYWRcIiwgKCkgPT4gc3luYyh0aGlzKSk7XG5cbiAgICAgIC8vIFBlcmlvZGljYWwgc3luY1xuICAgICAgLy8gVG8gb2JzZXJ2ZSBzdG9yYWdlIGNoYW5naW5ncyBhbmQgYC52YWx1ZWAgY2hhbmdpbmdzIGJ5IGFuIGV4dGVybmFsIGphdmFzY3JpcHRzXG4gICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIGF3YWl0IHUuc2xlZXAoU1lOQ19JTlRFUlZBTCk7XG4gICAgICAgICAgYXdhaXQgc3luYyh0aGlzKTtcbiAgICAgICAgICB3cml0ZUFyZWEodGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0pKCk7XG4gICAgfVxuXG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgYWRkQWxsSGFuZGxlcnModGhpcyk7XG4gICAgICBpbml0QmluZGVyKHRoaXMpO1xuICAgICAgd3JpdGVBcmVhKHRoaXMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkgeyByZXR1cm4gW1wiYXJlYVwiXTsgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHJOYW1lOiBzdHJpbmcpIHtcbiAgICAgIHN3aXRjaCAoYXR0ck5hbWUpIHtcbiAgICAgIGNhc2UgXCJhcmVhXCI6XG4gICAgICAgIGluaXRCaW5kZXIodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuY29uc3QgbWl4ZWRTZWxlY3QgPSBtaXhpbkFyZWFTZWxlY3QoSFRNTFNlbGVjdEVsZW1lbnQpO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSFRNTEFyZWFTZWxlY3RFbGVtZW50IGV4dGVuZHMgbWl4ZWRTZWxlY3Qge1xuICBzdGF0aWMgZ2V0IGV4dGVuZHMoKSB7IHJldHVybiBcInNlbGVjdFwiOyB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGluaXRCaW5kZXIoc2VsZjogSW50ZXJuYWxBcmVhU2VsZWN0KTogUHJvbWlzZTx2b2lkPiB7XG4gIC8vIEF2b2lkIHRvIGluaXRhbGl6ZSB1bnRpbCA8b3B0aW9uPiBlbGVtZW50cyBhcmUgYXBwZW5kZWRcbiAgaWYgKHNlbGYub3B0aW9ucy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICBzZWxmLmJpbmRlciA9IG51bGw7XG5cbiAgY29uc3QgaCA9IGdldEFyZWFIYW5kbGVyKHNlbGYpO1xuICBpZiAoIWgpIHJldHVybjtcblxuICBzZWxmLmJpbmRlciA9IG5ldyBCaW5kZXIoaCwgeyB3cml0ZTogd3JpdGVTZWxlY3QsIHJlYWQ6IHJlYWRTZWxlY3QgfSk7XG5cbiAgaWYgKHNlbGYuaXNJbml0TG9hZCkge1xuICAgIHNlbGYuaXNJbml0TG9hZCA9IGZhbHNlO1xuICAgIGF3YWl0IHN5bmMoc2VsZik7XG4gIH0gZWxzZSB7XG4gICAgYXdhaXQgc3VibWl0KHNlbGYpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyaXRlU2VsZWN0KHNlbGY6IGFueSwgbmV3VmFsdWU6ID9WYWx1ZSk6IHZvaWQge1xuICBpZiAoc2VsZi52YWx1ZSA9PT0gbmV3VmFsdWUpIHJldHVybjtcbiAgc2VsZi52YWx1ZSA9IG5ld1ZhbHVlO1xuICB3cml0ZUFyZWEoc2VsZik7XG59XG5cbmZ1bmN0aW9uIHJlYWRTZWxlY3Qoc2VsZjogYW55KTogVmFsdWUgeyByZXR1cm4gc2VsZi52YWx1ZTsgfVxuXG5hc3luYyBmdW5jdGlvbiBzdWJtaXQoc2VsZjogSW50ZXJuYWxBcmVhU2VsZWN0KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZWxmLmJpbmRlcikgYXdhaXQgc2VsZi5iaW5kZXIuc3VibWl0KFtzZWxmXSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN5bmMoc2VsZjogSW50ZXJuYWxBcmVhU2VsZWN0KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZWxmLmJpbmRlcikgYXdhaXQgc2VsZi5iaW5kZXIuc3luYyhbc2VsZl0pO1xufVxuXG5mdW5jdGlvbiB3cml0ZUFyZWEoc2VsZjogSW50ZXJuYWxBcmVhU2VsZWN0KSB7XG4gIGNvbnN0IGZvcm0gPSBzZWxmLmZvcm07XG4gIGlmIChmb3JtID09IG51bGwpIHJldHVybjtcbiAgZm9ybS5zZXRBdHRyaWJ1dGUoXCJhcmVhXCIsIHNlbGYudmFsdWUpO1xufVxuXG5mdW5jdGlvbiBnZXRBcmVhSGFuZGxlcihzZWxmOiBJbnRlcm5hbEFyZWFTZWxlY3QpOiA/YWguQXJlYUhhbmRsZXIge1xuICBjb25zdCBhID0gc2VsZi5hcmVhO1xuICBpZiAoIWEpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiUmVxdWlyZSAnYXJlYScgYXR0cmlidXRlXCIpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGggPSBhaC5maW5kSGFuZGxlcihhKTtcbiAgaWYgKCFoKSB7XG4gICAgY29uc29sZS5lcnJvcihcIk5vIHN1Y2ggYXJlYSBoYW5kbGVyOiBhcmVhPSVzXCIsIHNlbGYuYXJlYSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIGg7XG59XG5cbmZ1bmN0aW9uIGFkZEFsbEhhbmRsZXJzKHNlbGY6IEludGVybmFsQXJlYVNlbGVjdCkge1xuICBmb3IgKGNvbnN0IFthcmVhXSBvZiBhaC5saXN0SGFuZGxlcnMoKSkge1xuICAgIGNvbnN0IG8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpO1xuICAgIG8uaW5uZXJIVE1MID0gYXJlYTtcbiAgICBzZWxmLmFwcGVuZENoaWxkKG8pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldEF0dHIoc2VsZjogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHYgPSBzZWxmLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgcmV0dXJuIHYgPyB2IDogXCJcIjtcbn1cbmZ1bmN0aW9uIHNldEF0dHIoc2VsZjogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZywgdmFsdWU6ID9zdHJpbmcpOiB2b2lkIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybjtcbiAgc2VsZi5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2FyZWEtc2VsZWN0LmpzIiwiaW1wb3J0ICogYXMgdSBmcm9tIFwiLi91dGlsc1wiO1xuXG5pbXBvcnQgQmluZGVyIGZyb20gXCIuL2JpbmRlclwiO1xuaW1wb3J0IHR5cGUgeyBFbGVtZW50IH0gZnJvbSBcIi4vYmluZGVyXCI7XG5cbmltcG9ydCAqIGFzIGFoIGZyb20gXCIuL2FyZWEtaGFuZGxlclwiO1xuaW1wb3J0IEFyZWFTZWxlY3QgZnJvbSBcIi4vYXJlYS1zZWxlY3RcIjtcblxuZGVjbGFyZSB0eXBlIE5hbWUgPSBzdHJpbmc7XG5kZWNsYXJlIHR5cGUgVmFsdWUgPSBzdHJpbmc7XG5cbmRlY2xhcmUgaW50ZXJmYWNlIEZvcm1Db21wb25lbnRFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBuYW1lOiBOYW1lO1xuICB2YWx1ZT86IFZhbHVlO1xuICB0eXBlPzogc3RyaW5nO1xuICBjaGVja2VkPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdG9yYWdlRm9ybSBleHRlbmRzIEhUTUxGb3JtRWxlbWVudCB7XG4gIGF1dG9zeW5jOiBudW1iZXI7XG4gIGFyZWE6IHN0cmluZztcbn1cblxuZGVjbGFyZSBpbnRlcmZhY2UgSW50ZXJuYWxTdG9yYWdlRm9ybSBleHRlbmRzIFN0b3JhZ2VGb3JtIHtcbiAgaXNJbml0TG9hZDogYm9vbGVhbjtcbiAgYmluZGVyOiA/QmluZGVyO1xuICBjb21wb25lbnRPYnNlcnZlcnM6IE1hcDxGb3JtQ29tcG9uZW50RWxlbWVudCwgTXV0YXRpb25PYnNlcnZlcj47XG59XG5cbmNvbnN0IERFRkFVTFRfU1lOQ19JTlRFUlZBTCA9IDcwMDtcblxuZXhwb3J0IGZ1bmN0aW9uIG1peGluU3RvcmFnZUZvcm08VDogSFRNTEZvcm1FbGVtZW50PihjOiBDbGFzczxUPik6IENsYXNzPFQgJiBTdG9yYWdlRm9ybT4ge1xuICAvLyAkRmxvd0ZpeE1lIEZvcmNlIGNhc3QgdG8gdGhlIHJldHVybmVkIHR5cGUuXG4gIHJldHVybiBjbGFzcyBleHRlbmRzIGMge1xuICAgIGlzSW5pdExvYWQ6IGJvb2xlYW47XG4gICAgYmluZGVyOiA/QmluZGVyO1xuICAgIGNvbXBvbmVudE9ic2VydmVyczogTWFwPEZvcm1Db21wb25lbnRFbGVtZW50LCBNdXRhdGlvbk9ic2VydmVyPjtcblxuICAgIGdldCBhdXRvc3luYygpOiBudW1iZXIge1xuICAgICAgY29uc3QgbiA9IHBhcnNlSW50KGdldEF0dHIodGhpcywgXCJhdXRvc3luY1wiKSk7XG4gICAgICByZXR1cm4gbiA+IDAgPyBuIDogREVGQVVMVF9TWU5DX0lOVEVSVkFMO1xuICAgIH1cbiAgICBzZXQgYXV0b3N5bmModjogYW55KSB7IHNldEF0dHIodGhpcywgXCJhdXRvc3luY1wiLCB2KTsgfVxuICAgIGdldCBhcmVhKCk6IGFoLkFyZWEgeyByZXR1cm4gZ2V0QXR0cih0aGlzLCBcImFyZWFcIik7IH1cbiAgICBzZXQgYXJlYSh2OiBhbnkpIHsgc2V0QXR0cih0aGlzLCBcImFyZWFcIiwgdik7IH1cblxuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgc3VwZXIoKTtcbiAgICB9XG5cbiAgICBjcmVhdGVkQ2FsbGJhY2soKSB7XG4gICAgICB0aGlzLmlzSW5pdExvYWQgPSB0cnVlO1xuICAgICAgdGhpcy5jb21wb25lbnRPYnNlcnZlcnMgPSBuZXcgTWFwKCk7XG5cbiAgICAgIGluaXRCaW5kZXIodGhpcyk7XG5cbiAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgc3VibWl0KHRoaXMpO1xuICAgICAgfSk7XG5cbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwidW5sb2FkXCIsICgpID0+IHtcbiAgICAgICAgaWYgKGlzQXV0b1N5bmNFbmFibGVkKHRoaXMpKSB7XG4gICAgICAgICAgc3luYyh0aGlzKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIG5ldyBNdXRhdGlvbk9ic2VydmVyKChyZWNvcmRzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJzY2FuIGJ5IGZvcm0gTXV0YXRpb25PYnNlcnZlcjogXCIsIHRoaXMpO1xuICAgICAgICBzY2FuKHRoaXMpO1xuXG4gICAgICAgIGNvbnN0IGFkZGVkOiBBcnJheTxIVE1MRWxlbWVudD4gPVxuICAgICAgICAgICAgICBmbGF0dGVuKHJlY29yZHMubWFwKHIgPT4gKHIuYWRkZWROb2RlczogSXRlcmFibGU8YW55PikpKVxuICAgICAgICAgICAgICAuZmlsdGVyKChlKSA9PiBlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpO1xuICAgICAgICBpZiAoYWRkZWQubGVuZ3RoID4gMCkge1xuICAgICAgICAgIGZvciAoY29uc3QgZSBvZiBhZGRlZCkge1xuICAgICAgICAgICAgb2JzZXJ2ZUNvbXBvbmVudCh0aGlzLCBlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCByZW1vdmVkOiBBcnJheTxIVE1MRWxlbWVudD4gPVxuICAgICAgICAgICAgICBmbGF0dGVuKHJlY29yZHMubWFwKChyKSA9PiAoci5yZW1vdmVkTm9kZXM6IEl0ZXJhYmxlPGFueT4pKSlcbiAgICAgICAgICAgICAgLmZpbHRlcigoZSkgPT4gZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KTtcbiAgICAgICAgaWYgKHJlbW92ZWQubGVuZ3RoID4gMCkge1xuICAgICAgICAgIC8vIFVzZSBhbnkgdG8gZm9yY2UgY2FzdCB0byBBcnJheTxGb3JtQ29tcG9uZW50RWxlbWVudHM+XG4gICAgICAgICAgcmVtb3ZlKHRoaXMsIChyZW1vdmVkLmZpbHRlcigoZSkgPT4gKGU6IGFueSkubmFtZSk6IEFycmF5PGFueT4pKTtcbiAgICAgICAgICBmb3IgKGNvbnN0IGUgb2YgcmVtb3ZlZCkge1xuICAgICAgICAgICAgZGlzY29ubmVjdENvbXBvbmVudCh0aGlzLCBlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pLm9ic2VydmUodGhpcywgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XG5cbiAgICAgIHNjYW4odGhpcyk7XG5cbiAgICAgIC8vIFBlcmlvZGljYWwgc2Nhbi9zeW5jXG4gICAgICAvLyBUbyBvYnNlcnZlOlxuICAgICAgLy8gICAqIHN0b3JhZ2UgdmFsdWUgY2hhbmdpbmdzXG4gICAgICAvLyAgICogZXh0ZXJuYWwgZm9ybSBjb21wb25lbnRzIChzdWNoIGFzIGEgPGlucHV0IGZvcm09XCIuLi5cIiAuLi4+KVxuICAgICAgLy8gICAqIGZvcm0gdmFsdWUgY2hhbmdpbmdzIGJ5IGFuIGV4dGVybmFsIGphdmFzY3JpcHRcbiAgICAgIChhc3luYyAoKSA9PiB7XG4gICAgICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICAgICAgYXdhaXQgdS5zbGVlcCh0aGlzLmF1dG9zeW5jKTtcbiAgICAgICAgICBpZiAoaXNBdXRvU3luY0VuYWJsZWQodGhpcykpIHtcbiAgICAgICAgICAgIGF3YWl0IHN5bmModGhpcyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGF3YWl0IHNjYW4odGhpcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KSgpO1xuICAgIH1cblxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICBzY2FuKHRoaXMpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAgXCJhdXRvc3luY1wiLFxuICAgICAgICBcImFyZWFcIixcbiAgICAgIF07XG4gICAgfVxuXG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHJOYW1lOiBzdHJpbmcpIHtcbiAgICAgIHN3aXRjaCAoYXR0ck5hbWUpIHtcbiAgICAgIGNhc2UgXCJhdXRvc3luY1wiOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJhcmVhXCI6XG4gICAgICAgIGluaXRCaW5kZXIodGhpcyk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgfTtcbn1cblxuY29uc3QgbWl4ZWRGb3JtID0gbWl4aW5TdG9yYWdlRm9ybShIVE1MRm9ybUVsZW1lbnQpO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCBleHRlbmRzIG1peGVkRm9ybSB7XG4gIHN0YXRpYyBnZXQgZXh0ZW5kcygpIHsgcmV0dXJuIFwiZm9ybVwiOyB9XG5cbiAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgIC8vIEN1c3RvbSBFbGVtZW50IHYxIHNlZW1zIG5vdCB0byB3b3JrcyByaWdodCB0byBleHRlbmQgPGZvcm0+IGluIEdvb2dsZSBDaHJvbWUgNTVcbiAgICAvLyBTZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNDE0NTg2OTIvMzg2NDM1MVxuICAgIC8vIGN1c3RvbUVsZW1lbnRzLmRlZmluZShcInN0b3JhZ2UtZm9ybVwiLCBTdG9yYWdlRm9ybUVsZW1lbnQsIHsgZXh0ZW5kczogXCJmb3JtXCIgfSk7XG4gICAgLy8gd2luZG93LlN0b3JhZ2VGb3JtRWxlbWVudCA9IFN0b3JhZ2VGb3JtRWxlbWVudDtcblxuICAgIC8vIEN1c3RvbSBFbGVtZW50IHYwXG4gICAgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwic3RvcmFnZS1mb3JtXCIsIEhUTUxTdG9yYWdlRm9ybUVsZW1lbnQpO1xuICAgIGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcImFyZWEtc2VsZWN0XCIsIEFyZWFTZWxlY3QpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGlzQXV0b1N5bmNFbmFibGVkKHNlbGY6IEhUTUxGb3JtRWxlbWVudCk6IGJvb2xlYW4ge1xuICByZXR1cm4gc2VsZi5oYXNBdHRyaWJ1dGUoXCJhdXRvc3luY1wiKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc3VibWl0KHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbGYuYmluZGVyKSBhd2FpdCBzZWxmLmJpbmRlci5zdWJtaXQoZWxlbWVudHMoc2VsZikpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzeW5jKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0sIHRhcmdldHM/OiBBcnJheTxFbGVtZW50Pik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnN5bmModGFyZ2V0cyA/IHRhcmdldHMgOiBlbGVtZW50cyhzZWxmKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHNjYW4oc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnNjYW4oZWxlbWVudHMoc2VsZikpO1xufVxuXG5hc3luYyBmdW5jdGlvbiByZW1vdmUoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSwgZWxlbXM6IEFycmF5PEVsZW1lbnQ+KTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZWxmLmJpbmRlcikgYXdhaXQgc2VsZi5iaW5kZXIucmVtb3ZlKGVsZW1zKTtcbn1cblxuZnVuY3Rpb24gb2JzZXJ2ZUNvbXBvbmVudChzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtLCBuZXdFbGVtZW50OiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICBjb25zdCBlbGVtZW50czogQXJyYXk8Rm9ybUNvbXBvbmVudEVsZW1lbnQ+ID1cbiAgICAgICAgLy8gZm9yY2UgY2FzdFxuICAgICAgICAoW25ld0VsZW1lbnQsIC4uLkFycmF5LmZyb20obmV3RWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiKlwiKSldXG4gICAgICAgICAuZmlsdGVyKChlKSA9PiAoZTogYW55KS52YWx1ZSAhPSBudWxsICYmIChlOiBhbnkpLm5hbWUgIT0gbnVsbCk6IGFueSk7XG5cbiAgZm9yIChjb25zdCBlIG9mIGVsZW1lbnRzKSB7XG4gICAgY29uc3QgbyA9IG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHN5bmMoc2VsZiwgW2VdKSk7XG4gICAgby5vYnNlcnZlKGUsIHsgYXR0cmlidXRlczogdHJ1ZSwgYXRyaWJ1dGVGaWx0ZXI6IFtcIm5hbWVcIl0gfSk7XG4gICAgc2VsZi5jb21wb25lbnRPYnNlcnZlcnMuc2V0KGUsIG8pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRpc2Nvbm5lY3RDb21wb25lbnQoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSwgZWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3QgZWxlbWVudHMgPSBbZWxlbWVudCwgLi4uQXJyYXkuZnJvbShlbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIqXCIpKV07XG4gIGZvciAoY29uc3QgZSBvZiBlbGVtZW50cykge1xuICAgIGNvbnN0IG8gPSBzZWxmLmNvbXBvbmVudE9ic2VydmVycy5nZXQoKGU6IGFueSkpO1xuICAgIGlmIChvID09IG51bGwpIGNvbnRpbnVlO1xuICAgIHNlbGYuY29tcG9uZW50T2JzZXJ2ZXJzLmRlbGV0ZSgoZTogYW55KSk7XG4gICAgby5kaXNjb25uZWN0KCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gZWxlbWVudHMoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSk6IEFycmF5PEVsZW1lbnQ+IHtcbiAgcmV0dXJuIEFycmF5LmZyb20oKChzZWxmLmVsZW1lbnRzKTogSXRlcmFibGU8YW55PikpXG4gICAgLmZpbHRlcihlID0+IGUubmFtZSlcbiAgICAuZmlsdGVyKGUgPT4gIShlIGluc3RhbmNlb2YgQXJlYVNlbGVjdCkpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0QmluZGVyKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgc2VsZi5iaW5kZXIgPSBudWxsO1xuXG4gIGNvbnN0IGggPSBnZXRBcmVhSGFuZGxlcihzZWxmKTtcbiAgaWYgKCFoKSByZXR1cm47XG5cbiAgc2VsZi5iaW5kZXIgPSBuZXcgQmluZGVyKGgsIHsgd3JpdGU6IHdyaXRlRm9ybSwgcmVhZDogcmVhZEZvcm0gfSk7XG4gIGlmIChzZWxmLmlzSW5pdExvYWQpIHtcbiAgICBzZWxmLmlzSW5pdExvYWQgPSBmYWxzZTtcbiAgICBhd2FpdCBzeW5jKHNlbGYpO1xuICB9IGVsc2Uge1xuICAgIGF3YWl0IHN1Ym1pdChzZWxmKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3cml0ZUZvcm0oY29tcG9uZW50OiBhbnksIG5ld1ZhbHVlOiA/VmFsdWUpOiB2b2lkIHtcbiAgKGNvbXBvbmVudDogRm9ybUNvbXBvbmVudEVsZW1lbnQpO1xuICBjb25zdCB0eXBlID0gY29tcG9uZW50LnR5cGU7XG4gIGlmICh0eXBlID09PSBcImNoZWNrYm94XCIgfHwgdHlwZSA9PT0gXCJyYWRpb1wiKSB7XG4gICAgY29tcG9uZW50LmNoZWNrZWQgPSBuZXdWYWx1ZSA9PT0gY29tcG9uZW50LnZhbHVlO1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGlmIChuZXdWYWx1ZSA9PSBudWxsIHx8IGNvbXBvbmVudC52YWx1ZSA9PSBudWxsKVxuICAgIHJldHVybjtcblxuICBjb21wb25lbnQudmFsdWUgPSBuZXdWYWx1ZTtcbn1cblxuZnVuY3Rpb24gcmVhZEZvcm0oY29tcG9uZW50OiBhbnkpOiA/VmFsdWUge1xuICAoY29tcG9uZW50OiBGb3JtQ29tcG9uZW50RWxlbWVudCk7XG4gIGNvbnN0IHR5cGUgPSBjb21wb25lbnQudHlwZTtcbiAgaWYgKHR5cGUgPT09IFwiY2hlY2tib3hcIiB8fCB0eXBlID09PSBcInJhZGlvXCIpIHtcbiAgICByZXR1cm4gY29tcG9uZW50LmNoZWNrZWQgPyBjb21wb25lbnQudmFsdWUgOiBudWxsO1xuICB9XG4gIHJldHVybiBjb21wb25lbnQudmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldEFyZWFIYW5kbGVyKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pOiA/YWguQXJlYUhhbmRsZXIge1xuICBjb25zdCBhID0gc2VsZi5hcmVhO1xuICBpZiAoIWEpIHtcbiAgICBjb25zb2xlLmVycm9yKFwiUmVxdWlyZSAnYXJlYScgYXR0cmlidXRlXCIpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGggPSBhaC5maW5kSGFuZGxlcihhKTtcbiAgaWYgKCFoKSB7XG4gICAgY29uc29sZS5lcnJvcihcIk5vIHN1Y2ggYXJlYSBoYW5kbGVyOiBhcmVhPSVzXCIsIHNlbGYuYXJlYSk7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIGg7XG59XG5cbmZ1bmN0aW9uIGdldEF0dHIoc2VsZjogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHYgPSBzZWxmLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgcmV0dXJuIHYgPyB2IDogXCJcIjtcbn1cbmZ1bmN0aW9uIHNldEF0dHIoc2VsZjogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZywgdmFsdWU6ID9zdHJpbmcpOiB2b2lkIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybjtcbiAgc2VsZi5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuPFQ+KGl0ZXJpdGVyOiBJdGVyYWJsZTxJdGVyYWJsZTxUPj4pOiBBcnJheTxUPiB7XG4gIHJldHVybiBBcnJheS5mcm9tKChmdW5jdGlvbiogKCkge1xuICAgIGZvciAoY29uc3QgaXRlciBvZiBpdGVyaXRlcikgZm9yIChjb25zdCB0IG9mIGl0ZXIpIHlpZWxkIHQ7XG4gIH0pKCkpO1xufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3N0b3JhZ2UtZm9ybS5qcyJdLCJzb3VyY2VSb290IjoiIn0=