type Changes = Record<string, chrome.storage.StorageChange>;

/** A minimum implementation of chrome.storage.StorageArea. */
export function fakeChromeStorageArea(
  values: Record<string, unknown> = {},
  constants: Record<string, number> = {},
) {
  const listeners = new Set<(changes: Changes) => void>();
  const area = {
    ...constants,
    get: jest.fn((keys: string[] | null) =>
      Promise.resolve(
        Object.fromEntries(
          Object.entries(values).filter(([k]) => keys?.includes(k) ?? true),
        ),
      ),
    ),
    getBytesInUse: jest.fn((key: string | null) =>
      Promise.resolve(
        Object.entries(values)
          .filter(([k]) => key === null || k === key)
          .reduce((acc, [k, v]) => acc + k.length + String(v).length, 0),
      ),
    ),
    set: jest.fn((items: Record<string, unknown>, callback: () => void) => {
      Object.assign(values, items);
      callback();
    }),
    remove: jest.fn((keys: string[], callback: () => void) => {
      for (const k of keys) Reflect.deleteProperty(values, k);
      callback();
    }),
    onChanged: {
      addListener: (l: (changes: Changes) => void) => listeners.add(l),
      removeListener: (l: (changes: Changes) => void) => listeners.delete(l),
    },
  };
  return {
    values,
    mock: area,
    area: area as unknown as chrome.storage.StorageArea,
    emit: (changes: Changes) => {
      for (const l of listeners) l(changes);
    },
  };
}
