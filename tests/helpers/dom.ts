/** Waits for mutation observers and queued storage tasks to be processed. */
export function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/** Replaces the body, and waits for the custom elements to be initialized. */
export async function render(html: string): Promise<void> {
  document.body.innerHTML = html;
  await flush();
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function query<T extends Element>(selector: string): T {
  const e = document.querySelector<T>(selector);
  if (e === null) throw Error(`Not found: ${selector}`);
  return e;
}

/** Returns all entries of the storage. */
export function dump(storage: Storage): Record<string, string> {
  return Object.fromEntries(Object.entries(storage));
}

/** Changes the value as a user does. */
export async function input(
  element: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement,
  value: string,
): Promise<void> {
  element.value = value;
  element.dispatchEvent(new Event("input", { bubbles: true }));
  await flush();
}

/** Changes the checked state as a user does. */
export async function check(
  element: HTMLInputElement,
  checked: boolean,
): Promise<void> {
  element.checked = checked;
  element.dispatchEvent(new Event("change", { bubbles: true }));
  await flush();
}

/** Changes the storage as another window does. */
export async function updateFromAnotherWindow(
  storage: Storage,
  key: string,
  newValue: string | null,
): Promise<void> {
  const oldValue = storage.getItem(key);
  if (newValue === null) storage.removeItem(key);
  else storage.setItem(key, newValue);
  dispatchEvent(
    new StorageEvent("storage", {
      key,
      oldValue,
      newValue,
      storageArea: storage,
    }),
  );
  await flush();
}
