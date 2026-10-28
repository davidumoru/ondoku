export interface LocalStore<T> {
  read: () => T;
  write: (value: T) => void;
  subscribe: (callback: () => void) => () => void;
}

export function createLocalStore<T>(
  key: string,
  parse: (raw: string | null) => T,
): LocalStore<T> {
  const event = `${key}-change`;
  let cache: { raw: string | null; value: T } | null = null;

  function read(): T {
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(key);
    } catch {}
    if (cache?.raw !== raw) cache = { raw, value: parse(raw) };
    return cache.value;
  }

  function write(value: T) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      return;
    }
    window.dispatchEvent(new Event(event));
  }

  function subscribe(callback: () => void) {
    window.addEventListener(event, callback);
    window.addEventListener("storage", callback);
    return () => {
      window.removeEventListener(event, callback);
      window.removeEventListener("storage", callback);
    };
  }

  return { read, write, subscribe };
}
