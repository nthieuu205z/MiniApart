import { describe, expect, it } from 'vitest'
import { dinhDangNgayIso, dinhDangTien } from './format'

describe('dinhDangNgayIso', () => {
  it('NFR-USA-06 formats backend ISO dates as dd/MM/yyyy without timezone conversion', () => {
    expect(dinhDangNgayIso('2026-08-31')).toBe('31/08/2026')
  })

  it('NFR-USA-06 keeps an unrecognised API value visible instead of inventing a date', () => {
    expect(dinhDangNgayIso('ngay-khong-hop-le')).toBe('ngay-khong-hop-le')
  })
})

describe('dinhDangTien', () => {
  it('NFR-USA-06 formats NUMERIC money strings without floating-point conversion', () => {
    expect(dinhDangTien('99999999999999.99')).toBe('99.999.999.999.999,99')
    expect(dinhDangTien('-12345678901234.56')).toBe('-12.345.678.901.234,56')
    expect(dinhDangTien('3714500.00')).toBe('3.714.500')
  })
})
