export function mixinLoadButton(c: typeof HTMLButtonElement) {
  return class extends c {
    constructor() {
      super();

      this.addEventListener("click", (event) => {
        event.preventDefault();
        if (this.form?.load instanceof Function) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          this.form.load();
        } else {
          console.error("Unsupported form: ", this.form);
        }
      });
    }
  };
}

export class HTMLLoadButton extends mixinLoadButton(HTMLButtonElement) {
  static register() {
    register();
  }
}
export function register() {
  customElements.define("load-button", HTMLLoadButton, { extends: "button" });
}
