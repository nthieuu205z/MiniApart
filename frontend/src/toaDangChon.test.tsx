// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ThongTinToaNha } from './api'
import { BuildingSelect, useBuildings } from './ManagementShared'
import { KHOA_LUU_TOA, ToaDangChonProvider, tenToaDangChon, useMotToa, useToaDangChon, type ToaDangChon } from './toaDangChon'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

const toa = (id: number, ten: string) => ({ id, ten, maToa: `T${id}`, diaChi: '', soTang: 4, ngayChotSo: 25, soNgayHanTt: 5, maNganHang: '' }) as unknown as ThongTinToaNha
const BA_TOA = [toa(1, 'Bình Minh Riverside'), toa(2, 'Mộc Lan Home'), toa(3, 'An Nhiên Residence')]

let container: HTMLDivElement
let root: Root | undefined
let gt: ToaDangChon
let mot: ReturnType<typeof useMotToa>
function Doc() { gt = useToaDangChon(); mot = useMotToa(); return null }

beforeEach(() => { globalThis.IS_REACT_ACT_ENVIRONMENT = true; localStorage.clear(); container = document.createElement('div'); document.body.append(container); root = createRoot(container) })
afterEach(async () => { await act(async () => root?.unmount()); root = undefined; container.remove() })

async function ve(vaiTro: string, search = '', ds = BA_TOA, token: string | null = 't') {
  const taiToa = async () => ds
  await act(async () => root!.render(<ToaDangChonProvider token={token} vaiTro={vaiTro} search={search} taiToa={taiToa}><Doc /></ToaDangChonProvider>))
  return taiToa
}

describe('ToaDangChonProvider', () => {
  it('Chủ: mặc định "Tất cả", chọn toà thì nhớ, chọn lại "Tất cả" thì xoá', async () => {
    await ve('CHU')
    expect(gt.toaNhaId).toBeNull()
    expect(gt.coDinh).toBe(false)
    expect(tenToaDangChon(gt)).toBe('Tất cả 3 toà')
    await act(async () => gt.chon(2))
    expect(gt.toaNhaId).toBe(2)
    expect(localStorage.getItem(KHOA_LUU_TOA)).toBe('2')
    expect(tenToaDangChon(gt)).toBe('Mộc Lan Home')
    await act(async () => gt.chon(null))
    expect(localStorage.getItem(KHOA_LUU_TOA)).toBeNull()
  })

  it('Chủ: lần đăng nhập sau đọc lại toà đã nhớ', async () => {
    localStorage.setItem(KHOA_LUU_TOA, '3')
    await ve('CHU')
    expect(gt.toaNhaId).toBe(3)
  })

  it('toà đã nhớ không còn trong danh sách → "Tất cả" và xoá giá trị cũ', async () => {
    localStorage.setItem(KHOA_LUU_TOA, '9')
    await ve('CHU')
    expect(gt.toaNhaId).toBeNull()
    expect(localStorage.getItem(KHOA_LUU_TOA)).toBeNull()
  })

  it('link cũ có ?toaNhaId= thắng giá trị đã nhớ và được nhớ luôn', async () => {
    localStorage.setItem(KHOA_LUU_TOA, '1')
    await ve('CHU', '?toaNhaId=3&kyId=4')
    expect(gt.toaNhaId).toBe(3)
    expect(localStorage.getItem(KHOA_LUU_TOA)).toBe('3')
  })

  it('đổi URL sau khi tải (điều hướng tới link có toaNhaId) → nhận toà mới; toaNhaId lạ thì bỏ qua', async () => {
    const taiToa = await ve('CHU')
    await act(async () => root!.render(<ToaDangChonProvider token="t" vaiTro="CHU" search="?toaNhaId=2" taiToa={taiToa}><Doc /></ToaDangChonProvider>))
    expect(gt.toaNhaId).toBe(2)
    await act(async () => root!.render(<ToaDangChonProvider token="t" vaiTro="CHU" search="?toaNhaId=77" taiToa={taiToa}><Doc /></ToaDangChonProvider>))
    expect(gt.toaNhaId).toBe(2)
  })

  it('không nhận id không có trong danh sách khi chọn', async () => {
    await ve('CHU')
    await act(async () => gt.chon(42))
    expect(gt.toaNhaId).toBeNull()
  })

  it('Quản lý: một toà được phân công → cố định, không đổi được, không ghi storage', async () => {
    await ve('QUAN_LY', '?toaNhaId=1', [toa(3, 'An Nhiên Residence')])
    expect(gt.toaNhaId).toBe(3)
    expect(gt.coDinh).toBe(true)
    await act(async () => gt.chon(null))
    expect(gt.toaNhaId).toBe(3)
    expect(localStorage.getItem(KHOA_LUU_TOA)).toBeNull()
    expect(mot.canChonTaiCho).toBe(false)
  })

  it('Thợ / khách / QTHT: không tải toà, không có ô chọn', async () => {
    let goi = 0
    for (const v of ['THO', 'NGUOI_THUE', 'QTHT']) {
      await act(async () => root!.render(<ToaDangChonProvider token="t" vaiTro={v} search="" taiToa={async () => { goi += 1; return BA_TOA }}><Doc /></ToaDangChonProvider>))
      expect(gt.coDinh).toBe(true)
      expect(gt.danhSach).toEqual([])
    }
    expect(goi).toBe(0)
  })

  it('đăng xuất (token null) → về trạng thái trống', async () => {
    await ve('CHU')
    await act(async () => gt.chon(1))
    await ve('CHU', '', BA_TOA, null)
    expect(gt.toaNhaId).toBeNull()
    expect(gt.danhSach).toEqual([])
  })

  it('useMotToa: Chủ ở "Tất cả" phải chọn toà tại chỗ; chọn xong là chọn cho cả khung', async () => {
    await ve('CHU')
    expect(mot).toMatchObject({ toaNhaId: null, canChonTaiCho: true })
    await act(async () => mot.chon(1))
    expect(gt.toaNhaId).toBe(1)
    expect(mot.canChonTaiCho).toBe(false)
  })

  it('useMotToa({ tuChonDau }): Chủ ở "Tất cả" được chọn sẵn toà đầu; Quản lý (một toà) không bị đổi', async () => {
    let tuChon: ReturnType<typeof useMotToa>
    function DocTuChon() { gt = useToaDangChon(); tuChon = useMotToa({ tuChonDau: true }); return null }
    await act(async () => root!.render(<ToaDangChonProvider token="t" vaiTro="CHU" search="" taiToa={async () => BA_TOA as never}><DocTuChon /></ToaDangChonProvider>))
    await act(async () => undefined)
    expect(tuChon!.toaNhaId).toBe(BA_TOA[0].id)
    expect(gt.toaNhaId).toBe(BA_TOA[0].id)
  })

  it('lỗi tải danh sách toà hiện ra, không văng', async () => {
    await act(async () => root!.render(<ToaDangChonProvider token="t" vaiTro="CHU" search="" taiToa={async () => { throw new Error('Máy chủ không phản hồi') }}><Doc /></ToaDangChonProvider>))
    expect(gt.loi).toBe('Máy chủ không phản hồi')
    expect(gt.dangTai).toBe(false)
  })
})

