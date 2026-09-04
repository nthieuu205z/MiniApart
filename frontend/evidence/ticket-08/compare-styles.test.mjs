import { describe, expect, it } from 'vitest'
import { SCREEN_CASES, assertRenderedApp, compareRgba } from './compare-styles.mjs'

describe('Ticket 08 visual comparator', () => {
  it('covers the five migrated routes through the real App entry point', () => {
    expect(SCREEN_CASES).toEqual([
      expect.objectContaining({ id: 'building', route: '/toa-nha', testId: 'building-catalog' }),
      expect.objectContaining({ id: 'room', route: '/phong', testId: 'room-catalog' }),
      expect.objectContaining({ id: 'meter', route: '/ghi-chi-so', testId: 'meter-screen' }),
      expect.objectContaining({ id: 'invoice', route: '/hoa-don-cua-toi', testId: 'invoice-detail' }),
      expect.objectContaining({ id: 'account', route: '/tai-khoan', testId: 'account-management' }),
    ])
  })

  it('rejects synthetic hook-only HTML that was not rendered and settled through App', () => {
    const syntheticFixture = {
      ready: false,
      renderer: null,
      screen: null,
      route: '/toa-nha',
      locationPathname: '/toa-nha',
      apiRequests: null,
      unexpectedRequestCount: 0,
      surfacePresent: true,
      settledTextPresent: true,
      invalid: null,
    }

    expect(() => assertRenderedApp(SCREEN_CASES[0], syntheticFixture)).toThrow(/real App render did not become ready/)
  })

  it('rejects a ready App document when the requested route surface is absent', () => {
    const wrongSurface = {
      ready: true,
      renderer: 'App',
      screen: 'building',
      route: '/toa-nha',
      locationPathname: '/toa-nha',
      apiRequests: 'deterministic-mock',
      unexpectedRequestCount: 0,
      surfacePresent: false,
      settledTextPresent: true,
      invalid: null,
    }

    expect(() => assertRenderedApp(SCREEN_CASES[0], wrongSurface)).toThrow(/building-catalog/)
  })

  it('accepts the settled room list without requiring a click-only room detail state', () => {
    const room = SCREEN_CASES.find((screen) => screen.id === 'room')
    const settledRoomList = {
      ready: true,
      renderer: 'App',
      screen: 'room',
      route: '/phong',
      locationPathname: '/phong',
      apiRequests: 'deterministic-mock',
      unexpectedRequestCount: 0,
      surfacePresent: true,
      settledTextPresent: true,
      invalid: null,
    }

    expect(() => assertRenderedApp(room, settledRoomList)).not.toThrow()
  })

  it('accepts settled data split across component markup when the runtime text check passed', () => {
    const meter = SCREEN_CASES.find((screen) => screen.id === 'meter')
    const settledMeter = {
      ready: true,
      renderer: 'App',
      screen: 'meter',
      route: '/ghi-chi-so',
      locationPathname: '/ghi-chi-so',
      apiRequests: 'deterministic-mock',
      unexpectedRequestCount: 0,
      surfacePresent: true,
      settledTextPresent: true,
      invalid: null,
    }

    expect(() => assertRenderedApp(meter, settledMeter)).not.toThrow()
  })

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
