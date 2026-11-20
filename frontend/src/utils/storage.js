// localStorage can be blocked (private mode, sandboxed frames) - never let that crash the app
const memory = {};

export const storage = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return memory[key] ?? null;
    }
  },
  set(key, value) {
    memory[key] = value;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* keep in memory */
    }
  },
  remove(key) {
    delete memory[key];
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
