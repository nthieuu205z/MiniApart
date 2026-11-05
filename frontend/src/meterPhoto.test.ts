// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest'
import { nenAnhCongTo } from './meterPhoto'

describe('nenAnhCongTo', () => {
  it('FR-MTR-06 compresses meter photos before upload', async () => {
    const original = new File([new Uint8Array(4096)], 'cong-to.png', { type: 'image/png' })
    const drawImage = vi.fn()
    const canvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({ drawImage })),
      toBlob(callback: (blob: Blob | null) => void, type?: string, quality?: number) {
        callback(new Blob([new Uint8Array(512)], { type: type ?? 'image/jpeg' }))
      },
    } as unknown as HTMLCanvasElement

    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 1200, height: 800 }))
    const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') return canvas
      return document.createElementNS('http://www.w3.org/1999/xhtml', tagName)
    })

    const compressed = await nenAnhCongTo(original)

    expect(createElementSpy).toHaveBeenCalledWith('canvas')
    expect(drawImage).toHaveBeenCalled()
    expect(compressed.type).toBe('image/jpeg')
    expect(compressed.name).toBe('cong-to.jpg')
    expect(compressed.size).toBeLessThan(original.size)
  })
})
