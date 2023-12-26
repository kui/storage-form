import { repeatAsPolling } from "./promises.js";
import { SingletonMapManager } from "./singleton-map-manager.js";

interface ValueContainerElement extends HTMLElement {
  value: string;
  checked?: boolean;
}

export interface ValueChangeDetail {
  oldValue: string;
  newValue: string;
}

export interface CheckedChangeDetail {
  oldChecked: boolean;
  newChecked: boolean;
}

export type ValueObserverContainer = ReturnType<(typeof ValueObserver)["registry"]["get"]>;

interface ValueObserverOptions {
  enablePolling?: boolean;
  enableBubbling?: boolean;
}

export class ValueObserver {
  #value: string;
  #checked: boolean | undefined;
  /**
   * Polling the value of the element.
   *
   * Polling start/stop is affected after observer start or restart.
   */
  enablePolling: boolean;
  enableBubbling: boolean;
  private listening: { stop: () => void | Promise<void> } | null = null;

  private constructor(
    private readonly element: ValueContainerElement,
    options: ValueObserverOptions = {},
  ) {
    this.#value = element.value;
    this.#checked = element.checked;
    this.enablePolling = options.enablePolling ?? false;
    this.enableBubbling = options.enableBubbling ?? false;
  }

  private static readonly registry = new SingletonMapManager(
    (element: ValueContainerElement, options?: ValueObserverOptions) => {
      const o = new ValueObserver(element, options);
      o.start();
      return o;
    },
    (observer: ValueObserver) => {
      return observer.stop();
    },
  );

  static async observe(
    element: ValueContainerElement,
    options?: ValueObserverOptions,
  ): Promise<ValueObserverContainer> {
    const container = ValueObserver.registry.get(element, options);
    const observer = container.instance;
    const oldEnablePolling = observer.enablePolling;
    observer.enablePolling ||= options?.enablePolling ?? false;
    if (oldEnablePolling !== observer.enablePolling) await observer.restart();
    observer.enableBubbling ||= options?.enableBubbling ?? false;
    return container;
  }

  private start() {
    if (this.listening) throw Error("Already started");
    const changeListener = (event: Event) => {
      if (event.target !== this.element) return;
      this.update();
    };
    this.element.addEventListener("input", changeListener);
    this.element.addEventListener("change", changeListener);
    const listenings: { stop: () => void | Promise<void> }[] = [
      {
        stop: () => {
          this.element.removeEventListener("input", changeListener);
          this.element.removeEventListener("change", changeListener);
        },
      },
    ];
    if (this.enablePolling)
      listenings.push(
        repeatAsPolling(() => {
          this.update();
        }),
      );

    this.listening = {
      stop: async () => {
        await Promise.all(listenings.map((l) => l.stop()));
      },
    };
  }

  private update() {
    const oldValue = this.#value;
    const newValue = this.element.value;
    if (oldValue !== newValue) {
      this.#value = newValue;
      this.element.dispatchEvent(
        new CustomEvent<ValueChangeDetail>("valuechange", {
          detail: { oldValue, newValue },
          bubbles: this.enableBubbling,
        }),
      );
    }

    const oldChecked = this.#checked;
    const newChecked = this.element.checked;
    if (
      oldChecked !== newChecked &&
      oldChecked !== undefined &&
      newChecked !== undefined
    ) {
      this.#checked = newChecked;
      this.element.dispatchEvent(
        new CustomEvent<CheckedChangeDetail>("checkedchange", {
          detail: { oldChecked, newChecked },
          bubbles: this.enableBubbling,
        }),
      );
    }
  }

  private async stop() {
    if (!this.listening) throw Error("Not started");
    await this.listening.stop();
    this.listening = null;
  }

  /**
   * To prevent event dispatching, call this method before changing the element's value.
   */
  sync() {
    this.#value = this.element.value;
    this.#checked = this.element.checked;
  }

  async restart() {
    await this.stop();
    this.start();
  }
}
