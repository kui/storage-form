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
	
	var _storageForm = __webpack_require__(7);
	
	var _storageForm2 = _interopRequireDefault(_storageForm);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	_storageForm2.default.register();

/***/ },
/* 1 */
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
	
	  read(names) {
	    var r = names.map(n => [n, this.storage.getItem(n)]).reduce((o, _ref) => {
	      var n = _ref[0],
	          v = _ref[1];
	      o[n] = v;return o;
	    }, {});
	    return Promise.resolve(r);
	  }
	
	  write(items) {
	    for (var _iterator = Object.entries(items), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
	      var _ref3;
	
	      if (_isArray) {
	        if (_i >= _iterator.length) break;
	        _ref3 = _iterator[_i++];
	      } else {
	        _i = _iterator.next();
	        if (_i.done) break;
	        _ref3 = _i.value;
	      }
	
	      var _ref2 = _ref3;
	      var n = _ref2[0];
	      var v = _ref2[1];
	
	      this.storage.setItem(n, v);
	    }return Promise.resolve();
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
	
	  read(names) {
	    return new Promise(resolve => this.storage.get(names, resolve));
	  }
	
	  write(items) {
	    return new Promise(resolve => this.storage.set(items, resolve));
	  }
	}
	
	exports.ChromeStorageAreaHandler = ChromeStorageAreaHandler;
	class BufferedWriteChromeStorageAreaHandler extends ChromeStorageAreaHandler {
	
	  constructor(storage) {
	    super(storage);
	    // what interval we should keep for a write operation.
	    this.delayMillis = 60 * 60 * 1000 / storage.MAX_WRITE_OPERATIONS_PER_HOUR + 500;
	    this.updatedEntries = null;
	    this.writePromise = Promise.reject(Error("Illegal state"));
	  }
	
	  write(items) {
	    if (this.updatedEntries != null) {
	      Object.assign(this.updatedEntries, items);
	      return this.writePromise;
	    }
	
	    this.updatedEntries = Object.assign({}, items);
	    this.writePromise = new Promise(resolve => {
	      setTimeout(() => {
	        if (this.updatedEntries == null) return;
	        this.storage.set(this.updatedEntries, resolve);
	        this.updatedEntries = null;
	      }, this.delayMillis);
	    });
	
	    return this.writePromise;
	  }
	}
	
	exports.BufferedWriteChromeStorageAreaHandler = BufferedWriteChromeStorageAreaHandler;
	if (typeof chrome !== "undefined" && chrome.storage) {
	  if (chrome.storage.local) registerHandler("chrome-local", new ChromeStorageAreaHandler(chrome.storage.local));
	  if (chrome.storage.sync) registerHandler("chrome-sync", new BufferedWriteChromeStorageAreaHandler(chrome.storage.sync));
	}

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _utils = __webpack_require__(3);
	
	var utils = _interopRequireWildcard(_utils);
	
	var _areaHandler = __webpack_require__(1);
	
	var ah = _interopRequireWildcard(_areaHandler);
	
	var _binder = __webpack_require__(5);
	
	var _binder2 = _interopRequireDefault(_binder);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
	
	class StorageBinder {
	
	  constructor(bindee) {
	    var _this = this;
	
	    this.bindee = bindee;
	    this.autoTask = null;
	    this.init();
	
	    this.doAutoTask = utils.mergeNextPromise(_asyncToGenerator(function* () {
	      if (_this.bindee.isAutoSync()) {
	        yield _this.sync();
	        return;
	      }
	      if (_this.bindee.isAutoLoad()) {
	        yield _this.load();
	        return;
	      }
	    }));
	  }
	
	  init() {
	    var _this2 = this;
	
	    this.binder = initBinder(this.bindee);
	    this.binder.onChange = (() => {
	      var _ref2 = _asyncToGenerator(function* (event) {
	        var type = { atob: "load", btoa: "submit", sync: "sync" }[event.type];
	        var e = { type, target: _this2.bindee.getTarget(), isForce: event.isForce };
	
	        if (_this2.onChange) {
	          yield _this2.onChange(e);
	        }
	      });
	
	      return function (_x) {
	        return _ref2.apply(this, arguments);
	      };
	    })();
	  }
	
	  load(o) {
	    var _this3 = this;
	
	    return _asyncToGenerator(function* () {
	      yield _this3.binder.aToB(o);
	    })();
	  }
	
	  submit(o) {
	    var _this4 = this;
	
	    return _asyncToGenerator(function* () {
	      yield _this4.binder.bToA(o);
	    })();
	  }
	
	  sync() {
	    var _this5 = this;
	
	    return _asyncToGenerator(function* () {
	      yield _this5.binder.sync();
	    })();
	  }
	
	  startAutoBinding() {
	    var _this6 = this;
	
	    return _asyncToGenerator(function* () {
	      if (_this6.autoTask) _this6.autoTask.cancell();
	
	      if (_this6.bindee.isAutoLoad() || _this6.bindee.isAutoSync()) {
	        _this6.autoTask = utils.periodicalTask({
	          interval: function interval() {
	            return _this6.bindee.getInterval();
	          },
	          task: _this6.doAutoTask
	        });
	      } else {
	        _this6.autoTask = null;
	      }
	    })();
	  }
	}
	
	exports.default = StorageBinder;
	function initBinder(bindee) {
	  return new _binder2.default({
	    a: new StorageAreaHandler(bindee),
	    b: new FormHandler(bindee),
	    diff(oldValue, newValue) {
	      return { oldValue, newValue, isChanged: oldValue !== newValue };
	    }
	  });
	}
	
	class StorageAreaHandler {
	
	  constructor(bindee) {
	    this.bindee = bindee;
	    var h = getAreaHandler(bindee);
	    this.handler = h;
	  }
	
	  readAll() {
	    var _this7 = this;
	
	    return _asyncToGenerator(function* () {
	      if (!_this7.handler) return new Map();
	      var o = yield _this7.handler.read(Array.from(_this7.bindee.getNames()));
	      var a = Object.entries(o).filter(function (_ref3) {
	        var v = _ref3[1];
	        return v != null;
	      });
	      return new Map(a);
	    })();
	  }
	
	  write(changes, isForce) {
	    var _this8 = this;
	
	    return _asyncToGenerator(function* () {
	      if (!_this8.handler) return;
	      var items = {};
	      for (var _iterator = changes, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
	        var _ref5;
	
	        if (_isArray) {
	          if (_i >= _iterator.length) break;
	          _ref5 = _iterator[_i++];
	        } else {
	          _i = _iterator.next();
	          if (_i.done) break;
	          _ref5 = _i.value;
	        }
	
	        var _ref4 = _ref5;
	        var key = _ref4[0];
	        var _ref4$ = _ref4[1];
	        var _newValue = _ref4$.newValue;
	        var _isChanged = _ref4$.isChanged;
	
	        if (isForce || _isChanged) items[key] = _newValue || "";
	      }
	      yield _this8.handler.write(items);
	    })();
	  }
	}
	
	function getAreaHandler(bindee) {
	  var a = bindee.getArea();
	  if (!a) {
	    console.warn("Require 'area' attribute: ", bindee.getTarget());
	    return null;
	  }
	  var h = ah.findHandler(a);
	  if (!h) {
	    console.warn("Unsupported 'area':", a, bindee.getTarget());
	    return null;
	  }
	  return h;
	}
	
	class FormHandler {
	
	  constructor(bindee) {
	    this.bindee = bindee;
	  }
	
	  readAll() {
	    var items = new Map();
	    for (var _iterator2 = this.bindee.getElements(), _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
	      var _ref6;
	
	      if (_isArray2) {
	        if (_i2 >= _iterator2.length) break;
	        _ref6 = _iterator2[_i2++];
	      } else {
	        _i2 = _iterator2.next();
	        if (_i2.done) break;
	        _ref6 = _i2.value;
	      }
	
	      var _e = _ref6;
	
	      var name = _e.name;
	      if (!name) continue; // filter out empty named elements
	      var prevValue = items.get(name);
	      if (prevValue) continue; // empty value should update other values such as radio list.
	      var value = readValue(_e);
	      if (value == null) continue;
	      items.set(name, value);
	    }
	    return Promise.resolve(items);
	  }
	
	  write(changes, isForce) {
	    var changeMap = new Map(changes);
	    for (var _iterator3 = this.bindee.getElements(), _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
	      var _ref7;
	
	      if (_isArray3) {
	        if (_i3 >= _iterator3.length) break;
	        _ref7 = _iterator3[_i3++];
	      } else {
	        _i3 = _iterator3.next();
	        if (_i3.done) break;
	        _ref7 = _i3.value;
	      }
	
	      var _e2 = _ref7;
	
	      var name = _e2.name;
	      if (!name) continue; // filter out empty named elements
	      var change = changeMap.get(name);
	      if (!change) continue;
	      var _isChanged2 = isForce || change.isChanged;
	      if (!_isChanged2) continue;
	      var value = change.newValue || "";
	      writeValue(_e2, value);
	    }
	    return Promise.resolve();
	  }
	}
	
	function readValue(e) {
	  if (e instanceof HTMLInputElement && ["checkbox", "radio"].includes(e.type)) {
	    if (e.checked) return e.value;
	    if (e.dataset.uncheckedValue) return e.dataset.uncheckedValue;
	    return "";
	  } else if (e.value != null) {
	    return e.value;
	  }
	}
	
	function writeValue(e, value) {
	  if (e instanceof HTMLInputElement && ["checkbox", "radio"].includes(e.type)) {
	    e.checked = e.value === value;
	  } else if (e.value != null) {
	    e.value = value;
	  }
	}

