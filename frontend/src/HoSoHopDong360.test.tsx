// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HoSoHopDong360 from './HoSoHopDong360'
import { ToaDangChonProvider } from './toaDangChon'

declare global { var IS_REACT_ACT_ENVIRONMENT: boolean | undefined }

const TOA = { id: 3, maToa: 'T3', ten: 'An Nhiên Residence', diaChi: 'x', soTang: 4, ngayChotSo: 28, soNgayHanTt: 7, maNganHang: '970405', tkNganHang: '1', nguongThatThoat: '0', batBuocAnhCongTo: false }
const hd = (id: number, trangThai: string, tenTrangThai: string, sapHetHan = false) => ({
  id, phongId: 10 + id, soPhong: `10${id}`, nguoiThueId: 20 + id, hoTenNguoiThue: 'Trần Quang Huy',
  ngayBatDau: '2026-01-01', ngayKetThuc: '2027-01-01', giaThue: '3000000.00', tienCoc: '6000000.00', soNgayBaoTruoc: 30,
  trangThai, tenTrangThai, sapHetHan, soNgayConLai: sapHetHan ? 10 : 100,
  dichVuApDung: [{ dichVuId: 1, tenDichVu: 'Internet', donGiaApDung: '0.00', cheDoGia: 'CO_DINH' }], quyetToan: null,
})
const DS = [hd(1, 'HIEU_LUC', 'Hiệu lực', true), hd(2, 'CHO_KY', 'Chờ ký'), hd(3, 'HIEU_LUC', 'Hiệu lực')]
const NO = { toaNhaId: 3, tinhLuc: 'x', congNo: [
  { hoaDonId: 9, maHoaDon: 'HD-9', hopDongId: 1, conLai: '500000.00', hanThanhToan: '2026-07-05' },
  { hoaDonId: 8, maHoaDon: 'HD-8', hopDongId: 3, conLai: '100000.00', hanThanhToan: '2026-07-05' },
] }
const json = (b: unknown, status = 200) => new Response(JSON.stringify(b), { status, headers: { 'Content-Type': 'application/json' } })

describe('HoSoHopDong360', () => {
  let container: HTMLDivElement
  let root: Root
  const dieuHuong = vi.fn()

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    vi.stubGlobal('fetch', vi.fn(async (url: string) => (url.startsWith('/api/hop-dong') ? json(DS) : url.startsWith('/api/bao-cao/cong-no') ? json(NO) : json([]))))
    container = document.createElement('div')
    document.body.append(container)
    root = createRoot(container)
  })
  afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals() })

  async function mount(id: string) {
    await act(async () => {
      root.render(
        <ToaDangChonProvider token="t" vaiTro="CHU" search="" taiToa={async () => [TOA]}>
          <HoSoHopDong360 token="t" vaiTro="CHU" mobile={false} thamSo={{ id }} dieuHuong={dieuHuong} />
        </ToaDangChonProvider>,
      )
    })
    await vi.waitFor(() => expect(container.querySelector('h1, [role="status"] ~ *, .empty h3')).not.toBeNull())
    await vi.waitFor(() => expect(container.querySelector('[aria-busy="true"]')).toBeNull())
  }
  const nutChinh = () => [...container.querySelectorAll('.btn-primary')].map((b) => b.textContent)

  it('sắp hết hạn → nút chính "Gia hạn", có thẻ hạn và nợ', async () => {
    await mount('1')
    expect(container.querySelector('h1')?.textContent).toBe('Hợp đồng #1 · Phòng 101')
    expect(nutChinh()).toEqual(['Gia hạn'])
    expect(container.textContent).toContain('Hết hạn sau 10 ngày')
    expect(container.textContent).toContain('Nợ 500.000 ₫')
  })

  it('chờ ký → nút chính "Ký hợp đồng"', async () => {
    await mount('2')
    expect(nutChinh()).toEqual(['Ký hợp đồng'])
  })

  it('hiệu lực bình thường → không có nút chính', async () => {
    await mount('3')
    expect(nutChinh()).toEqual([])
    expect(container.textContent).toContain('Tải PDF')
  })

  it('"…" có đúng 5 mục và liên kết người thuê, phòng đúng href', async () => {
    await mount('1')
    await act(async () => { (container.querySelector('button[aria-haspopup="menu"]') as HTMLButtonElement).click() })
    expect([...container.querySelectorAll('[role="menuitem"]')].map((m) => m.textContent)).toEqual(['Thanh lý hợp đồng', 'Phụ lục', 'Khoản phát sinh', 'Người ở cùng', 'Giao dịch cọc'])
    expect(container.querySelector('a[href="/nguoi-thue/21"]')).not.toBeNull()
    expect(container.querySelector('a[href="/phong/11?toaNhaId=3"]')).not.toBeNull()
  })

  it('hợp đồng không có trong các toà được xem → trạng thái không tìm thấy', async () => {
    await mount('99')
    expect(container.textContent).toContain('Không tìm thấy hợp đồng này')
  })
})
