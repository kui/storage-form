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
	    this.formElements = new u.MultiValueMap();
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
	      if (_this3.syncPromise) yield _this3.syncPromise;
	
	      var lastElements = _this3.getFormElementSet();
	      var currentElements = _this3.getCurrentElements();
	
	      var lastNames = new Set(Object.keys(_this3.values));
	      var currentNames = names(currentElements);
	      var promises = [];
	
	      if (isEqualSet(lastNames, currentNames) && isEqualSet(lastElements, currentElements)) return;
	
	      _this3.formElements = Array.from(currentElements).reduce(function (map, e) {
	        map.add(e.name, e);
	        return map;
	      }, new u.MultiValueMap());
	
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
	    return new Set(Array.from(this.elements).filter(e => e.name));
	  }
	
	  getFormElementSet() {
	    return Array.from(this.formElements.values()).reduce((set, elements) => {
	      elements.forEach(set.add, set);
	      return set;
	    }, new Set());
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
	      for (var _iterator3 = names, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : _iterator3[Symbol.iterator]();;) {
	        var _ref3;
	
	        if (_isArray3) {
	          if (_i3 >= _iterator3.length) break;
	          _ref3 = _iterator3[_i3++];
	        } else {
	          _i3 = _iterator3.next();
	          if (_i3.done) break;
	          _ref3 = _i3.value;
	        }
	
	        var n = _ref3;
	
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
	      for (var _iterator5 = Object.entries(ps), _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : _iterator5[Symbol.iterator]();;) {
	        var _ref6;
	
	        if (_isArray5) {
	          if (_i5 >= _iterator5.length) break;
	          _ref6 = _iterator5[_i5++];
	        } else {
	          _i5 = _iterator5.next();
	          if (_i5.done) break;
	          _ref6 = _i5.value;
	        }
	
	        var _ref5 = _ref6;
	        var _name = _ref5[0];
	        var promise = _ref5[1];
	
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
	
	      var _ref9 = change == null ? [] : change,
	          newValue = _ref9[0];
	
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
	
	    for (var _iterator6 = Object.entries(changes), _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : _iterator6[Symbol.iterator]();;) {
	      var _ref8;
	
	      if (_isArray6) {
	        if (_i6 >= _iterator6.length) break;
	        _ref8 = _iterator6[_i6++];
	      } else {
	        _i6 = _iterator6.next();
	        if (_i6.done) break;
	        _ref8 = _i6.value;
	      }
	
	      var _ref7 = _ref8;
	      var _name2 = _ref7[0];
	      var changeArray = _ref7[1];
	
	      var _ret = _loop(changeArray, _name2);
	
	      if (_ret === "continue") continue;
	    }
	  }
	
	  writeStorage(changes) {
	    var _this9 = this;
	
	    return _asyncToGenerator(function* () {
	      var handler = _this9.getAreaHandler();
	      var promises = Object.entries(changes).map((() => {
	        var _ref11 = _asyncToGenerator(function* (_ref10) {
	          var name = _ref10[0],
	              chageArray = _ref10[1];
	
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
	          return _ref11.apply(this, arguments);
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
	        for (var _iterator7 = element.options, _isArray7 = Array.isArray(_iterator7), _i7 = 0, _iterator7 = _isArray7 ? _iterator7 : _iterator7[Symbol.iterator]();;) {
	          var _ref12;
	
	          if (_isArray7) {
	            if (_i7 >= _iterator7.length) break;
	            _ref12 = _iterator7[_i7++];
	          } else {
	            _i7 = _iterator7.next();
	            if (_i7.done) break;
	            _ref12 = _i7.value;
	          }
	
	          var opt = _ref12;
	
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
	
	      if (_this10.syncPromise) yield _this10.syncPromise;
	      _this10.syncPromise = _asyncToGenerator(function* () {
	        if (!opt.noLoad) yield _this10.load(names);
	        yield _this10.store(names);
	        _this10.syncPromise = null;
	      })();
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
	        this.formElements = new u.MultiValueMap();
	        break;
	    }
	  }
	}
	
	exports.default = HTMLStorageFormElement;
	function isEqualSet(a, b) {
	  if (a.size !== b.size) return false;
	  for (var _iterator8 = a, _isArray8 = Array.isArray(_iterator8), _i8 = 0, _iterator8 = _isArray8 ? _iterator8 : _iterator8[Symbol.iterator]();;) {
	    var _ref14;
	
	    if (_isArray8) {
	      if (_i8 >= _iterator8.length) break;
	      _ref14 = _iterator8[_i8++];
	    } else {
	      _i8 = _iterator8.next();
	      if (_i8.done) break;
	      _ref14 = _i8.value;
	    }
	
	    var t = _ref14;
	
	    if (!b.has(t)) return false;
	  }
	  for (var _iterator9 = b, _isArray9 = Array.isArray(_iterator9), _i9 = 0, _iterator9 = _isArray9 ? _iterator9 : _iterator9[Symbol.iterator]();;) {
	    var _ref15;
	
	    if (_isArray9) {
	      if (_i9 >= _iterator9.length) break;
	      _ref15 = _iterator9[_i9++];
	    } else {
	      _i9 = _iterator9.next();
	      if (_i9.done) break;
	      _ref15 = _i9.value;
	    }
	
	    var _t = _ref15;
	
	    if (!a.has(_t)) return false;
	  }
	  return true;
	}
	function names(iter) {
	  return new Set(map(iter, v => v.name));
	}
	function map(iter, callbackfn, thisArg) {
	  return Array.from(iter).map(callbackfn, thisArg);
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
	  add(key, value) {
	    var a = this.get(key);
	    if (!a) {
	      a = [];
	      this.set(key, a);
	    }
	    a.push(value);
	    return this;
	  }
	
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
	exports.MultiValueMap = MultiValueMap;

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgYjQ2MjJmNWEyZjk3NzUxMDdlZWMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0b3JhZ2UtZWxlbWVudHMtcmVnaXN0ZXJlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYXJlYS1oYW5kbGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9zdG9yYWdlLWZvcm0uanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3V0aWxzLmpzIl0sIm5hbWVzIjpbImFoIiwibG9jYWxTdG9yYWdlIiwicmVnaXN0ZXJIYW5kbGVyIiwiV2ViU3RvcmFnZUFyZWFIYW5kbGVyIiwic2Vzc2lvblN0b3JhZ2UiLCJjaHJvbWUiLCJzdG9yYWdlIiwibG9jYWwiLCJDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIiLCJzeW5jIiwiT2JqZWN0IiwiZGVmaW5lUHJvcGVydHkiLCJnZXQiLCJkb2N1bWVudCIsInJlZ2lzdGVyRWxlbWVudCIsImZpbmRIYW5kbGVyIiwiaGFuZGxlcnMiLCJhcmVhIiwiaGFuZGxlciIsIkVycm9yIiwiY29uc3RydWN0b3IiLCJyZWFkIiwibmFtZSIsIlByb21pc2UiLCJyZXNvbHZlIiwiZ2V0SXRlbSIsIndyaXRlIiwibmV3VmFsdWUiLCJzZXRJdGVtIiwicmVtb3ZlSXRlbSIsInYiLCJzZXQiLCJyZW1vdmUiLCJ1IiwiREVGQVVMVF9TWU5DX0lOVEVSVkFMIiwiSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCIsIkhUTUxGb3JtRWxlbWVudCIsImF1dG9zeW5jIiwibiIsInBhcnNlSW50IiwiZ2V0QXR0ciIsInNldEF0dHIiLCJjcmVhdGVkQ2FsbGJhY2siLCJ2YWx1ZXMiLCJmb3JtRWxlbWVudHMiLCJNdWx0aVZhbHVlTWFwIiwic2NhbkludGVydmFsTWlsbGlzIiwiY29tcG9uZW50T2JzZXJ2ZXJzIiwiTWFwIiwic3luY1Byb21pc2UiLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJwcmV2ZW50RGVmYXVsdCIsIm5vTG9hZCIsIk11dGF0aW9uT2JzZXJ2ZXIiLCJjb25zb2xlIiwiZGVidWciLCJzY2FuQ29tcG9uZW50cyIsIm9ic2VydmUiLCJjaGlsZExpc3QiLCJzdWJ0cmVlIiwiaXNBdXRvU3luY0VuYWJsZWQiLCJzdGFydFBlcmlvZGljYWxTeW5jIiwiYXR0YWNoZWRDYWxsYmFjayIsImRldGFjaGVkQ2FsbGJhY2siLCJzdG9yYWdlU3luY1Rhc2siLCJjbGVhclRpbWVvdXQiLCJzdG9wUGVyaW9kaWNhbFNjYW4iLCJzdGFydFBlcmlvZGljYWxTY2FuIiwic2NhblRhc2siLCJzbGVlcCIsImNhbmNlbGwiLCJzeW5jVGFzayIsInN0b3BQZXJpb2RpY2FsU3luYyIsImxhc3RFbGVtZW50cyIsImdldEZvcm1FbGVtZW50U2V0IiwiY3VycmVudEVsZW1lbnRzIiwiZ2V0Q3VycmVudEVsZW1lbnRzIiwibGFzdE5hbWVzIiwiU2V0Iiwia2V5cyIsImN1cnJlbnROYW1lcyIsIm5hbWVzIiwicHJvbWlzZXMiLCJpc0VxdWFsU2V0IiwiQXJyYXkiLCJmcm9tIiwicmVkdWNlIiwibWFwIiwiZSIsImFkZCIsImFkZGVkIiwic3VidHJhY3RTZXQiLCJzaXplIiwiZm9yRWFjaCIsImFmdGVyQ29tcG9uZW50QXBwZW5kIiwiYWRkZWROYW1lcyIsInB1c2giLCJyZW1vdmVkIiwiYWZ0ZXJDb21wb25lbnRSZW1vdmUiLCJyZW1vdmVkTmFtZXMiLCJwIiwiZWxlbWVudHMiLCJmaWx0ZXIiLCJvIiwiYXR0cmlidXRlcyIsImF0dHJpYnV0ZUZpbHRlciIsImRpc2Nvbm5lY3QiLCJsb2FkIiwic3RvcmFnZVZhbHVlcyIsInJlYWRTdG9yYWdlQWxsIiwic3RvcmFnZUNoYW5nZXMiLCJkaWZmVmFsdWVzIiwibGVuZ3RoIiwic3ViQ2hhbmdlcyIsIndyaXRlRm9ybSIsInN0b3JlIiwiZm9ybVZhbHVlcyIsInJlYWRGb3JtQWxsIiwiZm9ybUNoYW5nZXMiLCJ3cml0ZVN0b3JhZ2UiLCJuZXdWYWx1ZXMiLCJvbGRWYWx1ZXMiLCJkZWR1cCIsImNvbmNhdCIsInJlc3VsdCIsImxlbiIsIk1hdGgiLCJtYXgiLCJpIiwib2xkVmFsdWUiLCJzb21lIiwicHMiLCJmbGF0dGVuVmFsdWVzIiwicmVhZFN0b3JhZ2VCeU5hbWUiLCJlbnRyaWVzIiwicHJvbWlzZSIsImdldEFyZWFIYW5kbGVyIiwiY2hhbmdlcyIsImNoYW5nZUFycmF5IiwiY2hhbmdlIiwidHlwZSIsImNoZWNrZWQiLCJ2YWx1ZSIsImVycm9yIiwiY2hhZ2VBcnJheSIsImMiLCJhbGwiLCJpdGVtcyIsImVsZW1lbnQiLCJvcHRpb25zIiwib3B0Iiwic2VsZWN0ZWQiLCJhIiwiZ2V0QXJlYSIsImgiLCJnZXRBdHRyaWJ1dGUiLCJoYXNBdHRyaWJ1dGUiLCJvYnNlcnZlZEF0dHJpYnV0ZXMiLCJhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2siLCJhdHRyTmFtZSIsImIiLCJ0IiwiaGFzIiwiaXRlciIsImNhbGxiYWNrZm4iLCJ0aGlzQXJnIiwic2VsZiIsInNldEF0dHJpYnV0ZSIsIkNhbmNlbGxhYmxlUHJvbWlzZSIsImNhbGxiYWNrIiwiY2FuY2VsbEZ1bmN0aW9uIiwibXNlYyIsInRpbWVvdXRJZCIsInNldFRpbWVvdXQiLCJhcnJheSIsInByZWRpY2F0ZSIsInRhcmdldFNldCIsInJlbW92ZWRTZXQiLCJrZXkiLCJhcnIiXSwibWFwcGluZ3MiOiI7QUFBQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSx1QkFBZTtBQUNmO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOzs7Ozs7Ozs7QUNwQ0E7Ozs7QUFDQTs7S0FBWUEsRTs7Ozs7O0FBRVo7QUFMQTs7QUFNQSxLQUFJQyxZQUFKLEVBQ0VELEdBQUdFLGVBQUgsQ0FBbUIsZUFBbkIsRUFBb0MsSUFBSUYsR0FBR0cscUJBQVAsQ0FBNkJGLFlBQTdCLENBQXBDO0FBQ0YsS0FBSUcsY0FBSixFQUNFSixHQUFH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QixrSEFBaUM7QUFBQTs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBOztBQUFBLFdBQXRCeUksR0FBc0I7O0FBQy9CLDZCQUFnQkEsR0FBaEIseUhBQXFCO0FBQUE7O0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTs7QUFBQSxhQUFWdEosQ0FBVTs7QUFDbkIsZUFBTUEsQ0FBTjtBQUNEO0FBQ0Y7QUFDRjtBQWpCdUQ7U0FBN0NlLGEsR0FBQUEsYSIsImZpbGUiOiJzdG9yYWdlLWVsZW1lbnRzLWRlYnVnLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pXG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG5cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGV4cG9ydHM6IHt9LFxuIFx0XHRcdGlkOiBtb2R1bGVJZCxcbiBcdFx0XHRsb2FkZWQ6IGZhbHNlXG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgYjQ2MjJmNWEyZjk3NzUxMDdlZWMiLCIvKiBnbG9iYWwgY2hyb21lICovXG5cbmltcG9ydCBTdG9yYWdlRm9ybSBmcm9tIFwiLi9zdG9yYWdlLWZvcm1cIjtcbmltcG9ydCAqIGFzIGFoIGZyb20gXCIuL2FyZWEtaGFuZGxlclwiO1xuXG4vLyBSZWdpc3RlciBhcmVhIGhhbmRsZXJzXG5pZiAobG9jYWxTdG9yYWdlKVxuICBhaC5yZWdpc3RlckhhbmRsZXIoXCJsb2NhbC1zdG9yYWdlXCIsIG5ldyBhaC5XZWJTdG9yYWdlQXJlYUhhbmRsZXIobG9jYWxTdG9yYWdlKSk7XG5pZiAoc2Vzc2lvblN0b3JhZ2UpXG4gIGFoLnJlZ2lzdGVySGFuZGxlcihcInNlc3Npb24tc3RvcmFnZVwiLCBuZXcgYWguV2ViU3RvcmFnZUFyZWFIYW5kbGVyKHNlc3Npb25TdG9yYWdlKSk7XG5pZiAoY2hyb21lICYmIGNocm9tZS5zdG9yYWdlKSB7XG4gIGlmIChjaHJvbWUuc3RvcmFnZS5sb2NhbClcbiAgICBhaC5yZWdpc3RlckhhbmRsZXIoXCJjaHJvbWUtbG9jYWxcIiwgbmV3IGFoLkNocm9tZVN0b3JhZ2VBcmVhSGFuZGxlcihjaHJvbWUuc3RvcmFnZS5sb2NhbCkpO1xuICBpZiAoY2hyb21lLnN0b3JhZ2Uuc3luYylcbiAgICBhaC5yZWdpc3RlckhhbmRsZXIoXCJjaHJvbWUtc3luY1wiLCBuZXcgYWguQ2hyb21lU3RvcmFnZUFyZWFIYW5kbGVyKGNocm9tZS5zdG9yYWdlLnN5bmMpKTtcbn1cblxuLy8gQ3VzdG9tIEVsZW1lbnQgdjEgc2VlbXMgbm90IHRvIHdvcmtpbmcgcmlnaHQgb24gR29vZ2xlIENocm9tZSA1NVxuLy8gY3VzdG9tRWxlbWVudHMuZGVmaW5lKG5hbWUsIGNlLCB7IGV4dGVuZHM6IGV4IH0pO1xuXG4vLyBDdXN0b20gRWxlbWVudCB2MFxuLy8gJEZsb3dGaXhNZSBBdm9pZCB0byBhZmZlY3QgY29kZSBvZiBgc3RvcmFnZS1mb3JtLmpzYCBieSBDdXN0b20gRWxlbWVudCB2MFxuT2JqZWN0LmRlZmluZVByb3BlcnR5KFN0b3JhZ2VGb3JtLCBcImV4dGVuZHNcIiwgeyBnZXQ6ICgpID0+IFwiZm9ybVwiIH0pO1xuZG9jdW1lbnQucmVnaXN0ZXJFbGVtZW50KFwic3RvcmFnZS1mb3JtXCIsIFN0b3JhZ2VGb3JtKTtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9zdG9yYWdlLWVsZW1lbnRzLXJlZ2lzdGVyZXIuanMiLCJleHBvcnQgdHlwZSBBcmVhID0gc3RyaW5nO1xuXG5leHBvcnQgaW50ZXJmYWNlIEFyZWFIYW5kbGVyIHtcbiAgcmVhZChuYW1lOiBzdHJpbmcpOiBQcm9taXNlPD9zdHJpbmc+O1xuICB3cml0ZShuYW1lOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+O1xuICByZW1vdmVJdGVtKG5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG59XG5cbmNvbnN0IGhhbmRsZXJzOiB7IFthcmVhOiBBcmVhXTogQXJlYUhhbmRsZXIgfSA9IHt9O1xuXG5leHBvcnQgZnVuY3Rpb24gcmVnaXN0ZXJIYW5kbGVyKGFyZWE6IEFyZWEsIGhhbmRsZXI6IEFyZWFIYW5kbGVyKTogdm9pZCB7XG4gIGlmIChoYW5kbGVyc1thcmVhXSkge1xuICAgIHRocm93IEVycm9yKGBBbHJlYWR5IHJlZ2lzdGVyZWQgaGFuZGxlciBmb3IgXCIke2FyZWF9XCJgKTtcbiAgfVxuICBoYW5kbGVyc1thcmVhXSA9IGhhbmRsZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kSGFuZGxlcihhcmVhOiBBcmVhKTogP0FyZWFIYW5kbGVyIHtcbiAgcmV0dXJuIGhhbmRsZXJzW2FyZWFdO1xufVxuXG5leHBvcnQgY2xhc3MgV2ViU3RvcmFnZUFyZWFIYW5kbGVyIHtcbiAgc3RvcmFnZTogU3RvcmFnZTtcblxuICBjb25zdHJ1Y3RvcihzdG9yYWdlOiBTdG9yYWdlKSB7XG4gICAgdGhpcy5zdG9yYWdlID0gc3RvcmFnZTtcbiAgfVxuXG4gIHJlYWQobmFtZTogc3RyaW5nKTogUHJvbWlzZTw/c3RyaW5nPiB7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLnN0b3JhZ2UuZ2V0SXRlbShuYW1lKSk7XG4gIH1cblxuICB3cml0ZShuYW1lOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnN0b3JhZ2Uuc2V0SXRlbShuYW1lLCBuZXdWYWx1ZSk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICB9XG5cbiAgcmVtb3ZlSXRlbShuYW1lOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aGlzLnN0b3JhZ2UucmVtb3ZlSXRlbShuYW1lKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIENocm9tZVN0b3JhZ2VBcmVhSGFuZGxlciB7XG4gIHN0b3JhZ2U6IENocm9tZVN0b3JhZ2VBcmVhO1xuXG4gIGNvbnN0cnVjdG9yKHN0b3JhZ2U6IENocm9tZVN0b3JhZ2VBcmVhKSB7XG4gICAgdGhpcy5zdG9yYWdlID0gc3RvcmFnZTtcbiAgfVxuXG4gIHJlYWQobmFtZTogc3RyaW5nKTogUHJvbWlzZTw/c3RyaW5nPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB0aGlzLnN0b3JhZ2UuZ2V0KG5hbWUsICh2KSA9PiByZXNvbHZlKHZbbmFtZV0pKSk7XG4gIH1cblxuICB3cml0ZShuYW1lOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHRoaXMuc3RvcmFnZS5zZXQoeyBbbmFtZV06IG5ld1ZhbHVlIH0sIHJlc29sdmUpKTtcbiAgfVxuXG4gIHJlbW92ZUl0ZW0obmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB0aGlzLnN0b3JhZ2UucmVtb3ZlKG5hbWUsIHJlc29sdmUpKTtcbiAgfVxufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2FyZWEtaGFuZGxlci5qcyIsImltcG9ydCAqIGFzIHUgZnJvbSBcIi4vdXRpbHNcIjtcbmltcG9ydCAqIGFzIGFoIGZyb20gXCIuL2FyZWEtaGFuZGxlclwiO1xuXG5kZWNsYXJlIGludGVyZmFjZSBOYW1hYmxlSFRNTEVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIG5hbWU/OiBzdHJpbmc7XG59XG5kZWNsYXJlIGludGVyZmFjZSBGb3JtQ29tcG9uZW50RWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgbmFtZTogc3RyaW5nO1xuXG4gIHZhbHVlPzogc3RyaW5nO1xuICB0eXBlPzogc3RyaW5nO1xuICBjaGVja2VkPzogYm9vbGVhbjtcblxuICAvLyA8c2VsZWN0PiBlbGVtZW50XG4gIG9wdGlvbnM/OiBIVE1MT3B0aW9uc0NvbGxlY3Rpb247XG4gIGxlbmd0aD86IG51bWJlcjtcblxuICAvLyA8b3B0aW9uPiBlbGVtZW50XG4gIHNlbGVjdGVkPzogYm9vbGVhbjtcbn1cblxuZGVjbGFyZSBjbGFzcyBPYmplY3Qge1xuICBzdGF0aWMgZW50cmllczxLLCBWPihvOiB7IFtrZXk6IEtdOiBWIH0pOiBBcnJheTxbSywgVl0+XG59XG5cbi8vIFNlZSBodHRwczovL3d3dy53My5vcmcvVFIvaHRtbDUvaW5mcmFzdHJ1Y3R1cmUuaHRtbCNodG1sb3B0aW9uc2NvbGxlY3Rpb25cbmRlY2xhcmUgY2xhc3MgSFRNTE9wdGlvbnNDb2xsZWN0aW9uIGV4dGVuZHMgSFRNTENvbGxlY3Rpb248SFRNTE9wdGlvbkVsZW1lbnQ+IHt9XG5cbmRlY2xhcmUgdHlwZSBOYW1lID0gc3RyaW5nXG5cbi8vIFRPRE8gdXNlIE1hcDxOYW1lLCBBcnJheTxzdHJpbmc+PlxuZGVjbGFyZSB0eXBlIFZhbHVlcyA9IHsgW2tleTogTmFtZV06IEFycmF5PHN0cmluZz4gfTtcbi8vIFRPRE8gdXNlIE1hcDxOYW1lLCBBcnJheTw/eyBuZXdWYWx1ZTogP3N0cmluZywgb2xkVmFsdWU6ID9zdHJpbmcgfT4+XG5kZWNsYXJlIHR5cGUgVmFsdWVDaGFuZ2VzID0geyBba2V5OiBOYW1lXTogQXJyYXk8P1s/c3RyaW5nLCA/c3RyaW5nXT4gfTtcblxuZGVjbGFyZSB0eXBlIEZvcm1FbGVtZW50cyA9IHUuTXVsdGlWYWx1ZU1hcDxOYW1lLCBGb3JtQ29tcG9uZW50RWxlbWVudD47XG5cbmNvbnN0IERFRkFVTFRfU1lOQ19JTlRFUlZBTCA9IDUwMDtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCBleHRlbmRzIEhUTUxGb3JtRWxlbWVudCB7XG4gIHZhbHVlczogVmFsdWVzO1xuICBmb3JtRWxlbWVudHM6IEZvcm1FbGVtZW50cztcblxuICBzeW5jVGFzazogP3UuQ2FuY2VsbGFibGVQcm9taXNlPHZvaWQ+O1xuICBzY2FuVGFzazogP3UuQ2FuY2VsbGFibGVQcm9taXNlPHZvaWQ+O1xuICBzY2FuSW50ZXJ2YWxNaWxsaXM6IG51bWJlcjtcblxuICBjb21wb25lbnRPYnNlcnZlcnM6IE1hcDxGb3JtQ29tcG9uZW50RWxlbWVudCwgTXV0YXRpb25PYnNlcnZlcj47XG5cbiAgc3luY1Byb21pc2U6ID9Qcm9taXNlPHZvaWQ+O1xuXG4gIGdldCBhdXRvc3luYygpOiBudW1iZXIge1xuICAgIGNvbnN0IG4gPSBwYXJzZUludChnZXRBdHRyKHRoaXMsIFwiYXV0b3N5bmNcIikpO1xuICAgIHJldHVybiBuID4gMCA/IG4gOiBERUZBVUxUX1NZTkNfSU5URVJWQUw7XG4gIH1cbiAgc2V0IGF1dG9zeW5jKHY6IGFueSkgeyBzZXRBdHRyKHRoaXMsIFwiYXV0b3N5bmNcIiwgdik7IH1cbiAgZ2V0IGFyZWEoKTogYWguQXJlYSB7IHJldHVybiBnZXRBdHRyKHRoaXMsIFwiYXJlYVwiKTsgfVxuICBzZXQgYXJlYSh2OiBhbnkpIHsgc2V0QXR0cih0aGlzLCBcImFyZWFcIiwgdik7IH1cblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgdGhpcy5mb3JtRWxlbWVudHMgPSBuZXcgdS5NdWx0aVZhbHVlTWFwKCk7XG4gICAgdGhpcy5zY2FuSW50ZXJ2YWxNaWxsaXMgPSA3MDA7XG4gICAgdGhpcy5jb21wb25lbnRPYnNlcnZlcnMgPSBuZXcgTWFwKCk7XG4gICAgdGhpcy5zeW5jUHJvbWlzZSA9IG51bGw7XG5cbiAgICB0aGlzLmFkZEV2ZW50TGlzdGVuZXIoXCJzdWJtaXRcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgdGhpcy5zeW5jKG51bGwsIHsgbm9Mb2FkOiB0cnVlIH0pO1xuICAgIH0pO1xuXG4gICAgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKCkgPT4ge1xuICAgICAgY29uc29sZS5kZWJ1ZyhcInNjYW4gYnkgZm9ybSBNdXRhdGlvbk9ic2VydmVyOiBcIiwgdGhpcyk7XG4gICAgICB0aGlzLnNjYW5Db21wb25lbnRzKCk7XG4gICAgfSkub2JzZXJ2ZSh0aGlzLCB7IGNoaWxkTGlzdDogdHJ1ZSwgc3VidHJlZTogdHJ1ZSB9KTtcblxuICAgIHRoaXMuc2NhbkNvbXBvbmVudHMoKTtcbiAgICAvLyB0aGlzLnN0YXJ0UGVyaW9kaWNhbFNjYW4oKTtcblxuICAgIGlmICh0aGlzLmlzQXV0b1N5bmNFbmFibGVkKCkpXG4gICAgICB0aGlzLnN0YXJ0UGVyaW9kaWNhbFN5bmMoKTtcbiAgfVxuXG4gIGF0dGFjaGVkQ2FsbGJhY2soKSB7XG4gICAgdGhpcy5zY2FuQ29tcG9uZW50cygpO1xuXG4gICAgaWYgKHRoaXMuaXNBdXRvU3luY0VuYWJsZWQoKSlcbiAgICAgIHRoaXMuc3RhcnRQZXJpb2RpY2FsU3luYygpO1xuXG4gICAgLy8gdGhpcy5zdGFydFBlcmlvZGljYWxTY2FuKCk7XG4gIH1cblxuICBkZXRhY2hlZENhbGxiYWNrKCkge1xuICAgIGlmICh0aGlzLnN0b3JhZ2VTeW5jVGFzayAhPSBudWxsKVxuICAgICAgY2xlYXJUaW1lb3V0KHRoaXMuc3RvcmFnZVN5bmNUYXNrKTtcbiAgICB0aGlzLnN0b3BQZXJpb2RpY2FsU2NhbigpO1xuICB9XG5cbiAgYXN5bmMgc3RhcnRQZXJpb2RpY2FsU2NhbigpIHtcbiAgICBpZiAodGhpcy5zY2FuVGFzayAhPSBudWxsKSByZXR1cm47XG4gICAgd2hpbGUgKHRydWUpIHsgLy8gdGhpcyBsb29wIHdpbGwgYnJlYWsgYnkgc3RvcFBlcmlvZGljYWxTY2FuKClcbiAgICAgIHRoaXMuc2NhblRhc2sgPSB1LnNsZWVwKHRoaXMuc2NhbkludGVydmFsTWlsbGlzKTtcbiAgICAgIGF3YWl0IHRoaXMuc2NhblRhc2s7XG4gICAgICBhd2FpdCB0aGlzLnNjYW5Db21wb25lbnRzKCk7XG4gICAgfVxuICB9XG4gIHN0b3BQZXJpb2RpY2FsU2NhbigpIHtcbiAgICBpZiAodGhpcy5zY2FuVGFzayA9PSBudWxsKSByZXR1cm47XG4gICAgdGhpcy5zY2FuVGFzay5jYW5jZWxsKCk7XG4gICAgdGhpcy5zY2FuVGFzayA9IG51bGw7XG4gIH1cblxuICBhc3luYyBzdGFydFBlcmlvZGljYWxTeW5jKCkge1xuICAgIGlmICh0aGlzLnN5bmNUYXNrICE9IG51bGwpIHJldHVybjtcbiAgICB3aGlsZSAodHJ1ZSkgeyAvLyB0aGlzIGxvb3Agd2lsbCBicmVhayBieSBzdG9wUGVyaW9kaWNhbFN5bmMoKVxuICAgICAgdGhpcy5zeW5jVGFzayA9IHUuc2xlZXAodGhpcy5hdXRvc3luYyk7XG4gICAgICBhd2FpdCB0aGlzLnN5bmNUYXNrO1xuICAgICAgYXdhaXQgdGhpcy5zeW5jKCk7XG4gICAgfVxuICB9XG4gIHN0b3BQZXJpb2RpY2FsU3luYygpIHtcbiAgICBpZiAodGhpcy5zeW5jVGFzayA9PSBudWxsKSByZXR1cm47XG4gICAgdGhpcy5zeW5jVGFzay5jYW5jZWxsKCk7XG4gICAgdGhpcy5zeW5jVGFzayA9IG51bGw7XG4gIH1cblxuICBhc3luYyBzY2FuQ29tcG9uZW50cygpIHtcbiAgICBpZiAodGhpcy5zeW5jUHJvbWlzZSkgYXdhaXQgdGhpcy5zeW5jUHJvbWlzZTtcblxuICAgIGNvbnN0IGxhc3RFbGVtZW50cyA9IHRoaXMuZ2V0Rm9ybUVsZW1lbnRTZXQoKTtcbiAgICBjb25zdCBjdXJyZW50RWxlbWVudHMgPSB0aGlzLmdldEN1cnJlbnRFbGVtZW50cygpO1xuXG4gICAgY29uc3QgbGFzdE5hbWVzID0gbmV3IFNldChPYmplY3Qua2V5cyh0aGlzLnZhbHVlcykpO1xuICAgIGNvbnN0IGN1cnJlbnROYW1lcyA9IG5hbWVzKGN1cnJlbnRFbGVtZW50cyk7XG4gICAgY29uc3QgcHJvbWlzZXMgPSBbXTtcblxuICAgIGlmIChpc0VxdWFsU2V0KGxhc3ROYW1lcywgY3VycmVudE5hbWVzKVxuICAgICAgICAmJiBpc0VxdWFsU2V0KGxhc3RFbGVtZW50cywgY3VycmVudEVsZW1lbnRzKSlcbiAgICAgIHJldHVybjtcblxuICAgIHRoaXMuZm9ybUVsZW1lbnRzID0gQXJyYXkuZnJvbShjdXJyZW50RWxlbWVudHMpLnJlZHVjZSgobWFwOiBGb3JtRWxlbWVudHMsIGUpID0+IHtcbiAgICAgIG1hcC5hZGQoZS5uYW1lLCBlKTtcbiAgICAgIHJldHVybiBtYXA7XG4gICAgfSwgbmV3IHUuTXVsdGlWYWx1ZU1hcCgpKTtcblxuICAgIGNvbnN0IGFkZGVkID0gdS5zdWJ0cmFjdFNldChjdXJyZW50RWxlbWVudHMsIGxhc3RFbGVtZW50cyk7XG4gICAgaWYgKGFkZGVkLnNpemUgPiAwKSB7XG4gICAgICBhZGRlZC5mb3JFYWNoKHRoaXMuYWZ0ZXJDb21wb25lbnRBcHBlbmQsIHRoaXMpO1xuICAgIH1cblxuICAgIGNvbnN0IGFkZGVkTmFtZXMgPSB1LnN1YnRyYWN0U2V0KGN1cnJlbnROYW1lcywgbGFzdE5hbWVzKTtcbiAgICBBcnJheS5mcm9tKGFkZGVkKS5tYXAoZSA9PiBlLm5hbWUpLmZvckVhY2goYWRkZWROYW1lcy5hZGQsIGFkZGVkTmFtZXMpO1xuICAgIGlmIChhZGRlZE5hbWVzLnNpemUgPiAwKSB7XG4gICAgICBwcm9taXNlcy5wdXNoKHRoaXMuc3luYyhBcnJheS5mcm9tKGFkZGVkTmFtZXMpKSk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVtb3ZlZCA9IHUuc3VidHJhY3RTZXQobGFzdEVsZW1lbnRzLCBjdXJyZW50RWxlbWVudHMpO1xuICAgIGlmIChyZW1vdmVkLnNpemUgPiAwKSB7XG4gICAgICByZW1vdmVkLmZvckVhY2godGhpcy5hZnRlckNvbXBvbmVudFJlbW92ZSwgdGhpcyk7XG4gICAgfVxuXG4gICAgY29uc3QgcmVtb3ZlZE5hbWVzID0gdS5zdWJ0cmFjdFNldChsYXN0TmFtZXMsIGN1cnJlbnROYW1lcyk7XG4gICAgaWYgKHJlbW92ZWROYW1lcy5zaXplID4gMCkge1xuICAgICAgZm9yIChjb25zdCBuIG9mIHJlbW92ZWROYW1lcykge1xuICAgICAgICBjb25zb2xlLmRlYnVnKFwiUmVtb3ZlZCBuYW1lOiAlb1wiLCBuKTtcbiAgICAgICAgZGVsZXRlIHRoaXMudmFsdWVzW25dO1xuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoY29uc3QgcCBvZiBwcm9taXNlcykgYXdhaXQgcDtcbiAgfVxuXG4gIGdldEN1cnJlbnRFbGVtZW50cygpOiBTZXQ8Rm9ybUNvbXBvbmVudEVsZW1lbnQ+IHtcbiAgICByZXR1cm4gbmV3IFNldChBcnJheS5mcm9tKHRoaXMuZWxlbWVudHMpLmZpbHRlcigoZTogTmFtYWJsZUhUTUxFbGVtZW50KSA9PiBlLm5hbWUpKTtcbiAgfVxuXG4gIGdldEZvcm1FbGVtZW50U2V0KCk6IFNldDxGb3JtQ29tcG9uZW50RWxlbWVudD4ge1xuICAgIHJldHVybiBBcnJheS5mcm9tKHRoaXMuZm9ybUVsZW1lbnRzLnZhbHVlcygpKVxuICAgICAgLnJlZHVjZSgoc2V0LCBlbGVtZW50cykgPT4ge1xuICAgICAgICBlbGVtZW50cy5mb3JFYWNoKHNldC5hZGQsIHNldCk7XG4gICAgICAgIHJldHVybiBzZXQ7XG4gICAgICB9LCBuZXcgU2V0KCkpO1xuICB9XG5cbiAgYWZ0ZXJDb21wb25lbnRBcHBlbmQoZTogRm9ybUNvbXBvbmVudEVsZW1lbnQpIHtcbiAgICBjb25zb2xlLmRlYnVnKFwiYWZ0ZXJDb21wb25lbnRBcHBlbmQ6ICVvXCIsIGUpO1xuICAgIGNvbnN0IG8gPSBuZXcgTXV0YXRpb25PYnNlcnZlcigoKSA9PiB7XG4gICAgICBjb25zb2xlLmRlYnVnKFwic2NhbiBieSBcXFwibmFtZVxcXCIgYXR0ZXIgTXV0YXRpb25PYnNlcnZlcjogXCIsIGUpO1xuICAgICAgdGhpcy5zY2FuQ29tcG9uZW50cygpO1xuICAgIH0pO1xuICAgIG8ub2JzZXJ2ZShlLCB7IGF0dHJpYnV0ZXM6IHRydWUsIGF0dHJpYnV0ZUZpbHRlcjogW1wibmFtZVwiXSB9KTtcbiAgICB0aGlzLmNvbXBvbmVudE9ic2VydmVycy5zZXQoZSwgbyk7XG4gIH1cblxuICBhZnRlckNvbXBvbmVudFJlbW92ZShlOiBGb3JtQ29tcG9uZW50RWxlbWVudCkge1xuICAgIGNvbnNvbGUuZGVidWcoXCJhZnRlckNvbXBvbmVudFJlbW92ZTogJW9cIiwgZSk7XG4gICAgY29uc3QgbyA9IHRoaXMuY29tcG9uZW50T2JzZXJ2ZXJzLmdldChlKTtcbiAgICBpZiAobykgby5kaXNjb25uZWN0KCk7XG4gIH1cblxuICAvLy8gcGFydGlhbCBsb2FkIGlmIGBuYW1lc2Agd2FzIHByb3ZpZGVkXG4gIGFzeW5jIGxvYWQobmFtZXM/OiA/QXJyYXk8TmFtZT4pIHtcbiAgICBjb25zdCBzdG9yYWdlVmFsdWVzID0gYXdhaXQgdGhpcy5yZWFkU3RvcmFnZUFsbCgpO1xuICAgIGNvbnN0IHN0b3JhZ2VDaGFuZ2VzID0gdGhpcy5kaWZmVmFsdWVzKHN0b3JhZ2VWYWx1ZXMsIHRoaXMudmFsdWVzKTtcblxuICAgIGlmICghbmFtZXMpIG5hbWVzID0gT2JqZWN0LmtleXMoc3RvcmFnZUNoYW5nZXMpO1xuXG4gICAgaWYgKG5hbWVzLmxlbmd0aCA9PT0gMCkgcmV0dXJuO1xuXG4gICAgY29uc3Qgc3ViQ2hhbmdlcyA9IHt9O1xuICAgIGZvciAoY29uc3QgbiBvZiBuYW1lcykge1xuICAgICAgdGhpcy52YWx1ZXNbbl0gPSBzdG9yYWdlVmFsdWVzW25dO1xuICAgICAgc3ViQ2hhbmdlc1tuXSA9IHN0b3JhZ2VDaGFuZ2VzW25dIHx8IFtdO1xuICAgIH1cbiAgICB0aGlzLndyaXRlRm9ybShzdWJDaGFuZ2VzKTtcbiAgfVxuXG4gIC8vLyBwYXJ0aWFsIHN0b3JlIGlmIGBuYW1lc2Agd2FzIHByb3ZpZGVkXG4gIGFzeW5jIHN0b3JlKG5hbWVzPzogP0FycmF5PE5hbWU+KSB7XG4gICAgY29uc3QgZm9ybVZhbHVlcyA9IHRoaXMucmVhZEZvcm1BbGwoKTtcbiAgICBjb25zdCBmb3JtQ2hhbmdlcyA9IHRoaXMuZGlmZlZhbHVlcyhmb3JtVmFsdWVzLCB0aGlzLnZhbHVlcyk7XG5cbiAgICBpZiAoIW5hbWVzKSBuYW1lcyA9IE9iamVjdC5rZXlzKGZvcm1DaGFuZ2VzKTtcblxuICAgIGlmIChuYW1lcy5sZW5ndGggPT09IDApIHJldHVybjtcblxuICAgIGNvbnN0IHN1YkNoYW5nZXMgPSB7fTtcbiAgICBmb3IgKGNvbnN0IG4gb2YgbmFtZXMpIHtcbiAgICAgIHRoaXMudmFsdWVzW25dID0gZm9ybVZhbHVlc1tuXTtcbiAgICAgIHN1YkNoYW5nZXNbbl0gPSBmb3JtQ2hhbmdlc1tuXSB8fCBbXTtcbiAgICB9XG4gICAgYXdhaXQgdGhpcy53cml0ZVN0b3JhZ2Uoc3ViQ2hhbmdlcyk7XG4gIH1cblxuICBkaWZmVmFsdWVzKG5ld1ZhbHVlczogVmFsdWVzLCBvbGRWYWx1ZXM6IFZhbHVlcyk6IFZhbHVlQ2hhbmdlcyB7XG4gICAgY29uc3QgbmFtZXM6IEFycmF5PE5hbWU+ID0gdS5kZWR1cChPYmplY3Qua2V5cyhuZXdWYWx1ZXMpLmNvbmNhdChPYmplY3Qua2V5cyhvbGRWYWx1ZXMpKSk7XG4gICAgcmV0dXJuIG5hbWVzLnJlZHVjZSgocmVzdWx0OiBWYWx1ZUNoYW5nZXMsIG5hbWU6IE5hbWUpOiBWYWx1ZUNoYW5nZXMgPT4ge1xuICAgICAgaWYgKG5ld1ZhbHVlc1tuYW1lXSA9PSBudWxsKSBuZXdWYWx1ZXNbbmFtZV0gPSBbXTtcbiAgICAgIGlmIChvbGRWYWx1ZXNbbmFtZV0gPT0gbnVsbCkgb2xkVmFsdWVzW25hbWVdID0gW107XG4gICAgICBjb25zdCB2YWx1ZXMgPSBbXTtcbiAgICAgIGNvbnN0IGxlbiA9IE1hdGgubWF4KG5ld1ZhbHVlc1tuYW1lXS5sZW5ndGgsIG9sZFZhbHVlc1tuYW1lXS5sZW5ndGgpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47IGkrKykge1xuICAgICAgICBjb25zdCBuZXdWYWx1ZSA9IG5ld1ZhbHVlc1tuYW1lXVtpXTtcbiAgICAgICAgY29uc3Qgb2xkVmFsdWUgPSBvbGRWYWx1ZXNbbmFtZV1baV07XG4gICAgICAgIHZhbHVlc1tpXSA9IG5ld1ZhbHVlID09PSBvbGRWYWx1ZSA/IG51bGwgOiBbbmV3VmFsdWUsIG9sZFZhbHVlXTtcbiAgICAgIH1cbiAgICAgIGlmICh2YWx1ZXMuc29tZSgodikgPT4gdiAhPT0gbnVsbCkpXG4gICAgICAgIHJlc3VsdFtuYW1lXSA9IHZhbHVlcztcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSwge30pO1xuICB9XG5cbiAgYXN5bmMgcmVhZFN0b3JhZ2VBbGwoKTogUHJvbWlzZTxWYWx1ZXM+IHtcbiAgICAvLyBzdGFydCBhbGwgZGF0YSBmYXRjaGluZyBhdCBmaXJzdFxuICAgIGNvbnN0IHBzID0gQXJyYXkuZnJvbSh0aGlzLmZvcm1FbGVtZW50cy5mbGF0dGVuVmFsdWVzKCkpXG4gICAgICAgICAgLnJlZHVjZSgodmFsdWVzLCBlKSA9PiB7XG4gICAgICAgICAgICBjb25zdCBuID0gZS5uYW1lO1xuICAgICAgICAgICAgdmFsdWVzW25dID0gdGhpcy5yZWFkU3RvcmFnZUJ5TmFtZShuKTtcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZXM7XG4gICAgICAgICAgfSwge30pO1xuXG4gICAgLy8gcmVzb2x2ZSBwcm9taXNlc1xuICAgIGNvbnN0IHJlc3VsdCA9IHt9O1xuICAgIGZvciAoY29uc3QgW25hbWUsIHByb21pc2VdIG9mIE9iamVjdC5lbnRyaWVzKHBzKSkge1xuICAgICAgcmVzdWx0W25hbWVdID0gYXdhaXQgcHJvbWlzZTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGFzeW5jIHJlYWRTdG9yYWdlQnlOYW1lKG5hbWU6IHN0cmluZyk6IFByb21pc2U8QXJyYXk8c3RyaW5nPj4ge1xuICAgIGNvbnN0IHYgPSBhd2FpdCB0aGlzLmdldEFyZWFIYW5kbGVyKCkucmVhZChuYW1lKTtcbiAgICByZXR1cm4gdiA9PSBudWxsID8gW10gOiBbdl07XG4gIH1cblxuICB3cml0ZUZvcm0oY2hhbmdlczogVmFsdWVDaGFuZ2VzKSB7XG4gICAgZm9yIChjb25zdCBbbmFtZSwgY2hhbmdlQXJyYXldIG9mIE9iamVjdC5lbnRyaWVzKGNoYW5nZXMpKSB7XG4gICAgICBjb25zdCBjaGFuZ2UgPSBjaGFuZ2VBcnJheVswXTtcbiAgICAgIGNvbnN0IFtuZXdWYWx1ZV0gPSBjaGFuZ2UgPT0gbnVsbCA/IFtdIDogY2hhbmdlO1xuICAgICAgY29uc3QgZWxlbWVudHMgPSB0aGlzLmZvcm1FbGVtZW50cy5nZXQobmFtZSk7XG5cbiAgICAgIGlmIChlbGVtZW50cyA9PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgY29uc29sZS5kZWJ1ZyhcIndyaXRlIHRvIGZvcm06IG5hbWU9JXMsIHZhbHVlPSVzLCBlbGVtZW50cz0lb1wiLCBuYW1lLCBuZXdWYWx1ZSwgZWxlbWVudHMpO1xuXG4gICAgICBlbGVtZW50cy5mb3JFYWNoKChlKSA9PiB7XG4gICAgICAgIGlmIChlLnR5cGUgPT09IFwiY2hlY2tib3hcIiB8fCBlLnR5cGUgPT09IFwicmFkaW9cIikge1xuICAgICAgICAgIGUuY2hlY2tlZCA9IG5ld1ZhbHVlID09PSBlLnZhbHVlO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChlLnZhbHVlICE9IG51bGwpIHtcbiAgICAgICAgICBpZiAobmV3VmFsdWUgPT0gbnVsbCkgcmV0dXJuO1xuICAgICAgICAgIGUudmFsdWUgPSBuZXdWYWx1ZTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zb2xlLmVycm9yKFwiVW5zdXBwb3J0ZWQgZWxlbWVudDogJW9cIiwgZSk7XG4gICAgICB9KTtcbiAgICB9XG4gIH1cblxuICBhc3luYyB3cml0ZVN0b3JhZ2UoY2hhbmdlczogVmFsdWVDaGFuZ2VzKSB7XG4gICAgY29uc3QgaGFuZGxlciA9IHRoaXMuZ2V0QXJlYUhhbmRsZXIoKTtcbiAgICBjb25zdCBwcm9taXNlcyA9IE9iamVjdC5lbnRyaWVzKGNoYW5nZXMpLm1hcChhc3luYyAoW25hbWUsIGNoYWdlQXJyYXldKSA9PiB7XG4gICAgICBjb25zdCBjID0gY2hhZ2VBcnJheVswXTtcbiAgICAgIGlmIChjID09IG51bGwpIHJldHVybjtcbiAgICAgIGNvbnN0IFtuZXdWYWx1ZV0gPSBjO1xuXG4gICAgICBpZiAobmV3VmFsdWUgPT0gbnVsbCkge1xuICAgICAgICBjb25zb2xlLmRlYnVnKFwicmVtb3ZlIGZyb20gc3RvcmFnZTogbmFtZT0lb1wiLCBuYW1lKTtcbiAgICAgICAgYXdhaXQgaGFuZGxlci5yZW1vdmVJdGVtKG5hbWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc29sZS5kZWJ1ZyhcIndyaXRlIHRvIHN0b3JhZ2U6IG5hbWU9JW8sIHZhbHVlPSVvXCIsIG5hbWUsIG5ld1ZhbHVlKTtcbiAgICAgICAgYXdhaXQgaGFuZGxlci53cml0ZShuYW1lLCBuZXdWYWx1ZSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICB9XG5cbiAgcmVhZEZvcm1BbGwoKTogVmFsdWVzIHtcbiAgICByZXR1cm4gQXJyYXkuZnJvbSh0aGlzLmZvcm1FbGVtZW50cy5mbGF0dGVuVmFsdWVzKCkpXG4gICAgICAucmVkdWNlKChpdGVtczogVmFsdWVzLCBlbGVtZW50KSA9PiB7XG4gICAgICAgIGlmIChlbGVtZW50LnZhbHVlID09IG51bGwpIHJldHVybiBpdGVtcztcblxuICAgICAgICBjb25zdCBuID0gZWxlbWVudC5uYW1lO1xuICAgICAgICBpZiAoaXRlbXNbbl0gPT0gbnVsbCkgaXRlbXNbbl0gPSBbXTtcblxuICAgICAgICBpZiAoZWxlbWVudC50eXBlID09PSBcImNoZWNrYm94XCIgfHwgZWxlbWVudC50eXBlID09PSBcInJhZGlvXCIpIHtcbiAgICAgICAgICBpZiAoZWxlbWVudC5jaGVja2VkKSBpdGVtc1tuXS5wdXNoKGVsZW1lbnQudmFsdWUpO1xuICAgICAgICAgIHJldHVybiBpdGVtcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGV4cGFuZCBhIDxzZWxlY3Q+IGVsZW1lbnQgdG8gPG9wdGlvbj4gZWxlbWVudHMuXG4gICAgICAgIGlmIChlbGVtZW50Lm9wdGlvbnMgIT0gbnVsbCkge1xuICAgICAgICAgIGZvciAoY29uc3Qgb3B0IG9mIGVsZW1lbnQub3B0aW9ucykge1xuICAgICAgICAgICAgaWYgKG9wdC5zZWxlY3RlZCkgaXRlbXNbbl0ucHVzaChvcHQudmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gaXRlbXM7XG4gICAgICAgIH1cblxuICAgICAgICBpdGVtc1tuXS5wdXNoKGVsZW1lbnQudmFsdWUpO1xuICAgICAgICByZXR1cm4gaXRlbXM7XG4gICAgICB9LCB7fSk7XG4gIH1cblxuICBnZXRBcmVhSGFuZGxlcigpOiBhaC5BcmVhSGFuZGxlciB7XG4gICAgY29uc3QgYTogP2FoLkFyZWEgPSB0aGlzLmdldEFyZWEoKTtcbiAgICBpZiAoIWEpIHRocm93IEVycm9yKFwiXFxcImFyZWFcXFwiIGF0dHJpYnV0ZSBpcyByZXF1aXJlZFwiKTtcblxuICAgIGNvbnN0IGggPSBhaC5maW5kSGFuZGxlcihhKTtcbiAgICBpZiAoIWgpIHRocm93IEVycm9yKGBVbnN1cHBvcnRlZCBhcmVhOiBcIiR7YX1cImApO1xuICAgIHJldHVybiBoO1xuICB9XG5cbiAgZ2V0QXJlYSgpOiA/YWguQXJlYSB7XG4gICAgY29uc3QgYSA9IHRoaXMuZ2V0QXR0cmlidXRlKFwiYXJlYVwiKTtcbiAgICBpZiAoYSkgcmV0dXJuIGE7XG4gICAgcmV0dXJuIG51bGw7XG4gIH1cblxuICBhc3luYyBzeW5jKG5hbWVzPzogP0FycmF5PE5hbWU+LCBvcHQ/OiB7IG5vTG9hZDogYm9vbGVhbiB9ID0geyBub0xvYWQ6IGZhbHNlIH0pIHtcbiAgICBpZiAodGhpcy5zeW5jUHJvbWlzZSkgYXdhaXQgdGhpcy5zeW5jUHJvbWlzZTtcbiAgICB0aGlzLnN5bmNQcm9taXNlID0gKGFzeW5jICgpID0+IHtcbiAgICAgIGlmICghb3B0Lm5vTG9hZCkgYXdhaXQgdGhpcy5sb2FkKG5hbWVzKTtcbiAgICAgIGF3YWl0IHRoaXMuc3RvcmUobmFtZXMpO1xuICAgICAgdGhpcy5zeW5jUHJvbWlzZSA9IG51bGw7XG4gICAgfSkoKTtcbiAgfVxuXG4gIGlzQXV0b1N5bmNFbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhc0F0dHJpYnV0ZShcImF1dG9zeW5jXCIpO1xuICB9XG5cbiAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwiYXV0b3N5bmNcIixcbiAgICAgIFwiYXJlYVwiLFxuICAgIF07XG4gIH1cblxuICBhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2soYXR0ck5hbWU6IHN0cmluZykge1xuICAgIHN3aXRjaCAoYXR0ck5hbWUpIHtcbiAgICBjYXNlIFwiYXV0b3N5bmNcIjpcbiAgICAgIGlmICh0aGlzLmlzQXV0b1N5bmNFbmFibGVkKCkpIHtcbiAgICAgICAgdGhpcy5zdGFydFBlcmlvZGljYWxTeW5jKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnN0b3BQZXJpb2RpY2FsU3luYygpO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgY2FzZSBcImFyZWFcIjpcbiAgICAgIHRoaXMudmFsdWVzID0ge307XG4gICAgICB0aGlzLmZvcm1FbGVtZW50cyA9IG5ldyB1Lk11bHRpVmFsdWVNYXAoKTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiBpc0VxdWFsU2V0PFQ+KGE6IFNldDxUPiwgYjogU2V0PFQ+KTogYm9vbGVhbiB7XG4gIGlmIChhLnNpemUgIT09IGIuc2l6ZSkgcmV0dXJuIGZhbHNlO1xuICBmb3IgKGNvbnN0IHQgb2YgYSkge1xuICAgIGlmICghYi5oYXModCkpIHJldHVybiBmYWxzZTtcbiAgfVxuICBmb3IgKGNvbnN0IHQgb2YgYikge1xuICAgIGlmICghYS5oYXModCkpIHJldHVybiBmYWxzZTtcbiAgfVxuICByZXR1cm4gdHJ1ZTtcbn1cbmZ1bmN0aW9uIG5hbWVzKGl0ZXI6IEl0ZXJhYmxlPEZvcm1Db21wb25lbnRFbGVtZW50Pik6IFNldDxOYW1lPiB7XG4gIHJldHVybiBuZXcgU2V0KG1hcChpdGVyLCAodikgPT4gdi5uYW1lKSk7XG59XG5mdW5jdGlvbiBtYXA8VCwgVT4oaXRlcjogSXRlcmFibGU8VD4sXG4gICAgICAgICAgICAgICAgICAgY2FsbGJhY2tmbjogKHZhbHVlOiBULCBpbmRleDogbnVtYmVyLCBhcnJheTogQXJyYXk8VD4pID0+IFUsXG4gICAgICAgICAgICAgICAgICAgdGhpc0FyZz86IGFueSk6IEFycmF5PFU+IHtcbiAgcmV0dXJuIEFycmF5LmZyb20oaXRlcikubWFwKGNhbGxiYWNrZm4sIHRoaXNBcmcpO1xufVxuZnVuY3Rpb24gZ2V0QXR0cihzZWxmOiBIVE1MRWxlbWVudCwgbmFtZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgY29uc3QgdiA9IHNlbGYuZ2V0QXR0cmlidXRlKG5hbWUpO1xuICByZXR1cm4gdiA/IHYgOiBcIlwiO1xufVxuZnVuY3Rpb24gc2V0QXR0cihzZWxmOiBIVE1MRWxlbWVudCwgbmFtZTogc3RyaW5nLCB2YWx1ZTogP3N0cmluZykge1xuICBpZiAodmFsdWUgPT0gbnVsbCkgcmV0dXJuO1xuICBzZWxmLnNldEF0dHJpYnV0ZShuYW1lLCB2YWx1ZSk7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvc3RvcmFnZS1mb3JtLmpzIiwiZXhwb3J0IGNsYXNzIENhbmNlbGxhYmxlUHJvbWlzZTxSPiBleHRlbmRzIFByb21pc2U8Uj4ge1xuICBjYW5jZWxsRnVuY3Rpb246ICgpID0+IHZvaWQ7XG4gIGNvbnN0cnVjdG9yKFxuICAgIGNhbGxiYWNrOiAoXG4gICAgICByZXNvbHZlOiAocmVzdWx0OiBQcm9taXNlPFI+IHwgUikgPT4gdm9pZCxcbiAgICAgIHJlamVjdDogKGVycm9yOiBhbnkpID0+IHZvaWRcbiAgICApID0+IG1peGVkLFxuICAgIGNhbmNlbGw6ICgpID0+IHZvaWRcbiAgKSB7XG4gICAgc3VwZXIoY2FsbGJhY2spO1xuICAgIHRoaXMuY2FuY2VsbEZ1bmN0aW9uID0gY2FuY2VsbDtcbiAgfVxuXG4gIGNhbmNlbGwoKSB7XG4gICAgdGhpcy5jYW5jZWxsRnVuY3Rpb24oKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gc2xlZXAobXNlYzogbnVtYmVyKTogQ2FuY2VsbGFibGVQcm9taXNlPHZvaWQ+IHtcbiAgbGV0IHRpbWVvdXRJZDogP251bWJlcjtcbiAgcmV0dXJuIG5ldyBDYW5jZWxsYWJsZVByb21pc2UoXG4gICAgKHJlc29sdmUpID0+IHtcbiAgICAgIHRpbWVvdXRJZCA9IHNldFRpbWVvdXQoKCkgPT4gcmVzb2x2ZSgpLCBtc2VjKTtcbiAgICB9LFxuICAgICgpID0+IHtcbiAgICAgIGNsZWFyVGltZW91dCh0aW1lb3V0SWQpO1xuICAgIH1cbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGRlZHVwPFQ+KGFycmF5OiBBcnJheTxUPixcbiAgICAgICAgICAgICAgICAgICAgICAgICBwcmVkaWNhdGU/OiAodDogVCwgbzogVCkgPT4gYm9vbGVhbiA9ICh0LCBvKSA9PiB0ID09PSBvKTogQXJyYXk8VD4ge1xuICByZXR1cm4gYXJyYXkucmVkdWNlKChyZXN1bHQ6IEFycmF5PFQ+LCBlbGVtZW50KSA9PiB7XG4gICAgaWYgKHJlc3VsdC5zb21lKChpKSA9PiBwcmVkaWNhdGUoaSwgZWxlbWVudCkpKSByZXN1bHQ7XG4gICAgcmV0dXJuIHJlc3VsdC5jb25jYXQoZWxlbWVudCk7XG4gIH0sW10pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3VidHJhY3RTZXQ8VD4odGFyZ2V0U2V0OiBTZXQ8VD4sIHJlbW92ZWRTZXQ6IFNldDxUPik6IFNldDxUPiB7XG4gIHJldHVybiBuZXcgU2V0KEFycmF5LmZyb20odGFyZ2V0U2V0KS5maWx0ZXIoKGUpID0+ICFyZW1vdmVkU2V0LmhhcyhlKSkpO1xufVxuXG5leHBvcnQgY2xhc3MgTXVsdGlWYWx1ZU1hcDxLLCBWPiBleHRlbmRzIE1hcDxLLCBBcnJheTxWPj4ge1xuICBhZGQoa2V5OiBLLCB2YWx1ZTogVik6IHRoaXMge1xuICAgIGxldCBhID0gdGhpcy5nZXQoa2V5KTtcbiAgICBpZiAoIWEpIHtcbiAgICAgIGEgPSBbXTtcbiAgICAgIHRoaXMuc2V0KGtleSwgYSk7XG4gICAgfVxuICAgIGEucHVzaCh2YWx1ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICAqIGZsYXR0ZW5WYWx1ZXMoKTogSXRlcmF0b3I8Vj4ge1xuICAgIGZvciAoY29uc3QgYXJyIG9mIHRoaXMudmFsdWVzKCkpIHtcbiAgICAgIGZvciAoY29uc3QgdiBvZiBhcnIpIHtcbiAgICAgICAgeWllbGQgdjtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy91dGlscy5qcyJdLCJzb3VyY2VSb290IjoiIn0=