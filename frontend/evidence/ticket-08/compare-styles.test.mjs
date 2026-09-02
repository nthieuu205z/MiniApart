import { describe, expect, it } from 'vitest'
import { compareRgba } from './compare-styles.mjs'

describe('Ticket 08 visual comparator', () => {
  it('reports identical rendered pixels without a diff', () => {
    const pixels = new Uint8Array([12, 34, 56, 255, 90, 80, 70, 255])

    expect(compareRgba({ width: 2, height: 1, pixels }, { width: 2, height: 1, pixels })).toEqual({
      width: 2,
      height: 1,
      totalPixels: 2,
      differingPixels: 0,
      maxChannelDelta: 0,
      totalAbsDelta: 0,
    })
  })

  it('counts changed pixels and channel deltas', () => {
    const before = new Uint8Array([12, 34, 56, 255, 90, 80, 70, 255])
    const after = new Uint8Array([12, 34, 56, 255, 100, 75, 72, 255])

    expect(compareRgba({ width: 2, height: 1, pixels: before }, { width: 2, height: 1, pixels: after })).toEqual({
      width: 2,
      height: 1,
      totalPixels: 2,
      differingPixels: 1,
      maxChannelDelta: 10,
      totalAbsDelta: 17,
    })
  })
})
