import StorageBinder from "./storage-binder";
import * as ah from "./area-handler";

export function mixinAreaSelect(c: typeof HTMLSelectElement) {
  return class extends c {
    binder: StorageBinder | null = null;

    get area(): string {
      return this.getAttribute("area") ?? "";
    }
    set area(v: string) {
      this.setAttribute("area", v);
    }

    connectedCallback() {
      this.binder = new StorageBinder(this.generateBindee());
      this.binder.onChange = (event) => {
        this.writeArea();
        this.dispatchEvent(
          new CustomEvent(`area-select-${event.type}`, { detail: event }),
        );
      };
      this.observeValue(async () => {
        await this.binder?.submit();
      });

      if (this.length === 0) this.addAllHandlers();
      this.binder?.doAutoTask().catch(console.error);
      this.writeArea();
    }

    generateBindee() {
      return {
        getArea: () => this.area,
        getInterval: () => 700,
        isAutoSync: () => true,
        isAutoLoad: () => false,
        getNames: () => [this.name],
        getElements: () => [this],
        getTarget: () => this,
      };
    }

    writeArea() {
      this.form?.setAttribute("area", this.value);
    }

    observeValue(onChange: () => Promise<void>) {
      let value = this.value;
      (async () => {
        for (;;) {
          await waitAnimationFrame();
          if (this.value === value) continue;
          value = this.value;
          await onChange();
        }
      })().catch(console.error);
    }

    addAllHandlers() {
      for (const [area] of ah.listHandlers()) {
        const o = document.createElement("option");
        o.innerHTML = area;
        this.appendChild(o);
      }
    }

    static get observedAttributes() {
      return ["area"];
    }
    attributeChangedCallback(attrName: string) {
      if (!this.binder) return;
      switch (attrName) {
        case "area":
          this.binder.init();
          this.binder.doAutoTask().catch(console.error);
          break;
      }
    }

    sync() {
      if (!this.binder) return Promise.resolve();
      return this.binder.sync();
    }
  };
}

export class HTMLAreaSelectElement extends mixinAreaSelect(HTMLSelectElement) {
  static register() {
    register();
  }
}

export function register() {
  customElements.define("area-select", HTMLAreaSelectElement, {
    extends: "select",
  });
}

function waitAnimationFrame() {
  return new Promise((r) => requestAnimationFrame(r));
}
