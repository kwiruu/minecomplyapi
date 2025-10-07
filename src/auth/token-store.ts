const TOKEN_KEY = '__supabaseAuthToken';

type GlobalStore = Record<string, unknown>;

const getStore = (): GlobalStore => globalThis as GlobalStore;

export const setAuthToken = (token: string) => {
  const store = getStore();
  try {
    Object.defineProperty(store, TOKEN_KEY, {
      value: token,
      writable: true,
      enumerable: false,
      configurable: true,
    });
  } catch {
    store[TOKEN_KEY] = token;
  }
};

export const peekAuthToken = (): string | undefined => {
  const store = getStore();
  const token = store[TOKEN_KEY];
  return typeof token === 'string' ? token : undefined;
};

export const consumeAuthToken = (): string | undefined => {
  const store = getStore();
  const token = peekAuthToken();
  if (token) {
    delete store[TOKEN_KEY];
  }
  return token;
};

export const clearAuthToken = () => {
  const store = getStore();
  if (TOKEN_KEY in store) {
    delete store[TOKEN_KEY];
  }
};
