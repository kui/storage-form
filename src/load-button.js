export function mixinLoadButton(c) {
  // $FlowFixMe Force cast to the returned type.
  return class extends c {
    constructor() {
      super();

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

const mixedButton = mixinLoadButton(HTMLButtonElement);
export default class LoadButton extends mixedButton {}
