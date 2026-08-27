const TOKEN_STORAGE_KEY = 'miniapart.auth.token'

const fallbackStorage = new Map<string, string>()

function getStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  if (typeof globalThis.localStorage !== 'undefined') {
    return globalThis.localStorage
  }

  return {
    getItem(key: string) {
      return fallbackStorage.get(key) ?? null
    },
    setItem(key: string, value: string) {
      fallbackStorage.set(key, value)
    },
    removeItem(key: string) {
      fallbackStorage.delete(key)
    },
  }
}

export function storeToken(token: string) {
  getStorage().setItem(TOKEN_STORAGE_KEY, token)
}

export function readStoredToken() {
  return getStorage().getItem(TOKEN_STORAGE_KEY)
}

export function clearStoredToken() {
  getStorage().removeItem(TOKEN_STORAGE_KEY)
}
