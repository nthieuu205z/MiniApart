// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ChuDashboard } from './ChuDashboard'

describe('ChuDashboard', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    window.history.replaceState({}, '', '/tong-quan')
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
    vi.restoreAllMocks()
  })

  it('renders all 6 owner KPIs, tabs, charts, and utility reconciliation', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') {
        return jsonResponse([
          { id: 3, maToa: 'DEMO-P1', ten: 'An Nhiên Residence' },
          { id: 5, maToa: 'DEMO-P3', ten: 'Mộc Lan Home' },
        ])
      }
      if (url.startsWith('/api/dashboard/chu')) {
        return jsonResponse({
          toaNhaId: null,
          tenToaNha: 'Tất cả toà được phân quyền',
          tuNgay: '2026-06-01',
          denNgay: '2026-11-06',
          thoiDiemCapNhat: '2026-11-06T03:00:00Z',
          kpi: {
            doanhThuPhatHanh: 555947000,
            thucThu: 376130000,
            daThuHopDong: 382497000,
            congNoHienTai: 173450000,
            soHoaDonQuaHan: 60,
            tyLeLapDay: 75.0,
            tongSoPhong: 36,
            soPhongDangThue: 27,
            soPhongTrong: 6,
            soPhongDangSua: 3,
            chiPhiBaoTri: 750000,
            soSuCoDangMo: 12,
          },
          taiChinhTheoThang: [
            { thang: '2026-10-01', nhan: '10/2026', doanhThuPhatHanh: 100000000, thucThu: 80000000, daThuTheoHoaDon: 80000000, congNo: 20000000 },
          ],
          coCauPhong: {
            tongSo: 36,
            dangThue: 27,
            tyLeDangThue: 75.0,
            trong: 6,
            tyLeTrong: 16.67,
            daCoc: 0,
            tyLeDaCoc: 0.0,
            dangSua: 3,
            tyLeDangSua: 8.33,
            ngung: 0,
            tyLeNgung: 0.0,
          },
          tyLeLapDayLichSu: [],
          soSanhToaNha: [
            { toaNhaId: 3, tenToaNha: 'An Nhiên Residence', doanhThuPhatHanh: 200000000, thucThu: 150000000, congNo: 50000000, tyLeLapDay: 80.0, tongSoPhong: 12, soPhongDangThue: 10, chiPhiBaoTri: 0 },
          ],
          tieuThuDienNuoc: {
            dien: [{ kyId: 4, nhan: '10/2026', phong: 1006, dungChung: 555, tong: 1570, donVi: 'kWh' }],
            nuoc: [{ kyId: 4, nhan: '10/2026', phong: 61, dungChung: 20, tong: 82, donVi: 'm3' }],
          },
          tuoiNo: {
            chuaDenHan: { soLuong: 10, soTien: 50000000 },
            quaHan1Den7: { soLuong: 5, soTien: 20000000 },
            quaHan8Den30: { soLuong: 3, soTien: 15000000 },
            quaHanTren30: { soLuong: 2, soTien: 10000000 },
          },
          chiPhiBaoTri: [],
          dienNuocDungChung: {
            khuVucChung: [
              { diemDoId: 1, maCongTo: 'CT-HL-P1', tenCongTo: 'Hành lang', khuVuc: 'HANH_LANG', donVi: 'kWh', donGiaMua: 2400, mucTieuThu: 120, chiPhi: 288000 },
            ],
            doiSoat: {
              trangThai: 'KHOP_DOI_SOAT',
              mucTong: 1570,
              mucPhong: 1006,
              mucChungDoRieng: 555,
              chenhLech: 9,
              donVi: 'kWh',
              nguongChoPhep: 60,
              vuotNguong: false,
              ghiChu: 'Số liệu đối soát nằm trong ngưỡng sai số kỹ thuật cho phép.',
            },
            chiPhiUocTinh: 1332000,
          },
        })
      }
      if (url.startsWith('/api/bao-cao/cong-no')) {
        return jsonResponse({
          toaNhaId: null,
          tinhLuc: '2026-11-06T03:00:00Z',
          congNo: [
            { hoaDonId: 1, maHoaDon: 'HD1', kyId: 1, hopDongId: 1, toaNhaId: 3, tenToaNha: 'An Nhiên Residence', soPhong: '201', nguoiThueId: 7, hoTenNguoiThue: 'Nguyễn Văn A', ngayPhatHanh: '2026-06-01', hanThanhToan: '2026-06-10', tongTien: '9000000', daThu: '0', conLai: '9000000', soNgayQuaHan: 139 },
          ],
        })
      }
      if (url.startsWith('/api/bao-cao/tieu-thu')) {
        return jsonResponse({
          toaNhaId: null,
          phongId: null,
          kyId: null,
          tinhLuc: '2026-11-06T03:00:00Z',
          bieuDo: [],
          cacDong: [
            { kyId: 4, nam: 2026, thang: 10, nhanKy: '10/2026', tuNgay: '2026-10-01', denNgay: '2026-10-31', toaNhaId: 3, maToa: 'DEMO-P1', tenToaNha: 'An Nhiên Residence', phongId: 1, soPhong: '201', tang: 2, hopDongId: 1, dichVuId: 1, tenDichVu: 'Điện', donVi: 'kWh', laDien: true, chiSoDau: '0', chiSoCuoi: '1570', coThayCongTo: false, chiSoCuoiCongToCu: null, chiSoDauCongToMoi: null, mucTieuThu: '1570', coDuLieu: true },
          ],
        })
      }
      if (url.startsWith('/api/hop-dong')) {
        return jsonResponse([{ id: 1, phongId: 1, soPhong: '303', nguoiThueId: 7, hoTenNguoiThue: 'Nguyễn Văn A', ngayBatDau: '2025-12-02', ngayKetThuc: '2026-12-02', giaThue: '5000000', tienCoc: '5000000', soNgayBaoTruoc: 30, trangThai: 'HIEU_LUC', tenTrangThai: 'Hiệu lực', sapHetHan: true, soNgayConLai: 11, dichVuApDung: [], quyetToan: null }])
      }
      throw new Error(`Unexpected request ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    await act(async () => root.render(<ChuDashboard token="test-token" />))

    await vi.waitFor(() => expect(container.querySelector('[data-testid="owner-dashboard-screen"]')).not.toBeNull())
    await vi.waitFor(() => expect(container.textContent).toContain('Thực thu'))

    // Thẻ KPI + khối mới theo thiết kế 03
    expect(container.textContent).toContain('Thực thu')
    expect(container.textContent).toContain('376.130.000')
    expect(container.textContent).toContain('Công nợ')
    expect(container.textContent).toContain('173.450.000')
    expect(container.textContent).toContain('Tỷ lệ lấp đầy')
    expect(container.textContent).toContain('75%')
    expect(container.textContent).toContain('Nợ quá hạn nhiều nhất')
    expect(container.textContent).toContain('Tiêu thụ điện theo toà')
    await vi.waitFor(() => expect(container.textContent).toContain('Nguyễn Văn A'))
    await vi.waitFor(() => expect(container.textContent).toContain('1.570 kWh'))
    await vi.waitFor(() => expect(container.textContent).toContain('Phòng 303 An Nhiên Residence · còn 11 ngày'))
    expect(container.textContent).toContain('Chi phí kỳ này 750.000')

    // Đối soát công tơ tổng không còn nằm sau tab
    expect(container.textContent).toContain('Đối soát công tơ tổng')
    expect(container.textContent).toContain('Khớp đối soát')
  })

  it('calculates dynamic quick periods and uses /toa-nha drilldown for room KPIs', async () => {
    let requestedUrl = ''

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/toa-nha') {
        return jsonResponse([{ id: 3, maToa: 'DEMO-P1', ten: 'An Nhiên Residence' }])
      }
      if (url.startsWith('/api/dashboard/chu')) {
        requestedUrl = url
        return jsonResponse({
          toaNhaId: 3,
          tenToaNha: 'An Nhiên Residence',
          tuNgay: '2026-11-01',
          denNgay: '2026-11-30',
          thoiDiemCapNhat: '2026-11-06T03:00:00Z',
          kpi: {
            doanhThuPhatHanh: 0,
            thucThu: 0,
            daThuHopDong: 0,
            congNoHienTai: 0,
            soHoaDonQuaHan: 0,
            tyLeLapDay: 75.0,
            tongSoPhong: 12,
            soPhongDangThue: 9,
            soPhongTrong: 2,
            soPhongDangSua: 1,
            chiPhiBaoTri: 0,
            soSuCoDangMo: 0,
          },
          taiChinhTheoThang: [],
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
          tyLeLapDayLichSu: [],
          soSanhToaNha: [],
          tieuThuDienNuoc: { dien: [], nuoc: [] },
          tuoiNo: {
            chuaDenHan: { soLuong: 0, soTien: 0 },
            quaHan1Den7: { soLuong: 0, soTien: 0 },
            quaHan8Den30: { soLuong: 0, soTien: 0 },
            quaHanTren30: { soLuong: 0, soTien: 0 },
          },
          chiPhiBaoTri: [],
          dienNuocDungChung: { khuVucChung: [], doiSoat: null, chiPhiUocTinh: 0 },
        })
      }
      if (url.includes('/bang-viec')) {
        return jsonResponse({
          toaNhaId: 3,
          tenToaNha: 'An Nhiên Residence',
          nhomViec: [],
        })
      }
      throw new Error(`Unexpected request ${url}`)
    })

    vi.stubGlobal('fetch', fetchMock)

    await act(async () => root.render(<ChuDashboard token="test-token" />))

    await vi.waitFor(() => expect(container.querySelector('[data-testid="owner-dashboard-screen"]')).not.toBeNull())

    // Click quick period "Tháng này"
    const thangNayBtn = Array.from(container.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Tháng này')
    ) as HTMLButtonElement
    expect(thangNayBtn).not.toBeNull()
    await act(async () => thangNayBtn.click())

    // Verify dynamic request parameters
    await vi.waitFor(() => expect(requestedUrl).toContain('tuNgay='))
    const now = new Date()
    const currentYear = now.getFullYear()
    expect(requestedUrl).toContain(`tuNgay=${currentYear}-`)

    // Verify room KPI title does not suggest /phong
    const roomCard = container.querySelector('article[title="Xem danh mục toà nhà & phòng"]')
    expect(roomCard).not.toBeNull()
  })
})

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

