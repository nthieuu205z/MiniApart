// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { QuanLyDashboard } from './QuanLyDashboard'

describe('QuanLyDashboard', () => {
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

  it('renders operational KPIs, anomaly cards, and opens inspection review dialog', async () => {
    let alertUpdated = false

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') {
        return jsonResponse([{ id: 4, maToa: 'DEMO-P2', ten: 'Nhà Xanh Cầu Giấy' }])
      }
      if (url.startsWith('/api/dashboard/quan-ly')) {
        return jsonResponse({
          toaNhaId: 4,
          tenToaNha: 'Nhà Xanh Cầu Giấy',
          thoiDiemCapNhat: '2026-11-06T03:00:00Z',
          kpi: {
            khoanConPhaiThu: 53990000,
            soHoaDonQuaHan: 20,
            tienQuaHan: 53990000,
            soPhongDangThue: 9,
            soPhongTrong: 2,
            soPhongDangSua: 1,
            tongSoPhong: 12,
            tyLeLapDay: 75.0,
            soCongToChuaGhi: 7,
            soSuCoCanXuLy: 4,
            soCanhBaoDienNuocDangMo: 1,
          },
          canhBaoDienNuoc: [
            {
              id: 1,
              toaNhaId: 4,
              tenToaNha: 'Nhà Xanh Cầu Giấy',
              diemDoId: 9,
              tenDiemDo: 'Đồng hồ máy bơm cấp nước',
              phongId: null,
              soPhong: null,
              kyId: 9,
              tenKy: 'Kỳ 10/2026',
              loaiDichVu: 'NUOC',
              loaiCanhBao: 'TIEU_THU_TANG_CAO',
              mucTieuThuKyNay: 84,
              mucThamChieu: 40,
              mucTang: 44,
              tyLeTang: 2.1,
              lyDo: 'Mức tiêu thụ máy bơm kỳ này là 84.00 m3, gấp 2.1 lần trung bình 3 kỳ trước.',
              trangThai: alertUpdated ? 'DANG_KIEM_TRA' : 'MOI_PHAT_HIEN',
              nguoiXacNhan: alertUpdated ? 'Phạm Đức Anh' : null,
              ghiChuXuLy: alertUpdated ? 'Đang cử thợ' : null,
              thoiDiemTao: '2026-11-06T03:00:00Z',
              duongDanHanhDong: '/ghi-chi-so?toaNhaId=4',
            },
          ],
          coCauPhong: {
            tongSo: 12,
            dangThue: 9,
            tyLeDangThue: 75.0,
            trong: 2,
            tyLeTrong: 16.67,
            daCoc: 0,
            tyLeDaCoc: 0.0,
            dangSua: 1,
            tyLeDangSua: 8.33,
            ngung: 0,
            tyLeNgung: 0.0,
          },
          tuoiNo: {
            chuaDenHan: { soLuong: 2, soTien: 10000000 },
            quaHan1Den7: { soLuong: 1, soTien: 5000000 },
            quaHan8Den30: { soLuong: 0, soTien: 0 },
            quaHanTren30: { soLuong: 0, soTien: 0 },
          },
          congToChuaGhi: {
            kyHienTaiId: 9,
            tenKyHienTai: 'Kỳ 10/2026',
            tongSoCongTo: 24,
            soCongToDaGhi: 17,
            soCongToChuaGhi: 7,
            danhSachChuaGhi: [
              { viTriId: 101, tenViTri: 'Phòng 101', toaNhaId: 4, tenToaNha: 'Nhà Xanh Cầu Giấy', tenDichVu: 'Điện', donVi: 'kWh', loaiDichDo: 'PHONG', kyId: 9 },
            ],
          },
          dienNuocDungChung: { khuVucChung: [], doiSoat: null, chiPhiUocTinh: 0 },
          lichHenSapToi: [],
        })
      }
      if (url.includes('/api/canh-bao-tieu-thu/1/trang-thai') && init?.method === 'POST') {
        alertUpdated = true
        return jsonResponse({ ok: true })
      }
      if (url.includes('/bang-viec')) {
        return jsonResponse({
          toaNhaId: 4,
          tenToaNha: 'Nhà Xanh Cầu Giấy',
          nhomViec: [],
        })
      }
      throw new Error(`Unexpected request ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    await act(async () => root.render(<QuanLyDashboard token="test-token" />))

    await vi.waitFor(() => expect(container.querySelector('[data-testid="manager-dashboard-screen"]')).not.toBeNull())

    // Verify operational KPIs
    expect(container.textContent).toContain('Cần thu hồi nợ')
    expect(container.textContent).toContain('53.990.000')
    expect(container.textContent).toContain('20 quá hạn')
    expect(container.textContent).toContain('Công tơ chưa ghi')
    expect(container.textContent).toContain('7 điểm đo')

    // Verify Anomaly Alert card
    expect(container.textContent).toContain('Cảnh báo bất thường điện nước')
    expect(container.textContent).toContain('Mức tiêu thụ máy bơm kỳ này là 84.00 m3')
    expect(container.textContent).toContain('Mới phát hiện')

    // Click "Xác nhận kiểm tra" to open modal dialog
    const reviewBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Xác nhận kiểm tra')
    ) as HTMLButtonElement
    await act(async () => reviewBtn?.click())

    // Dialog appears
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
    expect(document.body.textContent).toContain('Xử lý cảnh báo tiêu thụ')

    // Submit dialog
    const saveBtn = document.body.querySelector('[role="dialog"] button:last-child') as HTMLButtonElement
    await act(async () => saveBtn?.click())

    // Dialog closes
    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull())
  })

  it('opens common area meter recording dialog and successfully records readings', async () => {
    let ghiSoCalled = false
    let ghiSoPayload: any = null

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input)
      if (url === '/api/toa-nha') {
        return jsonResponse([{ id: 4, maToa: 'DEMO-P2', ten: 'Nhà Xanh Cầu Giấy' }])
      }
      if (url.startsWith('/api/dashboard/quan-ly')) {
        return jsonResponse({
          toaNhaId: 4,
          tenToaNha: 'Nhà Xanh Cầu Giấy',
          thoiDiemCapNhat: '2026-11-06T03:00:00Z',
          kpi: {
            khoanConPhaiThu: 0,
            soHoaDonQuaHan: 0,
            tienQuaHan: 0,
            soPhongDangThue: 9,
            soPhongTrong: 2,
            soPhongDangSua: 1,
            tongSoPhong: 12,
            tyLeLapDay: 75.0,
            soCongToChuaGhi: 1,
            soSuCoCanXuLy: 0,
            soCanhBaoDienNuocDangMo: 0,
          },
          canhBaoDienNuoc: [],
          coCauPhong: {
            tongSo: 12,
            dangThue: 9,
            tyLeDangThue: 75.0,
            trong: 2,
            tyLeTrong: 16.67,
            daCoc: 0,
            tyLeDaCoc: 0.0,
            dangSua: 1,
            tyLeDangSua: 8.33,
            ngung: 0,
            tyLeNgung: 0.0,
          },
          tuoiNo: {
            chuaDenHan: { soLuong: 0, soTien: 0 },
            quaHan1Den7: { soLuong: 0, soTien: 0 },
            quaHan8Den30: { soLuong: 0, soTien: 0 },
            quaHanTren30: { soLuong: 0, soTien: 0 },
          },
          congToChuaGhi: {
            kyHienTaiId: 9,
            tenKyHienTai: 'Kỳ 10/2026',
            tongSoCongTo: 24,
            soCongToDaGhi: 23,
            soCongToChuaGhi: 1,
            danhSachChuaGhi: [
              {
                viTriId: 9,
                tenViTri: 'Đồng hồ máy bơm cấp nước',
                toaNhaId: 4,
                tenToaNha: 'Nhà Xanh Cầu Giấy',
                tenDichVu: 'Nước',
                donVi: 'm³',
                loaiDiemDo: 'KHU_VUC_CHUNG',
                kyId: 9,
                chiSoCuoiKyTruoc: 85,
              },
            ],
          },
          dienNuocDungChung: { khuVucChung: [], doiSoat: null, chiPhiUocTinh: 0 },
          lichHenSapToi: [],
        })
      }
      if (url === '/api/cong-to-dung-chung/ghi-chi-so' && init?.method === 'POST') {
        ghiSoCalled = true
        ghiSoPayload = JSON.parse(String(init.body))
        return jsonResponse({ ok: true })
      }
      if (url.includes('/bang-viec')) {
        return jsonResponse({
          toaNhaId: 4,
          tenToaNha: 'Nhà Xanh Cầu Giấy',
          nhomViec: [],
        })
      }
      throw new Error(`Unexpected request ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    await act(async () => root.render(<QuanLyDashboard token="test-token" />))

    await vi.waitFor(() => expect(container.querySelector('[data-testid="manager-dashboard-screen"]')).not.toBeNull())

    // Click "Ghi ngay" on common meter row
    const recordBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Ghi ngay')
    ) as HTMLButtonElement
    expect(recordBtn).not.toBeNull()
    await act(async () => recordBtn.click())

    // Common meter dialog opens
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
    expect(document.body.textContent).toContain('Ghi chỉ số điểm đo chung')
    expect(document.body.textContent).toContain('Đồng hồ máy bơm cấp nước')

    // Enter readings: initial reading is prefilled with 85 from chiSoCuoiKyTruoc
    const inputs = document.body.querySelectorAll('[role="dialog"] input[type="number"]') as NodeListOf<HTMLInputElement>
    expect(inputs.length).toBeGreaterThanOrEqual(2)
    expect(inputs[0].value).toBe('85')
    const cuoiInput = inputs[1]

    await act(async () => {
      setInputValue(cuoiInput, '150.5')
    })

    // Submit dialog
    const saveMeterBtn = Array.from(document.body.querySelectorAll('[role="dialog"] button')).find((b) =>
      b.textContent?.includes('Lưu chỉ số & Kiểm tra')
    ) as HTMLButtonElement
    await act(async () => saveMeterBtn.click())

    // Verify API called with proper values
    await vi.waitFor(() => expect(ghiSoCalled).toBe(true))
    expect(ghiSoPayload.diemDoId).toBe(9)
    expect(ghiSoPayload.kyId).toBe(9)
    expect(ghiSoPayload.chiSoDau).toBe(85)
    expect(ghiSoPayload.chiSoCuoi).toBe(150.5)

    // Dialog closes
    await vi.waitFor(() => expect(document.body.querySelector('[role="dialog"]')).toBeNull())
  })
})

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function setInputValue(input: HTMLInputElement, value: string) {
  const valueSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  valueSetter?.call(input, value)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}
