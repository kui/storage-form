// @flow

export function mixinLoadButton<T: HTMLButtonElement>(c: Class<T>): Class<T> {
  // $FlowFixMe Force cast to the returned type.
  return class extends c {
    createdCallback() {
      this.addEventListener("click", (event: MouseEvent) => {
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

const mixedButton = mixinLoadButton(HTMLButtonElement);
export default class LoadButton extends mixedButton {
  static get extends() { return "button"; }
}
