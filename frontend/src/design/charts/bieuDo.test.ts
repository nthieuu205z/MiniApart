import { describe, expect, it } from 'vitest'
import { cungGauge, duongVaVung, mocTruc } from './bieuDo'

const k = { rong: 608, cao: 212, trai: 52, phai: 8, tren: 12, duoi: 24 }

describe('mocTruc', () => {
  it('chọn bước 1/2/5 × 10^n phủ giá trị lớn nhất', () => {
    expect(mocTruc(137_395_000)).toEqual([0, 50_000_000, 100_000_000, 150_000_000])
    expect(mocTruc(1246, 4)).toEqual([0, 500, 1000, 1500, 2000])
    expect(mocTruc(90)).toEqual([0, 50, 100, 150])
  })
  it('không có số liệu thì trục 0–1, không chia cho 0', () => {
    expect(mocTruc(0)).toEqual([0, 1])
  })
})

describe('duongVaVung', () => {
  it('điểm đầu ở lề trái, điểm cuối ở lề phải, giá trị bằng trần chạm mép trên', () => {
    const r = duongVaVung([0, 150, 75], 150, k)
    expect(r.diem[0]).toEqual({ x: 52, y: 188 })
    expect(r.diem[1]).toEqual({ x: 326, y: 12 })
    expect(r.diem[2]).toEqual({ x: 600, y: 100 })
    expect(r.duong).toBe('M52 188 L326 12 L600 100')
    expect(r.vung).toBe('M52 188 L52 188 L326 12 L600 100 L600 188 Z')
  })
  it('kỳ chưa có số (null) cắt đường thành hai đoạn', () => {
    const r = duongVaVung([10, 20, null, 30], 30, k)
    expect(r.duong.match(/M/g)).toHaveLength(2)
    expect(r.diem[2]).toBeNull()
  })
  it('một điểm duy nhất nằm giữa khung', () => {
    expect(duongVaVung([5], 10, k).diem[0]?.x).toBe(326)
  })
  it('trần trục = 0 (toàn số 0) vẽ sát đáy, không ra NaN', () => {
    expect(duongVaVung([0, 0], 0, k).duong).toBe('M52 188 L600 188')
  })
  it('vượt trần thì kẹp ở mép trên, không vẽ ra ngoài khung', () => {
    expect(duongVaVung([999], 10, k).diem[0]?.y).toBe(12)
  })
})

describe('cungGauge', () => {
  it('75% kết thúc ở góc 45° bên phải', () => {
    expect(cungGauge(75).giaTri).toBe('M20 120 A100 100 0 0 1 190.71 49.29')
  })
  it('0% không vẽ cung giá trị, quá 100% kẹp về 100%', () => {
    expect(cungGauge(0).giaTri).toBe('')
    expect(cungGauge(140).giaTri).toBe('M20 120 A100 100 0 0 1 220 120')
    expect(cungGauge(Number.NaN).giaTri).toBe('')
  })
})