/***/ },
/* 3 */
/***/ function(module, exports) {

	"use strict";
	
	exports.__esModule = true;
	exports.sleep = sleep;
	exports.periodicalTask = periodicalTask;
	exports.dedup = dedup;
	exports.subtractSet = subtractSet;
	exports.mergeNextPromise = mergeNextPromise;
	
	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
	
	class CancellablePromise extends Promise {
	  constructor(callback, cancell) {
	    super(callback);
	    this.cancell = cancell;
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
	
	function periodicalTask(o) {
	  var sleepPromise = void 0;
	  return new CancellablePromise(_asyncToGenerator(function* () {
	    do {
	      yield o.task();
	      sleepPromise = sleep(o.interval());
	      yield sleepPromise;
	    } while (sleepPromise);
	  }), () => {
	    if (sleepPromise) sleepPromise.cancell();
	    sleepPromise = null;
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
	      var _ref2;
	
	      if (_isArray) {
	        if (_i >= _iterator.length) break;
	        _ref2 = _iterator[_i++];
	      } else {
	        _i = _iterator.next();
	        if (_i.done) break;
	        _ref2 = _i.value;
	      }
	
	      var arr = _ref2;
	
	      for (var _iterator2 = arr, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
	        var _ref3;
	
	        if (_isArray2) {
	          if (_i2 >= _iterator2.length) break;
	          _ref3 = _iterator2[_i2++];
	        } else {
	          _i2 = _iterator2.next();
	          if (_i2.done) break;
	          _ref3 = _i2.value;
	        }
	
	        var v = _ref3;
	
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
	  getOrSetEmpty(key) {
	    var v = super.get(key);
	    if (v == null) {
	      var n = [];
	      super.set(key, n);
	      return n;
	    } else {
	      return v;
	    }
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
	function mergeNextPromise(task) {
	  var currentPromise = void 0;
	  var nextPromise = void 0;
	  return _asyncToGenerator(function* () {
	    if (nextPromise) {
	      yield nextPromise;
	      return;
	    }
	
	    if (currentPromise) {
	      nextPromise = _asyncToGenerator(function* () {
	        if (currentPromise) {
	          yield currentPromise;
	        }
	        nextPromise = null;
	
	        currentPromise = task();
	        yield currentPromise;
	        currentPromise = null;
	      })();
	
	      yield nextPromise;
	      return;
	    }
	
	    currentPromise = _asyncToGenerator(function* () {
	      yield task();
	      currentPromise = null;
	    })();
	    yield currentPromise;
	  });
	}

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	exports.mixinAreaSelect = mixinAreaSelect;
	
	var _storageBinder = __webpack_require__(2);
	
	var _storageBinder2 = _interopRequireDefault(_storageBinder);
	
	var _areaHandler = __webpack_require__(1);
	
	var ah = _interopRequireWildcard(_areaHandler);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
	
	function mixinAreaSelect(c) {
	  // $FlowFixMe Force cast to the returned type.
	  return class extends c {
	
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
	          writeArea(_this);
	          dispatchEvent(_this, `area-select-${ event.type }`, event);
	        });
	
	        return function (_x) {
	          return _ref.apply(this, arguments);
	        };
	      })();
	      observeValue(this, _asyncToGenerator(function* () {
	        yield _this.binder.submit();
	      }));
	    }
	
	    attachedCallback() {
	      if (this.length === 0) addAllHandlers(this);
	      this.binder.doAutoTask();
	      writeArea(this);
	    }
	
	    static get observedAttributes() {
	      return ["area"];
	    }
	    attributeChangedCallback(attrName) {
	      switch (attrName) {
	        case "area":
	          this.binder.init();
	          this.binder.doAutoTask();
	          break;
	      }
	    }
	
	    sync() {
	      if (!this.binder) return Promise.resolve();
	      return this.binder.sync();
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
	function generateBindee(self) {
	  return {
	    getArea: () => self.area,
	    getInterval: () => 700,
	    isAutoSync: () => true,
	    isAutoLoad: () => false,
	    getNames: () => [self.name],
	    getElements: () => [self],
	    getTarget: () => self
	  };
	}
	
	function observeValue(self, onChange) {
	  var value = self.value;
	  _asyncToGenerator(function* () {
	    while (true) {
	      yield waitAnimationFrame();
	      if (self.value === value) continue;
	      value = self.value;
	      yield onChange();
	    }
	  })();
	}
	
	function waitAnimationFrame() {
	  return new Promise(r => requestAnimationFrame(r));
	}
	
	function writeArea(self) {
	  var form = self.form;
	  if (form == null) return;
	  form.setAttribute("area", self.value);
	}
	
	function addAllHandlers(self) {
	  for (var _iterator = ah.listHandlers(), _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
	    var _ref5;
	
	    if (_isArray) {
	      if (_i >= _iterator.length) break;
	      _ref5 = _iterator[_i++];
	    } else {
	      _i = _iterator.next();
	      if (_i.done) break;
	      _ref5 = _i.value;
	    }
	
	    var _ref4 = _ref5;
	    var _area = _ref4[0];
	
	    var o = document.createElement("option");
	    o.innerHTML = _area;
	    self.appendChild(o);
	  }
	}
	
	function dispatchEvent(self, type, detail) {
	  return self.dispatchEvent(new CustomEvent(type, detail));
	}
	
	function getAttr(self, name) {
	  var v = self.getAttribute(name);
	  return v ? v : "";
	}

/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";
	
	exports.__esModule = true;
	
	var lockBlock = (() => {
	  var _ref2 = _asyncToGenerator(function* (self, fn) {
	    while (self.lock) {
	      yield self.lock;
	    }self.lock = fn();
	    var t = yield self.lock;
	    self.lock = null;
	    return t;
	  });
	
	  return function lockBlock(_x3, _x4) {
	    return _ref2.apply(this, arguments);
	  };
	})();
	
	var readAndWrite = (() => {
	  var _ref3 = _asyncToGenerator(function* (self, from, to, isForce) {
	    var newValues = yield from.readAll();
	    var oldValues = self.values;
	    self.values = newValues;
	    var keys = new Set(concat(oldValues.keys(), newValues.keys()));
	    var hasChanged = false;
	    var changes = map(keys, function (k) {
	      var d = self.handler.diff(oldValues.get(k), newValues.get(k));
	      hasChanged = hasChanged || d.isChanged;
	      return [k, d];
	    });
	    yield to.write(changes, isForce);
	    return hasChanged;
	  });
	
	  return function readAndWrite(_x5, _x6, _x7, _x8) {
	    return _ref3.apply(this, arguments);
	  };
	})();
	
	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
	
	class Binder {
	
	  constructor(handler) {
	    this.handler = handler;
	    this.values = new Map();
	    this.lock = null;
	  }
	
	  aToB() {
	    var _arguments = arguments,
	        _this = this;
	
	    return _asyncToGenerator(function* () {
	      var o = _arguments.length > 0 && _arguments[0] !== undefined ? _arguments[0] : { force: false };
	
	      var hasChanged = yield lockBlock(_this, function () {
	        return readAndWrite(_this, _this.handler.a, _this.handler.b, o.force);
	      });
	      if (hasChanged && _this.onChange) yield _this.onChange({ type: "atob", isForce: o.force });
	    })();
	  }
	
	  bToA() {
	    var _arguments2 = arguments,
	        _this2 = this;
	
	    return _asyncToGenerator(function* () {
	      var o = _arguments2.length > 0 && _arguments2[0] !== undefined ? _arguments2[0] : { force: false };
	
	      var hasChanged = yield lockBlock(_this2, function () {
	        return readAndWrite(_this2, _this2.handler.b, _this2.handler.a, o.force);
	      });
	      if (hasChanged && _this2.onChange) yield _this2.onChange({ type: "btoa", isForce: o.force });
	    })();
	  }
	
	  sync() {
	    var _this3 = this;
	
	    return _asyncToGenerator(function* () {
	      var hasChanged = false;
	      yield lockBlock(_this3, _asyncToGenerator(function* () {
	        hasChanged = (yield readAndWrite(_this3, _this3.handler.a, _this3.handler.b, false)) || hasChanged;
	        hasChanged = (yield readAndWrite(_this3, _this3.handler.b, _this3.handler.a, false)) || hasChanged;
	      }));
	      if (hasChanged && _this3.onChange) yield _this3.onChange({ type: "sync", isForce: false });
	    })();
	  }
	}
	
	exports.default = Binder;
	
	
	function* concat() {
	  for (var _len = arguments.length, iters = Array(_len), _key = 0; _key < _len; _key++) {
	    iters[_key] = arguments[_key];
	  }
	
	  for (var _iterator = iters, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
	    var _ref4;
	
	    if (_isArray) {
	      if (_i >= _iterator.length) break;
	      _ref4 = _iterator[_i++];
	    } else {
	      _i = _iterator.next();
	      if (_i.done) break;
	      _ref4 = _i.value;
	    }
	
	    var iter = _ref4;
	    for (var _iterator2 = iter, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
	      var _ref5;
	
	      if (_isArray2) {
	        if (_i2 >= _iterator2.length) break;
	        _ref5 = _iterator2[_i2++];
	      } else {
	        _i2 = _iterator2.next();
	        if (_i2.done) break;
	        _ref5 = _i2.value;
	      }
	
	      var k = _ref5;
	      yield k;
	    }
	  }
	}
	
	function* map(iter, fn) {
	  for (var _iterator3 = iter, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
	    var _ref6;
	
	    if (_isArray3) {
	      if (_i3 >= _iterator3.length) break;
	      _ref6 = _iterator3[_i3++];
	    } else {
	      _i3 = _iterator3.next();
	      if (_i3.done) break;
	      _ref6 = _i3.value;
	    }
	
	    var _t = _ref6;
	    yield fn(_t);
	  }
	}

/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";
	
	exports.__esModule = true;
	exports.mixinLoadButton = mixinLoadButton;
	function mixinLoadButton(c) {
	  // $FlowFixMe Force cast to the returned type.
	  return class extends c {
	    createdCallback() {
	      this.addEventListener("click", event => {
	        event.preventDefault();
	        if (this.form && typeof this.form.load === "function") {
	          this.form.load();
	        } else {
	          console.error("Unsupported form: ", this.form);
	        }
	      });
	    }
	  };
	}
	
	var mixedButton = mixinLoadButton(HTMLButtonElement);
	class LoadButton extends mixedButton {
	  static get extends() {
	    return "button";
	  }
	}
	exports.default = LoadButton;

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	exports.mixinStorageForm = mixinStorageForm;
	
	var _utils = __webpack_require__(3);
	
	var utils = _interopRequireWildcard(_utils);
	
	var _storageBinder = __webpack_require__(2);
	
	var _storageBinder2 = _interopRequireDefault(_storageBinder);
	
	var _areaHandler = __webpack_require__(1);
	
	var ah = _interopRequireWildcard(_areaHandler);
	
	var _areaSelect = __webpack_require__(4);
	
	var _areaSelect2 = _interopRequireDefault(_areaSelect);
	
	var _loadButton = __webpack_require__(6);
	
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

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNTQ5NmVkM2MxYjkxZjViNDg0Y2YiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0b3JhZ2UtZWxlbWVudHMtcmVnaXN0ZXJlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYXJlYS1oYW5kbGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9zdG9yYWdlLWJpbmRlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvdXRpbHMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2FyZWEtc2VsZWN0LmpzIiwid2VicGFjazovLy8uL3NyYy9iaW5kZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2xvYWQtYnV0dG9uLmpzIiwid2VicGFjazovLy8uL3NyYy9zdG9yYWdlLWZvcm0uanMiXSwibmFtZXMiOlsicmVnaXN0ZXIiLCJyZWdpc3RlckhhbmRsZXIiLCJmaW5kSGFuZGxlciIsImxpc3RIYW5kbGVycyIsImhhbmRsZXJzIiwiYXJlYSIsImhhbmRsZXIiLCJFcnJvciIsIk9iamVjdCIsImVudHJpZXMiLCJXZWJTdG9yYWdlQXJlYUhhbmRsZXIiLCJjb25zdHJ1Y3RvciIsInN0b3JhZ2UiLCJyZWFkIiwibmFtZXMiLCJyIiwibWFwIiwibiIsImdldEl0ZW0iLCJyZWR1Y2UiLCJvIiwidiIsIlByb21pc2UiLCJyZXNvbHZlIiwid3JpdGUiLCJpdGVtcyIsInNldEl0ZW0iLCJsb2NhbFN0b3JhZ2UiLCJzZXNzaW9uU3RvcmFnZSIsIkNocm9tZVN0b3JhZ2VBcmVhSGFuZGxlciIsImdldCIsInNldCIsIkJ1ZmZlcmVkV3JpdGVDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIiLCJkZWxheU1pbGxpcyIsIk1BWF9XUklURV9PUEVSQVRJT05TX1BFUl9IT1VSIiwidXBkYXRlZEVudHJpZXMiLCJ3cml0ZVByb21pc2UiLCJyZWplY3QiLCJhc3NpZ24iLCJzZXRUaW1lb3V0IiwiY2hyb21lIiwibG9jYWwiLCJzeW5jIiwidXRpbHMiLCJhaCIsIlN0b3JhZ2VCaW5kZXIiLCJiaW5kZWUiLCJhdXRvVGFzayIsImluaXQiLCJkb0F1dG9UYXNrIiwibWVyZ2VOZXh0UHJvbWlzZSIsImlzQXV0b1N5bmMiLCJpc0F1dG9Mb2FkIiwibG9hZCIsImJpbmRlciIsImluaXRCaW5kZXIiLCJvbkNoYW5nZSIsImV2ZW50IiwidHlwZSIsImF0b2IiLCJidG9hIiwiZSIsInRhcmdldCIsImdldFRhcmdldCIsImlzRm9yY2UiLCJhVG9CIiwic3VibWl0IiwiYlRvQSIsInN0YXJ0QXV0b0JpbmRpbmciLCJjYW5jZWxsIiwicGVyaW9kaWNhbFRhc2siLCJpbnRlcnZhbCIsImdldEludGVydmFsIiwidGFzayIsImEiLCJTdG9yYWdlQXJlYUhhbmRsZXIiLCJiIiwiRm9ybUhhbmRsZXIiLCJkaWZmIiwib2xkVmFsdWUiLCJuZXdWYWx1ZSIsImlzQ2hhbmdlZCIsImgiLCJnZXRBcmVhSGFuZGxlciIsInJlYWRBbGwiLCJNYXAiLCJBcnJheSIsImZyb20iLCJnZXROYW1lcyIsImZpbHRlciIsImNoYW5nZXMiLCJrZXkiLCJnZXRBcmVhIiwiY29uc29sZSIsIndhcm4iLCJnZXRFbGVtZW50cyIsIm5hbWUiLCJwcmV2VmFsdWUiLCJ2YWx1ZSIsInJlYWRWYWx1ZSIsImNoYW5nZU1hcCIsImNoYW5nZSIsIndyaXRlVmFsdWUiLCJIVE1MSW5wdXRFbGVtZW50IiwiaW5jbHVkZXMiLCJjaGVja2VkIiwiZGF0YXNldCIsInVuY2hlY2tlZFZhbHVlIiwic2xlZXAiLCJkZWR1cCIsInN1YnRyYWN0U2V0IiwiQ2FuY2VsbGFibGVQcm9taXNlIiwiY2FsbGJhY2siLCJtc2VjIiwidGltZW91dElkIiwiY2xlYXJUaW1lb3V0Iiwic2xlZXBQcm9taXNlIiwiYXJyYXkiLCJwcmVkaWNhdGUiLCJ0IiwicmVzdWx0IiwiZWxlbWVudCIsInNvbWUiLCJpIiwiY29uY2F0IiwidGFyZ2V0U2V0IiwicmVtb3ZlZFNldCIsIlNldCIsImhhcyIsIk11bHRpVmFsdWVNYXAiLCJmbGF0dGVuVmFsdWVzIiwidmFsdWVzIiwiYXJyIiwiQXJyYXlWYWx1ZU1hcCIsImFkZCIsInB1c2giLCJnZXRPclNldEVtcHR5IiwiU2V0VmFsdWVNYXAiLCJjdXJyZW50UHJvbWlzZSIsIm5leHRQcm9taXNlIiwibWl4aW5BcmVhU2VsZWN0IiwiYyIsImdldEF0dHIiLCJzZXRBdHRyaWJ1dGUiLCJjcmVhdGVkQ2FsbGJhY2siLCJnZW5lcmF0ZUJpbmRlZSIsIndyaXRlQXJlYSIsImRpc3BhdGNoRXZlbnQiLCJvYnNlcnZlVmFsdWUiLCJhdHRhY2hlZENhbGxiYWNrIiwibGVuZ3RoIiwiYWRkQWxsSGFuZGxlcnMiLCJvYnNlcnZlZEF0dHJpYnV0ZXMiLCJhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2siLCJhdHRyTmFtZSIsIm1peGVkU2VsZWN0IiwiSFRNTFNlbGVjdEVsZW1lbnQiLCJIVE1MQXJlYVNlbGVjdEVsZW1lbnQiLCJleHRlbmRzIiwic2VsZiIsIndhaXRBbmltYXRpb25GcmFtZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsImZvcm0iLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJpbm5lckhUTUwiLCJhcHBlbmRDaGlsZCIsImRldGFpbCIsIkN1c3RvbUV2ZW50IiwiZ2V0QXR0cmlidXRlIiwiZm4iLCJsb2NrIiwibG9ja0Jsb2NrIiwidG8iLCJuZXdWYWx1ZXMiLCJvbGRWYWx1ZXMiLCJrZXlzIiwiaGFzQ2hhbmdlZCIsImsiLCJkIiwicmVhZEFuZFdyaXRlIiwiQmluZGVyIiwiZm9yY2UiLCJpdGVycyIsIml0ZXIiLCJtaXhpbkxvYWRCdXR0b24iLCJhZGRFdmVudExpc3RlbmVyIiwicHJldmVudERlZmF1bHQiLCJlcnJvciIsIm1peGVkQnV0dG9uIiwiSFRNTEJ1dHRvbkVsZW1lbnQiLCJMb2FkQnV0dG9uIiwibWl4aW5TdG9yYWdlRm9ybSIsIkRFRkFVTFRfSU5URVJWQUwiLCJhdXRvc3luYyIsImhhc0F0dHJpYnV0ZSIsInNldEF0dHJBc0Jvb2xlYW4iLCJhdXRvbG9hZCIsInBhcnNlSW50Iiwic2V0T2JzZXJ2ZXIiLCJnZXRTdG9yYWdlRWxlbWVudHMiLCJlbGVtZW50cyIsIm1peGVkRm9ybSIsIkhUTUxGb3JtRWxlbWVudCIsIkhUTUxTdG9yYWdlRm9ybUVsZW1lbnQiLCJyZWdpc3RlckVsZW1lbnQiLCJmb3JtQ29udHJvbE9ic2VydmVycyIsIm9ic2VydmVGb3JtQ29udHJvbCIsIk11dGF0aW9uT2JzZXJ2ZXIiLCJvYnNlcnZlIiwiYXR0cmlidXRlcyIsImF0cmlidXRlRmlsdGVyIiwiZGlzY29ubmVjdEZvcm1Db250cm9sIiwiZGlzY29ubmVjdCIsImRlbGV0ZSIsIm9ic2VydmVGb3JtQ29udHJvbHMiLCJhZGRlZEVsZW1lbnRzIiwicmVtb3ZlZEVsZW1lbnRzIiwibmV3RWxlbWVudHMiLCJpc0VxdWFsc0FycmF5Iiwib2xkU2V0IiwibmV3U2V0IiwibGVuIiwicmVtb3ZlQXR0cmlidXRlIiwibWFwcGVyIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsdUJBQWU7QUFDZjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7Ozs7Ozs7O0FDckNBOzs7Ozs7QUFFQSx1QkFBbUJBLFFBQW5CLEc7Ozs7Ozs7OztTQ1NnQkMsZSxHQUFBQSxlO1NBT0FDLFcsR0FBQUEsVztTQUlBQyxZLEdBQUFBLFk7O0FBdEJoQjs7QUFTQSxLQUFNQyxXQUEwQyxFQUFoRDs7QUFFTyxVQUFTSCxlQUFULENBQXlCSSxJQUF6QixFQUFxQ0MsT0FBckMsRUFBaUU7QUFDdEUsT0FBSUYsU0FBU0MsSUFBVCxDQUFKLEVBQW9CO0FBQ2xCLFdBQU1FLE1BQU8sb0NBQWtDRixJQUFLLElBQTlDLENBQU47QUFDRDtBQUNERCxZQUFTQyxJQUFULElBQWlCQyxPQUFqQjtBQUNEOztBQUVNLFVBQVNKLFdBQVQsQ0FBcUJHLElBQXJCLEVBQStDO0FBQ3BELFVBQU9E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RCxXQUFVQyxHQUFWLENBQWN3SyxJQUFkLEVBQW9Cd0MsTUFBcEIsRUFBNEI7QUFDMUIseUJBQWdCeEMsSUFBaEI7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLFNBQVczSCxDQUFYO0FBQXNCLFdBQU1tSyxPQUFPbkssQ0FBUCxDQUFOO0FBQXRCO0FBQ0QsRSIsImZpbGUiOiJzdG9yYWdlLWVsZW1lbnRzLWRlYnVnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgNTQ5NmVkM2MxYjkxZjViNDg0Y2YiLCIvLyBAZmxvd1xuaW1wb3J0IFN0b3JhZ2VGb3JtRWxlbWVudCBmcm9tIFwiLi9zdG9yYWdlLWZvcm1cIjtcblxuU3RvcmFnZUZvcm1FbGVtZW50LnJlZ2lzdGVyKCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvc3RvcmFnZS1lbGVtZW50cy1yZWdpc3RlcmVyLmpzIiwiLy8gQGZsb3dcbi8qIGdsb2JhbCBjaHJvbWUgKi9cblxuZXhwb3J0IHR5cGUgQXJlYSA9IHN0cmluZztcblxuZXhwb3J0IGludGVyZmFjZSBBcmVhSGFuZGxlciB7XG4gIHJlYWQobmFtZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx7IFtuYW1lOiBzdHJpbmddOiA/c3RyaW5nIH0+O1xuICB3cml0ZShpdGVtczogeyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH0pOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5jb25zdCBoYW5kbGVyczogeyBbYXJlYTogQXJlYV06IEFyZWFIYW5kbGVyIH0gPSB7fTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySGFuZGxlcihhcmVhOiBBcmVhLCBoYW5kbGVyOiBBcmVhSGFuZGxlcik6IHZvaWQge1xuICBpZiAoaGFuZGxlcnNbYXJlYV0pIHtcbiAgICB0aHJvdyBFcnJvcihgQWxyZWFkeSByZWdpc3RlcmVkIGhhbmRsZXIgZm9yIFwiJHthcmVhfVwiYCk7XG4gIH1cbiAgaGFuZGxlcnNbYXJlYV0gPSBoYW5kbGVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZEhhbmRsZXIoYXJlYTogQXJlYSk6ID9BcmVhSGFuZGxlciB7XG4gIHJldHVybiBoYW5kbGVyc1thcmVhXTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpc3RIYW5kbGVycygpOiBBcnJheTxbQXJlYSwgQXJlYUhhbmRsZXJdPiB7XG4gIHJldHVybiBPYmplY3QuZW50cmllcyhoYW5kbGVycyk7XG59XG5cbi8vXG5cbmV4cG9ydCBjbGFzcyBXZWJTdG9yYWdlQXJlYUhhbmRsZXIge1xuICBzdG9yYWdlOiBTdG9yYWdlO1xuXG4gIGNvbnN0cnVjdG9yKHN0b3JhZ2U6IFN0b3JhZ2UpIHtcbiAgICB0aGlzLnN0b3JhZ2UgPSBzdG9yYWdlO1xuICB9XG5cbiAgcmVhZChuYW1lczogc3RyaW5nW10pOiBQcm9taXNlPHsgW25hbWU6IHN0cmluZ106ID9zdHJpbmcgfT4ge1xuICAgIGNvbnN0IHIgPSBuYW1lc1xuICAgICAgICAgIC5tYXAoKG4pID0+IFtuLCB0aGlzLnN0b3JhZ2UuZ2V0SXRlbShuKV0pXG4gICAgICAgICAgLnJlZHVjZSgobywgW24sIHZdKSA9PiB7IG9bbl0gPSB2OyByZXR1cm4gbzsgfSwge30pO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocik7XG4gIH1cblxuICB3cml0ZShpdGVtczogeyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBmb3IgKGNvbnN0IFtuLCB2XSBvZiBPYmplY3QuZW50cmllcyhpdGVtcykpXG4gICAgICB0aGlzLnN0b3JhZ2Uuc2V0SXRlbShuLCB2KTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cbn1cblxuaWYgKHR5cGVvZiBsb2NhbFN0b3JhZ2UgIT09IFwidW5kZWZpbmVkXCIpXG4gIHJlZ2lzdGVySGFuZGxlcihcImxvY2FsLXN0b3JhZ2VcIiwgbmV3IFdlYlN0b3JhZ2VBcmVhSGFuZGxlcihsb2NhbFN0b3JhZ2UpKTtcbmlmICh0eXBlb2Ygc2Vzc2lvblN0b3JhZ2UgIT09IFwidW5kZWZpbmVkXCIpXG4gIHJlZ2lzdGVySGFuZGxlcihcInNlc3Npb24tc3RvcmFnZVwiLCBuZXcgV2ViU3RvcmFnZUFyZWFIYW5kbGVyKHNlc3Npb25TdG9yYWdlKSk7XG5cbi8vXG5cbmV4cG9ydCBjbGFzcyBDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIge1xuICBzdG9yYWdlOiBDaHJvbWVTdG9yYWdlQXJlYTtcblxuICBjb25zdHJ1Y3RvcihzdG9yYWdlOiBDaHJvbWVTdG9yYWdlQXJlYSkge1xuICAgIHRoaXMuc3RvcmFnZSA9IHN0b3JhZ2U7XG4gIH1cblxuICByZWFkKG5hbWVzOiBzdHJpbmdbXSk6IFByb21pc2U8eyBbbmFtZTogc3RyaW5nXTogP3N0cmluZyB9PiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB0aGlzLnN0b3JhZ2UuZ2V0KG5hbWVzLCByZXNvbHZlKSk7XG4gIH1cblxuICB3cml0ZShpdGVtczogeyBbbmFtZTogc3RyaW5nXTogc3RyaW5nIH0pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHRoaXMuc3RvcmFnZS5zZXQoaXRlbXMsIHJlc29sdmUpKTtcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQnVmZmVyZWRXcml0ZUNocm9tZVN0b3JhZ2VBcmVhSGFuZGxlciBleHRlbmRzIENocm9tZVN0b3JhZ2VBcmVhSGFuZGxlciB7XG4gIGRlbGF5TWlsbGlzOiBudW1iZXI7XG4gIHVwZGF0ZWRFbnRyaWVzOiA/eyBbazogc3RyaW5nXTogc3RyaW5nIH07XG4gIHdyaXRlUHJvbWlzZTogUHJvbWlzZTx2b2lkPjtcblxuICBjb25zdHJ1Y3RvcihzdG9yYWdlOiBDaHJvbWVTdG9yYWdlQXJlYSAmIHsgTUFYX1dSSVRFX09QRVJBVElPTlNfUEVSX0hPVVI6IG51bWJlciB9KSB7XG4gICAgc3VwZXIoc3RvcmFnZSk7XG4gICAgLy8gd2hhdCBpbnRlcnZhbCB3ZSBzaG91bGQga2VlcCBmb3IgYSB3cml0ZSBvcGVyYXRpb24uXG4gICAgdGhpcy5kZWxheU1pbGxpcyA9ICg2MCAqIDYwICogMTAwMCAvIHN0b3JhZ2UuTUFYX1dSSVRFX09QRVJBVElPTlNfUEVSX0hPVVIpICsgNTAwO1xuICAgIHRoaXMudXBkYXRlZEVudHJpZXMgPSBudWxsO1xuICAgIHRoaXMud3JpdGVQcm9taXNlID0gUHJvbWlzZS5yZWplY3QoRXJyb3IoXCJJbGxlZ2FsIHN0YXRlXCIpKTtcbiAgfVxuXG4gIHdyaXRlKGl0ZW1zOiB7IFtuYW1lOiBzdHJpbmddOiBzdHJpbmcgfSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLnVwZGF0ZWRFbnRyaWVzICE9IG51bGwpIHtcbiAgICAgIE9iamVjdC5hc3NpZ24odGhpcy51cGRhdGVkRW50cmllcywgaXRlbXMpO1xuICAgICAgcmV0dXJuIHRoaXMud3JpdGVQcm9taXNlO1xuICAgIH1cblxuICAgIHRoaXMudXBkYXRlZEVudHJpZXMgPSBPYmplY3QuYXNzaWduKHt9LCBpdGVtcyk7XG4gICAgdGhpcy53cml0ZVByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLnVwZGF0ZWRFbnRyaWVzID09IG51bGwpIHJldHVybjtcbiAgICAgICAgdGhpcy5zdG9yYWdlLnNldCh0aGlzLnVwZGF0ZWRFbnRyaWVzLCByZXNvbHZlKTtcbiAgICAgICAgdGhpcy51cGRhdGVkRW50cmllcyA9IG51bGw7XG4gICAgICB9LCB0aGlzLmRlbGF5TWlsbGlzKTtcbiAgICB9KTtcblxuICAgIHJldHVybiB0aGlzLndyaXRlUHJvbWlzZTtcbiAgfVxufVxuXG5pZiAodHlwZW9mIGNocm9tZSAhPT0gXCJ1bmRlZmluZWRcIiAmJiBjaHJvbWUuc3RvcmFnZSkge1xuICBpZiAoY2hyb21lLnN0b3JhZ2UubG9jYWwpXG4gICAgcmVnaXN0ZXJIYW5kbGVyKFwiY2hyb21lLWxvY2FsXCIsIG5ldyBDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIoY2hyb21lLnN0b3JhZ2UubG9jYWwpKTtcbiAgaWYgKGNocm9tZS5zdG9yYWdlLnN5bmMpXG4gICAgcmVnaXN0ZXJIYW5kbGVyKFwiY2hyb21lLXN5bmNcIiwgbmV3IEJ1ZmZlcmVkV3JpdGVDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIoY2hyb21lLnN0b3JhZ2Uuc3luYykpO1xufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2FyZWEtaGFuZGxlci5qcyIsIi8vIEBmbG93XG5cbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgKiBhcyBhaCBmcm9tIFwiLi9hcmVhLWhhbmRsZXJcIjtcbmltcG9ydCBCaW5kZXIgZnJvbSBcIi4vYmluZGVyXCI7XG5cbmltcG9ydCB0eXBlIHsgRGF0YUhhbmRsZXIsIFN0b3JhZ2VIYW5kbGVyIH0gZnJvbSBcIi4vYmluZGVyXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQmluZGVlIHtcbiAgZ2V0QXJlYSgpOiBhaC5BcmVhO1xuICBpc0F1dG9TeW5jKCk6IGJvb2xlYW47XG4gIGlzQXV0b0xvYWQoKTogYm9vbGVhbjtcbiAgZ2V0SW50ZXJ2YWwoKTogbnVtYmVyO1xuICBnZXRFbGVtZW50cygpOiBJdGVyYWJsZTxIVE1MRWxlbWVudD47XG4gIGdldE5hbWVzKCk6IEl0ZXJhYmxlPHN0cmluZz47XG4gIGdldFRhcmdldCgpOiBIVE1MRWxlbWVudDtcbn1cblxuZGVjbGFyZSB0eXBlIENoYW5nZSA9IHsgb2xkVmFsdWU6ID9zdHJpbmcsIG5ld1ZhbHVlOiA/c3RyaW5nLCBpc0NoYW5nZWQ6IGJvb2xlYW4gfTtcblxuZGVjbGFyZSB0eXBlIENoYW5nZUV2ZW50ID0ge1xuICB0eXBlOiBcImxvYWRcIiB8IFwic3VibWl0XCIgfCBcInN5bmNcIixcbiAgdGFyZ2V0OiBIVE1MRWxlbWVudCxcbiAgaXNGb3JjZTogYm9vbGVhbixcbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFN0b3JhZ2VCaW5kZXIge1xuICBiaW5kZWU6IEJpbmRlZTtcbiAgYmluZGVyOiBCaW5kZXI8c3RyaW5nLCBzdHJpbmcsIENoYW5nZT47XG4gIGRvQXV0b1Rhc2s6ICgpID0+IFByb21pc2U8dm9pZD47XG4gIGF1dG9UYXNrOiA/dXRpbHMuQ2FuY2VsbGFibGVQcm9taXNlPHZvaWQ+O1xuXG4gIG9uQ2hhbmdlOiAoZTogQ2hhbmdlRXZlbnQpID0+IFByb21pc2U8dm9pZD47XG5cbiAgY29uc3RydWN0b3IoYmluZGVlOiBCaW5kZWUpIHtcbiAgICB0aGlzLmJpbmRlZSA9IGJpbmRlZTtcbiAgICB0aGlzLmF1dG9UYXNrID0gbnVsbDtcbiAgICB0aGlzLmluaXQoKTtcblxuICAgIHRoaXMuZG9BdXRvVGFzayA9IHV0aWxzLm1lcmdlTmV4dFByb21pc2UoYXN5bmMgKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuYmluZGVlLmlzQXV0b1N5bmMoKSkge1xuICAgICAgICBhd2FpdCB0aGlzLnN5bmMoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKHRoaXMuYmluZGVlLmlzQXV0b0xvYWQoKSkge1xuICAgICAgICBhd2FpdCB0aGlzLmxvYWQoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgaW5pdCgpIHtcbiAgICB0aGlzLmJpbmRlciA9IGluaXRCaW5kZXIodGhpcy5iaW5kZWUpO1xuICAgIHRoaXMuYmluZGVyLm9uQ2hhbmdlID0gYXN5bmMgKGV2ZW50KSA9PiB7XG4gICAgICBjb25zdCB0eXBlID0geyBhdG9iOiBcImxvYWRcIiwgYnRvYTogXCJzdWJtaXRcIiwgc3luYzogXCJzeW5jXCJ9W2V2ZW50LnR5cGVdO1xuICAgICAgY29uc3QgZSA9IHsgdHlwZSwgdGFyZ2V0OiB0aGlzLmJpbmRlZS5nZXRUYXJnZXQoKSwgaXNGb3JjZTogZXZlbnQuaXNGb3JjZSB9O1xuICAgICAgY29uc29sZS5kZWJ1ZyhcIm9uQ2hhbmdlOiBcIiwgZSk7XG4gICAgICBpZiAodGhpcy5vbkNoYW5nZSkge1xuICAgICAgICBhd2FpdCB0aGlzLm9uQ2hhbmdlKGUpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICBhc3luYyBsb2FkKG8/OiB7IGZvcmNlOiBib29sZWFuIH0pIHtcbiAgICBhd2FpdCB0aGlzLmJpbmRlci5hVG9CKG8pO1xuICB9XG5cbiAgYXN5bmMgc3VibWl0KG8/OiB7IGZvcmNlOiBib29sZWFuIH0pIHtcbiAgICBhd2FpdCB0aGlzLmJpbmRlci5iVG9BKG8pO1xuICB9XG5cbiAgYXN5bmMgc3luYygpIHtcbiAgICBhd2FpdCB0aGlzLmJpbmRlci5zeW5jKCk7XG4gIH1cblxuICBhc3luYyBzdGFydEF1dG9CaW5kaW5nKCkge1xuICAgIGlmICh0aGlzLmF1dG9UYXNrKSB0aGlzLmF1dG9UYXNrLmNhbmNlbGwoKTtcblxuICAgIGlmICh0aGlzLmJpbmRlZS5pc0F1dG9Mb2FkKCkgfHwgdGhpcy5iaW5kZWUuaXNBdXRvU3luYygpICkge1xuICAgICAgdGhpcy5hdXRvVGFzayA9IHV0aWxzLnBlcmlvZGljYWxUYXNrKHtcbiAgICAgICAgaW50ZXJ2YWw6ICgpID0+IHRoaXMuYmluZGVlLmdldEludGVydmFsKCksXG4gICAgICAgIHRhc2s6IHRoaXMuZG9BdXRvVGFzayxcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmF1dG9UYXNrID0gbnVsbDtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gaW5pdEJpbmRlcihiaW5kZWU6IEJpbmRlZSk6IEJpbmRlcjxzdHJpbmcsIHN0cmluZywgQ2hhbmdlPiB7XG4gIHJldHVybiBuZXcgQmluZGVyKCh7XG4gICAgYTogKG5ldyBTdG9yYWdlQXJlYUhhbmRsZXIoYmluZGVlKTogU3RvcmFnZUhhbmRsZXI8c3RyaW5nLCBzdHJpbmcsIENoYW5nZT4pLFxuICAgIGI6IChuZXcgRm9ybUhhbmRsZXIoYmluZGVlKTogU3RvcmFnZUhhbmRsZXI8c3RyaW5nLCBzdHJpbmcsIENoYW5nZT4pLFxuICAgIGRpZmYob2xkVmFsdWU6ID9zdHJpbmcsIG5ld1ZhbHVlOiA/c3RyaW5nKTogQ2hhbmdlIHtcbiAgICAgIHJldHVybiB7IG9sZFZhbHVlLCBuZXdWYWx1ZSwgaXNDaGFuZ2VkOiAob2xkVmFsdWUgIT09IG5ld1ZhbHVlKSB9O1xuICAgIH1cbiAgfTogRGF0YUhhbmRsZXI8c3RyaW5nLCBzdHJpbmcsIENoYW5nZT4pKTtcbn1cblxuY2xhc3MgU3RvcmFnZUFyZWFIYW5kbGVyIHtcbiAgYmluZGVlOiBCaW5kZWU7XG4gIGhhbmRsZXI6ID9haC5BcmVhSGFuZGxlcjtcblxuICBjb25zdHJ1Y3RvcihiaW5kZWU6IEJpbmRlZSkge1xuICAgIHRoaXMuYmluZGVlID0gYmluZGVlO1xuICAgIGNvbnN0IGggPSBnZXRBcmVhSGFuZGxlcihiaW5kZWUpO1xuICAgIHRoaXMuaGFuZGxlciA9IGg7XG4gIH1cblxuICBhc3luYyByZWFkQWxsKCk6IFByb21pc2U8TWFwPHN0cmluZywgc3RyaW5nPj4ge1xuICAgIGlmICghdGhpcy5oYW5kbGVyKSByZXR1cm4gbmV3IE1hcDtcbiAgICBjb25zdCBvOiB7IFtuOiBzdHJpbmddOiBzdHJpbmcgfSA9IChhd2FpdCB0aGlzLmhhbmRsZXIucmVhZChBcnJheS5mcm9tKHRoaXMuYmluZGVlLmdldE5hbWVzKCkpKTogYW55KTtcbiAgICBjb25zdCBhID0gKE9iamVjdC5lbnRyaWVzKG8pKS5maWx0ZXIoKFssIHZdKSA9PiB2ICE9IG51bGwpO1xuICAgIHJldHVybiBuZXcgTWFwKGEpO1xuICB9XG5cbiAgYXN5bmMgd3JpdGUoY2hhbmdlczogSXRlcmF0b3I8W3N0cmluZywgQ2hhbmdlXT4sIGlzRm9yY2U6IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAoIXRoaXMuaGFuZGxlcikgcmV0dXJuO1xuICAgIGNvbnN0IGl0ZW1zID0ge307XG4gICAgZm9yIChjb25zdCBba2V5LCB7IG5ld1ZhbHVlLCBpc0NoYW5nZWQgfV0gb2YgY2hhbmdlcykge1xuICAgICAgaWYgKGlzRm9yY2UgfHwgaXNDaGFuZ2VkKSBpdGVtc1trZXldID0gbmV3VmFsdWUgfHwgXCJcIjtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy5oYW5kbGVyLndyaXRlKGl0ZW1zKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBnZXRBcmVhSGFuZGxlcihiaW5kZWU6IEJpbmRlZSk6ID9haC5BcmVhSGFuZGxlciB7XG4gIGNvbnN0IGEgPSBiaW5kZWUuZ2V0QXJlYSgpO1xuICBpZiAoIWEpIHtcbiAgICBjb25zb2xlLndhcm4oXCJSZXF1aXJlICdhcmVhJyBhdHRyaWJ1dGU6IFwiLCBiaW5kZWUuZ2V0VGFyZ2V0KCkpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIGNvbnN0IGggPSBhaC5maW5kSGFuZGxlcihhKTtcbiAgaWYgKCFoKSB7XG4gICAgY29uc29sZS53YXJuKFwiVW5zdXBwb3J0ZWQgJ2FyZWEnOlwiLCBhLCBiaW5kZWUuZ2V0VGFyZ2V0KCkpO1xuICAgIHJldHVybiBudWxsO1xuICB9XG4gIHJldHVybiBoO1xufVxuXG5jbGFzcyBGb3JtSGFuZGxlciB7XG4gIGJpbmRlZTogQmluZGVlO1xuXG4gIGNvbnN0cnVjdG9yKGJpbmRlZTogQmluZGVlKSB7XG4gICAgdGhpcy5iaW5kZWUgPSBiaW5kZWU7XG4gIH1cblxuICByZWFkQWxsKCkge1xuICAgIGNvbnN0IGl0ZW1zID0gbmV3IE1hcDtcbiAgICBmb3IgKGNvbnN0IGUgb2YgdGhpcy5iaW5kZWUuZ2V0RWxlbWVudHMoKSkge1xuICAgICAgY29uc3QgbmFtZTogP3N0cmluZyA9IChlOiBhbnkpLm5hbWU7XG4gICAgICBpZiAoIW5hbWUpIGNvbnRpbnVlOyAvLyBmaWx0ZXIgb3V0IGVtcHR5IG5hbWVkIGVsZW1lbnRzXG4gICAgICBjb25zdCBwcmV2VmFsdWUgPSBpdGVtcy5nZXQobmFtZSk7XG4gICAgICBpZiAocHJldlZhbHVlKSBjb250aW51ZTsgLy8gZW1wdHkgdmFsdWUgc2hvdWxkIHVwZGF0ZSBvdGhlciB2YWx1ZXMgc3VjaCBhcyByYWRpbyBsaXN0LlxuICAgICAgY29uc3QgdmFsdWUgPSByZWFkVmFsdWUoZSk7XG4gICAgICBpZiAodmFsdWUgPT0gbnVsbCkgY29udGludWU7XG4gICAgICBpdGVtcy5zZXQobmFtZSwgdmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGl0ZW1zKTtcbiAgfVxuXG4gIHdyaXRlKGNoYW5nZXM6IEl0ZXJhdG9yPFtzdHJpbmcsIENoYW5nZV0+LCBpc0ZvcmNlOiBib29sZWFuKSB7XG4gICAgY29uc3QgY2hhbmdlTWFwID0gbmV3IE1hcChjaGFuZ2VzKTtcbiAgICBmb3IgKGNvbnN0IGUgb2YgdGhpcy5iaW5kZWUuZ2V0RWxlbWVudHMoKSkge1xuICAgICAgY29uc3QgbmFtZTogP3N0cmluZyA9IChlOiBhbnkpLm5hbWU7XG4gICAgICBpZiAoIW5hbWUpIGNvbnRpbnVlOyAvLyBmaWx0ZXIgb3V0IGVtcHR5IG5hbWVkIGVsZW1lbnRzXG4gICAgICBjb25zdCBjaGFuZ2UgPSBjaGFuZ2VNYXAuZ2V0KG5hbWUpO1xuICAgICAgaWYgKCFjaGFuZ2UpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgaXNDaGFuZ2VkID0gaXNGb3JjZSB8fCBjaGFuZ2UuaXNDaGFuZ2VkO1xuICAgICAgaWYgKCFpc0NoYW5nZWQpIGNvbnRpbnVlO1xuICAgICAgY29uc3QgdmFsdWUgPSBjaGFuZ2UubmV3VmFsdWUgfHwgXCJcIjtcbiAgICAgIHdyaXRlVmFsdWUoZSwgdmFsdWUpO1xuICAgIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gcmVhZFZhbHVlKGU6IEhUTUxFbGVtZW50KTogP3N0cmluZyB7XG4gIGlmICgoZSBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQpICYmIFtcImNoZWNrYm94XCIsIFwicmFkaW9cIl0uaW5jbHVkZXMoZS50eXBlKSkge1xuICAgIGlmIChlLmNoZWNrZWQpIHJldHVybiBlLnZhbHVlO1xuICAgIGlmIChlLmRhdGFzZXQudW5jaGVja2VkVmFsdWUpIHJldHVybiBlLmRhdGFzZXQudW5jaGVja2VkVmFsdWU7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH0gZWxzZSBpZiAoZS52YWx1ZSAhPSBudWxsKSB7XG4gICAgcmV0dXJuIChlOiBhbnkpLnZhbHVlO1xuICB9XG59XG5cbmZ1bmN0aW9uIHdyaXRlVmFsdWUoZTogSFRNTEVsZW1lbnQsIHZhbHVlOiBzdHJpbmcpIHtcbiAgaWYgKChlIGluc3RhbmNlb2YgSFRNTElucHV0RWxlbWVudCkgJiYgW1wiY2hlY2tib3hcIiwgXCJyYWRpb1wiXS5pbmNsdWRlcyhlLnR5cGUpKSB7XG4gICAgZS5jaGVja2VkID0gZS52YWx1ZSA9PT0gdmFsdWU7XG4gIH0gZWxzZSBpZiAoZS52YWx1ZSAhPSBudWxsKSB7XG4gICAgKGU6IGFueSkudmFsdWUgPSB2YWx1ZTtcbiAgfVxufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3N0b3JhZ2UtYmluZGVyLmpzIiwiLy8gQGZsb3dcblxuZXhwb3J0IGNsYXNzIENhbmNlbGxhYmxlUHJvbWlzZTxSPiBleHRlbmRzIFByb21pc2U8Uj4ge1xuICBjYW5jZWxsOiAoKSA9PiB2b2lkO1xuICBjb25zdHJ1Y3RvcihcbiAgICBjYWxsYmFjazogKFxuICAgICAgcmVzb2x2ZTogKHJlc3VsdDogUHJvbWlzZTxSPiB8IFIpID0+IHZvaWQsXG4gICAgICByZWplY3Q6IChlcnJvcjogYW55KSA9PiB2b2lkXG4gICAgKSA9PiBtaXhlZCxcbiAgICBjYW5jZWxsOiAoKSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGNhbGxiYWNrKTtcbiAgICB0aGlzLmNhbmNlbGwgPSBjYW5jZWxsO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzbGVlcChtc2VjOiBudW1iZXIpOiBDYW5jZWxsYWJsZVByb21pc2U8dm9pZD4ge1xuICBsZXQgdGltZW91dElkOiA/bnVtYmVyO1xuICByZXR1cm4gbmV3IENhbmNlbGxhYmxlUHJvbWlzZShcbiAgICAocmVzb2x2ZSkgPT4ge1xuICAgICAgdGltZW91dElkID0gc2V0VGltZW91dCgoKSA9PiByZXNvbHZlKCksIG1zZWMpO1xuICAgIH0sXG4gICAgKCkgPT4ge1xuICAgICAgY2xlYXJUaW1lb3V0KHRpbWVvdXRJZCk7XG4gICAgfVxuICApO1xufVxuXG5kZWNsYXJlIHR5cGUgUGVyaW9kaWNhbFRhc2sgPSB7IGludGVydmFsOiAoKSA9PiBudW1iZXIsIHRhc2s6ICgpID0+IFByb21pc2U8dm9pZD4gfTtcblxuZXhwb3J0IGZ1bmN0aW9uIHBlcmlvZGljYWxUYXNrKG86IFBlcmlvZGljYWxUYXNrKTogQ2FuY2VsbGFibGVQcm9taXNlPHZvaWQ+IHtcbiAgbGV0IHNsZWVwUHJvbWlzZTtcbiAgcmV0dXJuIG5ldyBDYW5jZWxsYWJsZVByb21pc2UoXG4gICAgYXN5bmMgKCkgPT4ge1xuICAgICAgZG8ge1xuICAgICAgICBhd2FpdCBvLnRhc2soKTtcbiAgICAgICAgc2xlZXBQcm9taXNlID0gc2xlZXAoby5pbnRlcnZhbCgpKTtcbiAgICAgICAgYXdhaXQgc2xlZXBQcm9taXNlO1xuICAgICAgfSB3aGlsZSAoc2xlZXBQcm9taXNlKTtcbiAgICB9LFxuICAgICgpID0+IHtcbiAgICAgIGlmIChzbGVlcFByb21pc2UpIHNsZWVwUHJvbWlzZS5jYW5jZWxsKCk7XG4gICAgICBzbGVlcFByb21pc2UgPSBudWxsO1xuICAgIH1cbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZHVwPFQ+KGFycmF5OiBBcnJheTxUPixcbiAgICAgICAgICAgICAgICAgICAgICAgICBwcmVkaWNhdGU/OiAodDogVCwgbzogVCkgPT4gYm9vbGVhbiA9ICh0LCBvKSA9PiB0ID09PSBvKTogQXJyYXk8VD4ge1xuICByZXR1cm4gYXJyYXkucmVkdWNlKChyZXN1bHQ6IEFycmF5PFQ+LCBlbGVtZW50KSA9PiB7XG4gICAgaWYgKHJlc3VsdC5zb21lKChpKSA9PiBwcmVkaWNhdGUoaSwgZWxlbWVudCkpKSByZXN1bHQ7XG4gICAgcmV0dXJuIHJlc3VsdC5jb25jYXQoZWxlbWVudCk7XG4gIH0sW10pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3VidHJhY3RTZXQ8VD4odGFyZ2V0U2V0OiBTZXQ8VD4sIHJlbW92ZWRTZXQ6IFNldDxUPik6IFNldDxUPiB7XG4gIHJldHVybiBuZXcgU2V0KEFycmF5LmZyb20odGFyZ2V0U2V0KS5maWx0ZXIoKGUpID0+ICFyZW1vdmVkU2V0LmhhcyhlKSkpO1xufVxuXG5jbGFzcyBNdWx0aVZhbHVlTWFwPEssIFYsIEk6IEl0ZXJhYmxlPFY+PiBleHRlbmRzIE1hcDxLLCBJPiB7XG4gICogZmxhdHRlblZhbHVlcygpOiBJdGVyYXRvcjxWPiB7XG4gICAgZm9yIChjb25zdCBhcnIgb2YgdGhpcy52YWx1ZXMoKSkge1xuICAgICAgZm9yIChjb25zdCB2IG9mIGFycikge1xuICAgICAgICB5aWVsZCB2O1xuICAgICAgfVxuICAgIH1cbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgQXJyYXlWYWx1ZU1hcDxLLCBWPiBleHRlbmRzIE11bHRpVmFsdWVNYXA8SywgViwgQXJyYXk8Vj4+IHtcbiAgYWRkKGtleTogSywgdmFsdWU6IFYpOiB0aGlzIHtcbiAgICBsZXQgYSA9IHRoaXMuZ2V0KGtleSk7XG4gICAgaWYgKCFhKSB7XG4gICAgICBhID0gW107XG4gICAgICB0aGlzLnNldChrZXksIGEpO1xuICAgIH1cbiAgICBhLnB1c2godmFsdWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIGdldE9yU2V0RW1wdHkoa2V5OiBLKTogQXJyYXk8Vj4ge1xuICAgIGNvbnN0IHYgPSBzdXBlci5nZXQoa2V5KTtcbiAgICBpZiAodiA9PSBudWxsKSB7XG4gICAgICBjb25zdCBuID0gW107XG4gICAgICBzdXBlci5zZXQoa2V5LCBuKTtcbiAgICAgIHJldHVybiBuO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdjtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNldFZhbHVlTWFwPEssIFY+IGV4dGVuZHMgTXVsdGlWYWx1ZU1hcDxLLCBWLCBTZXQ8Vj4+IHtcbiAgYWRkKGtleTogSywgdmFsdWU6IFYpOiB0aGlzIHtcbiAgICBsZXQgYSA9IHRoaXMuZ2V0KGtleSk7XG4gICAgaWYgKCFhKSB7XG4gICAgICBhID0gbmV3IFNldCgpO1xuICAgICAgdGhpcy5zZXQoa2V5LCBhKTtcbiAgICB9XG4gICAgYS5hZGQodmFsdWUpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtZXJnZU5leHRQcm9taXNlKHRhc2s6ICgpID0+IFByb21pc2U8dm9pZD4pOiAoKSA9PiBQcm9taXNlPHZvaWQ+IHtcbiAgbGV0IGN1cnJlbnRQcm9taXNlOiA/UHJvbWlzZTx2b2lkPjtcbiAgbGV0IG5leHRQcm9taXNlOiA/UHJvbWlzZTx2b2lkPjtcbiAgcmV0dXJuIGFzeW5jICgpID0+IHtcbiAgICBpZiAobmV4dFByb21pc2UpIHtcbiAgICAgIGF3YWl0IG5leHRQcm9taXNlO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmIChjdXJyZW50UHJvbWlzZSkge1xuICAgICAgbmV4dFByb21pc2UgPSAoYXN5bmMgKCkgPT4ge1xuICAgICAgICBpZiAoY3VycmVudFByb21pc2UpIHtcbiAgICAgICAgICBhd2FpdCBjdXJyZW50UHJvbWlzZTtcbiAgICAgICAgfVxuICAgICAgICBuZXh0UHJvbWlzZSA9IG51bGw7XG5cbiAgICAgICAgY3VycmVudFByb21pc2UgPSB0YXNrKCk7XG4gICAgICAgIGF3YWl0IGN1cnJlbnRQcm9taXNlO1xuICAgICAgICBjdXJyZW50UHJvbWlzZSA9IG51bGw7XG4gICAgICB9KSgpO1xuXG4gICAgICBhd2FpdCBuZXh0UHJvbWlzZTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjdXJyZW50UHJvbWlzZSA9IChhc3luYyAoKSA9PiB7XG4gICAgICBhd2FpdCB0YXNrKCk7XG4gICAgICBjdXJyZW50UHJvbWlzZSA9IG51bGw7XG4gICAgfSkoKTtcbiAgICBhd2FpdCBjdXJyZW50UHJvbWlzZTtcbiAgfTtcbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy91dGlscy5qcyIsIi8vIEBmbG93XG5cbmltcG9ydCBTdG9yYWdlQmluZGVyIGZyb20gXCIuL3N0b3JhZ2UtYmluZGVyXCI7XG5pbXBvcnQgKiBhcyBhaCBmcm9tIFwiLi9hcmVhLWhhbmRsZXJcIjtcblxuaW1wb3J0IHR5cGUgeyBCaW5kZWUgfSBmcm9tIFwiLi9zdG9yYWdlLWJpbmRlclwiO1xuXG5pbnRlcmZhY2UgQXJlYVNlbGVjdCBleHRlbmRzIEhUTUxTZWxlY3RFbGVtZW50IHtcbiAgYXJlYTogc3RyaW5nO1xufVxuXG5pbnRlcmZhY2UgSW50ZXJuYWxBcmVhU2VsZWN0IGV4dGVuZHMgQXJlYVNlbGVjdCB7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtaXhpbkFyZWFTZWxlY3Q8VDogSFRNTFNlbGVjdEVsZW1lbnQ+KGM6IENsYXNzPFQ+KTogQ2xhc3M8VCAmIEFyZWFTZWxlY3Q+IHtcbiAgLy8gJEZsb3dGaXhNZSBGb3JjZSBjYXN0IHRvIHRoZSByZXR1cm5lZCB0eXBlLlxuICByZXR1cm4gY2xhc3MgZXh0ZW5kcyBjIHtcbiAgICBiaW5kZXI6IFN0b3JhZ2VCaW5kZXI7XG5cbiAgICBnZXQgYXJlYSgpOiBhaC5BcmVhIHsgcmV0dXJuIGdldEF0dHIodGhpcywgXCJhcmVhXCIpOyB9XG4gICAgc2V0IGFyZWEodjogYW55KSB7IHRoaXMuc2V0QXR0cmlidXRlKFwiYXJlYVwiLCB2KTsgfVxuXG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICBzdXBlcigpO1xuICAgIH1cblxuICAgIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICAgIHRoaXMuYmluZGVyID0gbmV3IFN0b3JhZ2VCaW5kZXIoZ2VuZXJhdGVCaW5kZWUodGhpcykpO1xuICAgICAgdGhpcy5iaW5kZXIub25DaGFuZ2UgPSBhc3luYyAoZXZlbnQpID0+IHtcbiAgICAgICAgd3JpdGVBcmVhKHRoaXMpO1xuICAgICAgICBkaXNwYXRjaEV2ZW50KHRoaXMsIGBhcmVhLXNlbGVjdC0ke2V2ZW50LnR5cGV9YCwgZXZlbnQpO1xuICAgICAgfTtcbiAgICAgIG9ic2VydmVWYWx1ZSh0aGlzLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGF3YWl0IHRoaXMuYmluZGVyLnN1Ym1pdCgpO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgIGlmICh0aGlzLmxlbmd0aCA9PT0gMCkgYWRkQWxsSGFuZGxlcnModGhpcyk7XG4gICAgICB0aGlzLmJpbmRlci5kb0F1dG9UYXNrKCk7XG4gICAgICB3cml0ZUFyZWEodGhpcyk7XG4gICAgfVxuXG4gICAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7IHJldHVybiBbXCJhcmVhXCJdOyB9XG4gICAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHJOYW1lOiBzdHJpbmcpIHtcbiAgICAgIHN3aXRjaCAoYXR0ck5hbWUpIHtcbiAgICAgIGNhc2UgXCJhcmVhXCI6XG4gICAgICAgIHRoaXMuYmluZGVyLmluaXQoKTtcbiAgICAgICAgdGhpcy5iaW5kZXIuZG9BdXRvVGFzaygpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBzeW5jKCkge1xuICAgICAgaWYgKCF0aGlzLmJpbmRlcikgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgcmV0dXJuIHRoaXMuYmluZGVyLnN5bmMoKTtcbiAgICB9XG4gIH07XG59XG5cbmNvbnN0IG1peGVkU2VsZWN0ID0gbWl4aW5BcmVhU2VsZWN0KEhUTUxTZWxlY3RFbGVtZW50KTtcbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhUTUxBcmVhU2VsZWN0RWxlbWVudCBleHRlbmRzIG1peGVkU2VsZWN0IHtcbiAgc3RhdGljIGdldCBleHRlbmRzKCkgeyByZXR1cm4gXCJzZWxlY3RcIjsgfVxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZUJpbmRlZShzZWxmOiBJbnRlcm5hbEFyZWFTZWxlY3QpOiBCaW5kZWUge1xuICByZXR1cm4ge1xuICAgIGdldEFyZWE6ICgpID0+IHNlbGYuYXJlYSxcbiAgICBnZXRJbnRlcnZhbDogKCkgPT4gNzAwLFxuICAgIGlzQXV0b1N5bmM6ICgpID0+IHRydWUsXG4gICAgaXNBdXRvTG9hZDogKCkgPT4gZmFsc2UsXG4gICAgZ2V0TmFtZXM6ICgpID0+IFtzZWxmLm5hbWVdLFxuICAgIGdldEVsZW1lbnRzOiAoKSA9PiBbc2VsZl0sXG4gICAgZ2V0VGFyZ2V0OiAoKSA9PiBzZWxmLFxuICB9O1xufVxuXG5mdW5jdGlvbiBvYnNlcnZlVmFsdWUoc2VsZjogSW50ZXJuYWxBcmVhU2VsZWN0LCBvbkNoYW5nZTogKCkgPT4gUHJvbWlzZTx2b2lkPikge1xuICBsZXQgdmFsdWUgPSBzZWxmLnZhbHVlO1xuICAoYXN5bmMgKCkgPT4ge1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBhd2FpdCB3YWl0QW5pbWF0aW9uRnJhbWUoKTtcbiAgICAgIGlmIChzZWxmLnZhbHVlID09PSB2YWx1ZSkgY29udGludWU7XG4gICAgICB2YWx1ZSA9IHNlbGYudmFsdWU7XG4gICAgICBhd2FpdCBvbkNoYW5nZSgpO1xuICAgIH1cbiAgfSkoKTtcbn1cblxuZnVuY3Rpb24gd2FpdEFuaW1hdGlvbkZyYW1lKCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHIpID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZShyKSk7XG59XG5cbmZ1bmN0aW9uIHdyaXRlQXJlYShzZWxmOiBJbnRlcm5hbEFyZWFTZWxlY3QpIHtcbiAgY29uc3QgZm9ybSA9IHNlbGYuZm9ybTtcbiAgaWYgKGZvcm0gPT0gbnVsbCkgcmV0dXJuO1xuICBmb3JtLnNldEF0dHJpYnV0ZShcImFyZWFcIiwgc2VsZi52YWx1ZSk7XG59XG5cbmZ1bmN0aW9uIGFkZEFsbEhhbmRsZXJzKHNlbGY6IEludGVybmFsQXJlYVNlbGVjdCkge1xuICBmb3IgKGNvbnN0IFthcmVhXSBvZiBhaC5saXN0SGFuZGxlcnMoKSkge1xuICAgIGNvbnN0IG8gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwib3B0aW9uXCIpO1xuICAgIG8uaW5uZXJIVE1MID0gYXJlYTtcbiAgICBzZWxmLmFwcGVuZENoaWxkKG8pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGRpc3BhdGNoRXZlbnQoc2VsZjogSFRNTEVsZW1lbnQsIHR5cGU6IHN0cmluZywgZGV0YWlsPzogYW55KTogYm9vbGVhbiB7XG4gIHJldHVybiBzZWxmLmRpc3BhdGNoRXZlbnQobmV3IEN1c3RvbUV2ZW50KHR5cGUsIGRldGFpbCkpO1xufVxuXG5mdW5jdGlvbiBnZXRBdHRyKHNlbGY6IEhUTUxFbGVtZW50LCBuYW1lOiBzdHJpbmcpOiBzdHJpbmcge1xuICBjb25zdCB2ID0gc2VsZi5nZXRBdHRyaWJ1dGUobmFtZSk7XG4gIHJldHVybiB2ID8gdiA6IFwiXCI7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvYXJlYS1zZWxlY3QuanMiLCIvLyBAZmxvd1xuXG5kZWNsYXJlIGludGVyZmFjZSBEaWZmVmFsdWUge1xuICBpc0NoYW5nZWQ6IGJvb2xlYW47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgU3RvcmFnZUhhbmRsZXI8S2V5LCBWYWx1ZSwgQ2hhbmdlczogRGlmZlZhbHVlPiB7XG4gIHdyaXRlKGM6IEl0ZXJhdG9yPFtLZXksIENoYW5nZXNdPiwgaXNGb3JjZTogYm9vbGVhbik6IFByb21pc2U8dm9pZD47XG4gIHJlYWRBbGwoKTogUHJvbWlzZTxNYXA8S2V5LCBWYWx1ZT4+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIERhdGFIYW5kbGVyPEtleSwgVmFsdWUsIENoYW5nZXM6IERpZmZWYWx1ZT4ge1xuICBhOiBTdG9yYWdlSGFuZGxlcjxLZXksIFZhbHVlLCBDaGFuZ2VzPjtcbiAgYjogU3RvcmFnZUhhbmRsZXI8S2V5LCBWYWx1ZSwgQ2hhbmdlcz47XG4gIGRpZmYob2xkVmFsdWU6ID9WYWx1ZSwgbmV3VmFsdWU6ID9WYWx1ZSk6IENoYW5nZXM7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVmFsdWVDaGFuZ2VFdmVudCB7XG4gIHR5cGU6IFwiYXRvYlwiIHwgXCJidG9hXCIgfCBcInN5bmNcIjtcbiAgaXNGb3JjZTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgQmluZGVyPEtleSwgVmFsdWUsIENoYW5nZXM6IERpZmZWYWx1ZT4ge1xuICBoYW5kbGVyOiBEYXRhSGFuZGxlcjxLZXksIFZhbHVlLCBDaGFuZ2VzPjtcbiAgdmFsdWVzOiBNYXA8S2V5LCBWYWx1ZT47XG4gIGxvY2s6ID9Qcm9taXNlPGFueT47XG4gIG9uQ2hhbmdlOiAoZTogVmFsdWVDaGFuZ2VFdmVudCkgPT4gUHJvbWlzZTx2b2lkPjtcblxuICBjb25zdHJ1Y3RvcihoYW5kbGVyOiBEYXRhSGFuZGxlcjxLZXksIFZhbHVlLCBDaGFuZ2VzPikge1xuICAgIHRoaXMuaGFuZGxlciA9IGhhbmRsZXI7XG4gICAgdGhpcy52YWx1ZXMgPSBuZXcgTWFwO1xuICAgIHRoaXMubG9jayA9IG51bGw7XG4gIH1cblxuICBhc3luYyBhVG9CKG8/OiB7IGZvcmNlOiBib29sZWFuIH0gPSB7IGZvcmNlOiBmYWxzZSB9KSB7XG4gICAgY29uc3QgaGFzQ2hhbmdlZCA9XG4gICAgICAgICAgYXdhaXQgbG9ja0Jsb2NrKHRoaXMsICgpID0+IHJlYWRBbmRXcml0ZSh0aGlzLCB0aGlzLmhhbmRsZXIuYSwgdGhpcy5oYW5kbGVyLmIsIG8uZm9yY2UpKTtcbiAgICBpZiAoaGFzQ2hhbmdlZCAmJiB0aGlzLm9uQ2hhbmdlKSBhd2FpdCB0aGlzLm9uQ2hhbmdlKHsgdHlwZTogXCJhdG9iXCIsIGlzRm9yY2U6IG8uZm9yY2V9KTtcbiAgfVxuXG4gIGFzeW5jIGJUb0Eobz86IHsgZm9yY2U6IGJvb2xlYW4gfSA9IHsgZm9yY2U6IGZhbHNlIH0pIHtcbiAgICBjb25zdCBoYXNDaGFuZ2VkID1cbiAgICAgICAgICBhd2FpdCBsb2NrQmxvY2sodGhpcywgKCkgPT4gcmVhZEFuZFdyaXRlKHRoaXMsIHRoaXMuaGFuZGxlci5iLCB0aGlzLmhhbmRsZXIuYSwgby5mb3JjZSkpO1xuICAgIGlmIChoYXNDaGFuZ2VkICYmIHRoaXMub25DaGFuZ2UpIGF3YWl0IHRoaXMub25DaGFuZ2UoeyB0eXBlOiBcImJ0b2FcIiwgaXNGb3JjZTogby5mb3JjZX0pO1xuICB9XG5cbiAgYXN5bmMgc3luYygpIHtcbiAgICBsZXQgaGFzQ2hhbmdlZCA9IGZhbHNlO1xuICAgIGF3YWl0IGxvY2tCbG9jayh0aGlzLCBhc3luYyAoKSA9PiB7XG4gICAgICBoYXNDaGFuZ2VkID0gKGF3YWl0IHJlYWRBbmRXcml0ZSh0aGlzLCB0aGlzLmhhbmRsZXIuYSwgdGhpcy5oYW5kbGVyLmIsIGZhbHNlKSkgfHwgaGFzQ2hhbmdlZDtcbiAgICAgIGhhc0NoYW5nZWQgPSAoYXdhaXQgcmVhZEFuZFdyaXRlKHRoaXMsIHRoaXMuaGFuZGxlci5iLCB0aGlzLmhhbmRsZXIuYSwgZmFsc2UpKSB8fCBoYXNDaGFuZ2VkO1xuICAgIH0pO1xuICAgIGlmIChoYXNDaGFuZ2VkICYmIHRoaXMub25DaGFuZ2UpIGF3YWl0IHRoaXMub25DaGFuZ2UoeyB0eXBlOiBcInN5bmNcIiwgaXNGb3JjZTogZmFsc2V9KTtcbiAgfVxufVxuXG5hc3luYyBmdW5jdGlvbiBsb2NrQmxvY2s8SywgViwgQzogRGlmZlZhbHVlLCBUPihzZWxmOiBCaW5kZXI8SywgViwgQz4sIGZuOiAoKSA9PiBQcm9taXNlPFQ+KTogUHJvbWlzZTxUPiB7XG4gIHdoaWxlIChzZWxmLmxvY2spIGF3YWl0IHNlbGYubG9jaztcbiAgc2VsZi5sb2NrID0gZm4oKTtcbiAgY29uc3QgdCA9IGF3YWl0IHNlbGYubG9jaztcbiAgc2VsZi5sb2NrID0gbnVsbDtcbiAgcmV0dXJuIHQ7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlYWRBbmRXcml0ZTxLLCBWLCBDOiBEaWZmVmFsdWUsIEg6IFN0b3JhZ2VIYW5kbGVyPEssIFYsIEM+PihcbiAgc2VsZjogQmluZGVyPEssIFYsIEM+LCBmcm9tOiBILCB0bzogSCwgaXNGb3JjZTogYm9vbGVhbik6IFByb21pc2U8Ym9vbGVhbj4ge1xuICBjb25zdCBuZXdWYWx1ZXMgPSBhd2FpdCBmcm9tLnJlYWRBbGwoKTtcbiAgY29uc3Qgb2xkVmFsdWVzID0gc2VsZi52YWx1ZXM7XG4gIHNlbGYudmFsdWVzID0gbmV3VmFsdWVzO1xuICBjb25zdCBrZXlzOiBTZXQ8Sz4gPSBuZXcgU2V0KGNvbmNhdChvbGRWYWx1ZXMua2V5cygpLCBuZXdWYWx1ZXMua2V5cygpKSk7XG4gIGxldCBoYXNDaGFuZ2VkID0gZmFsc2U7XG4gIGNvbnN0IGNoYW5nZXMgPSBtYXAoa2V5cywgKGspID0+IHtcbiAgICBjb25zdCBkID0gc2VsZi5oYW5kbGVyLmRpZmYob2xkVmFsdWVzLmdldChrKSwgbmV3VmFsdWVzLmdldChrKSk7XG4gICAgaGFzQ2hhbmdlZCA9IGhhc0NoYW5nZWQgfHwgZC5pc0NoYW5nZWQ7XG4gICAgcmV0dXJuIFtrLCBkXTtcbiAgfSk7XG4gIGF3YWl0IHRvLndyaXRlKGNoYW5nZXMsIGlzRm9yY2UpO1xuICByZXR1cm4gaGFzQ2hhbmdlZDtcbn1cblxuZnVuY3Rpb24qIGNvbmNhdDxLPiguLi5pdGVyczogSXRlcmFibGU8Sz5bXSk6IEl0ZXJhdG9yPEs+IHtcbiAgZm9yIChjb25zdCBpdGVyIG9mIGl0ZXJzKSBmb3IgKGNvbnN0IGsgb2YgaXRlcikgeWllbGQgaztcbn1cblxuZnVuY3Rpb24qIG1hcDxULCBVPihpdGVyOiBJdGVyYWJsZTxUPiwgZm46ICh0OiBUKSA9PiBVKTogSXRlcmF0b3I8VT4ge1xuICBmb3IgKGNvbnN0IHQgb2YgaXRlcikgeWllbGQgZm4odCk7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvYmluZGVyLmpzIiwiLy8gQGZsb3dcblxuZXhwb3J0IGZ1bmN0aW9uIG1peGluTG9hZEJ1dHRvbjxUOiBIVE1MQnV0dG9uRWxlbWVudD4oYzogQ2xhc3M8VD4pOiBDbGFzczxUPiB7XG4gIC8vICRGbG93Rml4TWUgRm9yY2UgY2FzdCB0byB0aGUgcmV0dXJuZWQgdHlwZS5cbiAgcmV0dXJuIGNsYXNzIGV4dGVuZHMgYyB7XG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50OiBNb3VzZUV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGlmICh0aGlzLmZvcm0gJiYgdHlwZW9mIHRoaXMuZm9ybS5sb2FkID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICB0aGlzLmZvcm0ubG9hZCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbnN1cHBvcnRlZCBmb3JtOiBcIiwgdGhpcy5mb3JtKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9O1xufVxuXG5jb25zdCBtaXhlZEJ1dHRvbiA9IG1peGluTG9hZEJ1dHRvbihIVE1MQnV0dG9uRWxlbWVudCk7XG5leHBvcnQgZGVmYXVsdCBjbGFzcyBMb2FkQnV0dG9uIGV4dGVuZHMgbWl4ZWRCdXR0b24ge1xuICBzdGF0aWMgZ2V0IGV4dGVuZHMoKSB7IHJldHVybiBcImJ1dHRvblwiOyB9XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvbG9hZC1idXR0b24uanMiLCIvLyBAZmxvd1xuXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tIFwiLi91dGlsc1wiO1xuaW1wb3J0IFN0b3JhZ2VCaW5kZXIgZnJvbSBcIi4vc3RvcmFnZS1iaW5kZXJcIjtcbmltcG9ydCAqIGFzIGFoIGZyb20gXCIuL2FyZWEtaGFuZGxlclwiO1xuaW1wb3J0IEFyZWFTZWxlY3QgZnJvbSBcIi4vYXJlYS1zZWxlY3RcIjtcbmltcG9ydCBMb2FkQnV0dG9uIGZyb20gXCIuL2xvYWQtYnV0dG9uXCI7XG5cbmltcG9ydCB0eXBlIHsgQmluZGVlIH0gZnJvbSBcIi4vc3RvcmFnZS1iaW5kZXJcIjtcblxuZGVjbGFyZSBpbnRlcmZhY2UgRm9ybUNvbnRyb2xFbGVtZW50IGV4dGVuZHMgSFRNTEVsZW1lbnQge1xuICBuYW1lOiBzdHJpbmc7XG4gIHZhbHVlPzogc3RyaW5nO1xuICB0eXBlPzogc3RyaW5nO1xuICBjaGVja2VkPzogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTdG9yYWdlRm9ybSBleHRlbmRzIEhUTUxGb3JtRWxlbWVudCB7XG4gIGF1dG9zeW5jOiBib29sZWFuO1xuICBhdXRvbG9hZDogYm9vbGVhbjtcbiAgaW50ZXJ2YWw6IG51bWJlcjtcbiAgYXJlYTogc3RyaW5nO1xuXG4gIGxvYWQoKTogUHJvbWlzZTx2b2lkPjtcbiAgc3luYygpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5kZWNsYXJlIGludGVyZmFjZSBJbnRlcm5hbFN0b3JhZ2VGb3JtIGV4dGVuZHMgU3RvcmFnZUZvcm0ge1xuICBiaW5kZXI6IFN0b3JhZ2VCaW5kZXI7XG59XG5cbmNvbnN0IERFRkFVTFRfSU5URVJWQUwgPSA3MDA7XG5cbmV4cG9ydCBmdW5jdGlvbiBtaXhpblN0b3JhZ2VGb3JtPFQ6IEhUTUxGb3JtRWxlbWVudD4oYzogQ2xhc3M8VD4pOiBDbGFzczxUICYgU3RvcmFnZUZvcm0+IHtcbiAgLy8gJEZsb3dGaXhNZSBGb3JjZSBjYXN0IHRvIHRoZSByZXR1cm5lZCB0eXBlLlxuICByZXR1cm4gY2xhc3MgZXh0ZW5kcyBjIHtcbiAgICBpbml0QmluZGVyOiAoKSA9PiB2b2lkO1xuICAgIGJpbmRlcjogU3RvcmFnZUJpbmRlcjtcblxuICAgIGdldCBhdXRvc3luYygpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuaGFzQXR0cmlidXRlKFwiYXV0b3N5bmNcIik7IH1cbiAgICBzZXQgYXV0b3N5bmMoYjogYm9vbGVhbikgeyBzZXRBdHRyQXNCb29sZWFuKHRoaXMsIFwiYXV0b3N5bmNcIiwgYik7IH1cblxuICAgIGdldCBhdXRvbG9hZCgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuaGFzQXR0cmlidXRlKFwiYXV0b2xvYWRcIik7IH1cbiAgICBzZXQgYXV0b2xvYWQoYjogYm9vbGVhbikgeyBzZXRBdHRyQXNCb29sZWFuKHRoaXMsIFwiYXV0b2xvYWRcIiwgYik7IH1cblxuICAgIGdldCBpbnRlcnZhbCgpOiBudW1iZXIge1xuICAgICAgY29uc3QgbiA9IHBhcnNlSW50KGdldEF0dHIodGhpcywgXCJpbnRlcnZhbFwiKSk7XG4gICAgICByZXR1cm4gbiA+IDMwMCA/IG4gOiBERUZBVUxUX0lOVEVSVkFMO1xuICAgIH1cbiAgICBzZXQgaW50ZXJ2YWwodjogYW55KSB7IHRoaXMuc2V0QXR0cmlidXRlKFwiaW50ZXJ2YWxcIiwgdik7IH1cblxuICAgIGdldCBhcmVhKCk6IGFoLkFyZWEgeyByZXR1cm4gZ2V0QXR0cih0aGlzLCBcImFyZWFcIik7IH1cbiAgICBzZXQgYXJlYSh2OiBhbnkpIHsgdGhpcy5zZXRBdHRyaWJ1dGUoXCJhcmVhXCIsIHYpOyB9XG5cbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgdGhpcy5iaW5kZXIgPSBuZXcgU3RvcmFnZUJpbmRlcihnZW5lcmF0ZUJpbmRlZSh0aGlzKSk7XG4gICAgICB0aGlzLmJpbmRlci5vbkNoYW5nZSA9IGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgICBkaXNwYXRjaEV2ZW50KHRoaXMsIGBzdG9yYWdlLWZvcm0tJHtldmVudC50eXBlfWAsIGV2ZW50KTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuYmluZGVyLnN0YXJ0QXV0b0JpbmRpbmcoKTtcblxuICAgICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB0aGlzLmJpbmRlci5zdWJtaXQoeyBmb3JjZTogdHJ1ZSB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBzZXRPYnNlcnZlcih0aGlzKTtcbiAgICB9XG5cbiAgICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgICAgdGhpcy5iaW5kZXIuc3RhcnRBdXRvQmluZGluZygpO1xuICAgIH1cblxuICAgIHN0YXRpYyBnZXQgb2JzZXJ2ZWRBdHRyaWJ1dGVzKCkge1xuICAgICAgcmV0dXJuIFtcbiAgICAgICAgXCJhdXRvc3luY1wiLFxuICAgICAgICBcImF1dG9sb2FkXCIsXG4gICAgICAgIFwiYXJlYVwiLFxuICAgICAgXTtcbiAgICB9XG5cbiAgICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ck5hbWU6IHN0cmluZykge1xuICAgICAgc3dpdGNoIChhdHRyTmFtZSkge1xuICAgICAgY2FzZSBcImF1dG9zeW5jXCI6XG4gICAgICBjYXNlIFwiYXV0b2xvYWRcIjpcbiAgICAgICAgdGhpcy5iaW5kZXIuc3RhcnRBdXRvQmluZGluZygpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgXCJhcmVhXCI6XG4gICAgICAgIHRoaXMuaW5pdEJpbmRlcigpO1xuICAgICAgICB0aGlzLmJpbmRlci5kb0F1dG9UYXNrKCk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cblxuICAgIGluaXRCaW5kZXIoKSB7IHRoaXMuYmluZGVyLmluaXQoKTsgfVxuICAgIGxvYWQoKSB7IHJldHVybiB0aGlzLmJpbmRlci5sb2FkKHsgZm9yY2U6IHRydWUgfSk7IH1cbiAgICBzeW5jKCkgeyByZXR1cm4gdGhpcy5iaW5kZXIuc3luYygpOyB9XG4gIH07XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlQmluZGVlKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pOiBCaW5kZWUge1xuICByZXR1cm4ge1xuICAgIGdldEFyZWE6ICgpID0+IHNlbGYuYXJlYSxcbiAgICBnZXRJbnRlcnZhbDogKCkgPT4gc2VsZi5pbnRlcnZhbCxcbiAgICBpc0F1dG9TeW5jOiAoKSA9PiBzZWxmLmF1dG9zeW5jLFxuICAgIGlzQXV0b0xvYWQ6ICgpID0+IHNlbGYuYXV0b2xvYWQsXG4gICAgZ2V0TmFtZXM6ICgpID0+IG1hcChnZXRTdG9yYWdlRWxlbWVudHMoc2VsZiksIGUgPT4gKGU6IGFueSkubmFtZSksXG4gICAgZ2V0RWxlbWVudHM6ICgpID0+IGdldFN0b3JhZ2VFbGVtZW50cyhzZWxmKSxcbiAgICBnZXRUYXJnZXQ6ICgpID0+IHNlbGYsXG4gIH07XG59XG5cbmZ1bmN0aW9uKiBnZXRTdG9yYWdlRWxlbWVudHMoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSk6IEl0ZXJhdG9yPEhUTUxFbGVtZW50PiB7XG4gIGZvciAoY29uc3QgZSBvZiBzZWxmLmVsZW1lbnRzKSB7XG4gICAgaWYgKGUuYXJlYSAhPSBudWxsKSBjb250aW51ZTsgLy8gZmlsdGVyIG91dCBcImFyZWEtc2VsZWN0XCJcbiAgICBpZiAoIWUubmFtZSkgY29udGludWU7XG4gICAgeWllbGQgZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkaXNwYXRjaEV2ZW50KHNlbGY6IEhUTUxFbGVtZW50LCB0eXBlOiBzdHJpbmcsIGRldGFpbD86IGFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gc2VsZi5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCh0eXBlLCBkZXRhaWwpKTtcbn1cblxuY29uc3QgbWl4ZWRGb3JtID0gbWl4aW5TdG9yYWdlRm9ybShIVE1MRm9ybUVsZW1lbnQpO1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCBleHRlbmRzIG1peGVkRm9ybSB7XG4gIHN0YXRpYyBnZXQgZXh0ZW5kcygpIHsgcmV0dXJuIFwiZm9ybVwiOyB9XG5cbiAgc3RhdGljIHJlZ2lzdGVyKCkge1xuICAgIC8vIEN1c3RvbSBFbGVtZW50IHYxIHNlZW1zIG5vdCB0byB3b3JrcyByaWdodCB0byBleHRlbmQgPGZvcm0+IGluIEdvb2dsZSBDaHJvbWUgNTVcbiAgICAvLyBTZWUgaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL2EvNDE0NTg2OTIvMzg2NDM1MVxuICAgIC8vIFBvbHlmaWxsIHRvbzogaHR0cHM6Ly9naXRodWIuY29tL3dlYmNvbXBvbmVudHMvY3VzdG9tLWVsZW1lbnRzL3RyZWUvbWFzdGVyL3NyY1xuICAgIC8vID4gVG8gZG86IEltcGxlbWVudCBidWlsdC1pbiBlbGVtZW50IGV4dGVuc2lvbiAoaXM9KVxuICAgIC8vIGN1c3RvbUVsZW1lbnRzLmRlZmluZShcInN0b3JhZ2UtZm9ybVwiLCBTdG9yYWdlRm9ybUVsZW1lbnQsIHsgZXh0ZW5kczogXCJmb3JtXCIgfSk7XG4gICAgLy8gd2luZG93LlN0b3JhZ2VGb3JtRWxlbWVudCA9IFN0b3JhZ2VGb3JtRWxlbWVudDtcblxuICAgIC8vIEN1c3RvbSBFbGVtZW50IHYwXG4gICAgZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwic3RvcmFnZS1mb3JtXCIsIEhUTUxTdG9yYWdlRm9ybUVsZW1lbnQpO1xuICAgIGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcImFyZWEtc2VsZWN0XCIsIEFyZWFTZWxlY3QpO1xuICAgIGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcImxvYWQtYnV0dG9uXCIsIExvYWRCdXR0b24pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNldE9ic2VydmVyKHNlbGY6IEludGVybmFsU3RvcmFnZUZvcm0pIHtcbiAgY29uc3QgZm9ybUNvbnRyb2xPYnNlcnZlcnMgPSBuZXcgTWFwO1xuXG4gIGZ1bmN0aW9uIG9ic2VydmVGb3JtQ29udHJvbChlbGVtZW50OiBGb3JtQ29udHJvbEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCBvID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4gc2VsZi5iaW5kZXIuZG9BdXRvVGFzaygpKTtcbiAgICBvLm9ic2VydmUoZWxlbWVudCwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBhdHJpYnV0ZUZpbHRlcjogW1wibmFtZVwiXSB9KTtcbiAgICBmb3JtQ29udHJvbE9ic2VydmVycy5zZXQoZWxlbWVudCwgbyk7XG4gIH1cblxuICBmdW5jdGlvbiBkaXNjb25uZWN0Rm9ybUNvbnRyb2woZWxlbWVudDogRm9ybUNvbnRyb2xFbGVtZW50KTogdm9pZCB7XG4gICAgY29uc3QgbyA9IGZvcm1Db250cm9sT2JzZXJ2ZXJzLmdldChlbGVtZW50KTtcbiAgICBpZiAobyA9PSBudWxsKSByZXR1cm47XG4gICAgby5kaXNjb25uZWN0KCk7XG4gICAgZm9ybUNvbnRyb2xPYnNlcnZlcnMuZGVsZXRlKGVsZW1lbnQpO1xuICB9XG5cbiAgLy8gT2JzZXJ2ZSBhZGRlZC9yZW1vdmVkIGZvcm0tY29udHJvbHNcbiAgLy8gRG8gTk9UIHVzZSBNdXRhdGlvbk9ic2VydmVyLiBmb3JtIGNvbnRyb2xzIGFyZSBub3QgYWx3YXlzIHRoZSBET00gY2hpbGRyZW4gb2YgdGhlIGZvcm1cbiAgLy8gc3VjaCBhcyA8aW5wdXQgZm9ybT1cIi4uLlwiIC4uLj4uXG4gIC8vIEFuZCBNdXRhdGlvbk9ic2VydmVyIG1pZ2h0IGJlIHRvbyBoZWFieSB0byBvYnNlcnZlIGFsbCBkZXNjZW5kYW50cyBvZiBhIGJvZHkgZWxlbWVudC5cbiAgb2JzZXJ2ZUZvcm1Db250cm9scyhzZWxmLCBhc3luYyAoeyBhZGRlZEVsZW1lbnRzLCByZW1vdmVkRWxlbWVudHMgfSkgPT4ge1xuICAgIGNvbnNvbGUuZGVidWcoXCJkZXRlY3QgYWRkZWQvcmVtb3ZlZCBmb3JtLWNvbnRyb2xzXCIsIHNlbGYpO1xuICAgIGZvciAoY29uc3QgZSBvZiBhZGRlZEVsZW1lbnRzKSBvYnNlcnZlRm9ybUNvbnRyb2woZSk7XG4gICAgZm9yIChjb25zdCBlIG9mIHJlbW92ZWRFbGVtZW50cykgZGlzY29ubmVjdEZvcm1Db250cm9sKGUpO1xuICAgIGF3YWl0IHNlbGYuYmluZGVyLmRvQXV0b1Rhc2soKTtcbiAgfSk7XG59XG5cbmRlY2xhcmUgdHlwZSBGb3JtQ29udHJvbENoYW5nZXMgPSB7XG4gIGFkZGVkRWxlbWVudHM6IFNldDxGb3JtQ29udHJvbEVsZW1lbnQ+LFxuICByZW1vdmVkRWxlbWVudHM6IFNldDxGb3JtQ29udHJvbEVsZW1lbnQ+LFxufTtcbmZ1bmN0aW9uIG9ic2VydmVGb3JtQ29udHJvbHMoc2VsZjogSW50ZXJuYWxTdG9yYWdlRm9ybSwgY2FsbGJhY2s6IChyOiBGb3JtQ29udHJvbENoYW5nZXMpID0+IFByb21pc2U8dm9pZD4pIHtcbiAgbGV0IGVsZW1lbnRzID0gc2VsZi5lbGVtZW50cztcbiAgKGFzeW5jICgpID0+IHtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgYXdhaXQgd2FpdEFuaW1hdGlvbkZyYW1lKCk7XG4gICAgICBjb25zdCBuZXdFbGVtZW50cyA9IHNlbGYuZWxlbWVudHM7XG4gICAgICBpZiAoaXNFcXVhbHNBcnJheShlbGVtZW50cywgbmV3RWxlbWVudHMpKSBjb250aW51ZTtcblxuICAgICAgY29uc3Qgb2xkU2V0ID0gbmV3IFNldChlbGVtZW50cyk7XG4gICAgICBjb25zdCBuZXdTZXQgPSBuZXcgU2V0KG5ld0VsZW1lbnRzKTtcbiAgICAgIGNvbnN0IGFkZGVkRWxlbWVudHMgPSB1dGlscy5zdWJ0cmFjdFNldChuZXdTZXQsIG9sZFNldCk7XG4gICAgICBjb25zdCByZW1vdmVkRWxlbWVudHMgPSB1dGlscy5zdWJ0cmFjdFNldChvbGRTZXQsIG5ld1NldCk7XG4gICAgICBlbGVtZW50cyA9IG5ld0VsZW1lbnRzO1xuICAgICAgYXdhaXQgY2FsbGJhY2soeyBhZGRlZEVsZW1lbnRzLCByZW1vdmVkRWxlbWVudHMgfSk7XG4gICAgfVxuICB9KSgpO1xufVxuXG5mdW5jdGlvbiBpc0VxdWFsc0FycmF5KGEsIGIpIHtcbiAgaWYgKGEubGVuZ3RoICE9PSBiLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuICBjb25zdCBsZW4gPSBhLmxlbmd0aDtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykgaWYgKGFbaV0gIT09IGJbaV0pIHJldHVybiBmYWxzZTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGdldEF0dHIoc2VsZjogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHYgPSBzZWxmLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgcmV0dXJuIHYgPyB2IDogXCJcIjtcbn1cblxuZnVuY3Rpb24gc2V0QXR0ckFzQm9vbGVhbihzZWxmOiBIVE1MRWxlbWVudCwgbmFtZTogc3RyaW5nLCBiOiBib29sZWFuKSB7XG4gIGlmIChiKSB7XG4gICAgc2VsZi5zZXRBdHRyaWJ1dGUobmFtZSwgXCJcIik7XG4gIH0gZWxzZSB7XG4gICAgc2VsZi5yZW1vdmVBdHRyaWJ1dGUobmFtZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gd2FpdEFuaW1hdGlvbkZyYW1lKCkge1xuICByZXR1cm4gbmV3IFByb21pc2UoKHIpID0+IHJlcXVlc3RBbmltYXRpb25GcmFtZShyKSk7XG59XG5cbmZ1bmN0aW9uKiBtYXAoaXRlciwgbWFwcGVyKSB7XG4gIGZvciAoY29uc3QgZSBvZiBpdGVyKSB5aWVsZCBtYXBwZXIoZSk7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvc3RvcmFnZS1mb3JtLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==