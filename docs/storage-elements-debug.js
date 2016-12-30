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
	
	var _storageForm = __webpack_require__(2);
	
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
	
	  removeItem(name) {
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
	
	  removeItem(name) {
	    return new Promise(resolve => this.storage.remove(name, resolve));
	  }
	}
	exports.ChromeStorageAreaHandler = ChromeStorageAreaHandler;

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _utils = __webpack_require__(3);
	
	var u = _interopRequireWildcard(_utils);
	
	var _areaHandler = __webpack_require__(1);
	
	var ah = _interopRequireWildcard(_areaHandler);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
	
	// See https://www.w3.org/TR/html5/infrastructure.html#htmloptionscollection
	
	
	// TODO use Map<Name, Array<string>>
	
	// TODO use Map<Name, Array<?{ newValue: ?string, oldValue: ?string }>>
	var DEFAULT_SYNC_INTERVAL = 500;
	
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
	    this.values = {};
	    this.formElements = new u.ArrayValueMap();
	    this.scanIntervalMillis = 700;
	    this.componentObservers = new Map();
	    this.syncPromise = null;
	
	    this.addEventListener("submit", event => {
	      event.preventDefault();
	      this.sync(null, { noLoad: true });
	    });
	
	    new MutationObserver(() => {
	      console.debug("scan by form MutationObserver: ", this);
	      this.scanComponents();
	    }).observe(this, { childList: true, subtree: true });
	
	    this.scanComponents();
	    // this.startPeriodicalScan();
	
	    if (this.isAutoSyncEnabled()) this.startPeriodicalSync();
	  }
	
	  attachedCallback() {
	    this.scanComponents();
	
	    if (this.isAutoSyncEnabled()) this.startPeriodicalSync();
	
	    // this.startPeriodicalScan();
	  }
	
	  detachedCallback() {
	    if (this.storageSyncTask != null) clearTimeout(this.storageSyncTask);
	    this.stopPeriodicalScan();
	  }
	
	  startPeriodicalScan() {
	    var _this = this;
	
	    return _asyncToGenerator(function* () {
	      if (_this.scanTask != null) return;
	      while (true) {
	        // this loop will break by stopPeriodicalScan()
	        _this.scanTask = u.sleep(_this.scanIntervalMillis);
	        yield _this.scanTask;
	        yield _this.scanComponents();
	      }
	    })();
	  }
	  stopPeriodicalScan() {
	    if (this.scanTask == null) return;
	    this.scanTask.cancell();
	    this.scanTask = null;
	  }
	
	  startPeriodicalSync() {
	    var _this2 = this;
	
	    return _asyncToGenerator(function* () {
	      if (_this2.syncTask != null) return;
	      while (true) {
	        // this loop will break by stopPeriodicalSync()
	        _this2.syncTask = u.sleep(_this2.autosync);
	        yield _this2.syncTask;
	        yield _this2.sync();
	      }
	    })();
	  }
	  stopPeriodicalSync() {
	    if (this.syncTask == null) return;
	    this.syncTask.cancell();
	    this.syncTask = null;
	  }
	
	  scanComponents() {
	    var _this3 = this;
	
	    return _asyncToGenerator(function* () {
	      while (_this3.syncPromise) {
	        yield _this3.syncPromise;
	      }var lastElements = _this3.getFormElementSet();
	      var currentElements = _this3.getCurrentElements();
	
	      var lastNames = new Set(Object.keys(_this3.values));
	      var currentNames = names(currentElements);
	      var promises = [];
	
	      if (isEqualSet(lastNames, currentNames) && isEqualSet(lastElements, currentElements)) return;
	
	      _this3.formElements = Array.from(currentElements).reduce(function (map, e) {
	        map.add(e.name, e);
	        return map;
	      }, new u.ArrayValueMap());
	
	      var added = u.subtractSet(currentElements, lastElements);
	      if (added.size > 0) {
	        added.forEach(_this3.afterComponentAppend, _this3);
	      }
	
	      var addedNames = u.subtractSet(currentNames, lastNames);
	      Array.from(added).map(function (e) {
	        return e.name;
	      }).forEach(addedNames.add, addedNames);
	      if (addedNames.size > 0) {
	        promises.push(_this3.sync(Array.from(addedNames)));
	      }
	
	      var removed = u.subtractSet(lastElements, currentElements);
	      if (removed.size > 0) {
	        removed.forEach(_this3.afterComponentRemove, _this3);
	      }
	
	      var removedNames = u.subtractSet(lastNames, currentNames);
	      if (removedNames.size > 0) {
	        for (var _iterator = removedNames, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
	          var _ref;
	
	          if (_isArray) {
	            if (_i >= _iterator.length) break;
	            _ref = _iterator[_i++];
	          } else {
	            _i = _iterator.next();
	            if (_i.done) break;
	            _ref = _i.value;
	          }
	
	          var n = _ref;
	
	          console.debug("Removed name: %o", n);
	          delete _this3.values[n];
	        }
	      }
	
	      for (var _iterator2 = promises, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : _iterator2[Symbol.iterator]();;) {
	        var _ref2;
	
	        if (_isArray2) {
	          if (_i2 >= _iterator2.length) break;
	          _ref2 = _iterator2[_i2++];
	        } else {
	          _i2 = _iterator2.next();
	          if (_i2.done) break;
	          _ref2 = _i2.value;
	        }
	
	        var p = _ref2;
	        yield p;
	      }
	    })();
	  }
	
	  getCurrentElements() {
	    var elms = this.elements;
	    return new Set(function* () {
	      for (var _iterator3 = elms, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
	        var _ref3;
	
	        if (_isArray3) {
	          if (_i3 >= _iterator3.length) break;
	          _ref3 = _iterator3[_i3++];
	        } else {
	          _i3 = _iterator3.next();
	          if (_i3.done) break;
	          _ref3 = _i3.value;
	        }
	
	        var e = _ref3;
	
	        if (e.name) yield e;
	      }
	    }());
	  }
	
	  getFormElementSet() {
	    return new Set(this.formElements.flattenValues());
	  }
	
	  afterComponentAppend(e) {
	    console.debug("afterComponentAppend: %o", e);
	    var o = new MutationObserver(() => {
	      console.debug("scan by \"name\" atter MutationObserver: ", e);
	      this.scanComponents();
	    });
	    o.observe(e, { attributes: true, attributeFilter: ["name"] });
	    this.componentObservers.set(e, o);
	  }
	
	  afterComponentRemove(e) {
	    console.debug("afterComponentRemove: %o", e);
	    var o = this.componentObservers.get(e);
	    if (o) o.disconnect();
	  }
	
	  /// partial load if `names` was provided
	  load(names) {
	    var _this4 = this;
	
	    return _asyncToGenerator(function* () {
	      var storageValues = yield _this4.readStorageAll();
	      var storageChanges = _this4.diffValues(storageValues, _this4.values);
	
	      if (!names) names = Object.keys(storageChanges);
	
	      if (names.length === 0) return;
	
	      var subChanges = {};
	      for (var _iterator4 = names, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : _iterator4[Symbol.iterator]();;) {
	        var _ref4;
	
	        if (_isArray4) {
	          if (_i4 >= _iterator4.length) break;
	          _ref4 = _iterator4[_i4++];
	        } else {
	          _i4 = _iterator4.next();
	          if (_i4.done) break;
	          _ref4 = _i4.value;
	        }
	
	        var n = _ref4;
	
	        _this4.values[n] = storageValues[n];
	        subChanges[n] = storageChanges[n] || [];
	      }
	      _this4.writeForm(subChanges);
	    })();
	  }
	
	  /// partial store if `names` was provided
	  store(names) {
	    var _this5 = this;
	
	    return _asyncToGenerator(function* () {
	      var formValues = _this5.readFormAll();
	      var formChanges = _this5.diffValues(formValues, _this5.values);
	
	      if (!names) names = Object.keys(formChanges);
	
	      if (names.length === 0) return;
	
	      var subChanges = {};
	      for (var _iterator5 = names, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {
	        var _ref5;
	
	        if (_isArray5) {
	          if (_i5 >= _iterator5.length) break;
	          _ref5 = _iterator5[_i5++];
	        } else {
	          _i5 = _iterator5.next();
	          if (_i5.done) break;
	          _ref5 = _i5.value;
	        }
	
	        var n = _ref5;
	
	        _this5.values[n] = formValues[n];
	        subChanges[n] = formChanges[n] || [];
	      }
	      yield _this5.writeStorage(subChanges);
	    })();
	  }
	
	  diffValues(newValues, oldValues) {
	    var names = u.dedup(Object.keys(newValues).concat(Object.keys(oldValues)));
	    return names.reduce((result, name) => {
	      if (newValues[name] == null) newValues[name] = [];
	      if (oldValues[name] == null) oldValues[name] = [];
	      var values = [];
	      var len = Math.max(newValues[name].length, oldValues[name].length);
	      for (var i = 0; i < len; i++) {
	        var newValue = newValues[name][i];
	        var oldValue = oldValues[name][i];
	        values[i] = newValue === oldValue ? null : [newValue, oldValue];
	      }
	      if (values.some(v => v !== null)) result[name] = values;
	      return result;
	    }, {});
	  }
	
	  readStorageAll() {
	    var _this6 = this;
	
	    return _asyncToGenerator(function* () {
	      // start all data fatching at first
	      var ps = Array.from(_this6.formElements.flattenValues()).reduce(function (values, e) {
	        var n = e.name;
	        values[n] = _this6.readStorageByName(n);
	        return values;
	      }, {});
	
	      // resolve promises
	      var result = {};
	      for (var _iterator6 = Object.entries(ps), _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : _iterator6[Symbol.iterator]();;) {
	        var _ref7;
	
	        if (_isArray6) {
	          if (_i6 >= _iterator6.length) break;
	          _ref7 = _iterator6[_i6++];
	        } else {
	          _i6 = _iterator6.next();
	          if (_i6.done) break;
	          _ref7 = _i6.value;
	        }
	
	        var _ref6 = _ref7;
	        var _name = _ref6[0];
	        var promise = _ref6[1];
	
	        result[_name] = yield promise;
	      }
	      return result;
	    })();
	  }
	
	  readStorageByName(name) {
	    var _this7 = this;
	
	    return _asyncToGenerator(function* () {
	      var v = yield _this7.getAreaHandler().read(name);
	      return v == null ? [] : [v];
	    })();
	  }
	
	  writeForm(changes) {
	    var _this8 = this;
	
	    var _loop = function _loop(changeArray, _name2) {
	      var change = changeArray[0];
	
	      var _ref10 = change == null ? [] : change,
	          newValue = _ref10[0];
	
	      var elements = _this8.formElements.get(_name2);
	
	      if (elements == null) return "continue";
	
	      console.debug("write to form: name=%s, value=%s, elements=%o", _name2, newValue, elements);
	
	      elements.forEach(e => {
	        if (e.type === "checkbox" || e.type === "radio") {
	          e.checked = newValue === e.value;
	          return;
	        }
	
	        if (e.value != null) {
	          if (newValue == null) return;
	          e.value = newValue;
	          return;
	        }
	
	        console.error("Unsupported element: %o", e);
	      });
	    };
	
	    for (var _iterator7 = Object.entries(changes), _isArray7 = Array.isArray(_iterator7), _i7 = 0, _iterator7 = _isArray7 ? _iterator7 : _iterator7[Symbol.iterator]();;) {
	      var _ref9;
	
	      if (_isArray7) {
	        if (_i7 >= _iterator7.length) break;
	        _ref9 = _iterator7[_i7++];
	      } else {
	        _i7 = _iterator7.next();
	        if (_i7.done) break;
	        _ref9 = _i7.value;
	      }
	
	      var _ref8 = _ref9;
	      var _name2 = _ref8[0];
	      var changeArray = _ref8[1];
	
	      var _ret = _loop(changeArray, _name2);
	
	      if (_ret === "continue") continue;
	    }
	  }
	
	  writeStorage(changes) {
	    var _this9 = this;
	
	    return _asyncToGenerator(function* () {
	      var handler = _this9.getAreaHandler();
	      var promises = Object.entries(changes).map((() => {
	        var _ref12 = _asyncToGenerator(function* (_ref11) {
	          var name = _ref11[0],
	              chageArray = _ref11[1];
	
	          var c = chageArray[0];
	          if (c == null) return;
	          var newValue = c[0];
	
	
	          if (newValue == null) {
	            console.debug("remove from storage: name=%o", name);
	            yield handler.removeItem(name);
	          } else {
	            console.debug("write to storage: name=%o, value=%o", name, newValue);
	            yield handler.write(name, newValue);
	          }
	        });
	
	        return function (_x) {
	          return _ref12.apply(this, arguments);
	        };
	      })());
	      yield Promise.all(promises);
	    })();
	  }
	
	  readFormAll() {
	    return Array.from(this.formElements.flattenValues()).reduce((items, element) => {
	      if (element.value == null) return items;
	
	      var n = element.name;
	      if (items[n] == null) items[n] = [];
	
	      if (element.type === "checkbox" || element.type === "radio") {
	        if (element.checked) items[n].push(element.value);
	        return items;
	      }
	
	      // expand a <select> element to <option> elements.
	      if (element.options != null) {
	        for (var _iterator8 = element.options, _isArray8 = Array.isArray(_iterator8), _i8 = 0, _iterator8 = _isArray8 ? _iterator8 : _iterator8[Symbol.iterator]();;) {
	          var _ref13;
	
	          if (_isArray8) {
	            if (_i8 >= _iterator8.length) break;
	            _ref13 = _iterator8[_i8++];
	          } else {
	            _i8 = _iterator8.next();
	            if (_i8.done) break;
	            _ref13 = _i8.value;
	          }
	
	          var opt = _ref13;
	
	          if (opt.selected) items[n].push(opt.value);
	        }
	        return items;
	      }
	
	      items[n].push(element.value);
	      return items;
	    }, {});
	  }
	
	  getAreaHandler() {
	    var a = this.getArea();
	    if (!a) throw Error("\"area\" attribute is required");
	
	    var h = ah.findHandler(a);
	    if (!h) throw Error(`Unsupported area: "${ a }"`);
	    return h;
	  }
	
	  getArea() {
	    var a = this.getAttribute("area");
	    if (a) return a;
	    return null;
	  }
	
	  sync(names) {
	    var _arguments = arguments,
	        _this10 = this;
	
	    return _asyncToGenerator(function* () {
	      var opt = _arguments.length > 1 && _arguments[1] !== undefined ? _arguments[1] : { noLoad: false };
	
	      while (_this10.syncPromise) {
	        yield _this10.syncPromise;
	      }_this10.syncPromise = _asyncToGenerator(function* () {
	        if (!opt.noLoad) yield _this10.load(names);
	        yield _this10.store(names);
	        _this10.syncPromise = null;
	      })();
	      yield _this10.syncPromise;
	    })();
	  }
	
	  isAutoSyncEnabled() {
	    return this.hasAttribute("autosync");
	  }
	
	  static get observedAttributes() {
	    return ["autosync", "area"];
	  }
	
	  attributeChangedCallback(attrName) {
	    switch (attrName) {
	      case "autosync":
	        if (this.isAutoSyncEnabled()) {
	          this.startPeriodicalSync();
	        } else {
	          this.stopPeriodicalSync();
	        }
	        break;
	      case "area":
	        this.values = {};
	        this.formElements = new u.ArrayValueMap();
	        break;
	    }
	  }
	}
	
	exports.default = HTMLStorageFormElement;
	function isEqualSet(a, b) {
	  if (a.size !== b.size) return false;
	  for (var _iterator9 = a, _isArray9 = Array.isArray(_iterator9), _i9 = 0, _iterator9 = _isArray9 ? _iterator9 : _iterator9[Symbol.iterator]();;) {
	    var _ref15;
	
	    if (_isArray9) {
	      if (_i9 >= _iterator9.length) break;
	      _ref15 = _iterator9[_i9++];
	    } else {
	      _i9 = _iterator9.next();
	      if (_i9.done) break;
	      _ref15 = _i9.value;
	    }
	
	    var t = _ref15;
	
	    if (!b.has(t)) return false;
	  }
	  for (var _iterator10 = b, _isArray10 = Array.isArray(_iterator10), _i10 = 0, _iterator10 = _isArray10 ? _iterator10 : _iterator10[Symbol.iterator]();;) {
	    var _ref16;
	
	    if (_isArray10) {
	      if (_i10 >= _iterator10.length) break;
	      _ref16 = _iterator10[_i10++];
	    } else {
	      _i10 = _iterator10.next();
	      if (_i10.done) break;
	      _ref16 = _i10.value;
	    }
	
	    var _t = _ref16;
	
	    if (!a.has(_t)) return false;
	  }
	  return true;
	}
	function names(iter) {
	  return new Set(function* () {
	    for (var _iterator11 = iter, _isArray11 = Array.isArray(_iterator11), _i11 = 0, _iterator11 = _isArray11 ? _iterator11 : _iterator11[Symbol.iterator]();;) {
	      var _ref17;
	
	      if (_isArray11) {
	        if (_i11 >= _iterator11.length) break;
	        _ref17 = _iterator11[_i11++];
	      } else {
	        _i11 = _iterator11.next();
	        if (_i11.done) break;
	        _ref17 = _i11.value;
	      }
	
	      var e = _ref17;
	      yield e.name;
	    }
	  }());
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
/* 3 */
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

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgNzBlZGU4ZDgwMWE4MmRkMDExZDkiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0b3JhZ2UtZWxlbWVudHMtcmVnaXN0ZXJlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYXJlYS1oYW5kbGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9zdG9yYWdlLWZvcm0uanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3V0aWxzLmpzIl0sIm5hbWVzIjpbImFoIiwibG9jYWxTdG9yYWdlIiwicmVnaXN0ZXJIYW5kbGVyIiwiV2ViU3RvcmFnZUFyZWFIYW5kbGVyIiwic2Vzc2lvblN0b3JhZ2UiLCJjaHJvbWUiLCJzdG9yYWdlIiwibG9jYWwiLCJDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIiLCJzeW5jIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXQiLCJkb2N1bWVudCIsInJlZ2lzdGVyRWxlbWVudCIsImZpbmRIYW5kbGVyIiwiaGFuZGxlcnMiLCJhcmVhIiwiaGFuZGxlciIsIkVycm9yIiwiY29uc3RydWN0b3IiLCJyZWFkIiwibmFtZSIsIlByb21pc2UiLCJyZXNvbHZlIiwiZ2V0SXRlbSIsIndyaXRlIiwibmV3VmFsdWUiLCJzZXRJdGVtIiwicmVtb3ZlSXRlbSIsInYiLCJzZXQiLCJyZW1vdmUiLCJ1IiwiREVGQVVMVF9TWU5DX0lOVEVSVkFMIiwiSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCIsIkhUTUxGb3JtRWxlbWVudCIsImF1dG9zeW5jIiwibiIsInBhcnNlSW50IiwiZ2V0QXR0ciIsInNldEF0dHIiLCJjcmVhdGVkQ2FsbGJhY2siLCJ2YWx1ZXMiLCJmb3JtRWxlbWVudHMiLCJBcnJheVZhbHVlTWFwIiwic2NhbkludGVydmFsTWlsbGlzIiwiY29tcG9uZW50T2JzZXJ2ZXJzIiwiTWFwIiwic3luY1Byb21pc2UiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJwcmV2ZW50RGVmYXVsdCIsIm5vTG9hZCIsIk11dGF0aW9uT2JzZXJ2ZXIiLCJjb25zb2xlIiwiZGVidWciLCJzY2FuQ29tcG9uZW50cyIsIm9ic2VydmUiLCJjaGlsZExpc3QiLCJzdWJ0cmVlIiwiaXNBdXRvU3luY0VuYWJsZWQiLCJzdGFydFBlcmlvZGljYWxTeW5jIiwiYXR0YWNoZWRDYWxsYmFjayIsImRldGFjaGVkQ2FsbGJhY2siLCJzdG9yYWdlU3luY1Rhc2siLCJjbGVhclRpbWVvdXQiLCJzdG9wUGVyaW9kaWNhbFNjYW4iLCJzdGFydFBlcmlvZGljYWxTY2FuIiwic2NhblRhc2siLCJzbGVlcCIsImNhbmNlbGwiLCJzeW5jVGFzayIsInN0b3BQZXJpb2RpY2FsU3luYyIsImxhc3RFbGVtZW50cyIsImdldEZvcm1FbGVtZW50U2V0IiwiY3VycmVudEVsZW1lbnRzIiwiZ2V0Q3VycmVudEVsZW1lbnRzIiwibGFzdE5hbWVzIiwiU2V0Iiwia2V5cyIsImN1cnJlbnROYW1lcyIsIm5hbWVzIiwicHJvbWlzZXMiLCJpc0VxdWFsU2V0IiwiQXJyYXkiLCJmcm9tIiwicmVkdWNlIiwibWFwIiwiZSIsImFkZCIsImFkZGVkIiwic3VidHJhY3RTZXQiLCJzaXplIiwiZm9yRWFjaCIsImFmdGVyQ29tcG9uZW50QXBwZW5kIiwiYWRkZWROYW1lcyIsInB1c2giLCJyZW1vdmVkIiwiYWZ0ZXJDb21wb25lbnRSZW1vdmUiLCJyZW1vdmVkTmFtZXMiLCJwIiwiZWxtcyIsImVsZW1lbnRzIiwiZmxhdHRlblZhbHVlcyIsIm8iLCJhdHRyaWJ1dGVzIiwiYXR0cmlidXRlRmlsdGVyIiwiZGlzY29ubmVjdCIsImxvYWQiLCJzdG9yYWdlVmFsdWVzIiwicmVhZFN0b3JhZ2VBbGwiLCJzdG9yYWdlQ2hhbmdlcyIsImRpZmZWYWx1ZXMiLCJsZW5ndGgiLCJzdWJDaGFuZ2VzIiwid3JpdGVGb3JtIiwic3RvcmUiLCJmb3JtVmFsdWVzIiwicmVhZEZvcm1BbGwiLCJmb3JtQ2hhbmdlcyIsIndyaXRlU3RvcmFnZSIsIm5ld1ZhbHVlcyIsIm9sZFZhbHVlcyIsImRlZHVwIiwiY29uY2F0IiwicmVzdWx0IiwibGVuIiwiTWF0aCIsIm1heCIsImkiLCJvbGRWYWx1ZSIsInNvbWUiLCJwcyIsInJlYWRTdG9yYWdlQnlOYW1lIiwiZW50cmllcyIsInByb21pc2UiLCJnZXRBcmVhSGFuZGxlciIsImNoYW5nZXMiLCJjaGFuZ2VBcnJheSIsImNoYW5nZSIsInR5cGUiLCJjaGVja2VkIiwidmFsdWUiLCJlcnJvciIsImNoYWdlQXJyYXkiLCJjIiwiYWxsIiwiaXRlbXMiLCJlbGVtZW50Iiwib3B0aW9ucyIsIm9wdCIsInNlbGVjdGVkIiwiYSIsImdldEFyZWEiLCJoIiwiZ2V0QXR0cmlidXRlIiwiaGFzQXR0cmlidXRlIiwib2JzZXJ2ZWRBdHRyaWJ1dGVzIiwiYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrIiwiYXR0ck5hbWUiLCJiIiwidCIsImhhcyIsIml0ZXIiLCJzZWxmIiwic2V0QXR0cmlidXRlIiwiQ2FuY2VsbGFibGVQcm9taXNlIiwiY2FsbGJhY2siLCJjYW5jZWxsRnVuY3Rpb24iLCJtc2VjIiwidGltZW91dElkIiwic2V0VGltZW91dCIsImFycmF5IiwicHJlZGljYXRlIiwidGFyZ2V0U2V0IiwicmVtb3ZlZFNldCIsImZpbHRlciIsIk11bHRpVmFsdWVNYXAiLCJhcnIiLCJrZXkiLCJTZXRWYWx1ZU1hcCJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7OztBQ3BDQTs7OztBQUNBOztLQUFZQSxFOzs7Ozs7QUFFWjtBQUxBOztBQU1BLEtBQUlDLFlBQUosRUFDRUQsR0FBR0UsZUFBSCxDQUFtQixlQUFuQixFQUFvQyxJQUFJRixHQUFHRyxxQkFBUCxDQUE2QkYsWUFBN0IsQ0FBcEM7QUFDRixLQUFJRyxj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QixTQUFJVSxJQUFJLEtBQUs3SSxHQUFMLENBQVN3SyxHQUFULENBQVI7QUFDQSxTQUFJLENBQUMzQixDQUFMLEVBQVE7QUFDTkEsV0FBSSxFQUFKO0FBQ0EsWUFBSzFILEdBQUwsQ0FBU3FKLEdBQVQsRUFBYzNCLENBQWQ7QUFDRDtBQUNEQSxPQUFFeEQsSUFBRixDQUFPOEMsS0FBUDtBQUNBLFlBQU8sSUFBUDtBQUNEO0FBVG9FOztTQUExRGxHLGEsR0FBQUEsYTtBQVlOLE9BQU13SSxXQUFOLFNBQWdDSCxhQUFoQyxDQUE0RDtBQUNqRXhGLE9BQUkwRixHQUFKLEVBQVlyQyxLQUFaLEVBQTRCO0FBQzFCLFNBQUlVLElBQUksS0FBSzdJLEdBQUwsQ0FBU3dLLEdBQVQsQ0FBUjtBQUNBLFNBQUksQ0FBQzNCLENBQUwsRUFBUTtBQUNOQSxXQUFJLElBQUkxRSxHQUFKLEVBQUo7QUFDQSxZQUFLaEQsR0FBTCxDQUFTcUosR0FBVCxFQUFjM0IsQ0FBZDtBQUNEO0FBQ0RBLE9BQUUvRCxHQUFGLENBQU1xRCxLQUFOO0FBQ0EsWUFBTyxJQUFQO0FBQ0Q7QUFUZ0U7U0FBdERzQyxXLEdBQUFBLFciLCJmaWxlIjoic3RvcmFnZS1lbGVtZW50cy1kZWJ1Zy5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHdlYnBhY2svYm9vdHN0cmFwIDcwZWRlOGQ4MDFhODJkZDAxMWQ5IiwiLyogZ2xvYmFsIGNocm9tZSAqL1xuXG5pbXBvcnQgU3RvcmFnZUZvcm0gZnJvbSBcIi4vc3RvcmFnZS1mb3JtXCI7XG5pbXBvcnQgKiBhcyBhaCBmcm9tIFwiLi9hcmVhLWhhbmRsZXJcIjtcblxuLy8gUmVnaXN0ZXIgYXJlYSBoYW5kbGVyc1xuaWYgKGxvY2FsU3RvcmFnZSlcbiAgYWgucmVnaXN0ZXJIYW5kbGVyKFwibG9jYWwtc3RvcmFnZVwiLCBuZXcgYWguV2ViU3RvcmFnZUFyZWFIYW5kbGVyKGxvY2FsU3RvcmFnZSkpO1xuaWYgKHNlc3Npb25TdG9yYWdlKVxuICBhaC5yZWdpc3RlckhhbmRsZXIoXCJzZXNzaW9uLXN0b3JhZ2VcIiwgbmV3IGFoLldlYlN0b3JhZ2VBcmVhSGFuZGxlcihzZXNzaW9uU3RvcmFnZSkpO1xuaWYgKGNocm9tZSAmJiBjaHJvbWUuc3RvcmFnZSkge1xuICBpZiAoY2hyb21lLnN0b3JhZ2UubG9jYWwpXG4gICAgYWgucmVnaXN0ZXJIYW5kbGVyKFwiY2hyb21lLWxvY2FsXCIsIG5ldyBhaC5DaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIoY2hyb21lLnN0b3JhZ2UubG9jYWwpKTtcbiAgaWYgKGNocm9tZS5zdG9yYWdlLnN5bmMpXG4gICAgYWgucmVnaXN0ZXJIYW5kbGVyKFwiY2hyb21lLXN5bmNcIiwgbmV3IGFoLkNocm9tZVN0b3JhZ2VBcmVhSGFuZGxlcihjaHJvbWUuc3RvcmFnZS5zeW5jKSk7XG59XG5cbi8vIEN1c3RvbSBFbGVtZW50IHYxIHNlZW1zIG5vdCB0byB3b3JraW5nIHJpZ2h0IG9uIEdvb2dsZSBDaHJvbWUgNTVcbi8vIGN1c3RvbUVsZW1lbnRzLmRlZmluZShuYW1lLCBjZSwgeyBleHRlbmRzOiBleCB9KTtcblxuLy8gQ3VzdG9tIEVsZW1lbnQgdjBcbi8vICRGbG93Rml4TWUgQXZvaWQgdG8gYWZmZWN0IGNvZGUgb2YgYHN0b3JhZ2UtZm9ybS5qc2AgYnkgQ3VzdG9tIEVsZW1lbnQgdjBcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShTdG9yYWdlRm9ybSwgXCJleHRlbmRzXCIsIHsgZ2V0OiAoKSA9PiBcImZvcm1cIiB9KTtcbmRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChcInN0b3JhZ2UtZm9ybVwiLCBTdG9yYWdlRm9ybSk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvc3RvcmFnZS1lbGVtZW50cy1yZWdpc3RlcmVyLmpzIiwiZXhwb3J0IHR5cGUgQXJlYSA9IHN0cmluZztcblxuZXhwb3J0IGludGVyZmFjZSBBcmVhSGFuZGxlciB7XG4gIHJlYWQobmFtZTogc3RyaW5nKTogUHJvbWlzZTw/c3RyaW5nPjtcbiAgd3JpdGUobmFtZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcbiAgcmVtb3ZlSXRlbShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xufVxuXG5jb25zdCBoYW5kbGVyczogeyBbYXJlYTogQXJlYV06IEFyZWFIYW5kbGVyIH0gPSB7fTtcblxuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVySGFuZGxlcihhcmVhOiBBcmVhLCBoYW5kbGVyOiBBcmVhSGFuZGxlcik6IHZvaWQge1xuICBpZiAoaGFuZGxlcnNbYXJlYV0pIHtcbiAgICB0aHJvdyBFcnJvcihgQWxyZWFkeSByZWdpc3RlcmVkIGhhbmRsZXIgZm9yIFwiJHthcmVhfVwiYCk7XG4gIH1cbiAgaGFuZGxlcnNbYXJlYV0gPSBoYW5kbGVyO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZmluZEhhbmRsZXIoYXJlYTogQXJlYSk6ID9BcmVhSGFuZGxlciB7XG4gIHJldHVybiBoYW5kbGVyc1thcmVhXTtcbn1cblxuZXhwb3J0IGNsYXNzIFdlYlN0b3JhZ2VBcmVhSGFuZGxlciB7XG4gIHN0b3JhZ2U6IFN0b3JhZ2U7XG5cbiAgY29uc3RydWN0b3Ioc3RvcmFnZTogU3RvcmFnZSkge1xuICAgIHRoaXMuc3RvcmFnZSA9IHN0b3JhZ2U7XG4gIH1cblxuICByZWFkKG5hbWU6IHN0cmluZyk6IFByb21pc2U8P3N0cmluZz4ge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5zdG9yYWdlLmdldEl0ZW0obmFtZSkpO1xuICB9XG5cbiAgd3JpdGUobmFtZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zdG9yYWdlLnNldEl0ZW0obmFtZSwgbmV3VmFsdWUpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIHJlbW92ZUl0ZW0obmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhpcy5zdG9yYWdlLnJlbW92ZUl0ZW0obmFtZSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIge1xuICBzdG9yYWdlOiBDaHJvbWVTdG9yYWdlQXJlYTtcblxuICBjb25zdHJ1Y3RvcihzdG9yYWdlOiBDaHJvbWVTdG9yYWdlQXJlYSkge1xuICAgIHRoaXMuc3RvcmFnZSA9IHN0b3JhZ2U7XG4gIH1cblxuICByZWFkKG5hbWU6IHN0cmluZyk6IFByb21pc2U8P3N0cmluZz4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gdGhpcy5zdG9yYWdlLmdldChuYW1lLCAodikgPT4gcmVzb2x2ZSh2W25hbWVdKSkpO1xuICB9XG5cbiAgd3JpdGUobmFtZTogc3RyaW5nLCBuZXdWYWx1ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB0aGlzLnN0b3JhZ2Uuc2V0KHsgW25hbWVdOiBuZXdWYWx1ZSB9LCByZXNvbHZlKSk7XG4gIH1cblxuICByZW1vdmVJdGVtKG5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gdGhpcy5zdG9yYWdlLnJlbW92ZShuYW1lLCByZXNvbHZlKSk7XG4gIH1cbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9hcmVhLWhhbmRsZXIuanMiLCJpbXBvcnQgKiBhcyB1IGZyb20gXCIuL3V0aWxzXCI7XG5pbXBvcnQgKiBhcyBhaCBmcm9tIFwiLi9hcmVhLWhhbmRsZXJcIjtcblxuZGVjbGFyZSBpbnRlcmZhY2UgRm9ybUNvbXBvbmVudEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIG5hbWU6IHN0cmluZztcblxuICB2YWx1ZT86IHN0cmluZztcbiAgdHlwZT86IHN0cmluZztcbiAgY2hlY2tlZD86IGJvb2xlYW47XG5cbiAgLy8gPHNlbGVjdD4gZWxlbWVudFxuICBvcHRpb25zPzogSFRNTE9wdGlvbnNDb2xsZWN0aW9uO1xuICBsZW5ndGg/OiBudW1iZXI7XG5cbiAgLy8gPG9wdGlvbj4gZWxlbWVudFxuICBzZWxlY3RlZD86IGJvb2xlYW47XG59XG5cbmRlY2xhcmUgY2xhc3MgT2JqZWN0IHtcbiAgc3RhdGljIGVudHJpZXM8SywgVj4obzogeyBba2V5OiBLXTogViB9KTogQXJyYXk8W0ssIFZdPlxufVxuXG4vLyBTZWUgaHR0cHM6Ly93d3cudzMub3JnL1RSL2h0bWw1L2luZnJhc3RydWN0dXJlLmh0bWwjaHRtbG9wdGlvbnNjb2xsZWN0aW9uXG5kZWNsYXJlIGNsYXNzIEhUTUxPcHRpb25zQ29sbGVjdGlvbiBleHRlbmRzIEhUTUxDb2xsZWN0aW9uPEhUTUxPcHRpb25FbGVtZW50PiB7fVxuXG5kZWNsYXJlIHR5cGUgTmFtZSA9IHN0cmluZ1xuXG4vLyBUT0RPIHVzZSBNYXA8TmFtZSwgQXJyYXk8c3RyaW5nPj5cbmRlY2xhcmUgdHlwZSBWYWx1ZXMgPSB7IFtrZXk6IE5hbWVdOiBBcnJheTxzdHJpbmc+IH07XG4vLyBUT0RPIHVzZSBNYXA8TmFtZSwgQXJyYXk8P3sgbmV3VmFsdWU6ID9zdHJpbmcsIG9sZFZhbHVlOiA/c3RyaW5nIH0+PlxuZGVjbGFyZSB0eXBlIFZhbHVlQ2hhbmdlcyA9IHsgW2tleTogTmFtZV06IEFycmF5PD9bP3N0cmluZywgP3N0cmluZ10+IH07XG5cbmRlY2xhcmUgdHlwZSBGb3JtRWxlbWVudHMgPSB1LkFycmF5VmFsdWVNYXA8TmFtZSwgRm9ybUNvbXBvbmVudEVsZW1lbnQ+O1xuXG5jb25zdCBERUZBVUxUX1NZTkNfSU5URVJWQUwgPSA1MDA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhUTUxTdG9yYWdlRm9ybUVsZW1lbnQgZXh0ZW5kcyBIVE1MRm9ybUVsZW1lbnQge1xuICB2YWx1ZXM6IFZhbHVlcztcbiAgZm9ybUVsZW1lbnRzOiBGb3JtRWxlbWVudHM7XG5cbiAgc3luY1Rhc2s6ID91LkNhbmNlbGxhYmxlUHJvbWlzZTx2b2lkPjtcbiAgc2NhblRhc2s6ID91LkNhbmNlbGxhYmxlUHJvbWlzZTx2b2lkPjtcbiAgc2NhbkludGVydmFsTWlsbGlzOiBudW1iZXI7XG5cbiAgY29tcG9uZW50T2JzZXJ2ZXJzOiBNYXA8Rm9ybUNvbXBvbmVudEVsZW1lbnQsIE11dGF0aW9uT2JzZXJ2ZXI+O1xuXG4gIHN5bmNQcm9taXNlOiA/UHJvbWlzZTx2b2lkPjtcblxuICBnZXQgYXV0b3N5bmMoKTogbnVtYmVyIHtcbiAgICBjb25zdCBuID0gcGFyc2VJbnQoZ2V0QXR0cih0aGlzLCBcImF1dG9zeW5jXCIpKTtcbiAgICByZXR1cm4gbiA+IDAgPyBuIDogREVGQVVMVF9TWU5DX0lOVEVSVkFMO1xuICB9XG4gIHNldCBhdXRvc3luYyh2OiBhbnkpIHsgc2V0QXR0cih0aGlzLCBcImF1dG9zeW5jXCIsIHYpOyB9XG4gIGdldCBhcmVhKCk6IGFoLkFyZWEgeyByZXR1cm4gZ2V0QXR0cih0aGlzLCBcImFyZWFcIik7IH1cbiAgc2V0IGFyZWEodjogYW55KSB7IHNldEF0dHIodGhpcywgXCJhcmVhXCIsIHYpOyB9XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcbiAgfVxuXG4gIGNyZWF0ZWRDYWxsYmFjaygpIHtcbiAgICB0aGlzLnZhbHVlcyA9IHt9O1xuICAgIHRoaXMuZm9ybUVsZW1lbnRzID0gbmV3IHUuQXJyYXlWYWx1ZU1hcCgpO1xuICAgIHRoaXMuc2NhbkludGVydmFsTWlsbGlzID0gNzAwO1xuICAgIHRoaXMuY29tcG9uZW50T2JzZXJ2ZXJzID0gbmV3IE1hcCgpO1xuICAgIHRoaXMuc3luY1Byb21pc2UgPSBudWxsO1xuXG4gICAgdGhpcy5hZGRFdmVudExpc3RlbmVyKFwic3VibWl0XCIsIChldmVudCkgPT4ge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHRoaXMuc3luYyhudWxsLCB7IG5vTG9hZDogdHJ1ZSB9KTtcbiAgICB9KTtcblxuICAgIG5ldyBNdXRhdGlvbk9ic2VydmVyKCgpID0+IHtcbiAgICAgIGNvbnNvbGUuZGVidWcoXCJzY2FuIGJ5IGZvcm0gTXV0YXRpb25PYnNlcnZlcjogXCIsIHRoaXMpO1xuICAgICAgdGhpcy5zY2FuQ29tcG9uZW50cygpO1xuICAgIH0pLm9ic2VydmUodGhpcywgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSk7XG5cbiAgICB0aGlzLnNjYW5Db21wb25lbnRzKCk7XG4gICAgLy8gdGhpcy5zdGFydFBlcmlvZGljYWxTY2FuKCk7XG5cbiAgICBpZiAodGhpcy5pc0F1dG9TeW5jRW5hYmxlZCgpKVxuICAgICAgdGhpcy5zdGFydFBlcmlvZGljYWxTeW5jKCk7XG4gIH1cblxuICBhdHRhY2hlZENhbGxiYWNrKCkge1xuICAgIHRoaXMuc2NhbkNvbXBvbmVudHMoKTtcblxuICAgIGlmICh0aGlzLmlzQXV0b1N5bmNFbmFibGVkKCkpXG4gICAgICB0aGlzLnN0YXJ0UGVyaW9kaWNhbFN5bmMoKTtcblxuICAgIC8vIHRoaXMuc3RhcnRQZXJpb2RpY2FsU2NhbigpO1xuICB9XG5cbiAgZGV0YWNoZWRDYWxsYmFjaygpIHtcbiAgICBpZiAodGhpcy5zdG9yYWdlU3luY1Rhc2sgIT0gbnVsbClcbiAgICAgIGNsZWFyVGltZW91dCh0aGlzLnN0b3JhZ2VTeW5jVGFzayk7XG4gICAgdGhpcy5zdG9wUGVyaW9kaWNhbFNjYW4oKTtcbiAgfVxuXG4gIGFzeW5jIHN0YXJ0UGVyaW9kaWNhbFNjYW4oKSB7XG4gICAgaWYgKHRoaXMuc2NhblRhc2sgIT0gbnVsbCkgcmV0dXJuO1xuICAgIHdoaWxlICh0cnVlKSB7IC8vIHRoaXMgbG9vcCB3aWxsIGJyZWFrIGJ5IHN0b3BQZXJpb2RpY2FsU2NhbigpXG4gICAgICB0aGlzLnNjYW5UYXNrID0gdS5zbGVlcCh0aGlzLnNjYW5JbnRlcnZhbE1pbGxpcyk7XG4gICAgICBhd2FpdCB0aGlzLnNjYW5UYXNrO1xuICAgICAgYXdhaXQgdGhpcy5zY2FuQ29tcG9uZW50cygpO1xuICAgIH1cbiAgfVxuICBzdG9wUGVyaW9kaWNhbFNjYW4oKSB7XG4gICAgaWYgKHRoaXMuc2NhblRhc2sgPT0gbnVsbCkgcmV0dXJuO1xuICAgIHRoaXMuc2NhblRhc2suY2FuY2VsbCgpO1xuICAgIHRoaXMuc2NhblRhc2sgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgc3RhcnRQZXJpb2RpY2FsU3luYygpIHtcbiAgICBpZiAodGhpcy5zeW5jVGFzayAhPSBudWxsKSByZXR1cm47XG4gICAgd2hpbGUgKHRydWUpIHsgLy8gdGhpcyBsb29wIHdpbGwgYnJlYWsgYnkgc3RvcFBlcmlvZGljYWxTeW5jKClcbiAgICAgIHRoaXMuc3luY1Rhc2sgPSB1LnNsZWVwKHRoaXMuYXV0b3N5bmMpO1xuICAgICAgYXdhaXQgdGhpcy5zeW5jVGFzaztcbiAgICAgIGF3YWl0IHRoaXMuc3luYygpO1xuICAgIH1cbiAgfVxuICBzdG9wUGVyaW9kaWNhbFN5bmMoKSB7XG4gICAgaWYgKHRoaXMuc3luY1Rhc2sgPT0gbnVsbCkgcmV0dXJuO1xuICAgIHRoaXMuc3luY1Rhc2suY2FuY2VsbCgpO1xuICAgIHRoaXMuc3luY1Rhc2sgPSBudWxsO1xuICB9XG5cbiAgYXN5bmMgc2NhbkNvbXBvbmVudHMoKSB7XG4gICAgd2hpbGUgKHRoaXMuc3luY1Byb21pc2UpIGF3YWl0IHRoaXMuc3luY1Byb21pc2U7XG5cbiAgICBjb25zdCBsYXN0RWxlbWVudHMgPSB0aGlzLmdldEZvcm1FbGVtZW50U2V0KCk7XG4gICAgY29uc3QgY3VycmVudEVsZW1lbnRzID0gdGhpcy5nZXRDdXJyZW50RWxlbWVudHMoKTtcblxuICAgIGNvbnN0IGxhc3ROYW1lcyA9IG5ldyBTZXQoT2JqZWN0LmtleXModGhpcy52YWx1ZXMpKTtcbiAgICBjb25zdCBjdXJyZW50TmFtZXMgPSBuYW1lcyhjdXJyZW50RWxlbWVudHMpO1xuICAgIGNvbnN0IHByb21pc2VzID0gW107XG5cbiAgICBpZiAoaXNFcXVhbFNldChsYXN0TmFtZXMsIGN1cnJlbnROYW1lcylcbiAgICAgICAgJiYgaXNFcXVhbFNldChsYXN0RWxlbWVudHMsIGN1cnJlbnRFbGVtZW50cykpXG4gICAgICByZXR1cm47XG5cbiAgICB0aGlzLmZvcm1FbGVtZW50cyA9IEFycmF5LmZyb20oY3VycmVudEVsZW1lbnRzKS5yZWR1Y2UoKG1hcDogRm9ybUVsZW1lbnRzLCBlKSA9PiB7XG4gICAgICBtYXAuYWRkKGUubmFtZSwgZSk7XG4gICAgICByZXR1cm4gbWFwO1xuICAgIH0sIG5ldyB1LkFycmF5VmFsdWVNYXAoKSk7XG5cbiAgICBjb25zdCBhZGRlZCA9IHUuc3VidHJhY3RTZXQoY3VycmVudEVsZW1lbnRzLCBsYXN0RWxlbWVudHMpO1xuICAgIGlmIChhZGRlZC5zaXplID4gMCkge1xuICAgICAgYWRkZWQuZm9yRWFjaCh0aGlzLmFmdGVyQ29tcG9uZW50QXBwZW5kLCB0aGlzKTtcbiAgICB9XG5cbiAgICBjb25zdCBhZGRlZE5hbWVzID0gdS5zdWJ0cmFjdFNldChjdXJyZW50TmFtZXMsIGxhc3ROYW1lcyk7XG4gICAgQXJyYXkuZnJvbShhZGRlZCkubWFwKGUgPT4gZS5uYW1lKS5mb3JFYWNoKGFkZGVkTmFtZXMuYWRkLCBhZGRlZE5hbWVzKTtcbiAgICBpZiAoYWRkZWROYW1lcy5zaXplID4gMCkge1xuICAgICAgcHJvbWlzZXMucHVzaCh0aGlzLnN5bmMoQXJyYXkuZnJvbShhZGRlZE5hbWVzKSkpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlbW92ZWQgPSB1LnN1YnRyYWN0U2V0KGxhc3RFbGVtZW50cywgY3VycmVudEVsZW1lbnRzKTtcbiAgICBpZiAocmVtb3ZlZC5zaXplID4gMCkge1xuICAgICAgcmVtb3ZlZC5mb3JFYWNoKHRoaXMuYWZ0ZXJDb21wb25lbnRSZW1vdmUsIHRoaXMpO1xuICAgIH1cblxuICAgIGNvbnN0IHJlbW92ZWROYW1lcyA9IHUuc3VidHJhY3RTZXQobGFzdE5hbWVzLCBjdXJyZW50TmFtZXMpO1xuICAgIGlmIChyZW1vdmVkTmFtZXMuc2l6ZSA+IDApIHtcbiAgICAgIGZvciAoY29uc3QgbiBvZiByZW1vdmVkTmFtZXMpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIlJlbW92ZWQgbmFtZTogJW9cIiwgbik7XG4gICAgICAgIGRlbGV0ZSB0aGlzLnZhbHVlc1tuXTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IHAgb2YgcHJvbWlzZXMpIGF3YWl0IHA7XG4gIH1cblxuICBnZXRDdXJyZW50RWxlbWVudHMoKTogU2V0PEZvcm1Db21wb25lbnRFbGVtZW50PiB7XG4gICAgY29uc3QgZWxtcyA9IHRoaXMuZWxlbWVudHM7XG4gICAgcmV0dXJuIG5ldyBTZXQoKGZ1bmN0aW9uKiAoKSB7XG4gICAgICBmb3IgKGNvbnN0IGU6IGFueSBvZiBlbG1zKVxuICAgICAgICBpZiAoZS5uYW1lKSB5aWVsZCBlO1xuICAgIH0pKCkpO1xuICB9XG5cbiAgZ2V0Rm9ybUVsZW1lbnRTZXQoKTogU2V0PEZvcm1Db21wb25lbnRFbGVtZW50PiB7XG4gICAgcmV0dXJuIG5ldyBTZXQodGhpcy5mb3JtRWxlbWVudHMuZmxhdHRlblZhbHVlcygpKTtcbiAgfVxuXG4gIGFmdGVyQ29tcG9uZW50QXBwZW5kKGU6IEZvcm1Db21wb25lbnRFbGVtZW50KSB7XG4gICAgY29uc29sZS5kZWJ1ZyhcImFmdGVyQ29tcG9uZW50QXBwZW5kOiAlb1wiLCBlKTtcbiAgICBjb25zdCBvID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4ge1xuICAgICAgY29uc29sZS5kZWJ1ZyhcInNjYW4gYnkgXFxcIm5hbWVcXFwiIGF0dGVyIE11dGF0aW9uT2JzZXJ2ZXI6IFwiLCBlKTtcbiAgICAgIHRoaXMuc2NhbkNvbXBvbmVudHMoKTtcbiAgICB9KTtcbiAgICBvLm9ic2VydmUoZSwgeyBhdHRyaWJ1dGVzOiB0cnVlLCBhdHRyaWJ1dGVGaWx0ZXI6IFtcIm5hbWVcIl0gfSk7XG4gICAgdGhpcy5jb21wb25lbnRPYnNlcnZlcnMuc2V0KGUsIG8pO1xuICB9XG5cbiAgYWZ0ZXJDb21wb25lbnRSZW1vdmUoZTogRm9ybUNvbXBvbmVudEVsZW1lbnQpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiYWZ0ZXJDb21wb25lbnRSZW1vdmU6ICVvXCIsIGUpO1xuICAgIGNvbnN0IG8gPSB0aGlzLmNvbXBvbmVudE9ic2VydmVycy5nZXQoZSk7XG4gICAgaWYgKG8pIG8uZGlzY29ubmVjdCgpO1xuICB9XG5cbiAgLy8vIHBhcnRpYWwgbG9hZCBpZiBgbmFtZXNgIHdhcyBwcm92aWRlZFxuICBhc3luYyBsb2FkKG5hbWVzPzogP0FycmF5PE5hbWU+KSB7XG4gICAgY29uc3Qgc3RvcmFnZVZhbHVlcyA9IGF3YWl0IHRoaXMucmVhZFN0b3JhZ2VBbGwoKTtcbiAgICBjb25zdCBzdG9yYWdlQ2hhbmdlcyA9IHRoaXMuZGlmZlZhbHVlcyhzdG9yYWdlVmFsdWVzLCB0aGlzLnZhbHVlcyk7XG5cbiAgICBpZiAoIW5hbWVzKSBuYW1lcyA9IE9iamVjdC5rZXlzKHN0b3JhZ2VDaGFuZ2VzKTtcblxuICAgIGlmIChuYW1lcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgIGNvbnN0IHN1YkNoYW5nZXMgPSB7fTtcbiAgICBmb3IgKGNvbnN0IG4gb2YgbmFtZXMpIHtcbiAgICAgIHRoaXMudmFsdWVzW25dID0gc3RvcmFnZVZhbHVlc1tuXTtcbiAgICAgIHN1YkNoYW5nZXNbbl0gPSBzdG9yYWdlQ2hhbmdlc1tuXSB8fCBbXTtcbiAgICB9XG4gICAgdGhpcy53cml0ZUZvcm0oc3ViQ2hhbmdlcyk7XG4gIH1cblxuICAvLy8gcGFydGlhbCBzdG9yZSBpZiBgbmFtZXNgIHdhcyBwcm92aWRlZFxuICBhc3luYyBzdG9yZShuYW1lcz86ID9BcnJheTxOYW1lPikge1xuICAgIGNvbnN0IGZvcm1WYWx1ZXMgPSB0aGlzLnJlYWRGb3JtQWxsKCk7XG4gICAgY29uc3QgZm9ybUNoYW5nZXMgPSB0aGlzLmRpZmZWYWx1ZXMoZm9ybVZhbHVlcywgdGhpcy52YWx1ZXMpO1xuXG4gICAgaWYgKCFuYW1lcykgbmFtZXMgPSBPYmplY3Qua2V5cyhmb3JtQ2hhbmdlcyk7XG5cbiAgICBpZiAobmFtZXMubGVuZ3RoID09PSAwKSByZXR1cm47XG5cbiAgICBjb25zdCBzdWJDaGFuZ2VzID0ge307XG4gICAgZm9yIChjb25zdCBuIG9mIG5hbWVzKSB7XG4gICAgICB0aGlzLnZhbHVlc1tuXSA9IGZvcm1WYWx1ZXNbbl07XG4gICAgICBzdWJDaGFuZ2VzW25dID0gZm9ybUNoYW5nZXNbbl0gfHwgW107XG4gICAgfVxuICAgIGF3YWl0IHRoaXMud3JpdGVTdG9yYWdlKHN1YkNoYW5nZXMpO1xuICB9XG5cbiAgZGlmZlZhbHVlcyhuZXdWYWx1ZXM6IFZhbHVlcywgb2xkVmFsdWVzOiBWYWx1ZXMpOiBWYWx1ZUNoYW5nZXMge1xuICAgIGNvbnN0IG5hbWVzOiBBcnJheTxOYW1lPiA9IHUuZGVkdXAoT2JqZWN0LmtleXMobmV3VmFsdWVzKS5jb25jYXQoT2JqZWN0LmtleXMob2xkVmFsdWVzKSkpO1xuICAgIHJldHVybiBuYW1lcy5yZWR1Y2UoKHJlc3VsdDogVmFsdWVDaGFuZ2VzLCBuYW1lOiBOYW1lKTogVmFsdWVDaGFuZ2VzID0+IHtcbiAgICAgIGlmIChuZXdWYWx1ZXNbbmFtZV0gPT0gbnVsbCkgbmV3VmFsdWVzW25hbWVdID0gW107XG4gICAgICBpZiAob2xkVmFsdWVzW25hbWVdID09IG51bGwpIG9sZFZhbHVlc1tuYW1lXSA9IFtdO1xuICAgICAgY29uc3QgdmFsdWVzID0gW107XG4gICAgICBjb25zdCBsZW4gPSBNYXRoLm1heChuZXdWYWx1ZXNbbmFtZV0ubGVuZ3RoLCBvbGRWYWx1ZXNbbmFtZV0ubGVuZ3RoKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcbiAgICAgICAgY29uc3QgbmV3VmFsdWUgPSBuZXdWYWx1ZXNbbmFtZV1baV07XG4gICAgICAgIGNvbnN0IG9sZFZhbHVlID0gb2xkVmFsdWVzW25hbWVdW2ldO1xuICAgICAgICB2YWx1ZXNbaV0gPSBuZXdWYWx1ZSA9PT0gb2xkVmFsdWUgPyBudWxsIDogW25ld1ZhbHVlLCBvbGRWYWx1ZV07XG4gICAgICB9XG4gICAgICBpZiAodmFsdWVzLnNvbWUoKHYpID0+IHYgIT09IG51bGwpKVxuICAgICAgICByZXN1bHRbbmFtZV0gPSB2YWx1ZXM7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0sIHt9KTtcbiAgfVxuXG4gIGFzeW5jIHJlYWRTdG9yYWdlQWxsKCk6IFByb21pc2U8VmFsdWVzPiB7XG4gICAgLy8gc3RhcnQgYWxsIGRhdGEgZmF0Y2hpbmcgYXQgZmlyc3RcbiAgICBjb25zdCBwcyA9IEFycmF5LmZyb20odGhpcy5mb3JtRWxlbWVudHMuZmxhdHRlblZhbHVlcygpKVxuICAgICAgICAgIC5yZWR1Y2UoKHZhbHVlcywgZSkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbiA9IGUubmFtZTtcbiAgICAgICAgICAgIHZhbHVlc1tuXSA9IHRoaXMucmVhZFN0b3JhZ2VCeU5hbWUobik7XG4gICAgICAgICAgICByZXR1cm4gdmFsdWVzO1xuICAgICAgICAgIH0sIHt9KTtcblxuICAgIC8vIHJlc29sdmUgcHJvbWlzZXNcbiAgICBjb25zdCByZXN1bHQgPSB7fTtcbiAgICBmb3IgKGNvbnN0IFtuYW1lLCBwcm9taXNlXSBvZiBPYmplY3QuZW50cmllcyhwcykpIHtcbiAgICAgIHJlc3VsdFtuYW1lXSA9IGF3YWl0IHByb21pc2U7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG4gIH1cblxuICBhc3luYyByZWFkU3RvcmFnZUJ5TmFtZShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPEFycmF5PHN0cmluZz4+IHtcbiAgICBjb25zdCB2ID0gYXdhaXQgdGhpcy5nZXRBcmVhSGFuZGxlcigpLnJlYWQobmFtZSk7XG4gICAgcmV0dXJuIHYgPT0gbnVsbCA/IFtdIDogW3ZdO1xuICB9XG5cbiAgd3JpdGVGb3JtKGNoYW5nZXM6IFZhbHVlQ2hhbmdlcykge1xuICAgIGZvciAoY29uc3QgW25hbWUsIGNoYW5nZUFycmF5XSBvZiBPYmplY3QuZW50cmllcyhjaGFuZ2VzKSkge1xuICAgICAgY29uc3QgY2hhbmdlID0gY2hhbmdlQXJyYXlbMF07XG4gICAgICBjb25zdCBbbmV3VmFsdWVdID0gY2hhbmdlID09IG51bGwgPyBbXSA6IGNoYW5nZTtcbiAgICAgIGNvbnN0IGVsZW1lbnRzID0gdGhpcy5mb3JtRWxlbWVudHMuZ2V0KG5hbWUpO1xuXG4gICAgICBpZiAoZWxlbWVudHMgPT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIGNvbnNvbGUuZGVidWcoXCJ3cml0ZSB0byBmb3JtOiBuYW1lPSVzLCB2YWx1ZT0lcywgZWxlbWVudHM9JW9cIiwgbmFtZSwgbmV3VmFsdWUsIGVsZW1lbnRzKTtcblxuICAgICAgZWxlbWVudHMuZm9yRWFjaCgoZSkgPT4ge1xuICAgICAgICBpZiAoZS50eXBlID09PSBcImNoZWNrYm94XCIgfHwgZS50eXBlID09PSBcInJhZGlvXCIpIHtcbiAgICAgICAgICBlLmNoZWNrZWQgPSBuZXdWYWx1ZSA9PT0gZS52YWx1ZTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZS52YWx1ZSAhPSBudWxsKSB7XG4gICAgICAgICAgaWYgKG5ld1ZhbHVlID09IG51bGwpIHJldHVybjtcbiAgICAgICAgICBlLnZhbHVlID0gbmV3VmFsdWU7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc29sZS5lcnJvcihcIlVuc3VwcG9ydGVkIGVsZW1lbnQ6ICVvXCIsIGUpO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgYXN5bmMgd3JpdGVTdG9yYWdlKGNoYW5nZXM6IFZhbHVlQ2hhbmdlcykge1xuICAgIGNvbnN0IGhhbmRsZXIgPSB0aGlzLmdldEFyZWFIYW5kbGVyKCk7XG4gICAgY29uc3QgcHJvbWlzZXMgPSBPYmplY3QuZW50cmllcyhjaGFuZ2VzKS5tYXAoYXN5bmMgKFtuYW1lLCBjaGFnZUFycmF5XSkgPT4ge1xuICAgICAgY29uc3QgYyA9IGNoYWdlQXJyYXlbMF07XG4gICAgICBpZiAoYyA9PSBudWxsKSByZXR1cm47XG4gICAgICBjb25zdCBbbmV3VmFsdWVdID0gYztcblxuICAgICAgaWYgKG5ld1ZhbHVlID09IG51bGwpIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcInJlbW92ZSBmcm9tIHN0b3JhZ2U6IG5hbWU9JW9cIiwgbmFtZSk7XG4gICAgICAgIGF3YWl0IGhhbmRsZXIucmVtb3ZlSXRlbShuYW1lKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnNvbGUuZGVidWcoXCJ3cml0ZSB0byBzdG9yYWdlOiBuYW1lPSVvLCB2YWx1ZT0lb1wiLCBuYW1lLCBuZXdWYWx1ZSk7XG4gICAgICAgIGF3YWl0IGhhbmRsZXIud3JpdGUobmFtZSwgbmV3VmFsdWUpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIGF3YWl0IFByb21pc2UuYWxsKHByb21pc2VzKTtcbiAgfVxuXG4gIHJlYWRGb3JtQWxsKCk6IFZhbHVlcyB7XG4gICAgcmV0dXJuIEFycmF5LmZyb20odGhpcy5mb3JtRWxlbWVudHMuZmxhdHRlblZhbHVlcygpKVxuICAgICAgLnJlZHVjZSgoaXRlbXM6IFZhbHVlcywgZWxlbWVudCkgPT4ge1xuICAgICAgICBpZiAoZWxlbWVudC52YWx1ZSA9PSBudWxsKSByZXR1cm4gaXRlbXM7XG5cbiAgICAgICAgY29uc3QgbiA9IGVsZW1lbnQubmFtZTtcbiAgICAgICAgaWYgKGl0ZW1zW25dID09IG51bGwpIGl0ZW1zW25dID0gW107XG5cbiAgICAgICAgaWYgKGVsZW1lbnQudHlwZSA9PT0gXCJjaGVja2JveFwiIHx8IGVsZW1lbnQudHlwZSA9PT0gXCJyYWRpb1wiKSB7XG4gICAgICAgICAgaWYgKGVsZW1lbnQuY2hlY2tlZCkgaXRlbXNbbl0ucHVzaChlbGVtZW50LnZhbHVlKTtcbiAgICAgICAgICByZXR1cm4gaXRlbXM7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBleHBhbmQgYSA8c2VsZWN0PiBlbGVtZW50IHRvIDxvcHRpb24+IGVsZW1lbnRzLlxuICAgICAgICBpZiAoZWxlbWVudC5vcHRpb25zICE9IG51bGwpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IG9wdCBvZiBlbGVtZW50Lm9wdGlvbnMpIHtcbiAgICAgICAgICAgIGlmIChvcHQuc2VsZWN0ZWQpIGl0ZW1zW25dLnB1c2gob3B0LnZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIGl0ZW1zO1xuICAgICAgICB9XG5cbiAgICAgICAgaXRlbXNbbl0ucHVzaChlbGVtZW50LnZhbHVlKTtcbiAgICAgICAgcmV0dXJuIGl0ZW1zO1xuICAgICAgfSwge30pO1xuICB9XG5cbiAgZ2V0QXJlYUhhbmRsZXIoKTogYWguQXJlYUhhbmRsZXIge1xuICAgIGNvbnN0IGE6ID9haC5BcmVhID0gdGhpcy5nZXRBcmVhKCk7XG4gICAgaWYgKCFhKSB0aHJvdyBFcnJvcihcIlxcXCJhcmVhXFxcIiBhdHRyaWJ1dGUgaXMgcmVxdWlyZWRcIik7XG5cbiAgICBjb25zdCBoID0gYWguZmluZEhhbmRsZXIoYSk7XG4gICAgaWYgKCFoKSB0aHJvdyBFcnJvcihgVW5zdXBwb3J0ZWQgYXJlYTogXCIke2F9XCJgKTtcbiAgICByZXR1cm4gaDtcbiAgfVxuXG4gIGdldEFyZWEoKTogP2FoLkFyZWEge1xuICAgIGNvbnN0IGEgPSB0aGlzLmdldEF0dHJpYnV0ZShcImFyZWFcIik7XG4gICAgaWYgKGEpIHJldHVybiBhO1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgYXN5bmMgc3luYyhuYW1lcz86ID9BcnJheTxOYW1lPiwgb3B0PzogeyBub0xvYWQ6IGJvb2xlYW4gfSA9IHsgbm9Mb2FkOiBmYWxzZSB9KSB7XG4gICAgd2hpbGUgKHRoaXMuc3luY1Byb21pc2UpIGF3YWl0IHRoaXMuc3luY1Byb21pc2U7XG4gICAgdGhpcy5zeW5jUHJvbWlzZSA9IChhc3luYyAoKSA9PiB7XG4gICAgICBpZiAoIW9wdC5ub0xvYWQpIGF3YWl0IHRoaXMubG9hZChuYW1lcyk7XG4gICAgICBhd2FpdCB0aGlzLnN0b3JlKG5hbWVzKTtcbiAgICAgIHRoaXMuc3luY1Byb21pc2UgPSBudWxsO1xuICAgIH0pKCk7XG4gICAgYXdhaXQgdGhpcy5zeW5jUHJvbWlzZTtcbiAgfVxuXG4gIGlzQXV0b1N5bmNFbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhc0F0dHJpYnV0ZShcImF1dG9zeW5jXCIpO1xuICB9XG5cbiAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiYXV0b3N5bmNcIixcbiAgICAgIFwiYXJlYVwiLFxuICAgIF07XG4gIH1cblxuICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ck5hbWU6IHN0cmluZykge1xuICAgIHN3aXRjaCAoYXR0ck5hbWUpIHtcbiAgICBjYXNlIFwiYXV0b3N5bmNcIjpcbiAgICAgIGlmICh0aGlzLmlzQXV0b1N5bmNFbmFibGVkKCkpIHtcbiAgICAgICAgdGhpcy5zdGFydFBlcmlvZGljYWxTeW5jKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnN0b3BQZXJpb2RpY2FsU3luYygpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImFyZWFcIjpcbiAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgICB0aGlzLmZvcm1FbGVtZW50cyA9IG5ldyB1LkFycmF5VmFsdWVNYXAoKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpc0VxdWFsU2V0PFQ+KGE6IFNldDxUPiwgYjogU2V0PFQ+KTogYm9vbGVhbiB7XG4gIGlmIChhLnNpemUgIT09IGIuc2l6ZSkgcmV0dXJuIGZhbHNlO1xuICBmb3IgKGNvbnN0IHQgb2YgYSkge1xuICAgIGlmICghYi5oYXModCkpIHJldHVybiBmYWxzZTtcbiAgfVxuICBmb3IgKGNvbnN0IHQgb2YgYikge1xuICAgIGlmICghYS5oYXModCkpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cbmZ1bmN0aW9uIG5hbWVzKGl0ZXI6IEl0ZXJhYmxlPEZvcm1Db21wb25lbnRFbGVtZW50Pik6IFNldDxOYW1lPiB7XG4gIHJldHVybiBuZXcgU2V0KChmdW5jdGlvbiogKCkgeyBmb3IgKGNvbnN0IGUgb2YgaXRlcikgeWllbGQgZS5uYW1lOyB9KSgpKTtcbn1cbmZ1bmN0aW9uIGdldEF0dHIoc2VsZjogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIGNvbnN0IHYgPSBzZWxmLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgcmV0dXJuIHYgPyB2IDogXCJcIjtcbn1cbmZ1bmN0aW9uIHNldEF0dHIoc2VsZjogSFRNTEVsZW1lbnQsIG5hbWU6IHN0cmluZywgdmFsdWU6ID9zdHJpbmcpIHtcbiAgaWYgKHZhbHVlID09IG51bGwpIHJldHVybjtcbiAgc2VsZi5zZXRBdHRyaWJ1dGUobmFtZSwgdmFsdWUpO1xufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3N0b3JhZ2UtZm9ybS5qcyIsImV4cG9ydCBjbGFzcyBDYW5jZWxsYWJsZVByb21pc2U8Uj4gZXh0ZW5kcyBQcm9taXNlPFI+IHtcbiAgY2FuY2VsbEZ1bmN0aW9uOiAoKSA9PiB2b2lkO1xuICBjb25zdHJ1Y3RvcihcbiAgICBjYWxsYmFjazogKFxuICAgICAgcmVzb2x2ZTogKHJlc3VsdDogUHJvbWlzZTxSPiB8IFIpID0+IHZvaWQsXG4gICAgICByZWplY3Q6IChlcnJvcjogYW55KSA9PiB2b2lkXG4gICAgKSA9PiBtaXhlZCxcbiAgICBjYW5jZWxsOiAoKSA9PiB2b2lkXG4gICkge1xuICAgIHN1cGVyKGNhbGxiYWNrKTtcbiAgICB0aGlzLmNhbmNlbGxGdW5jdGlvbiA9IGNhbmNlbGw7XG4gIH1cblxuICBjYW5jZWxsKCkge1xuICAgIHRoaXMuY2FuY2VsbEZ1bmN0aW9uKCk7XG4gIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNsZWVwKG1zZWM6IG51bWJlcik6IENhbmNlbGxhYmxlUHJvbWlzZTx2b2lkPiB7XG4gIGxldCB0aW1lb3V0SWQ6ID9udW1iZXI7XG4gIHJldHVybiBuZXcgQ2FuY2VsbGFibGVQcm9taXNlKFxuICAgIChyZXNvbHZlKSA9PiB7XG4gICAgICB0aW1lb3V0SWQgPSBzZXRUaW1lb3V0KCgpID0+IHJlc29sdmUoKSwgbXNlYyk7XG4gICAgfSxcbiAgICAoKSA9PiB7XG4gICAgICBjbGVhclRpbWVvdXQodGltZW91dElkKTtcbiAgICB9XG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkZWR1cDxUPihhcnJheTogQXJyYXk8VD4sXG4gICAgICAgICAgICAgICAgICAgICAgICAgcHJlZGljYXRlPzogKHQ6IFQsIG86IFQpID0+IGJvb2xlYW4gPSAodCwgbykgPT4gdCA9PT0gbyk6IEFycmF5PFQ+IHtcbiAgcmV0dXJuIGFycmF5LnJlZHVjZSgocmVzdWx0OiBBcnJheTxUPiwgZWxlbWVudCkgPT4ge1xuICAgIGlmIChyZXN1bHQuc29tZSgoaSkgPT4gcHJlZGljYXRlKGksIGVsZW1lbnQpKSkgcmVzdWx0O1xuICAgIHJldHVybiByZXN1bHQuY29uY2F0KGVsZW1lbnQpO1xuICB9LFtdKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHN1YnRyYWN0U2V0PFQ+KHRhcmdldFNldDogU2V0PFQ+LCByZW1vdmVkU2V0OiBTZXQ8VD4pOiBTZXQ8VD4ge1xuICByZXR1cm4gbmV3IFNldChBcnJheS5mcm9tKHRhcmdldFNldCkuZmlsdGVyKChlKSA9PiAhcmVtb3ZlZFNldC5oYXMoZSkpKTtcbn1cblxuY2xhc3MgTXVsdGlWYWx1ZU1hcDxLLCBWLCBJOiBJdGVyYWJsZTxWPj4gZXh0ZW5kcyBNYXA8SywgST4ge1xuICAqIGZsYXR0ZW5WYWx1ZXMoKTogSXRlcmF0b3I8Vj4ge1xuICAgIGZvciAoY29uc3QgYXJyIG9mIHRoaXMudmFsdWVzKCkpIHtcbiAgICAgIGZvciAoY29uc3QgdiBvZiBhcnIpIHtcbiAgICAgICAgeWllbGQgdjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFycmF5VmFsdWVNYXA8SywgVj4gZXh0ZW5kcyBNdWx0aVZhbHVlTWFwPEssIFYsIEFycmF5PFY+PiB7XG4gIGFkZChrZXk6IEssIHZhbHVlOiBWKTogdGhpcyB7XG4gICAgbGV0IGEgPSB0aGlzLmdldChrZXkpO1xuICAgIGlmICghYSkge1xuICAgICAgYSA9IFtdO1xuICAgICAgdGhpcy5zZXQoa2V5LCBhKTtcbiAgICB9XG4gICAgYS5wdXNoKHZhbHVlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2V0VmFsdWVNYXA8SywgVj4gZXh0ZW5kcyBNdWx0aVZhbHVlTWFwPEssIFYsIFNldDxWPj4ge1xuICBhZGQoa2V5OiBLLCB2YWx1ZTogVik6IHRoaXMge1xuICAgIGxldCBhID0gdGhpcy5nZXQoa2V5KTtcbiAgICBpZiAoIWEpIHtcbiAgICAgIGEgPSBuZXcgU2V0KCk7XG4gICAgICB0aGlzLnNldChrZXksIGEpO1xuICAgIH1cbiAgICBhLmFkZCh2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy91dGlscy5qcyJdLCJzb3VyY2VSb290IjoiIn0=