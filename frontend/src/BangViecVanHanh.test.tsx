// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BangViecVanHanh } from './BangViecVanHanh'

describe('BangViecVanHanh', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    window.history.replaceState({}, '', '/nhac-viec')
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  it('FR_NTF_01 renders every group with count, semantic status, and actionable link', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') return jsonResponse([{ id: 1, maToa: 'TN-A', ten: 'Toà A' }])
      if (url === '/api/toa-nha/1/bang-viec') return jsonResponse({
        toaNhaId: 1,
        tenToaNha: 'Toà A',
        nhomViec: [
          group('NO_QUA_HAN', 'Nợ quá hạn', 2, 'CAN_XU_LY', '/hoa-don?toaNhaId=1&trangThai=QUA_HAN'),
          group('THIEU_CHI_SO', 'Thiếu chỉ số sau ngày chốt', 0, 'DA_XONG', '/ghi-chi-so?toaNhaId=1'),
          group('HOP_DONG_SAP_HET_HAN', 'Hợp đồng sắp hết hạn', 1, 'CAN_XU_LY', '/hop-dong?toaNhaId=1&sapHetHan=true'),
          group('SU_CO_TON_DONG', 'Sự cố tồn đọng trên 48 giờ', 0, 'DA_XONG', '/su-co?toaNhaId=1&boLoc=TON_DONG_QUA_48_GIO'),
          { ma: 'PCCC', tieuDe: 'Kiểm tra PCCC', soLuong: null, trangThai: 'CHUA_SAN_SANG', tenTrangThai: 'Chưa triển khai nguồn kiểm tra PCCC', khanCap: false, lienKet: null },
        ],
      })
      throw new Error(`Unexpected request ${url}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    await act(async () => root.render(<BangViecVanHanh token="test-token" />))

    await vi.waitFor(() => expect(container.querySelectorAll('[data-dashboard-group]')).toHaveLength(5))
    expect(container.querySelector('[data-dashboard-group="NO_QUA_HAN"]')?.textContent).toContain('2')
    expect(container.querySelector('[data-dashboard-group="NO_QUA_HAN"]')?.textContent).toContain('Cần xử lý')
    expect(container.querySelector('[data-dashboard-group="THIEU_CHI_SO"]')?.textContent).toContain('Đã xong')
    expect(container.querySelector('[data-dashboard-group="PCCC"]')?.textContent).toContain('Chưa triển khai nguồn kiểm tra PCCC')
    expect(container.querySelector('[data-dashboard-group="PCCC"] [data-dashboard-link]')).toBeNull()
    expect(container.querySelector('[data-dashboard-group="PCCC"]')?.textContent).not.toContain('Mở khu vực an toàn')
    expect(container.querySelector('[data-dashboard-group="NO_QUA_HAN"] [data-dashboard-link]')?.getAttribute('href')).toBe('/hoa-don?toaNhaId=1&trangThai=NO_QUA_HAN')
    expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/1/bang-viec', { headers: { Authorization: 'Bearer test-token' } })
  })
})

function group(ma: string, tieuDe: string, soLuong: number, trangThai: string, lienKet: string) {
  return { ma, tieuDe, soLuong, trangThai, tenTrangThai: trangThai === 'DA_XONG' ? 'Đã xong' : 'Cần xử lý', khanCap: trangThai === 'CAN_XU_LY', lienKet }
}

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } })
}
