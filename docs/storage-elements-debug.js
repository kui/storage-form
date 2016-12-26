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
	
	var _storageItems = __webpack_require__(4);
	
	var i = _interopRequireWildcard(_storageItems);
	
	var _areaHandler = __webpack_require__(1);
	
	var ah = _interopRequireWildcard(_areaHandler);
	
	var _webStorageHandler = __webpack_require__(6);
	
	var _webStorageHandler2 = _interopRequireDefault(_webStorageHandler);
	
	var _chromeStorageHandler = __webpack_require__(3);
	
	var _chromeStorageHandler2 = _interopRequireDefault(_chromeStorageHandler);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	// Register area handlers
	if (localStorage) ah.registerHandler("local-storage", new _webStorageHandler2.default(localStorage)); /* global chrome */
	
	if (sessionStorage) ah.registerHandler("session-storage", new _webStorageHandler2.default(sessionStorage));
	if (chrome && chrome.storage) {
	  if (chrome.storage.local) ah.registerHandler("chrome-local", new _chromeStorageHandler2.default(chrome.storage.local));
	  if (chrome.storage.sync) ah.registerHandler("chrome-sync", new _chromeStorageHandler2.default(chrome.storage.sync));
	}
	
	// Register custom elements
	[["storage-form", _storageForm2.default, "form"], ["storage-input", i.StorageInputElement, "input"], ["storage-textarea", i.StorageTextAreaElement, "textarea"], ["storage-select", i.StorageSelectElement, "select"]].forEach((_ref) => {
	  var name = _ref[0],
	      customElement = _ref[1],
	      extendee = _ref[2];
	
	  // Custom Element v1 seems not to working right on Google Chrome 55
	  // customElements.define(name, ce, { extends: ex });
	
	  // Custom Element v0
	  // $FlowFixMe Avoid to affect code of `storage-form.js` by Custom Element v0
	  Object.defineProperty(customElement, "extends", { get: () => extendee });
	  document.registerElement(name, customElement);
	});

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

