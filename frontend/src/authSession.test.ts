import { beforeEach, describe, expect, it } from 'vitest'
import { clearStoredToken, readStoredToken, storeToken } from './authSession'

describe('authSession', () => {
  beforeEach(() => {
    clearStoredToken()
  })

  it('FR-AUT-01 stores and reloads the signed-in token across page refreshes', () => {
    storeToken('header.payload.signature')

    expect(readStoredToken()).toBe('header.payload.signature')
  })

  it('FR-AUT-01 clears the stored token on logout', () => {
    storeToken('header.payload.signature')

    clearStoredToken()

    expect(readStoredToken()).toBeNull()
  })
})
