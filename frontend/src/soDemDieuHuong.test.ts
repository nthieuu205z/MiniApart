// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { taiSoDemDieuHuong } from './soDemDieuHuong'

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

function gia(ham: (url: string) => Response) {
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => ham(typeof input === 'string' ? input : input instanceof URL ? input.pathname + input.search : input.url))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe('taiSoDemDieuHuong', () => {
  it('Chủ: đếm sự cố mới tiếp nhận và lịch hẹn chờ xác nhận, kèm toà đang chọn', async () => {
    const f = gia((url) => {
      if (url.startsWith('/api/yeu-cau-sua-chua')) return json([{ trangThai: 'MOI_TIEP_NHAN' }, { trangThai: 'MOI_TIEP_NHAN' }, { trangThai: 'DA_PHAN_CONG' }])
      if (url.startsWith('/api/lich-hen')) return json([{ trangThai: 'CHO_XAC_NHAN' }, { trangThai: 'DA_XAC_NHAN' }, { trangThai: 'CHO_XAC_NHAN' }, { trangThai: 'CHO_XAC_NHAN' }])
      throw new Error(`không mong đợi ${url}`)
    })
    expect(await taiSoDemDieuHuong('t', 'CHU', 3)).toEqual({ suCo: 2, lichHen: 3, chuKy: undefined })
    const urls = f.mock.calls.map((c) => String(c[0]))
    expect(urls).toContain('/api/yeu-cau-sua-chua?trangThai=MOI_TIEP_NHAN&toaNhaId=3')
    expect(urls).toContain('/api/lich-hen?toaNhaId=3')
    expect(urls.some((u) => u.includes('dashboard'))).toBe(false)
  })

  it('Quản lý: thêm số công tơ chưa ghi từ dashboard', async () => {
    gia((url) => {
      if (url.startsWith('/api/dashboard/quan-ly')) return json({ kpi: { soCongToChuaGhi: 4 } })
      if (url.startsWith('/api/yeu-cau-sua-chua')) return json([])
      return json([])
    })
    expect(await taiSoDemDieuHuong('t', 'QUAN_LY', null)).toEqual({ suCo: 0, lichHen: 0, chuKy: 4 })
  })

  it('API lỗi → số đó biến mất, các số khác vẫn còn, không ném lỗi', async () => {
    gia((url) => (url.startsWith('/api/lich-hen') ? json({ thongBao: 'lỗi' }, 500) : json([{ trangThai: 'MOI_TIEP_NHAN' }])))
    expect(await taiSoDemDieuHuong('t', 'CHU', null)).toEqual({ suCo: 1, lichHen: undefined, chuKy: undefined })
  })

  it('Thợ, khách, QTHT không có số và không gọi API', async () => {
    const f = gia(() => json([]))
    for (const v of ['THO', 'NGUOI_THUE', 'QTHT']) expect(await taiSoDemDieuHuong('t', v, null)).toEqual({})
    expect(f).not.toHaveBeenCalled()
  })
})
