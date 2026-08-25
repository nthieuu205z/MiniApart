import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchHealth } from './api'

describe('fetchHealth', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('requests the health endpoint through the relative API path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'UP', database: 'UP' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchHealth()).resolves.toEqual({ status: 'UP', database: 'UP' })
    expect(fetchMock).toHaveBeenCalledWith('/api/health')
  })
})
