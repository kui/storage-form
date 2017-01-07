"use strict";

exports.__esModule = true;

var next = (() => {
  var _ref2 = _asyncToGenerator(function* (self) {
    if (self.current) return;

    var t = void 0;
    while (t = self.q.shift()) {
      self.current = t();
      yield self.current;
    }
    self.current = null;
  });

  return function next(_x) {
    return _ref2.apply(this, arguments);
  };
})();

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

class WorkerQueue {

  constructor() {
    this.q = [];
    this.current = null;
  }

  add(task) {
    var _this = this;

    return new Promise(resolve => {
      var t = (() => {
        var _ref = _asyncToGenerator(function* () {
          yield task();
          resolve();
          yield next(_this);
        });

        return function t() {
          return _ref.apply(this, arguments);
        };
      })();
      this.q.push(t);
      next(this);
    });
  }
}

exports.default = WorkerQueue;