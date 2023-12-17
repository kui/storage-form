import * as utils from "./utils";
import StorageBinder, { Change } from "./storage-binder";

const DEFAULT_INTERVAL = 700;

export function mixinStorage(c: typeof HTMLFormElement) {
  return class extends c {
    private binder: StorageBinder | null = null;

    get autosync(): boolean {
      return this.hasAttribute("autosync");
    }
    set autosync(b: boolean) {
      setAttrAsBoolean(this, "autosync", b);
    }

    get autoload(): boolean {
      return this.hasAttribute("autoload");
    }
    set autoload(b: boolean) {
      setAttrAsBoolean(this, "autoload", b);
    }

    get interval(): number {
      const n = parseInt(this.getAttribute("interval") ?? "");
      return n > 300 ? n : DEFAULT_INTERVAL;
    }
    set interval(v: number) {
      this.setAttribute("interval", String(v));
    }

    get area(): string {
      return this.getAttribute("area") ?? "";
    }
    set area(v: string) {
      this.setAttribute("area", v);
    }

    connectedCallback() {
      this.binder = new StorageBinder(this.generateBindee());
      this.binder.onChange = (event: Change) => {
        this.dispatchEvent(
          new CustomEvent(`storage-form-${event.type}`, { detail: event }),
        );
      };

      this.binder.startAutoBinding();

      this.addEventListener("submit", (event) => {
        event.preventDefault();
        this.binder?.submit({ force: true }).catch(console.error);
      });

      this.setObserver();

      this.binder.startAutoBinding();
    }

    generateBindee() {
      return {
        getArea: () => this.area,
        getInterval: () => this.interval,
        isAutoSync: () => this.autosync,
        isAutoLoad: () => this.autoload,
        getNames: () => map(this.getStorageElements(), (e) => e.name),
        getElements: () => this.getStorageElements(),
        getTarget: () => this,
      };
    }

    *getStorageElements(): Iterable<Element & { name: string }> {
      for (const e of this.elements) {
        if ("area" in e) continue; // filter out "area-select"
        if ("name" in e) yield e as Element & { name: string };
      }
    }

    setObserver() {
      const formControlObservers = new Map<Element, MutationObserver>();

      const observeFormControl = (element: Element) => {
        const o = new MutationObserver(() => {
          this.binder?.doAutoTask().catch(console.error);
        });
        o.observe(element, { attributes: true, attributeFilter: ["name"] });
        formControlObservers.set(element, o);
      };

      const disconnectFormControl = (element: Element) => {
        const o = formControlObservers.get(element);
        if (o == null) return;
        o.disconnect();
        formControlObservers.delete(element);
      };

      // Observe added/removed form-controls
      // Do NOT use MutationObserver. form controls are not always the DOM children of the form
      // such as <input form="..." ...>.
      // And MutationObserver might be too heavy to observe all descendants of a body element.
      this.observeFormControls(async ({ addedElements, removedElements }) => {
        console.debug("detect added/removed form-controls", self);
        for (const e of addedElements) observeFormControl(e);
        for (const e of removedElements) disconnectFormControl(e);
        await this.binder?.doAutoTask();
      });
    }

    observeFormControls(
      callback: (e: {
        addedElements: Set<Element>;
        removedElements: Set<Element>;
      }) => Promise<void>,
    ) {
      let elements = this.elements;
      (async () => {
        for (;;) {
          await waitAnimationFrame();
          const newElements = this.elements;
          if (isEqualsArray(elements, newElements)) continue;

          const oldSet = new Set(elements);
          const newSet = new Set(newElements);
          const addedElements = utils.subtractSet(newSet, oldSet);
          const removedElements = utils.subtractSet(oldSet, newSet);
          elements = newElements;
          await callback({ addedElements, removedElements });
        }
      })().catch(console.error);
    }

    static get observedAttributes() {
      return ["autosync", "autoload", "area"];
    }

    attributeChangedCallback(attrName: string) {
      if (!this.binder) return;
      switch (attrName) {
        case "autosync":
        case "autoload":
          this.binder.startAutoBinding();
          break;
        case "area":
          this.initBinder();
          this.binder.doAutoTask().catch(console.error);
          break;
      }
    }

    initBinder() {
      this.binder?.init();
    }
    async load(): Promise<void> {
      await this.binder?.load({ force: true });
    }
    async sync() {
      await this.binder?.sync();
    }
  };
}

export class HTMLStorageFormElement extends mixinStorage(HTMLFormElement) {
  constructor() {
    super();
  }

  static register() {
    register();
  }
}

export function register() {
  customElements.define("storage-form", HTMLStorageFormElement, {
    extends: "form",
  });
}

interface ArrayLike<T> {
  length: number;
  [index: number]: T;
}

function isEqualsArray(a: ArrayLike<unknown>, b: ArrayLike<unknown>) {
  if (a.length !== b.length) return false;
  const len = a.length;
  for (let i = 0; i < len; i++) if (a[i] !== b[i]) return false;
  return true;
}

function setAttrAsBoolean(self: HTMLElement, name: string, b: boolean) {
  if (b) {
    self.setAttribute(name, "");
  } else {
    self.removeAttribute(name);
  }
}

function waitAnimationFrame() {
  return new Promise((r) => requestAnimationFrame(r));
}

function* map<T, U>(iter: Iterable<T>, mapper: (e: T) => U) {
  for (const e of iter) yield mapper(e);
}