/***/ },
/* 2 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	
	var _utils = __webpack_require__(5);
	
	var u = _interopRequireWildcard(_utils);
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
	
	class HTMLStorageFormElement extends HTMLFormElement {
	  constructor() {
	    super();
	  }
	
	  createdCallback() {
	    this.addEventListener("submit", event => {
	      event.preventDefault();
	      this.store();
	    });
	    if (this.isAutoSyncEnabled()) this.periodicalSync();
	  }
	
	  store() {
	    var _this = this;
	
	    return _asyncToGenerator(function* () {
	      // Avoid to store twice by "name"
	      var storingItems = Array.from(_this.elements).reduce(function (map, element) {
	        if (!(element.store instanceof Function)) return map;
	        var name = element.name;
	        if (!name) return map;
	        if (!map.has(name)) {
	          map.set(name, element);
	          return map;
	        }
	        // Overrite a storing element if "checked" element was found.
	        if (element.checked) {
	          map.set(name, element);
	          return map;
	        }
	        return map;
	      }, new Map());
	
	      yield Promise.all(Array.from(storingItems.values()).map(function (e) {
	        return e.store();
	      }));
	    })();
	  }
	
	  sync() {
	    var _this2 = this;
	
	    return _asyncToGenerator(function* () {
	      var d = _this2.getSyncDelay();
	      if (d == null) return Promise.reject(Error("Require positive integer value 'sync-delay' attribute"));
	      if (d <= 0) return Promise.reject(Error(`Require positive number for "sync-delay": ${ d }`));
	
	      yield u.sleep(d);
	
	      if (!_this2.isAutoSyncEnabled()) {
	        return;
	      }
	
	      return _this2.store();
	    })();
	  }
	
	  isAutoSyncEnabled() {
	    return this.hasAttribute("sync") && this.getSyncDelay() !== null;
	  }
	
	  getSyncDelay() {
	    var a = this.getAttribute("sync-delay");
	    if (!a) return null;
	    var d = parseInt(a);
	    if (d <= 0) return null;
	    return d;
	  }
	
	  periodicalSync() {
	    var _this3 = this;
	
	    return _asyncToGenerator(function* () {
	      while (_this3.isAutoSyncEnabled()) {
	        yield _this3.sync();
	      }
	    })();
	  }
	
	  attachedCallback() {}
	
	  detachedCallback() {}
	
	  static get observedAttributes() {
	    return ["sync", "sync-delay"];
	  }
	
	  attributeChangedCallback(attrName) {
	    if (attrName === "sync" || attrName === "sync-delay") {
	      this.periodicalSync();
	    }
	  }
	}
	exports.default = HTMLStorageFormElement;

/***/ },
/* 3 */
/***/ function(module, exports) {

	"use strict";
	
	exports.__esModule = true;
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
	exports.default = ChromeStorageAreaHandler;

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	exports.__esModule = true;
	exports.StorageInputElement = exports.StorageSelectElement = exports.StorageTextAreaElement = undefined;
	exports.mixinStorageElement = mixinStorageElement;
	
	var _areaHandler = __webpack_require__(1);
	
	var ah = _interopRequireWildcard(_areaHandler);
	
	var _storageForm = __webpack_require__(2);
	
	var _storageForm2 = _interopRequireDefault(_storageForm);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }
	
	function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }
	
	function mixinStorageElement(c) {
	  return class extends c {
	    constructor() {
	      super();
	    }
	
	    createdCallback() {
	      if (this.name) this.load();
	    }
	
	    attachedCallback() {
	      this.load();
	    }
	
	    load() {
	      var _this = this;
	
	      return _asyncToGenerator(function* () {
	        if (!_this.name) throw Error("\"name\" attribute are required");
	
	        var v = yield _this.getAreaHandler().read(_this.name);
	        _this.value = v ? v : "";
	      })();
	    }
	
	    getAreaHandler() {
	      var a = this.getArea();
	      if (!a) throw Error("\"area\" attribute is required");
	
	      var h = ah.findHandler(a);
	      if (!h) throw Error(`Unsupported area: ${ a }`);
	      return h;
	    }
	
	    getArea() {
	      var a = this.getAttribute("area");
	      if (a) return a;
	
	      var fa = this.getForm().getAttribute("area");
	      if (fa) return fa;
	      return null;
	    }
	
	    getForm() {
	      var f = this.form;
	      if (f instanceof _storageForm2.default) return f;
	      throw Error(`'${ String(this.getAttribute("is")) }' requires ` + "'<form is=\"storage-form\" ...>' as a parent Node");
	    }
	
	    store() {
	      var _this2 = this;
	
	      return _asyncToGenerator(function* () {
	        if (!_this2.name) throw Error("\"name\" attribute are required");
	
	        yield _this2.getAreaHandler().write(_this2.name, _this2.value);
	      })();
	    }
	
	    detachedCallback() {}
	  };
	}
	
	var StorageTextAreaElement = exports.StorageTextAreaElement = mixinStorageElement(HTMLTextAreaElement);
	var StorageSelectElement = exports.StorageSelectElement = mixinStorageElement(HTMLSelectElement);
	
	var MixinedInputElement = mixinStorageElement(HTMLInputElement);
	class StorageInputElement extends MixinedInputElement {
	
	  // DONOT use "async" keyword.
	  // Because "async" function transpiler does not support "super".
	  load() {
	    if (!this.name) throw Error("\"name\" attribute are required");
	
	    if (this.type === "checkbox") {
	      return this.getAreaHandler().read(this.name).then(v => {
	        this.checked = v != null;
	        // Update stored value to current checkbox value
	        this.store();
	      });
	    }
	
	    if (this.type === "radio") {
	      return this.getAreaHandler().read(this.name).then(v => {
	        this.checked = this.value === v;
	      });
	    }
	
	    return super.load();
	  }
	
	  store() {
	    if (!this.name) throw Error("\"name\" attribute are required");
	
	    if (this.type === "checkbox") {
	      if (this.checked) return super.store();
	      return this.deleteStore();
	    }
	
	    if (this.type === "radio") {
	      if (this.checked) return super.store();
	      return Promise.resolve();
	    }
	
	    return super.store();
	  }
	
	  deleteStore() {
	    return this.getAreaHandler().removeItem(this.name);
	  }
	}
	exports.StorageInputElement = StorageInputElement;

