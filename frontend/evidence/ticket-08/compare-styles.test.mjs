import { describe, expect, it } from 'vitest'
import * as comparator from './compare-styles.mjs'

const { SCREEN_CASES, assertRenderedApp, compareRgba } = comparator

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

  it('plans evidence for both required responsive viewports', () => {
    expect(comparator.VIEWPORTS).toEqual([
      expect.objectContaining({ width: 360, height: 2200, deviceScaleFactor: 1 }),
      expect.objectContaining({ width: 1920, height: 2200, deviceScaleFactor: 1 }),
    ])

    const plan = comparator.buildEvidencePlan()

    expect(plan).toHaveLength(10)
    expect([...new Set(plan.map(({ viewport }) => viewport.width))]).toEqual([360, 1920])
    expect(plan.map(({ imageStem }) => imageStem)).toEqual([
      'mobile-360-building',
      'mobile-360-room',
      'mobile-360-meter',
      'mobile-360-invoice',
      'mobile-360-account',
      'desktop-1920-building',
      'desktop-1920-room',
      'desktop-1920-meter',
      'desktop-1920-invoice',
      'desktop-1920-account',
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
      prefersLightColorScheme: true,
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
      prefersLightColorScheme: true,
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
      prefersLightColorScheme: true,
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
      prefersLightColorScheme: true,
      surfacePresent: true,
      settledTextPresent: true,
      invalid: null,
    }

    expect(() => assertRenderedApp(meter, settledMeter)).not.toThrow()
  })

  it('rejects a render captured under an unintended dark color scheme', () => {
    const building = SCREEN_CASES[0]
    const darkRender = {
      ready: true,
      renderer: 'App',
      screen: 'building',
      route: '/toa-nha',
      locationPathname: '/toa-nha',
      apiRequests: 'deterministic-mock',
      unexpectedRequestCount: 0,
      prefersLightColorScheme: false,
      surfacePresent: true,
      settledTextPresent: true,
      invalid: null,
    }

    expect(() => assertRenderedApp(building, darkRender)).toThrow(/light color scheme/)
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

  it('rejects evidence when any required rendered pixel changed', () => {
    expect(comparator.assertAppearancePreserved).toBeTypeOf('function')
    expect(() => comparator.assertAppearancePreserved({ differingPixels: 1 })).toThrow(/1 rendered pixel/)
  })
})
