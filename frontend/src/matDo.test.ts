import { describe, expect, it } from 'vitest'
import { matDoTheoVaiTro } from './matDo'

describe('matDoTheoVaiTro', () => {
  it.each([
    ['QUAN_LY', false, 'lam-viec'], ['CHU', false, 'lam-viec'], ['QTHT', false, 'lam-viec'],
    ['CHU', true, 'chu-m'], ['QUAN_LY', true, 'chu-m'],
    ['NGUOI_THUE', false, 'thoang'], ['NGUOI_THUE', true, 'thoang'], ['THO', false, 'thoang'], ['THO', true, 'thoang'],
  ] as const)('%s, hẹp=%s → %s', (vaiTro, hep, ky) => {
    expect(matDoTheoVaiTro(vaiTro, hep)).toBe(ky)
  })
})