/***/ },
/* 5 */
/***/ function(module, exports) {

	"use strict";
	
	exports.__esModule = true;
	exports.sleep = sleep;
	function sleep(msec) {
	  return new Promise(resolve => {
	    setInterval(() => resolve(), msec);
	  });
	}

/***/ },
/* 6 */
/***/ function(module, exports) {

	"use strict";
	
	exports.__esModule = true;
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
	exports.default = WebStorageAreaHandler;

/***/ }
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgOWI5Yjc1M2E3OTVhMmI2MjQ3ZTUiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0b3JhZ2UtZWxlbWVudHMtcmVnaXN0ZXJlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvYXJlYS1oYW5kbGVyLmpzIiwid2VicGFjazovLy8uL3NyYy9zdG9yYWdlLWZvcm0uanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2Nocm9tZS1zdG9yYWdlLWhhbmRsZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3N0b3JhZ2UtaXRlbXMuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL3V0aWxzLmpzIiwid2VicGFjazovLy8uL3NyYy93ZWItc3RvcmFnZS1oYW5kbGVyLmpzIl0sIm5hbWVzIjpbImkiLCJhaCIsImxvY2FsU3RvcmFnZSIsInJlZ2lzdGVySGFuZGxlciIsInNlc3Npb25TdG9yYWdlIiwiY2hyb21lIiwic3RvcmFnZSIsImxvY2FsIiwic3luYyIsIlN0b3JhZ2VJbnB1dEVsZW1lbnQiLCJTdG9yYWdlVGV4dEFyZWFFbGVtZW50IiwiU3RvcmFnZVNlbGVjdEVsZW1lbnQiLCJmb3JFYWNoIiwibmFtZSIsImN1c3RvbUVsZW1lbnQiLCJleHRlbmRlZSIsIk9iamVjdCIsImRlZmluZVByb3BlcnR5IiwiZ2V0IiwiZG9jdW1lbnQiLCJyZWdpc3RlckVsZW1lbnQiLCJmaW5kSGFuZGxlciIsImhhbmRsZXJzIiwiYXJlYSIsImhhbmRsZXIiLCJFcnJvciIsInUiLCJIVE1MU3RvcmFnZUZvcm1FbGVtZW50IiwiSFRNTEZvcm1FbGVtZW50IiwiY29uc3RydWN0b3IiLCJjcmVhdGVkQ2FsbGJhY2siLCJhZGRFdmVudExpc3RlbmVyIiwiZXZlbnQiLCJwcmV2ZW50RGVmYXVsdCIsInN0b3JlIiwiaXNBdXRvU3luY0VuYWJsZWQiLCJwZXJpb2RpY2FsU3luYyIsInN0b3JpbmdJdGVtcyIsIkFycmF5IiwiZnJvbSIsImVsZW1lbnRzIiwicmVkdWNlIiwibWFwIiwiZWxlbWVudCIsIkZ1bmN0aW9uIiwiaGFzIiwic2V0IiwiY2hlY2tlZCIsIk1hcCIsIlByb21pc2UiLCJhbGwiLCJ2YWx1ZXMiLCJlIiwiZCIsImdldFN5bmNEZWxheSIsInJlamVjdCIsInNsZWVwIiwiaGFzQXR0cmlidXRlIiwiYSIsImdldEF0dHJpYnV0ZSIsInBhcnNlSW50IiwiYXR0YWNoZWRDYWxsYmFjayIsImRldGFjaGVkQ2FsbGJhY2siLCJvYnNlcnZlZEF0dHJpYnV0ZXMiLCJhdHRyaWJ1dGVDaGFuZ2VkQ2FsbGJhY2siLCJhdHRyTmFtZSIsIkNocm9tZVN0b3JhZ2VBcmVhSGFuZGxlciIsInJlYWQiLCJyZXNvbHZlIiwidiIsIndyaXRlIiwibmV3VmFsdWUiLCJyZW1vdmVJdGVtIiwicmVtb3ZlIiwibWl4aW5TdG9yYWdlRWxlbWVudCIsImMiLCJsb2FkIiwiZ2V0QXJlYUhhbmRsZXIiLCJ2YWx1ZSIsImdldEFyZWEiLCJoIiwiZmEiLCJnZXRGb3JtIiwiZiIsImZvcm0iLCJTdHJpbmciLCJIVE1MVGV4dEFyZWFFbGVtZW50IiwiSFRNTFNlbGVjdEVsZW1lbnQiLCJNaXhpbmVkSW5wdXRFbGVtZW50IiwiSFRNTElucHV0RWxlbWVudCIsInR5cGUiLCJ0aGVuIiwiZGVsZXRlU3RvcmUiLCJtc2VjIiwic2V0SW50ZXJ2YWwiLCJXZWJTdG9yYWdlQXJlYUhhbmRsZXIiLCJnZXRJdGVtIiwic2V0SXRlbSJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBLHVCQUFlO0FBQ2Y7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7OztBQ3BDQTs7OztBQUNBOztLQUFZQSxDOztBQUNaOztLQUFZQyxFOztBQUNaOzs7O0FBQ0E7Ozs7Ozs7O0FBRUE7QUFDQSxLQUFJQyxZQUFKLEVBQ0VELEdBQUdFLGVB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QixLQUFLOUQsT0FBTCxDQUFhMEYsT0FBYixDQUFxQm5GLElBQXJCLENBQWhCLENBQVA7QUFDRDs7QUFFRHlELFNBQU16RCxJQUFOLEVBQW9CMEQsUUFBcEIsRUFBcUQ7QUFDbkQsVUFBS2pFLE9BQUwsQ0FBYTJGLE9BQWIsQ0FBcUJwRixJQUFyQixFQUEyQjBELFFBQTNCO0FBQ0EsWUFBT3RCLFFBQVFtQixPQUFSLEVBQVA7QUFDRDs7QUFFREksY0FBVzNELElBQVgsRUFBd0M7QUFDdEMsVUFBS1AsT0FBTCxDQUFha0UsVUFBYixDQUF3QjNELElBQXhCO0FBQ0EsWUFBT29DLFFBQVFtQixPQUFSLEVBQVA7QUFDRDtBQW5Cd0M7bUJBQXRCMkIscUIiLCJmaWxlIjoic3RvcmFnZS1lbGVtZW50cy1kZWJ1Zy5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKVxuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuXG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRleHBvcnRzOiB7fSxcbiBcdFx0XHRpZDogbW9kdWxlSWQsXG4gXHRcdFx0bG9hZGVkOiBmYWxzZVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sb2FkZWQgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKDApO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHdlYnBhY2svYm9vdHN0cmFwIDliOWI3NTNhNzk1YTJiNjI0N2U1IiwiLyogZ2xvYmFsIGNocm9tZSAqL1xuXG5pbXBvcnQgU3RvcmFnZUZvcm0gZnJvbSBcIi4vc3RvcmFnZS1mb3JtXCI7XG5pbXBvcnQgKiBhcyBpIGZyb20gXCIuL3N0b3JhZ2UtaXRlbXNcIjtcbmltcG9ydCAqIGFzIGFoIGZyb20gXCIuL2FyZWEtaGFuZGxlclwiO1xuaW1wb3J0IFdlYlN0b3JhZ2VBcmVhSGFuZGxlciBmcm9tIFwiLi93ZWItc3RvcmFnZS1oYW5kbGVyXCI7XG5pbXBvcnQgQ2hyb21lU3RvcmFnZUFyZWFIYW5kbGVyIGZyb20gXCIuL2Nocm9tZS1zdG9yYWdlLWhhbmRsZXJcIjtcblxuLy8gUmVnaXN0ZXIgYXJlYSBoYW5kbGVyc1xuaWYgKGxvY2FsU3RvcmFnZSlcbiAgYWgucmVnaXN0ZXJIYW5kbGVyKFwibG9jYWwtc3RvcmFnZVwiLCBuZXcgV2ViU3RvcmFnZUFyZWFIYW5kbGVyKGxvY2FsU3RvcmFnZSkpO1xuaWYgKHNlc3Npb25TdG9yYWdlKVxuICBhaC5yZWdpc3RlckhhbmRsZXIoXCJzZXNzaW9uLXN0b3JhZ2VcIiwgbmV3IFdlYlN0b3JhZ2VBcmVhSGFuZGxlcihzZXNzaW9uU3RvcmFnZSkpO1xuaWYgKGNocm9tZSAmJiBjaHJvbWUuc3RvcmFnZSkge1xuICBpZiAoY2hyb21lLnN0b3JhZ2UubG9jYWwpXG4gICAgYWgucmVnaXN0ZXJIYW5kbGVyKFwiY2hyb21lLWxvY2FsXCIsIG5ldyBDaHJvbWVTdG9yYWdlQXJlYUhhbmRsZXIoY2hyb21lLnN0b3JhZ2UubG9jYWwpKTtcbiAgaWYgKGNocm9tZS5zdG9yYWdlLnN5bmMpXG4gICAgYWgucmVnaXN0ZXJIYW5kbGVyKFwiY2hyb21lLXN5bmNcIiwgbmV3IENocm9tZVN0b3JhZ2VBcmVhSGFuZGxlcihjaHJvbWUuc3RvcmFnZS5zeW5jKSk7XG59XG5cbi8vIFJlZ2lzdGVyIGN1c3RvbSBlbGVtZW50c1xuW1tcInN0b3JhZ2UtZm9ybVwiLCBTdG9yYWdlRm9ybSwgXCJmb3JtXCJdLFxuIFtcInN0b3JhZ2UtaW5wdXRcIiwgaS5TdG9yYWdlSW5wdXRFbGVtZW50LCBcImlucHV0XCJdLFxuIFtcInN0b3JhZ2UtdGV4dGFyZWFcIiwgaS5TdG9yYWdlVGV4dEFyZWFFbGVtZW50LCBcInRleHRhcmVhXCJdLFxuIFtcInN0b3JhZ2Utc2VsZWN0XCIsIGkuU3RvcmFnZVNlbGVjdEVsZW1lbnQsIFwic2VsZWN0XCJdLFxuXS5mb3JFYWNoKChbbmFtZSwgY3VzdG9tRWxlbWVudCwgZXh0ZW5kZWVdKSA9PiB7XG4gIC8vIEN1c3RvbSBFbGVtZW50IHYxIHNlZW1zIG5vdCB0byB3b3JraW5nIHJpZ2h0IG9uIEdvb2dsZSBDaHJvbWUgNTVcbiAgLy8gY3VzdG9tRWxlbWVudHMuZGVmaW5lKG5hbWUsIGNlLCB7IGV4dGVuZHM6IGV4IH0pO1xuXG4gIC8vIEN1c3RvbSBFbGVtZW50IHYwXG4gIC8vICRGbG93Rml4TWUgQXZvaWQgdG8gYWZmZWN0IGNvZGUgb2YgYHN0b3JhZ2UtZm9ybS5qc2AgYnkgQ3VzdG9tIEVsZW1lbnQgdjBcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGN1c3RvbUVsZW1lbnQsIFwiZXh0ZW5kc1wiLCB7IGdldDogKCkgPT4gZXh0ZW5kZWUgfSk7XG4gIGRvY3VtZW50LnJlZ2lzdGVyRWxlbWVudChuYW1lLCBjdXN0b21FbGVtZW50KTtcbn0pO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3N0b3JhZ2UtZWxlbWVudHMtcmVnaXN0ZXJlci5qcyIsImV4cG9ydCB0eXBlIEFyZWEgPSBzdHJpbmc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXJlYUhhbmRsZXIge1xuICByZWFkKG5hbWU6IHN0cmluZyk6IFByb21pc2U8P3N0cmluZz47XG4gIHdyaXRlKG5hbWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD47XG4gIHJlbW92ZUl0ZW0obmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPjtcbn1cblxuY29uc3QgaGFuZGxlcnM6IHsgW2FyZWE6IEFyZWFdOiBBcmVhSGFuZGxlciB9ID0ge307XG5cbmV4cG9ydCBmdW5jdGlvbiByZWdpc3RlckhhbmRsZXIoYXJlYTogQXJlYSwgaGFuZGxlcjogQXJlYUhhbmRsZXIpOiB2b2lkIHtcbiAgaWYgKGhhbmRsZXJzW2FyZWFdKSB7XG4gICAgdGhyb3cgRXJyb3IoYEFscmVhZHkgcmVnaXN0ZXJlZCBoYW5kbGVyIGZvciBcIiR7YXJlYX1cImApO1xuICB9XG4gIGhhbmRsZXJzW2FyZWFdID0gaGFuZGxlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGZpbmRIYW5kbGVyKGFyZWE6IEFyZWEpOiA/QXJlYUhhbmRsZXIge1xuICByZXR1cm4gaGFuZGxlcnNbYXJlYV07XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvYXJlYS1oYW5kbGVyLmpzIiwiaW1wb3J0ICogYXMgdSBmcm9tIFwiLi91dGlsc1wiO1xuXG5kZWNsYXJlIGludGVyZmFjZSBTdG9yYWJsZUVsZW1lbnQgZXh0ZW5kcyBIVE1MRWxlbWVudCB7XG4gIG5hbWU/OiBzdHJpbmc7XG4gIGNoZWNrZWQ/OiBib29sZWFuO1xuICBzdG9yZSgpOiBhbnk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEhUTUxTdG9yYWdlRm9ybUVsZW1lbnQgZXh0ZW5kcyBIVE1MRm9ybUVsZW1lbnQge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICB9XG5cbiAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgIHRoaXMuYWRkRXZlbnRMaXN0ZW5lcihcInN1Ym1pdFwiLCAoZXZlbnQpID0+IHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB0aGlzLnN0b3JlKCk7XG4gICAgfSk7XG4gICAgaWYgKHRoaXMuaXNBdXRvU3luY0VuYWJsZWQoKSlcbiAgICAgIHRoaXMucGVyaW9kaWNhbFN5bmMoKTtcbiAgfVxuXG4gIGFzeW5jIHN0b3JlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIC8vIEF2b2lkIHRvIHN0b3JlIHR3aWNlIGJ5IFwibmFtZVwiXG4gICAgY29uc3Qgc3RvcmluZ0l0ZW1zOiBNYXA8c3RyaW5nLCBTdG9yYWJsZUVsZW1lbnQ+ID0gQXJyYXlcbiAgICAgICAgICAuZnJvbSh0aGlzLmVsZW1lbnRzKVxuICAgICAgICAgIC5yZWR1Y2UoKG1hcCwgZWxlbWVudDogU3RvcmFibGVFbGVtZW50KSA9PiB7XG4gICAgICAgICAgICBpZiAoIShlbGVtZW50LnN0b3JlIGluc3RhbmNlb2YgRnVuY3Rpb24pKSByZXR1cm4gbWFwO1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IGVsZW1lbnQubmFtZTtcbiAgICAgICAgICAgIGlmICghbmFtZSkgcmV0dXJuIG1hcDtcbiAgICAgICAgICAgIGlmICghbWFwLmhhcyhuYW1lKSkge1xuICAgICAgICAgICAgICBtYXAuc2V0KG5hbWUsIGVsZW1lbnQpO1xuICAgICAgICAgICAgICByZXR1cm4gbWFwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gT3ZlcnJpdGUgYSBzdG9yaW5nIGVsZW1lbnQgaWYgXCJjaGVja2VkXCIgZWxlbWVudCB3YXMgZm91bmQuXG4gICAgICAgICAgICBpZiAoZWxlbWVudC5jaGVja2VkKSB7XG4gICAgICAgICAgICAgIG1hcC5zZXQobmFtZSwgZWxlbWVudCk7XG4gICAgICAgICAgICAgIHJldHVybiBtYXA7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbWFwO1xuICAgICAgICAgIH0sIG5ldyBNYXAoKSk7XG5cbiAgICBhd2FpdCBQcm9taXNlLmFsbChBcnJheS5mcm9tKHN0b3JpbmdJdGVtcy52YWx1ZXMoKSkubWFwKChlKSA9PiBlLnN0b3JlKCkpKTtcbiAgfVxuXG4gIGFzeW5jIHN5bmMoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZCA9IHRoaXMuZ2V0U3luY0RlbGF5KCk7XG4gICAgaWYgKGQgPT0gbnVsbCkgcmV0dXJuIFByb21pc2UucmVqZWN0KEVycm9yKFwiUmVxdWlyZSBwb3NpdGl2ZSBpbnRlZ2VyIHZhbHVlICdzeW5jLWRlbGF5JyBhdHRyaWJ1dGVcIikpO1xuICAgIGlmIChkIDw9IDApIHJldHVybiBQcm9taXNlLnJlamVjdChFcnJvcihgUmVxdWlyZSBwb3NpdGl2ZSBudW1iZXIgZm9yIFwic3luYy1kZWxheVwiOiAke2R9YCkpO1xuXG4gICAgYXdhaXQgdS5zbGVlcChkKTtcblxuICAgIGlmICghdGhpcy5pc0F1dG9TeW5jRW5hYmxlZCgpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuc3RvcmUoKTtcbiAgfVxuXG4gIGlzQXV0b1N5bmNFbmFibGVkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhc0F0dHJpYnV0ZShcInN5bmNcIikgJiYgdGhpcy5nZXRTeW5jRGVsYXkoKSAhPT0gbnVsbDtcbiAgfVxuXG4gIGdldFN5bmNEZWxheSgpIHtcbiAgICBjb25zdCBhID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJzeW5jLWRlbGF5XCIpO1xuICAgIGlmICghYSkgcmV0dXJuIG51bGw7XG4gICAgY29uc3QgZCA9IHBhcnNlSW50KGEpO1xuICAgIGlmIChkIDw9IDApIHJldHVybiBudWxsO1xuICAgIHJldHVybiBkO1xuICB9XG5cbiAgYXN5bmMgcGVyaW9kaWNhbFN5bmMoKSB7XG4gICAgd2hpbGUgKHRoaXMuaXNBdXRvU3luY0VuYWJsZWQoKSkge1xuICAgICAgYXdhaXQgdGhpcy5zeW5jKCk7XG4gICAgfVxuICB9XG5cbiAgYXR0YWNoZWRDYWxsYmFjaygpIHt9XG5cbiAgZGV0YWNoZWRDYWxsYmFjaygpIHt9XG5cbiAgc3RhdGljIGdldCBvYnNlcnZlZEF0dHJpYnV0ZXMoKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIFwic3luY1wiLFxuICAgICAgXCJzeW5jLWRlbGF5XCIsXG4gICAgICAvLyBcImFyZWFcIixcbiAgICBdO1xuICB9XG5cbiAgYXR0cmlidXRlQ2hhbmdlZENhbGxiYWNrKGF0dHJOYW1lOiBzdHJpbmcpIHtcbiAgICBpZiAoYXR0ck5hbWUgPT09IFwic3luY1wiIHx8XG4gICAgICAgIGF0dHJOYW1lID09PSBcInN5bmMtZGVsYXlcIikge1xuICAgICAgdGhpcy5wZXJpb2RpY2FsU3luYygpO1xuICAgIH1cbiAgfVxufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3N0b3JhZ2UtZm9ybS5qcyIsImV4cG9ydCBkZWZhdWx0IGNsYXNzIENocm9tZVN0b3JhZ2VBcmVhSGFuZGxlciB7XG4gIHN0b3JhZ2U6IENocm9tZVN0b3JhZ2VBcmVhO1xuXG4gIGNvbnN0cnVjdG9yKHN0b3JhZ2U6IENocm9tZVN0b3JhZ2VBcmVhKSB7XG4gICAgdGhpcy5zdG9yYWdlID0gc3RvcmFnZTtcbiAgfVxuXG4gIHJlYWQobmFtZTogc3RyaW5nKTogUHJvbWlzZTw/c3RyaW5nPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB0aGlzLnN0b3JhZ2UuZ2V0KG5hbWUsICh2KSA9PiByZXNvbHZlKHZbbmFtZV0pKSk7XG4gIH1cblxuICB3cml0ZShuYW1lOiBzdHJpbmcsIG5ld1ZhbHVlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHRoaXMuc3RvcmFnZS5zZXQoeyBbbmFtZV06IG5ld1ZhbHVlIH0sIHJlc29sdmUpKTtcbiAgfVxuXG4gIHJlbW92ZUl0ZW0obmFtZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB0aGlzLnN0b3JhZ2UucmVtb3ZlKG5hbWUsIHJlc29sdmUpKTtcbiAgfVxufVxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2Nocm9tZS1zdG9yYWdlLWhhbmRsZXIuanMiLCJpbXBvcnQgKiBhcyBhaCBmcm9tIFwiLi9hcmVhLWhhbmRsZXJcIjtcbmltcG9ydCBIVE1MU3RvcmFnZUZvcm1FbGVtZW50IGZyb20gXCIuL3N0b3JhZ2UtZm9ybVwiO1xuXG5kZWNsYXJlIGludGVyZmFjZSBJdGVtRWxlbWVudCBleHRlbmRzIEhUTUxFbGVtZW50IHtcbiAgdmFsdWU6IHN0cmluZyxcbiAgbmFtZTogc3RyaW5nLFxuICBmb3JtOiBIVE1MRm9ybUVsZW1lbnQgfCBudWxsLFxuICB0eXBlPzogc3RyaW5nLFxuICBjaGVja2VkPzogYm9vbGVhbjtcbn1cblxuZGVjbGFyZSBpbnRlcmZhY2UgU3RvcmFnZUl0ZW1FbGVtZW50IGV4dGVuZHMgSXRlbUVsZW1lbnQge1xuICBsb2FkKCk6IFByb21pc2U8dm9pZD47XG4gIHN0b3JlKCk6IFByb21pc2U8dm9pZD47XG4gIGdldEFyZWFIYW5kbGVyKCk6IGFoLkFyZWFIYW5kbGVyO1xuICBnZXRGb3JtKCk6IEhUTUxTdG9yYWdlRm9ybUVsZW1lbnQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtaXhpblN0b3JhZ2VFbGVtZW50KGM6IENsYXNzPEl0ZW1FbGVtZW50Pik6IENsYXNzPFN0b3JhZ2VJdGVtRWxlbWVudD4ge1xuICByZXR1cm4gY2xhc3MgZXh0ZW5kcyBjIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgIHN1cGVyKCk7XG4gICAgfVxuXG4gICAgY3JlYXRlZENhbGxiYWNrKCkge1xuICAgICAgaWYgKHRoaXMubmFtZSkgdGhpcy5sb2FkKCk7XG4gICAgfVxuXG4gICAgYXR0YWNoZWRDYWxsYmFjaygpIHtcbiAgICAgIHRoaXMubG9hZCgpO1xuICAgIH1cblxuICAgIGFzeW5jIGxvYWQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICBpZiAoIXRoaXMubmFtZSkgdGhyb3cgRXJyb3IoXCJcXFwibmFtZVxcXCIgYXR0cmlidXRlIGFyZSByZXF1aXJlZFwiKTtcblxuICAgICAgY29uc3QgdiA9IGF3YWl0IHRoaXMuZ2V0QXJlYUhhbmRsZXIoKS5yZWFkKHRoaXMubmFtZSk7XG4gICAgICB0aGlzLnZhbHVlID0gdiA/IHYgOiBcIlwiO1xuICAgIH1cblxuICAgIGdldEFyZWFIYW5kbGVyKCk6IGFoLkFyZWFIYW5kbGVyIHtcbiAgICAgIGNvbnN0IGE6ID9haC5BcmVhID0gdGhpcy5nZXRBcmVhKCk7XG4gICAgICBpZiAoIWEpIHRocm93IEVycm9yKFwiXFxcImFyZWFcXFwiIGF0dHJpYnV0ZSBpcyByZXF1aXJlZFwiKTtcblxuICAgICAgY29uc3QgaCA9IGFoLmZpbmRIYW5kbGVyKGEpO1xuICAgICAgaWYgKCFoKSB0aHJvdyBFcnJvcihgVW5zdXBwb3J0ZWQgYXJlYTogJHthfWApO1xuICAgICAgcmV0dXJuIGg7XG4gICAgfVxuXG4gICAgZ2V0QXJlYSgpOiA/YWguQXJlYSB7XG4gICAgICBjb25zdCBhID0gdGhpcy5nZXRBdHRyaWJ1dGUoXCJhcmVhXCIpO1xuICAgICAgaWYgKGEpIHJldHVybiBhO1xuXG4gICAgICBjb25zdCBmYSA9IHRoaXMuZ2V0Rm9ybSgpLmdldEF0dHJpYnV0ZShcImFyZWFcIik7XG4gICAgICBpZiAoZmEpIHJldHVybiBmYTtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGdldEZvcm0oKTogSFRNTFN0b3JhZ2VGb3JtRWxlbWVudCB7XG4gICAgICBjb25zdCBmID0gdGhpcy5mb3JtO1xuICAgICAgaWYgKGYgaW5zdGFuY2VvZiBIVE1MU3RvcmFnZUZvcm1FbGVtZW50KSByZXR1cm4gZjtcbiAgICAgIHRocm93IEVycm9yKGAnJHtTdHJpbmcodGhpcy5nZXRBdHRyaWJ1dGUoXCJpc1wiKSl9JyByZXF1aXJlcyBgICtcbiAgICAgICAgICAgICAgICAgIFwiJzxmb3JtIGlzPVxcXCJzdG9yYWdlLWZvcm1cXFwiIC4uLj4nIGFzIGEgcGFyZW50IE5vZGVcIik7XG4gICAgfVxuXG4gICAgYXN5bmMgc3RvcmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICBpZiAoIXRoaXMubmFtZSkgdGhyb3cgRXJyb3IoXCJcXFwibmFtZVxcXCIgYXR0cmlidXRlIGFyZSByZXF1aXJlZFwiKTtcblxuICAgICAgYXdhaXQgdGhpcy5nZXRBcmVhSGFuZGxlcigpLndyaXRlKHRoaXMubmFtZSwgdGhpcy52YWx1ZSk7XG4gICAgfVxuXG4gICAgZGV0YWNoZWRDYWxsYmFjaygpIHt9XG4gIH07XG59XG5cbmV4cG9ydCBjb25zdCBTdG9yYWdlVGV4dEFyZWFFbGVtZW50ID0gbWl4aW5TdG9yYWdlRWxlbWVudChIVE1MVGV4dEFyZWFFbGVtZW50KTtcbmV4cG9ydCBjb25zdCBTdG9yYWdlU2VsZWN0RWxlbWVudCA9IG1peGluU3RvcmFnZUVsZW1lbnQoSFRNTFNlbGVjdEVsZW1lbnQpO1xuXG5jb25zdCBNaXhpbmVkSW5wdXRFbGVtZW50ID0gbWl4aW5TdG9yYWdlRWxlbWVudChIVE1MSW5wdXRFbGVtZW50KTtcbmV4cG9ydCBjbGFzcyBTdG9yYWdlSW5wdXRFbGVtZW50IGV4dGVuZHMgTWl4aW5lZElucHV0RWxlbWVudCB7XG5cbiAgLy8gRE9OT1QgdXNlIFwiYXN5bmNcIiBrZXl3b3JkLlxuICAvLyBCZWNhdXNlIFwiYXN5bmNcIiBmdW5jdGlvbiB0cmFuc3BpbGVyIGRvZXMgbm90IHN1cHBvcnQgXCJzdXBlclwiLlxuICBsb2FkKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5uYW1lKSB0aHJvdyBFcnJvcihcIlxcXCJuYW1lXFxcIiBhdHRyaWJ1dGUgYXJlIHJlcXVpcmVkXCIpO1xuXG4gICAgaWYgKHRoaXMudHlwZSA9PT0gXCJjaGVja2JveFwiKSB7XG4gICAgICByZXR1cm4gdGhpcy5nZXRBcmVhSGFuZGxlcigpLnJlYWQodGhpcy5uYW1lKS50aGVuKCh2KSA9PiB7XG4gICAgICAgIHRoaXMuY2hlY2tlZCA9IHYgIT0gbnVsbDtcbiAgICAgICAgLy8gVXBkYXRlIHN0b3JlZCB2YWx1ZSB0byBjdXJyZW50IGNoZWNrYm94IHZhbHVlXG4gICAgICAgIHRoaXMuc3RvcmUoKTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGlmICh0aGlzLnR5cGUgPT09IFwicmFkaW9cIikge1xuICAgICAgcmV0dXJuIHRoaXMuZ2V0QXJlYUhhbmRsZXIoKS5yZWFkKHRoaXMubmFtZSkudGhlbigodikgPT4ge1xuICAgICAgICB0aGlzLmNoZWNrZWQgPSB0aGlzLnZhbHVlID09PSB2O1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN1cGVyLmxvYWQoKTtcbiAgfVxuXG4gIHN0b3JlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICghdGhpcy5uYW1lKSB0aHJvdyBFcnJvcihcIlxcXCJuYW1lXFxcIiBhdHRyaWJ1dGUgYXJlIHJlcXVpcmVkXCIpO1xuXG4gICAgaWYgKHRoaXMudHlwZSA9PT0gXCJjaGVja2JveFwiKSB7XG4gICAgICBpZiAodGhpcy5jaGVja2VkKSByZXR1cm4gc3VwZXIuc3RvcmUoKTtcbiAgICAgIHJldHVybiB0aGlzLmRlbGV0ZVN0b3JlKCk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMudHlwZSA9PT0gXCJyYWRpb1wiKSB7XG4gICAgICBpZiAodGhpcy5jaGVja2VkKSByZXR1cm4gc3VwZXIuc3RvcmUoKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3VwZXIuc3RvcmUoKTtcbiAgfVxuXG4gIGRlbGV0ZVN0b3JlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHJldHVybiB0aGlzLmdldEFyZWFIYW5kbGVyKCkucmVtb3ZlSXRlbSh0aGlzLm5hbWUpO1xuICB9XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvc3RvcmFnZS1pdGVtcy5qcyIsImV4cG9ydCBmdW5jdGlvbiBzbGVlcChtc2VjOiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgc2V0SW50ZXJ2YWwoKCkgPT4gcmVzb2x2ZSgpLCBtc2VjKTtcbiAgfSk7XG59XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvdXRpbHMuanMiLCJleHBvcnQgZGVmYXVsdCBjbGFzcyBXZWJTdG9yYWdlQXJlYUhhbmRsZXIge1xuICBzdG9yYWdlOiBTdG9yYWdlO1xuXG4gIGNvbnN0cnVjdG9yKHN0b3JhZ2U6IFN0b3JhZ2UpIHtcbiAgICB0aGlzLnN0b3JhZ2UgPSBzdG9yYWdlO1xuICB9XG5cbiAgcmVhZChuYW1lOiBzdHJpbmcpOiBQcm9taXNlPD9zdHJpbmc+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuc3RvcmFnZS5nZXRJdGVtKG5hbWUpKTtcbiAgfVxuXG4gIHdyaXRlKG5hbWU6IHN0cmluZywgbmV3VmFsdWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc3RvcmFnZS5zZXRJdGVtKG5hbWUsIG5ld1ZhbHVlKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gIH1cblxuICByZW1vdmVJdGVtKG5hbWU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRoaXMuc3RvcmFnZS5yZW1vdmVJdGVtKG5hbWUpO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxufVxuXG5cblxuXG5cblxuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL3dlYi1zdG9yYWdlLWhhbmRsZXIuanMiXSwic291cmNlUm9vdCI6IiJ9