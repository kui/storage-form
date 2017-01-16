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