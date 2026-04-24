/**
 * Module-level token store so API functions can attach Authorization headers
 * without needing React context. AuthContext is responsible for keeping this
 * in sync with the persisted token.
 */
let _token: string | null = null;

export const tokenStore = {
  get: () => _token,
  set: (token: string | null) => {
    _token = token;
  },
};
