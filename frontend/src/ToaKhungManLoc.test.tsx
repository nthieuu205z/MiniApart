// @vitest-environment jsdom
// x12: các màn báo cáo/lịch hẹn/tổng quan chủ đi theo ô chọn toà của khung, không còn ô chọn toà riêng.
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import BaoCaoTongQuan from './BaoCaoTongQuan'
import ChiPhiBaoTriBaoCao from './ChiPhiBaoTriBaoCao'
import { ChuDashboard } from './ChuDashboard'
import QuanLyLichHen from './QuanLyLichHen'
import TieuThuBaoCao from './TieuThuBaoCao'
import { ToaDangChonProvider, useToaDangChon } from './toaDangChon'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

const DS = [{ id: 1, ten: 'Toà A' }, { id: 2, ten: 'Toà B' }] as never[]
const taiToa = async () => DS

function DoiToa() {
  const { chon } = useToaDangChon()
  return <button type="button" data-testid="doi-toa-2" onClick={() => chon(2)}>đổi</button>
}

const MAN: Array<[string, string, (p: { token: string }) => React.ReactElement, RegExp]> = [
  ['QuanLyLichHen', '/lich-hen', QuanLyLichHen, /\/api\/lich-hen\?toaNhaId=2/],
  ['TieuThuBaoCao', '/bao-cao/tieu-thu', TieuThuBaoCao, /\/api\/bao-cao\/tieu-thu\?toaNhaId=2/],
  ['ChiPhiBaoTriBaoCao', '/bao-cao/chi-phi-bao-tri', ChiPhiBaoTriBaoCao, /\/api\/bao-cao\/chi-phi-bao-tri\?toaNhaId=2/],
  ['BaoCaoTongQuan', '/bao-cao', BaoCaoTongQuan, /\/api\/bao-cao\/tong-quan\?.*toaNhaId=2/],
  ['ChuDashboard', '/', ChuDashboard, /\/api\/dashboard\/chu\?.*toaNhaId=2/],
]

describe('đổi toà ở khung → màn gọi API với toà mới', () => {
  let root: Root
  let container: HTMLDivElement
  const goi: string[] = []

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    localStorage.clear()
    goi.length = 0
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      goi.push(String(input))
      return new Response('{}', { status: 500, headers: { 'Content-Type': 'application/json' } })
    }))
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.unstubAllGlobals()
  })

  it.each(MAN)('%s', async (_ten, duongDan, Man, mau) => {
    window.history.replaceState({}, '', duongDan)
    await act(async () => root.render(
      <ToaDangChonProvider token="t" vaiTro="CHU" search="" taiToa={taiToa}><DoiToa /><Man token="t" /></ToaDangChonProvider>,
    ))
    expect(container.querySelector('select[aria-label*="toà nhà"], select#lich-hen-toa')).toBeNull()
    await act(async () => { (container.querySelector('[data-testid="doi-toa-2"]') as HTMLButtonElement).click() })
    await vi.waitFor(() => expect(goi.some((u) => mau.test(u))).toBe(true))
  })
})
