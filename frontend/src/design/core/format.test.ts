import { describe, expect, it } from 'vitest'
import { dinhDangNgayIso } from './format'

describe('dinhDangNgayIso', () => {
  it('NFR-USA-06 formats backend ISO dates as dd/MM/yyyy without timezone conversion', () => {
    expect(dinhDangNgayIso('2026-08-31')).toBe('31/08/2026')
  })

  it('NFR-USA-06 keeps an unrecognised API value visible instead of inventing a date', () => {
    expect(dinhDangNgayIso('ngay-khong-hop-le')).toBe('ngay-khong-hop-le')
  })
})