// Màn cũ (5 màn dùng useBuildings) đọc toà từ khung thay vì tự tải.
let bd: ReturnType<typeof useBuildings>
function ManThu() {
  bd = useBuildings('t')
  return <BuildingSelect buildings={bd.buildings} value={bd.buildingId} onChange={bd.setBuildingId} />
}
async function veMan(vaiTro: string, ds = BA_TOA) {
  await act(async () => root!.render(<ToaDangChonProvider token="t" vaiTro={vaiTro} search="" taiToa={async () => ds}><Doc /><ManThu /></ToaDangChonProvider>))
}

describe('useBuildings / BuildingSelect trong khung', () => {
  it('đổi toà qua khung → màn nhận toaNhaId mới; màn đổi toà → khung đổi theo và nhớ', async () => {
    await veMan('CHU')
    expect(bd.buildings).toHaveLength(3)
    expect(bd.buildingId).toBeNull()
    await act(async () => gt.chon(2))
    expect(bd.buildingId).toBe(2)
    await act(async () => bd.setBuildingId(3))
    expect(gt.toaNhaId).toBe(3)
    expect(localStorage.getItem(KHOA_LUU_TOA)).toBe('3')
  })

  it('Chủ đang "Tất cả toà": màn hiện ô chọn toà tại chỗ; đã chọn một toà thì ẩn (sidebar lo)', async () => {
    await veMan('CHU')
    const select = container.querySelector('select') as HTMLSelectElement
    expect(select).not.toBeNull()
    expect([...select.options].map((o) => o.textContent)).toEqual(['Chọn toà nhà', 'Bình Minh Riverside', 'Mộc Lan Home', 'An Nhiên Residence'])
    await act(async () => gt.chon(1))
    expect(container.querySelector('select')).toBeNull()
  })

  it('Quản lý một toà: BuildingSelect không render, màn vẫn có toaNhaId', async () => {
    await veMan('QUAN_LY', [toa(3, 'An Nhiên Residence')])
    expect(container.querySelector('select')).toBeNull()
    expect(bd.buildingId).toBe(3)
  })
})
