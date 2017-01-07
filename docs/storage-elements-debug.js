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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMDA5OGYyYWE1MDkxNzA0ZTFjMTUiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0b3JhZ2UtZWxlbWVudHMtcmVnaXN0ZXJlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FyZWEtaGFuZGxlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYmluZGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9hcmVhLXNlbGVjdC5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvc3RvcmFnZS1mb3JtLmpzIl0sIm5hbWVzIjpbInJlZ2lzdGVyIiwic2xlZXAiLCJkZWR1cCIsInN1YnRyYWN0U2V0IiwiQ2FuY2VsbGFibGVQcm9taXNlIiwiUHJvbWlzZSIsImNvbnN0cnVjdG9yIiwiY2FsbGJhY2siLCJjYW5jZWxsIiwiY2FuY2VsbEZ1bmN0aW9uIiwibXNlYyIsInRpbWVvdXRJZCIsInJlc29sdmUiLCJzZXRUaW1lb3V0IiwiY2xlYXJUaW1lb3V0IiwiYXJyYXkiLCJwcmVkaWNhdGUiLCJ0IiwibyIsInJlZHVjZSIsInJlc3VsdCIsImVsZW1lbnQiLCJzb21lIiwiaSIsImNvbmNhdCIsInRhcmdldFNldCIsInJlbW92ZWRTZXQiLCJTZXQiLCJBcnJheSIsImZyb20iLCJmaWx0ZXIiLCJlIiwiaGFzIiwiTXVsdGlWYWx1ZU1hcCIsIk1hcCIsImZsYXR0ZW5WYWx1ZXMiLCJ2YWx1ZXMiLCJhcnIiLCJ2IiwiQXJyYXlWYWx1ZU1hcCIsImFkZCIsImtleSIsInZhbHVlIiwiYSIsImdldCIsInNldCIsInB1c2giLCJTZXRWYWx1ZU1hcCIsInJlZ2lzdGVySGFuZGxlciIsImZpbmRIYW5kbGVyIiwibGlzdEhhbmRsZXJzIiwiaGFuZGxlcnMiLCJhcmVhIiwiaGFuZGxlciIsIkVycm9yIiwiT2JqZWN0IiwiZW50cmllcyIsIldlYlN0b3JhZ2VBcmVhSGFuZGxlciIsInN0b3JhZ2UiLCJyZWFkIiwibmFtZSIsImdldEl0ZW0iLCJ3cml0ZSIsIm5ld1ZhbHVlIiwic2V0SXRlbSIsInJlbW92ZSIsInJlbW92ZUl0ZW0iLCJsb2NhbFN0b3JhZ2UiLCJzZXNzaW9uU3RvcmFnZSIsIkNocm9tZVN0b3JhZ2VBcmVhSGFuZGxlciIsImNocm9tZSIsImxvY2FsIiwic3luYyIsInNlbGYiLCJ0YXJnZXRzIiwiYWxsIiwibWFwIiwibG9hZCIsInN0b3JlIiwiZG9TeW5jIiwiZm4iLCJsb2NrIiwic3luY0Jsb2NrIiwiZWxlbSIsIm5ld04iLCJuZXdWIiwicyIsIm52IiwiZiIsImZhbGxiYWNrSWZOdWxsIiwiZ2V0VmFsdWVCeU5hbWUiLCJ1IiwiQmluZGVyIiwic3VibWl0Iiwic2NhbiIsIm5ld0VsZW1lbnRzIiwia2V5cyIsImVsZW1lbnRzIiwiZGVsZXRlIiwiZm5zIiwib3B0aW9ucyIsImxlbmd0aCIsImJpbmRlciIsImgiLCJnZXRBcmVhSGFuZGxlciIsIndyaXRlU2VsZWN0IiwicmVhZFNlbGVjdCIsImlzSW5pdExvYWQiLCJpbml0QmluZGVyIiwibWl4aW5BcmVhU2VsZWN0IiwiYWgiLCJTWU5DX0lOVEVSVkFMIiwiYyIsImdldEF0dHIiLCJzZXRBdHRyIiwiY3JlYXRlZENhbGxiYWNrIiwiYWRkRXZlbnRMaXN0ZW5lciIsIndpbmRvdyIsIndyaXRlQXJlYSIsImF0dGFjaGVkQ2FsbGJhY2siLCJhZGRBbGxIYW5kbGVycyIsIm9ic2VydmVkQXR0cmlidXRlcyIsImF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayIsImF0dHJOYW1lIiwibWl4ZWRTZWxlY3QiLCJIVE1MU2VsZWN0RWxlbWVudCIsIkhUTUxBcmVhU2VsZWN0RWxlbWVudCIsImV4dGVuZHMiLCJmb3JtIiwic2V0QXR0cmlidXRlIiwiY29uc29sZSIsImRlYnVnIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiaW5uZXJIVE1MIiwiYXBwZW5kQ2hpbGQiLCJnZXRBdHRyaWJ1dGUiLCJlbGVtcyIsIndyaXRlRm9ybSIsInJlYWRGb3JtIiwibWl4aW5TdG9yYWdlRm9ybSIsIkRFRkFVTFRfU1lOQ19JTlRFUlZBTCIsImF1dG9zeW5jIiwibiIsInBhcnNlSW50IiwiY29tcG9uZW50T2JzZXJ2ZXJzIiwiZXZlbnQiLCJwcmV2ZW50RGVmYXVsdCIsImlzQXV0b1N5bmNFbmFibGVkIiwiTXV0YXRpb25PYnNlcnZlciIsInJlY29yZHMiLCJhZGRlZCIsImZsYXR0ZW4iLCJyIiwiYWRkZWROb2RlcyIsIkhUTUxFbGVtZW50Iiwib2JzZXJ2ZUNvbXBvbmVudCIsInJlbW92ZWQiLCJyZW1vdmVkTm9kZXMiLCJkaXNjb25uZWN0Q29tcG9uZW50Iiwib2JzZXJ2ZSIsImNoaWxkTGlzdCIsInN1YnRyZWUiLCJtaXhlZEZvcm0iLCJIVE1MRm9ybUVsZW1lbnQiLCJIVE1MU3RvcmFnZUZvcm1FbGVtZW50IiwicmVnaXN0ZXJFbGVtZW50IiwiaGFzQXR0cmlidXRlIiwibmV3RWxlbWVudCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJhdHRyaWJ1dGVzIiwiYXRyaWJ1dGVGaWx0ZXIiLCJkaXNjb25uZWN0IiwiY29tcG9uZW50IiwidHlwZSIsImNoZWNrZWQiLCJpdGVyaXRlciIsIml0ZXIiXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7QUNyQ0E7Ozs7OztBQUVBLHVCQUFtQkEsUUFBbkIsRzs7Ozs7Ozs7O1NDaUJnQkMsSyxHQUFBQSxLO1NBWUFDLEssR0FBQUEsSztTQVFBQyxXLEdBQUFBLFc7QUF0Q1QsT0FBTUMsa0JBQU4sU0FBb0NDLE9BQXBDLENBQStDO0FBRXBEQyxlQUNFQyxRQURGLEVBS0VDLE9BTEYsRUFNRTtBQUNBLFdBQU1ELFFBQU47QUFDQSxVQUFLRSxlQUFMLEdBQXVCRCxPQUF2QjtBQUNE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QUFkLEVBQXdEMUQsS0FBS3JCLElBQTdELEVBQW1FcUIsSUFBbkU7QUFDQSxZQUFPLElBQVA7QUFDRDtBQUNELFVBQU84QixDQUFQO0FBQ0Q7O0FBRUQsVUFBU1UsT0FBVCxDQUFpQnhDLElBQWpCLEVBQW9DYixJQUFwQyxFQUEwRDtBQUN4RCxPQUFNdEIsSUFBSW1DLEtBQUsrRCxZQUFMLENBQWtCNUUsSUFBbEIsQ0FBVjtBQUNBLFVBQU90QixJQUFJQSxDQUFKLEdBQVEsRUFBZjtBQUNEO0FBQ0QsVUFBUzRFLE9BQVQsQ0FBaUJ6QyxJQUFqQixFQUFvQ2IsSUFBcEMsRUFBa0RsQixLQUFsRCxFQUF3RTtBQUN0RSxPQUFJQSxTQUFTLElBQWIsRUFBbUI7QUFDbkIrQixRQUFLd0QsWUFBTCxDQUFrQnJFLElBQWxCLEVBQXdCbEIsS0FBeEI7QUFDRDs7QUFFRCxVQUFTOEcsT0FBVCxDQUFvQndCLFFBQXBCLEVBQStEO0FBQzdELFVBQU9wSixNQUFNQyxJQUFOLENBQVksYUFBYTtBQUM5QiwyQkFBbUJtSixRQUFuQjtBQUFBOztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7O0FBQUEsV0FBV0MsSUFBWDtBQUE2Qiw2QkFBZ0JBLElBQWhCO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxhQUFXaEssQ0FBWDtBQUFzQixlQUFNQSxDQUFOO0FBQXRCO0FBQTdCO0FBQ0QsSUFGaUIsRUFBWCxDQUFQO0FBR0QsRSIsImZpbGUiOiJzdG9yYWdlLWVsZW1lbnRzLWRlYnVnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgMDA5OGYyYWE1MDkxNzA0ZTFjMTUiLCIvLyBAZmxvd1xuaW1wb3J0IFN0b3JhZ2VGb3JtRWxlbWVudCBmcm9tIFwiLi9zdG9yYWdlLWZvcm1cIjtcblxuU3RvcmFnZUZvcm1FbGVtZW50LnJlZ2lzdGVyKCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvc3RvcmFnZS1lbGVtZW50cy1yZWdpc3RlcmVyLmpzIiwiLy8gQGZsb3dcblxuZXhwb3J0IGNsYXNzIENhbmNlbGxhYmxlUHJvbWlzZTxSPiBleHRlbmRzIFByb21pc2U8Uj4ge1xuICBjYW5jZWxsRnVuY3Rpb246ICgpID0+IHZvaWQ7XG4gIGNvbnN0cnVjdG9yKFxuICAgIGNhbGxiYWNrOiAoXG4gICAgICByZXNvbHZlOiAocmVzdWx0OiBQcm9taXNlPFI+IHwgUikgPT4gdm9pZCxcbiAgICAgIHJlamVjdDogKGVycm9yOiBhbnkpID0+IHZvaWRcbiAgICApID0+IG1peGVkLFxuICAgIGNhbmNlbGw6ICgpID0+IHZvaWRcbiAgKSB7XG4gICAgc3VwZXIoY2FsbGJhY2spO1xuICAgIHRoaXMuY2FuY2VsbEZ1bmN0aW9uID0gY2FuY2VsbDtcbiAgfVxuXG4gIGNhbmNlbGwoKSB7XG4gICAgdGhpcy5jYW5jZWxsRnVuY3Rpb24oKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2xlZXAobXNlYzogbnVtYmVyKTogQ2FuY2VsbGFibGVQcm9taXNlPHZvaWQ+IHtcbiAgbGV0IHRpbWVvdXRJZDogP251bWJlcjtcbiAgcmV0dXJuIG5ldyBDYW5jZWxsYWJsZVByb21pc2UoXG4gICAgKHJlc29sdmUpID0+IHtcbiAgICAgIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZSgpLCBtc2VjKTtcbiAgICB9LFxuICAgICgpID0+IHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgIH1cbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZHVwPFQ+KGFycmF5OiBBcnJheTxUPixcbiAgICAgICAgICAgICAgICAgICAgICAgICBwcmVkaWNhdGU/OiAodDogVCwgbzogVCkgPT4gYm9vbGVhbiA9ICh0LCBvKSA9PiB0ID09PSBvKTogQXJyYXk8VD4ge1xuICByZXR1cm4gYXJyYXkucmVkdWNlKChyZXN1bHQ6IEFycmF5PFQ+LCBlbGVtZW50KSA9PiB7XG4gICAgaWYgKHJlc3VsdC5zb21lKChpKSA9PiBwcmVkaWNhdGUoaSwgZWxlbWVudCkpKSByZXN1bHQ7XG4gICAgcmV0dXJuIHJlc3VsdC5jb25jYXQoZWxlbWVudCk7XG4gIH0sW10pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3VidHJhY3RTZXQ8VD4odGFyZ2V0U2V0OiBTZXQ8VD4sIHJlbW92ZWRTZXQ6IFNldDxUPik6IFNldDxUPiB7XG4gIHJldHVybiBuZXcgU2V0KEFycmF5LmZyb20odGFyZ2V0U2V0KS5maWx0ZXIoKGUpID0+ICFyZW1vdmVkU2V0LmhhcyhlKSkpO1xufVxuXG5jbGFzcyBNdWx0aVZhbHVlTWFwPEssIFYsIEk6IEl0ZXJhYmxlPFY+PiBleHRlbmRzIE1hcDxLLCBJPiB7XG4gICogZmxhdHRlblZhbHVlcygpOiBJdGVyYXRvcjxWPiB7XG4gICAgZm9yIChjb25zdCBhcnIgb2YgdGhpcy52YWx1ZXMoKSkge1xuICAgICAgZm9yIChjb25zdCB2IG9mIGFycikge1xuICAgICAgICB5aWVsZCB2O1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQXJyYXlWYWx1ZU1hcDxLLCBWPiBleHRlbmRzIE11bHRpVmFsdWVNYXA8SywgViwgQXJyYXk8Vj4+IHtcbiAgYWRkKGtleTogSywgdmFsdWU6IFYpOiB0aGlzIHtcbiAgICBsZXQgYSA9IHRoaXMuZ2V0KGtleSk7XG4gICAgaWYgKCFhKSB7XG4gICAgICBhID0gW107XG4gICAgICB0aGlzLnNldChrZXksIGEpO1xuICAgIH1cbiAgICBhLnB1c2godmFsdWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTZXRWYWx1ZU1hcDxLLCBWPiBleHRlbmRzIE11bHRpVmFsdWVNYXA8SywgViwgU2V0PFY+PiB7XG4gIGFkZChrZXk6IEssIHZhbHVlOiBWKTogdGhpcyB7XG4gICAgbGV0IGEgPSB0aGlzLmdldChrZXkpO1xuICAgIGlmICghYSkge1xuICAgICAgYSA9IG5ldyBTZXQoKTtcbiAgICAgIHRoaXMuc2V0KGtleSwgYSk7XG4gICAgfVxuICAgIGEuYWRkKHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3V0aWxzLmpzIiwiLy8gQGZsb3dcbi8qIGdsb2JhbCBjaHJvbWUgKi9cblxuZXhwb3J0IHR5cGUgQXJlYSA9IHN0cmluZztcblxuZXhwb3J0IGludGVyZmFjZSBBcmVhSGFuZGxlciB7XG4gIHJlYWQobmFtZTogc3RyaW5nKTogUHJvbWlzZTw/c3RyaW5nPjtcbiAgd3JpdGUobmFtZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcbiAgcmVtb3ZlKG5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG59XG5cbmNvbnN0IGhhbmRsZXJzOiB7IFthcmVhOiBBcmVhXTogQXJlYUhhbmRsZXIgfSA9IHt9O1xuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJIYW5kbGVyKGFyZWE6IEFyZWEsIGhhbmRsZXI6IEFyZWFIYW5kbGVyKTogdm9pZCB7XG4gIGlmIChoYW5kbGVyc1thcmVhXSkge1xuICAgIHRocm93IEVycm9yKGBBbHJlYWR5IHJlZ2lzdGVyZWQgaGFuZGxlciBmb3IgXCIke2FyZWF9XCJgKTtcbiAgfVxuICBoYW5kbGVyc1thcmVhXSA9IGhhbmRsZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kSGFuZGxlcihhcmVhOiBBcmVhKTogP0FyZWFIYW5kbGVyIHtcbiAgcmV0dXJuIGhhbmRsZXJzW2FyZWFdO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbGlzdEhhbmRsZXJzKCk6IEFycmF5PFtBcmVhLCBBcmVhSGFuZGxlcl0+IHtcbiAgcmV0dXJuIE9iamVjdC5lbnRyaWVzKGhhbmRsZXJzKTtcbn1cblxuLy9cblxuZXhwb3J0IGNsYXNzIFdlYlN0b3JhZ2VBcmVhSGFuZGxlciB7XG4gIHN0b3JhZ2U6IFN0b3JhZ2U7XG5cbiAgY29uc3RydWN0b3Ioc3RvcmFnZTogU3RvcmFnZSkge1xuICAgIHRoaXMuc3RvcmFnZSA9IHN0b3JhZ2U7XG4gIH1cblxuICByZWFkKG5hbWU6IHN0cmluZyk6IFByb21pc2U8P3N0cmluZz4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5zdG9yYWdlLmdldEl0ZW0obmFtZSkpO1xuICB9XG5cbiAgd3JpdGUobmFtZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zdG9yYWdlLnNldEl0ZW0obmFtZSwgbmV3VmFsdWUpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIHJlbW92ZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnN0b3JhZ2UucmVtb3ZlSXRlbShuYW1lKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cbn1cblxuaWYgKGxvY2FsU3RvcmFnZSlcbiAgcmVnaXN0ZXJIYW5kbGVyKFwibG9jYWwtc3RvcmFnZVwiLCBuZXcgV2ViU3RvcmFnZUFyZWFIYW5kbGVyKGxvY2FsU3RvcmFnZSkpO1xuaWYgKHNlc3Npb25TdG9yYWdlKVxuICByZWdpc3RlckhhbmRsZXIoXCJzZXNzaW9uLXN0b3JhZ2VcIiwgbmV3IFdlYlN0b3JhZ2VBcmVhSGFuZGxlcihzZXNzaW9uU3RvcmFnZSkpO1xuXG4vL1xuXG5leHBvcnQgY2xhc3MgQ2hyb21lU3RvcmFnZUFyZWFIYW5kbGVyIHtcbiAgc3RvcmFnZTogQ2hyb21lU3RvcmFnZUFyZWE7XG5cbiAgY29uc3RydWN0b3Ioc3RvcmFnZTogQ2hyb21lU3RvcmFnZUFyZWEpIHtcbiAgICB0aGlzLnN0b3JhZ2UgPSBzdG9yYWdlO1xuICB9XG5cbiAgcmVhZChuYW1lOiBzdHJpbmcpOiBQcm9taXNlPD9zdHJpbmc+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHRoaXMuc3RvcmFnZS5nZXQobmFtZSwgKHYpID0+IHJlc29sdmUodltuYW1lXSkpKTtcbiAgfVxuXG4gIHdyaXRlKG5hbWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gdGhpcy5zdG9yYWdlLnNldCh7IFtuYW1lXTogbmV3VmFsdWUgfSwgcmVzb2x2ZSkpO1xuICB9XG5cbiAgcmVtb3ZlKG5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gdGhpcy5zdG9yYWdlLnJlbW92ZShuYW1lLCByZXNvbHZlKSk7XG4gIH1cbn1cblxuaWYgKGNocm9tZSAmJiBjaHJvbWUuc3RvcmFnZSkge1xuICBpZiAoY2hyb21lLnN0b3JhZ2UubG9jYWwpXG4gICAgcmVnaXN0ZXJIYW5kbGVyKFwiY2hyb21lLWxvY2FsXCIsIG5ldyBDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIoY2hyb21lLnN0b3JhZ2UubG9jYWwpKTtcbiAgaWYgKGNocm9tZS5zdG9yYWdlLnN5bmMpXG4gICAgcmVnaXN0ZXJIYW5kbGVyKFwiY2hyb21lLXN5bmNcIiwgbmV3IENocm9tZVN0b3JhZ2VBcmVhSGFuZGxlcihjaHJvbWUuc3RvcmFnZS5zeW5jKSk7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvYXJlYS1oYW5kbGVyLmpzIiwiLy8gQGZsb3dcblxuaW1wb3J0ICogYXMgdSBmcm9tIFwiLi91dGlsc1wiO1xuXG5kZWNsYXJlIHR5cGUgTmFtZSA9IHN0cmluZztcbmRlY2xhcmUgdHlwZSBWYWx1ZSA9IHN0cmluZztcbmRlY2xhcmUgdHlwZSBOYW1lVmFsdWUgPSB7IG5hbWU6IE5hbWUsIHZhbHVlOiA/VmFsdWUgfTtcbmRlY2xhcmUgdHlwZSBWYWx1ZXMgPSBNYXA8RWxlbWVudCwgTmFtZVZhbHVlPjtcbmV4cG9ydCBpbnRlcmZhY2UgRWxlbWVudCB7XG4gIG5hbWU6IE5hbWU7XG59XG5kZWNsYXJlIGludGVyZmFjZSBTdG9yYWdlSGFuZGxlciB7XG4gIHJlYWQobjogTmFtZSk6IFByb21pc2U8P1ZhbHVlPjtcbiAgd3JpdGUobjogTmFtZSwgdjogVmFsdWUpOiBQcm9taXNlPHZvaWQ+O1xuICByZW1vdmUobjogTmFtZSk6IFByb21pc2U8dm9pZD47XG59XG5kZWNsYXJlIGludGVyZmFjZSBGb3JtSGFuZGxlciB7XG4gIHdyaXRlKGU6IEVsZW1lbnQsIHY6ID9WYWx1ZSk6IHZvaWQ7XG4gIHJlYWQoZTogRWxlbWVudCk6ID9WYWx1ZTtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQmluZGVyIHtcbiAgdjogVmFsdWVzO1xuICBzOiBTdG9yYWdlSGFuZGxlcjtcbiAgZjogRm9ybUhhbmRsZXI7XG4gIGxvY2s6ID9Qcm9taXNlPG1peGVkPjtcblxuICBjb25zdHJ1Y3RvcihzOiBTdG9yYWdlSGFuZGxlciwgZjogRm9ybUhhbmRsZXIpIHtcbiAgICB0aGlzLnYgPSBuZXcgTWFwO1xuICAgIHRoaXMucyA9IHM7XG4gICAgdGhpcy5mID0gZjtcbiAgICB0aGlzLmxvY2sgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgc3luYyh0YXJnZXRzOiBBcnJheTxFbGVtZW50Pik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN5bmNCbG9jayh0aGlzLCAoKSA9PiBkb1N5bmModGhpcywgdGFyZ2V0cykpO1xuICB9XG5cbiAgLy8vIEZvcmNlIHdyaXRlIGZvcm0gdmFsdWVzIHRvIHRoZSBzdG9yYWdlXG4gIGFzeW5jIHN1Ym1pdCh0YXJnZXRzOiBBcnJheTxFbGVtZW50Pik6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHN5bmNCbG9jayh0aGlzLCAoKSA9PiBQcm9taXNlLmFsbCh0YXJnZXRzLm1hcChhc3luYyAoZSkgPT4ge1xuICAgICAgYXdhaXQgc3RvcmUodGhpcywgZSk7XG4gICAgfSkpKTtcbiAgfVxuXG4gIC8vLyBTeW5jIG9ubHkgbmV3IGVsZW1lbnRzXG4gIGFzeW5jIHNjYW4odGFyZ2V0czogQXJyYXk8RWxlbWVudD4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCBzeW5jQmxvY2sodGhpcywgYXN5bmMgKCkgPT4ge1xuICAgICAgY29uc3QgbmV3RWxlbWVudHMgPSB1LnN1YnRyYWN0U2V0KG5ldyBTZXQodGFyZ2V0cyksIG5ldyBTZXQodGhpcy52LmtleXMoKSkpO1xuICAgICAgYXdhaXQgZG9TeW5jKHRoaXMsIEFycmF5LmZyb20obmV3RWxlbWVudHMpKTtcbiAgICB9KTtcbiAgfVxuXG4gIC8vLyBJbnZvcmsgaWYgYW4gZWxlbWVudCB3YXMgcmVtb3ZlZCBmcm9tIGEgZm9ybS5cbiAgYXN5bmMgcmVtb3ZlKGVsZW1lbnRzOiBBcnJheTxFbGVtZW50Pikge1xuICAgIGF3YWl0IHN5bmNCbG9jayh0aGlzLCBhc3luYyAoKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGUgb2YgZWxlbWVudHMpIHRoaXMudi5kZWxldGUoZSk7XG4gICAgfSk7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gZG9TeW5jKHNlbGY6IEJpbmRlciwgdGFyZ2V0czogQXJyYXk8RWxlbWVudD4pIHtcbiAgYXdhaXQgUHJvbWlzZS5hbGwodGFyZ2V0cy5tYXAoYXN5bmMgKGUpID0+IHtcbiAgICBhd2FpdCBsb2FkKHNlbGYsIGUpO1xuICAgIGF3YWl0IHN0b3JlKHNlbGYsIGUpO1xuICB9KSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN5bmNCbG9jayhzZWxmOiBCaW5kZXIsIGZuOiAoKSA9PiBQcm9taXNlPG1peGVkPikge1xuICB3aGlsZSAoc2VsZi5sb2NrKSBhd2FpdCBzZWxmLmxvY2s7XG4gIHNlbGYubG9jayA9IGZuKCk7XG4gIGF3YWl0IHNlbGYubG9jaztcbiAgc2VsZi5sb2NrID0gbnVsbDtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZChzZWxmOiBCaW5kZXIsIGVsZW06IEVsZW1lbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgbmV3TiA9IGVsZW0ubmFtZTtcbiAgY29uc3QgbmV3ViA9IGF3YWl0IHNlbGYucy5yZWFkKG5ld04pO1xuICBsZXQgbnY6ID9OYW1lVmFsdWUgPSBzZWxmLnYuZ2V0KGVsZW0pO1xuICBpZiAoIW52KSB7XG4gICAgbnYgPSB7IG5hbWU6IGVsZW0ubmFtZSwgdmFsdWU6IG51bGwgfTtcbiAgICBzZWxmLnYuc2V0KGVsZW0sIG52KTtcbiAgfVxuICBpZiAobnYubmFtZSAhPT0gbmV3TiB8fCBudi52YWx1ZSAhPT0gbmV3Vikge1xuICAgIHNlbGYuZi53cml0ZShlbGVtLCBuZXdWKTtcbiAgICBudi5uYW1lID0gIG5ld047XG4gICAgbnYudmFsdWUgPSAgbmV3VjtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBzdG9yZShzZWxmOiBCaW5kZXIsIGVsZW06IEVsZW1lbnQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgY29uc3QgbmV3TiA9IGVsZW0ubmFtZTtcbiAgY29uc3QgbmV3ViA9IGZhbGxiYWNrSWZOdWxsKCgpID0+IHNlbGYuZi5yZWFkKGVsZW0pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKCkgPT4gZ2V0VmFsdWVCeU5hbWUoc2VsZiwgbmV3TikpO1xuICBsZXQgbnY6ID9OYW1lVmFsdWUgPSBzZWxmLnYuZ2V0KGVsZW0pO1xuICBpZiAoIW52KSB7XG4gICAgbnYgPSB7IG5hbWU6IGVsZW0ubmFtZSwgdmFsdWU6IG51bGwgfTtcbiAgICBzZWxmLnYuc2V0KGVsZW0sIG52KTtcbiAgfVxuICBpZiAobnYubmFtZSAhPT0gbmV3TiB8fCBudi52YWx1ZSAhPT0gbmV3Vikge1xuICAgIGlmIChuZXdWID09IG51bGwpIHtcbiAgICAgIGF3YWl0IHNlbGYucy5yZW1vdmUobmV3Tik7XG4gICAgfSBlbHNlIHtcbiAgICAgIGF3YWl0IHNlbGYucy53cml0ZShuZXdOLCBuZXdWKTtcbiAgICB9XG4gICAgbnYubmFtZSA9ICBuZXdOO1xuICAgIG52LnZhbHVlID0gIG5ld1Y7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmFsbGJhY2tJZk51bGw8VD4oLi4uZm5zOiBBcnJheTwoKSA9PiBUPik6ID9UIHtcbiAgZm9yIChjb25zdCBmbiBvZiBmbnMpIHtcbiAgICBjb25zdCB2ID0gZm4oKTtcbiAgICBpZiAodiAhPSBudWxsKSByZXR1cm4gdjtcbiAgfVxuICByZXR1cm4gbnVsbDtcbn1cblxuZnVuY3Rpb24gZ2V0VmFsdWVCeU5hbWUoc2VsZjogQmluZGVyLCBuYW1lOiBOYW1lKTogP1ZhbHVlIHtcbiAgZm9yIChjb25zdCBudiBvZiBzZWxmLnYudmFsdWVzKCkpIHtcbiAgICBpZiAobnYubmFtZSA9PT0gbmFtZSkgcmV0dXJuIG52LnZhbHVlO1xuICB9XG4gIHJldHVybiBudWxsO1xufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2JpbmRlci5qcyIsIi8vIEBmbG93XG5cbmltcG9ydCAqIGFzIHUgZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCAqIGFzIGFoIGZyb20gXCIuL2FyZWEtaGFuZGxlclwiO1xuaW1wb3J0IEJpbmRlciBmcm9tIFwiLi9iaW5kZXJcIjtcblxuZGVjbGFyZSB0eXBlIFZhbHVlID0gc3RyaW5nO1xuXG5pbnRlcmZhY2UgQXJlYVNlbGVjdCBleHRlbmRzIEhUTUxTZWxlY3RFbGVtZW50IHtcbiAgYXJlYTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgSW50ZXJuYWxBcmVhU2VsZWN0IGV4dGVuZHMgQXJlYVNlbGVjdCB7XG4gIGlzSW5pdExvYWQ6IGJvb2xlYW47XG4gIGJpbmRlcjogP0JpbmRlcjtcbn1cblxuY29uc3QgU1lOQ19JTlRFUlZBTCA9IDUwMDtcblxuZXhwb3J0IGZ1bmN0aW9uIG1peGluQXJlYVNlbGVjdDxUOiBIVE1MU2VsZWN0RWxlbWVudD4oYzogQ2xhc3M8VD4pOiBDbGFzczxUICYgQXJlYVNlbGVjdD4ge1xuICAvLyAkRmxvd0ZpeE1lIEZvcmNlIGNhc3QgdG8gdGhlIHJldHVybmVkIHR5cGUuXG4gIHJldHVybiBjbGFzcyBleHRlbmRzIGMge1xuICAgIGlzSW5pdExvYWQ6IGJvb2xlYW47XG4gICAgYmluZGVyOiA/QmluZGVyO1xuXG4gICAgZ2V0IGFyZWEoKTogYWguQXJlYSB7IHJldHVybiBnZXRBdHRyKHRoaXMsIFwiYXJlYVwiKTsgfVxuICAgIHNldCBhcmVhKHY6IGFueSkgeyBzZXRBdHRyKHRoaXMsIFwiYXJlYVwiLCB2KTsgfVxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgIHRoaXMuaXNJbml0TG9hZCA9IHRydWU7XG5cbiAgICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCAoKSA9PiBzeW5jKHRoaXMpKTtcbiAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwidW5sb2FkXCIsICgpID0+IHN5bmModGhpcykpO1xuXG4gICAgICAvLyBQZXJpb2RpY2FsIHN5bmNcbiAgICAgIC8vIFRvIG9ic2VydmUgc3RvcmFnZSBjaGFuZ2luZ3MgYW5kIGAudmFsdWVgIGNoYW5naW5ncyBieSBhbiBleHRlcm5hbCBqYXZhc2NyaXB0c1xuICAgICAgKGFzeW5jICgpID0+IHtcbiAgICAgICAgd2hpbGUgKHRydWUpIHtcbiAgICAgICAgICBhd2FpdCB1LnNsZWVwKFNZTkNfSU5URVJWQUwpO1xuICAgICAgICAgIGF3YWl0IHN5bmModGhpcyk7XG4gICAgICAgICAgd3JpdGVBcmVhKHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9KSgpO1xuICAgIH1cblxuICAgIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgICBpZiAodGhpcy5sZW5ndGggPT09IDApIGFkZEFsbEhhbmRsZXJzKHRoaXMpO1xuICAgICAgaW5pdEJpbmRlcih0aGlzKTtcbiAgICAgIHdyaXRlQXJlYSh0aGlzKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHsgcmV0dXJuIFtcImFyZWFcIl07IH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhhdHRyTmFtZTogc3RyaW5nKSB7XG4gICAgICBzd2l0Y2ggKGF0dHJOYW1lKSB7XG4gICAgICBjYXNlIFwiYXJlYVwiOlxuICAgICAgICBpbml0QmluZGVyKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbmNvbnN0IG1peGVkU2VsZWN0ID0gbWl4aW5BcmVhU2VsZWN0KEhUTUxTZWxlY3RFbGVtZW50KTtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhUTUxBcmVhU2VsZWN0RWxlbWVudCBleHRlbmRzIG1peGVkU2VsZWN0IHtcbiAgc3RhdGljIGdldCBleHRlbmRzKCkgeyByZXR1cm4gXCJzZWxlY3RcIjsgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBpbml0QmluZGVyKHNlbGY6IEludGVybmFsQXJlYVNlbGVjdCk6IFByb21pc2U8dm9pZD4ge1xuICAvLyBBdm9pZCB0byBpbml0YWxpemUgdW50aWwgPG9wdGlvbj4gZWxlbWVudHMgYXJlIGFwcGVuZGVkXG4gIGlmIChzZWxmLm9wdGlvbnMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgc2VsZi5iaW5kZXIgPSBudWxsO1xuXG4gIGNvbnN0IGggPSBnZXRBcmVhSGFuZGxlcihzZWxmKTtcbiAgaWYgKCFoKSByZXR1cm47XG5cbiAgc2VsZi5iaW5kZXIgPSBuZXcgQmluZGVyKGgsIHsgd3JpdGU6IHdyaXRlU2VsZWN0LCByZWFkOiByZWFkU2VsZWN0IH0pO1xuXG4gIGlmIChzZWxmLmlzSW5pdExvYWQpIHtcbiAgICBzZWxmLmlzSW5pdExvYWQgPSBmYWxzZTtcbiAgICBhd2FpdCBzeW5jKHNlbGYpO1xuICB9IGVsc2Uge1xuICAgIGF3YWl0IHN1Ym1pdChzZWxmKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB3cml0ZVNlbGVjdChzZWxmOiBhbnksIG5ld1ZhbHVlOiA/VmFsdWUpOiB2b2lkIHtcbiAgaWYgKHNlbGYudmFsdWUgPT09IG5ld1ZhbHVlKSByZXR1cm47XG4gIHNlbGYudmFsdWUgPSBuZXdWYWx1ZTtcbiAgd3JpdGVBcmVhKHNlbGYpO1xufVxuXG5mdW5jdGlvbiByZWFkU2VsZWN0KHNlbGY6IGFueSk6IFZhbHVlIHsgcmV0dXJuIHNlbGYudmFsdWU7IH1cblxuYXN5bmMgZnVuY3Rpb24gc3VibWl0KHNlbGY6IEludGVybmFsQXJlYVNlbGVjdCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnN1Ym1pdChbc2VsZl0pO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzeW5jKHNlbGY6IEludGVybmFsQXJlYVNlbGVjdCk6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnN5bmMoW3NlbGZdKTtcbn1cblxuZnVuY3Rpb24gd3JpdGVBcmVhKHNlbGY6IEludGVybmFsQXJlYVNlbGVjdCkge1xuICBjb25zdCBmb3JtID0gc2VsZi5mb3JtO1xuICBpZiAoZm9ybSA9PSBudWxsKSByZXR1cm47XG4gIGZvcm0uc2V0QXR0cmlidXRlKFwiYXJlYVwiLCBzZWxmLnZhbHVlKTtcbn1cblxuZnVuY3Rpb24gZ2V0QXJlYUhhbmRsZXIoc2VsZjogSW50ZXJuYWxBcmVhU2VsZWN0KTogP2FoLkFyZWFIYW5kbGVyIHtcbiAgY29uc3QgYSA9IHNlbGYuYXJlYTtcbiAgaWYgKCFhKSB7XG4gICAgY29uc29sZS5kZWJ1ZyhcIlJlcXVpcmUgJ2FyZWEnIGF0dHJpYnV0ZVwiLCBzZWxmKTtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuICBjb25zdCBoID0gYWguZmluZEhhbmRsZXIoYSk7XG4gIGlmICghaCkge1xuICAgIGNvbnNvbGUuZGVidWcoXCJObyBzdWNoIGFyZWEgaGFuZGxlcjogYXJlYT0lcywgdGhpcz0lc1wiLCBzZWxmLmFyZWEsIHNlbGYpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBoO1xufVxuXG5mdW5jdGlvbiBhZGRBbGxIYW5kbGVycyhzZWxmOiBJbnRlcm5hbEFyZWFTZWxlY3QpIHtcbiAgZm9yIChjb25zdCBbYXJlYV0gb2YgYWgubGlzdEhhbmRsZXJzKCkpIHtcbiAgICBjb25zdCBvID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIm9wdGlvblwiKTtcbiAgICBvLmlubmVySFRNTCA9IGFyZWE7XG4gICAgc2VsZi5hcHBlbmRDaGlsZChvKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRBdHRyKHNlbGY6IEhUTUxFbGVtZW50LCBuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB2ID0gc2VsZi5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gIHJldHVybiB2ID8gdiA6IFwiXCI7XG59XG5mdW5jdGlvbiBzZXRBdHRyKHNlbGY6IEhUTUxFbGVtZW50LCBuYW1lOiBzdHJpbmcsIHZhbHVlOiA/c3RyaW5nKTogdm9pZCB7XG4gIGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm47XG4gIHNlbGYuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9hcmVhLXNlbGVjdC5qcyIsIi8vIEBmbG93XG5cbmltcG9ydCAqIGFzIHUgZnJvbSBcIi4vdXRpbHNcIjtcblxuaW1wb3J0IEJpbmRlciBmcm9tIFwiLi9iaW5kZXJcIjtcbmltcG9ydCB0eXBlIHsgRWxlbWVudCB9IGZyb20gXCIuL2JpbmRlclwiO1xuXG5pbXBvcnQgKiBhcyBhaCBmcm9tIFwiLi9hcmVhLWhhbmRsZXJcIjtcbmltcG9ydCBBcmVhU2VsZWN0IGZyb20gXCIuL2FyZWEtc2VsZWN0XCI7XG5cbmRlY2xhcmUgdHlwZSBOYW1lID0gc3RyaW5nO1xuZGVjbGFyZSB0eXBlIFZhbHVlID0gc3RyaW5nO1xuXG5kZWNsYXJlIGludGVyZmFjZSBGb3JtQ29tcG9uZW50RWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgbmFtZTogTmFtZTtcbiAgdmFsdWU/OiBWYWx1ZTtcbiAgdHlwZT86IHN0cmluZztcbiAgY2hlY2tlZD86IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RvcmFnZUZvcm0gZXh0ZW5kcyBIVE1MRm9ybUVsZW1lbnQge1xuICBhdXRvc3luYzogbnVtYmVyO1xuICBhcmVhOiBzdHJpbmc7XG59XG5cbmRlY2xhcmUgaW50ZXJmYWNlIEludGVybmFsU3RvcmFnZUZvcm0gZXh0ZW5kcyBTdG9yYWdlRm9ybSB7XG4gIGlzSW5pdExvYWQ6IGJvb2xlYW47XG4gIGJpbmRlcjogP0JpbmRlcjtcbiAgY29tcG9uZW50T2JzZXJ2ZXJzOiBNYXA8Rm9ybUNvbXBvbmVudEVsZW1lbnQsIE11dGF0aW9uT2JzZXJ2ZXI+O1xufVxuXG5jb25zdCBERUZBVUxUX1NZTkNfSU5URVJWQUwgPSA3MDA7XG5cbmV4cG9ydCBmdW5jdGlvbiBtaXhpblN0b3JhZ2VGb3JtPFQ6IEhUTUxGb3JtRWxlbWVudD4oYzogQ2xhc3M8VD4pOiBDbGFzczxUICYgU3RvcmFnZUZvcm0+IHtcbiAgLy8gJEZsb3dGaXhNZSBGb3JjZSBjYXN0IHRvIHRoZSByZXR1cm5lZCB0eXBlLlxuICByZXR1cm4gY2xhc3MgZXh0ZW5kcyBjIHtcbiAgICBpc0luaXRMb2FkOiBib29sZWFuO1xuICAgIGJpbmRlcjogP0JpbmRlcjtcbiAgICBjb21wb25lbnRPYnNlcnZlcnM6IE1hcDxGb3JtQ29tcG9uZW50RWxlbWVudCwgTXV0YXRpb25PYnNlcnZlcj47XG5cbiAgICBnZXQgYXV0b3N5bmMoKTogbnVtYmVyIHtcbiAgICAgIGNvbnN0IG4gPSBwYXJzZUludChnZXRBdHRyKHRoaXMsIFwiYXV0b3N5bmNcIikpO1xuICAgICAgcmV0dXJuIG4gPiAwID8gbiA6IERFRkFVTFRfU1lOQ19JTlRFUlZBTDtcbiAgICB9XG4gICAgc2V0IGF1dG9zeW5jKHY6IGFueSkgeyBzZXRBdHRyKHRoaXMsIFwiYXV0b3N5bmNcIiwgdik7IH1cbiAgICBnZXQgYXJlYSgpOiBhaC5BcmVhIHsgcmV0dXJuIGdldEF0dHIodGhpcywgXCJhcmVhXCIpOyB9XG4gICAgc2V0IGFyZWEodjogYW55KSB7IHNldEF0dHIodGhpcywgXCJhcmVhXCIsIHYpOyB9XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgdGhpcy5pc0luaXRMb2FkID0gdHJ1ZTtcbiAgICAgIHRoaXMuY29tcG9uZW50T2JzZXJ2ZXJzID0gbmV3IE1hcCgpO1xuXG4gICAgICBpbml0QmluZGVyKHRoaXMpO1xuXG4gICAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHN1Ym1pdCh0aGlzKTtcbiAgICAgIH0pO1xuXG4gICAgICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcInVubG9hZFwiLCAoKSA9PiB7XG4gICAgICAgIGlmIChpc0F1dG9TeW5jRW5hYmxlZCh0aGlzKSkge1xuICAgICAgICAgIHN5bmModGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBuZXcgTXV0YXRpb25PYnNlcnZlcigocmVjb3JkcykgPT4ge1xuICAgICAgICBjb25zb2xlLmRlYnVnKFwic2NhbiBieSBmb3JtIE11dGF0aW9uT2JzZXJ2ZXI6IFwiLCB0aGlzKTtcbiAgICAgICAgc2Nhbih0aGlzKTtcblxuICAgICAgICBjb25zdCBhZGRlZDogQXJyYXk8SFRNTEVsZW1lbnQ+ID1cbiAgICAgICAgICAgICAgZmxhdHRlbihyZWNvcmRzLm1hcChyID0+IChyLmFkZGVkTm9kZXM6IEl0ZXJhYmxlPGFueT4pKSlcbiAgICAgICAgICAgICAgLmZpbHRlcigoZSkgPT4gZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KTtcbiAgICAgICAgaWYgKGFkZGVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGUgb2YgYWRkZWQpIHtcbiAgICAgICAgICAgIG9ic2VydmVDb21wb25lbnQodGhpcywgZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgcmVtb3ZlZDogQXJyYXk8SFRNTEVsZW1lbnQ+ID1cbiAgICAgICAgICAgICAgZmxhdHRlbihyZWNvcmRzLm1hcCgocikgPT4gKHIucmVtb3ZlZE5vZGVzOiBJdGVyYWJsZTxhbnk+KSkpXG4gICAgICAgICAgICAgIC5maWx0ZXIoKGUpID0+IGUgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCk7XG4gICAgICAgIGlmIChyZW1vdmVkLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAvLyBVc2UgYW55IHRvIGZvcmNlIGNhc3QgdG8gQXJyYXk8Rm9ybUNvbXBvbmVudEVsZW1lbnRzPlxuICAgICAgICAgIHJlbW92ZSh0aGlzLCAocmVtb3ZlZC5maWx0ZXIoKGUpID0+IChlOiBhbnkpLm5hbWUpOiBBcnJheTxhbnk+KSk7XG4gICAgICAgICAgZm9yIChjb25zdCBlIG9mIHJlbW92ZWQpIHtcbiAgICAgICAgICAgIGRpc2Nvbm5lY3RDb21wb25lbnQodGhpcywgZSk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KS5vYnNlcnZlKHRoaXMsIHsgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH0pO1xuXG4gICAgICBzY2FuKHRoaXMpO1xuXG4gICAgICAvLyBQZXJpb2RpY2FsIHNjYW4vc3luY1xuICAgICAgLy8gVG8gb2JzZXJ2ZTpcbiAgICAgIC8vICAgKiBzdG9yYWdlIHZhbHVlIGNoYW5naW5nc1xuICAgICAgLy8gICAqIGV4dGVybmFsIGZvcm0gY29tcG9uZW50cyAoc3VjaCBhcyBhIDxpbnB1dCBmb3JtPVwiLi4uXCIgLi4uPilcbiAgICAgIC8vICAgKiBmb3JtIHZhbHVlIGNoYW5naW5ncyBieSBhbiBleHRlcm5hbCBqYXZhc2NyaXB0XG4gICAgICAoYXN5bmMgKCkgPT4ge1xuICAgICAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgICAgIGF3YWl0IHUuc2xlZXAodGhpcy5hdXRvc3luYyk7XG4gICAgICAgICAgaWYgKGlzQXV0b1N5bmNFbmFibGVkKHRoaXMpKSB7XG4gICAgICAgICAgICBhd2FpdCBzeW5jKHRoaXMpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhd2FpdCBzY2FuKHRoaXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSkoKTtcbiAgICB9XG5cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgc2Nhbih0aGlzKTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZ2V0IG9ic2VydmVkQXR0cmlidXRlcygpIHtcbiAgICAgIHJldHVybiBbXG4gICAgICAgIFwiYXV0b3N5bmNcIixcbiAgICAgICAgXCJhcmVhXCIsXG4gICAgICBdO1xuICAgIH1cblxuICAgIGF0dHJpYnV0ZUNoYW5nZWRDYWxsYmFjayhhdHRyTmFtZTogc3RyaW5nKSB7XG4gICAgICBzd2l0Y2ggKGF0dHJOYW1lKSB7XG4gICAgICBjYXNlIFwiYXV0b3N5bmNcIjpcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIFwiYXJlYVwiOlxuICAgICAgICBpbml0QmluZGVyKHRoaXMpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG4gIH07XG59XG5cbmNvbnN0IG1peGVkRm9ybSA9IG1peGluU3RvcmFnZUZvcm0oSFRNTEZvcm1FbGVtZW50KTtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhUTUxTdG9yYWdlRm9ybUVsZW1lbnQgZXh0ZW5kcyBtaXhlZEZvcm0ge1xuICBzdGF0aWMgZ2V0IGV4dGVuZHMoKSB7IHJldHVybiBcImZvcm1cIjsgfVxuXG4gIHN0YXRpYyByZWdpc3RlcigpIHtcbiAgICAvLyBDdXN0b20gRWxlbWVudCB2MSBzZWVtcyBub3QgdG8gd29ya3MgcmlnaHQgdG8gZXh0ZW5kIDxmb3JtPiBpbiBHb29nbGUgQ2hyb21lIDU1XG4gICAgLy8gU2VlIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzQxNDU4NjkyLzM4NjQzNTFcbiAgICAvLyBQb2x5ZmlsbCB0b286IGh0dHBzOi8vZ2l0aHViLmNvbS93ZWJjb21wb25lbnRzL2N1c3RvbS1lbGVtZW50cy90cmVlL21hc3Rlci9zcmNcbiAgICAvLyA+IFRvIGRvOiBJbXBsZW1lbnQgYnVpbHQtaW4gZWxlbWVudCBleHRlbnNpb24gKGlzPSlcbiAgICAvLyBjdXN0b21FbGVtZW50cy5kZWZpbmUoXCJzdG9yYWdlLWZvcm1cIiwgU3RvcmFnZUZvcm1FbGVtZW50LCB7IGV4dGVuZHM6IFwiZm9ybVwiIH0pO1xuICAgIC8vIHdpbmRvdy5TdG9yYWdlRm9ybUVsZW1lbnQgPSBTdG9yYWdlRm9ybUVsZW1lbnQ7XG5cbiAgICAvLyBDdXN0b20gRWxlbWVudCB2MFxuICAgIGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcInN0b3JhZ2UtZm9ybVwiLCBIVE1MU3RvcmFnZUZvcm1FbGVtZW50KTtcbiAgICBkb2N1bWVudC5yZWdpc3RlckVsZW1lbnQoXCJhcmVhLXNlbGVjdFwiLCBBcmVhU2VsZWN0KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpc0F1dG9TeW5jRW5hYmxlZChzZWxmOiBIVE1MRm9ybUVsZW1lbnQpOiBib29sZWFuIHtcbiAgcmV0dXJuIHNlbGYuaGFzQXR0cmlidXRlKFwiYXV0b3N5bmNcIik7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHN1Ym1pdChzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtKTogUHJvbWlzZTx2b2lkPiB7XG4gIGlmIChzZWxmLmJpbmRlcikgYXdhaXQgc2VsZi5iaW5kZXIuc3VibWl0KGVsZW1lbnRzKHNlbGYpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gc3luYyhzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtLCB0YXJnZXRzPzogQXJyYXk8RWxlbWVudD4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbGYuYmluZGVyKSBhd2FpdCBzZWxmLmJpbmRlci5zeW5jKHRhcmdldHMgPyB0YXJnZXRzIDogZWxlbWVudHMoc2VsZikpO1xufVxuXG5hc3luYyBmdW5jdGlvbiBzY2FuKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgaWYgKHNlbGYuYmluZGVyKSBhd2FpdCBzZWxmLmJpbmRlci5zY2FuKGVsZW1lbnRzKHNlbGYpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gcmVtb3ZlKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0sIGVsZW1zOiBBcnJheTxFbGVtZW50Pik6IFByb21pc2U8dm9pZD4ge1xuICBpZiAoc2VsZi5iaW5kZXIpIGF3YWl0IHNlbGYuYmluZGVyLnJlbW92ZShlbGVtcyk7XG59XG5cbmZ1bmN0aW9uIG9ic2VydmVDb21wb25lbnQoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSwgbmV3RWxlbWVudDogSFRNTEVsZW1lbnQpOiB2b2lkIHtcbiAgY29uc3QgZWxlbWVudHM6IEFycmF5PEZvcm1Db21wb25lbnRFbGVtZW50PiA9XG4gICAgICAgIC8vIGZvcmNlIGNhc3RcbiAgICAgICAgKFtuZXdFbGVtZW50LCAuLi5BcnJheS5mcm9tKG5ld0VsZW1lbnQucXVlcnlTZWxlY3RvckFsbChcIipcIikpXVxuICAgICAgICAgLmZpbHRlcigoZSkgPT4gKGU6IGFueSkudmFsdWUgIT0gbnVsbCAmJiAoZTogYW55KS5uYW1lICE9IG51bGwpOiBhbnkpO1xuXG4gIGZvciAoY29uc3QgZSBvZiBlbGVtZW50cykge1xuICAgIGNvbnN0IG8gPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PiBzeW5jKHNlbGYsIFtlXSkpO1xuICAgIG8ub2JzZXJ2ZShlLCB7IGF0dHJpYnV0ZXM6IHRydWUsIGF0cmlidXRlRmlsdGVyOiBbXCJuYW1lXCJdIH0pO1xuICAgIHNlbGYuY29tcG9uZW50T2JzZXJ2ZXJzLnNldChlLCBvKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkaXNjb25uZWN0Q29tcG9uZW50KHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0sIGVsZW1lbnQ6IEhUTUxFbGVtZW50KTogdm9pZCB7XG4gIGNvbnN0IGVsZW1lbnRzID0gW2VsZW1lbnQsIC4uLkFycmF5LmZyb20oZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiKlwiKSldO1xuICBmb3IgKGNvbnN0IGUgb2YgZWxlbWVudHMpIHtcbiAgICBjb25zdCBvID0gc2VsZi5jb21wb25lbnRPYnNlcnZlcnMuZ2V0KChlOiBhbnkpKTtcbiAgICBpZiAobyA9PSBudWxsKSBjb250aW51ZTtcbiAgICBzZWxmLmNvbXBvbmVudE9ic2VydmVycy5kZWxldGUoKGU6IGFueSkpO1xuICAgIG8uZGlzY29ubmVjdCgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIGVsZW1lbnRzKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pOiBBcnJheTxFbGVtZW50PiB7XG4gIHJldHVybiBBcnJheS5mcm9tKCgoc2VsZi5lbGVtZW50cyk6IEl0ZXJhYmxlPGFueT4pKVxuICAgIC5maWx0ZXIoZSA9PiBlLm5hbWUpXG4gICAgLmZpbHRlcihlID0+ICEoZSBpbnN0YW5jZW9mIEFyZWFTZWxlY3QpKTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gaW5pdEJpbmRlcihzZWxmOiBJbnRlcm5hbFN0b3JhZ2VGb3JtKTogUHJvbWlzZTx2b2lkPiB7XG4gIHNlbGYuYmluZGVyID0gbnVsbDtcblxuICBjb25zdCBoID0gZ2V0QXJlYUhhbmRsZXIoc2VsZik7XG4gIGlmICghaCkgcmV0dXJuO1xuXG4gIHNlbGYuYmluZGVyID0gbmV3IEJpbmRlcihoLCB7IHdyaXRlOiB3cml0ZUZvcm0sIHJlYWQ6IHJlYWRGb3JtIH0pO1xuICBpZiAoc2VsZi5pc0luaXRMb2FkKSB7XG4gICAgc2VsZi5pc0luaXRMb2FkID0gZmFsc2U7XG4gICAgYXdhaXQgc3luYyhzZWxmKTtcbiAgfSBlbHNlIHtcbiAgICBhd2FpdCBzdWJtaXQoc2VsZik7XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JpdGVGb3JtKGNvbXBvbmVudDogYW55LCBuZXdWYWx1ZTogP1ZhbHVlKTogdm9pZCB7XG4gIGNvbnN0IHR5cGUgPSBjb21wb25lbnQudHlwZTtcbiAgaWYgKHR5cGUgPT09IFwiY2hlY2tib3hcIiB8fCB0eXBlID09PSBcInJhZGlvXCIpIHtcbiAgICBjb21wb25lbnQuY2hlY2tlZCA9IG5ld1ZhbHVlID09PSBjb21wb25lbnQudmFsdWU7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKG5ld1ZhbHVlID09IG51bGwgfHwgY29tcG9uZW50LnZhbHVlID09IG51bGwpXG4gICAgcmV0dXJuO1xuXG4gIGNvbXBvbmVudC52YWx1ZSA9IG5ld1ZhbHVlO1xufVxuXG5mdW5jdGlvbiByZWFkRm9ybShjb21wb25lbnQ6IGFueSk6ID9WYWx1ZSB7XG4gIGNvbnN0IHR5cGUgPSBjb21wb25lbnQudHlwZTtcbiAgaWYgKHR5cGUgPT09IFwiY2hlY2tib3hcIiB8fCB0eXBlID09PSBcInJhZGlvXCIpIHtcbiAgICByZXR1cm4gY29tcG9uZW50LmNoZWNrZWQgPyBjb21wb25lbnQudmFsdWUgOiBudWxsO1xuICB9XG4gIHJldHVybiBjb21wb25lbnQudmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldEFyZWFIYW5kbGVyKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pOiA/YWguQXJlYUhhbmRsZXIge1xuICBjb25zdCBhID0gc2VsZi5hcmVhO1xuICBpZiAoIWEpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiUmVxdWlyZSAnYXJlYScgYXR0cmlidXRlXCIsIHNlbGYpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGggPSBhaC5maW5kSGFuZGxlcihhKTtcbiAgaWYgKCFoKSB7XG4gICAgY29uc29sZS5kZWJ1ZyhcIk5vIHN1Y2ggYXJlYSBoYW5kbGVyOiBhcmVhPSVzLCB0aGlzPSVvXCIsIHNlbGYuYXJlYSwgc2VsZik7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cbiAgcmV0dXJuIGg7XG59XG5cbmZ1bmN0aW9uIGdldEF0dHIoc2VsZjogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHYgPSBzZWxmLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgcmV0dXJuIHYgPyB2IDogXCJcIjtcbn1cbmZ1bmN0aW9uIHNldEF0dHIoc2VsZjogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZywgdmFsdWU6ID9zdHJpbmcpOiB2b2lkIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybjtcbiAgc2VsZi5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xufVxuXG5mdW5jdGlvbiBmbGF0dGVuPFQ+KGl0ZXJpdGVyOiBJdGVyYWJsZTxJdGVyYWJsZTxUPj4pOiBBcnJheTxUPiB7XG4gIHJldHVybiBBcnJheS5mcm9tKChmdW5jdGlvbiogKCkge1xuICAgIGZvciAoY29uc3QgaXRlciBvZiBpdGVyaXRlcikgZm9yIChjb25zdCB0IG9mIGl0ZXIpIHlpZWxkIHQ7XG4gIH0pKCkpO1xufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3N0b3JhZ2UtZm9ybS5qcyJdLCJzb3VyY2VSb290IjoiIn0=