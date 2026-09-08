import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ApiError,
  capNhatNguoiDungQuanLy,
  chotKyThanhToan,
  fetchCurrentUser,
  fetchHoaDonCuaNguoiThue,
  fetchLichSuHoaDonCuaNguoiThue,
  fetchTieuThuCuaNguoiThue,
  fetchHoaDonMoiNhatCuaNguoiThue,
  fetchHopDongCuaNguoiThue,
  fetchNguoiDungQuanLy,
  fetchHealth,
  fetchPhongChuaGhiChiSo,
  ghiChiSoDichVu,
  fetchToaNha,
  fetchVaiTro,
  fetchThongBao,
  danhDauThongBaoDaDoc,
  khoaNguoiDungQuanLy,
  login,
  taoNguoiDungQuanLy,
  fetchViecCuaToi,
  hoanThanhViecCuaToi,
  type ThongTinQuanLyNguoiDung,
} from './api'

describe('fetchHealth', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FR-INF-01 NFR_REL_03 requests the health endpoint through the relative API path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ status: 'UP', database: 'UP' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchHealth()).resolves.toEqual({ status: 'UP', database: 'UP' })
    expect(fetchMock).toHaveBeenCalledWith('/api/health')
  })

  it('FR-AUT-01 posts phone and password to the login endpoint', async () => {
    const runtimePassword = createRuntimePassword()
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          token: 'header.payload.signature',
          thoiHanGiay: 1800,
          nguoiDung: {
            id: 3,
            hoTen: 'Quản lý Toà A',
            soDienThoai: '0900000003',
            vaiTro: 'QUAN_LY',
            tenVaiTro: 'Quản lý toà nhà',
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(login({ soDienThoai: '0900000003', matKhau: runtimePassword })).resolves.toEqual({
      token: 'header.payload.signature',
      thoiHanGiay: 1800,
      nguoiDung: {
        id: 3,
        hoTen: 'Quản lý Toà A',
        soDienThoai: '0900000003',
        vaiTro: 'QUAN_LY',
        tenVaiTro: 'Quản lý toà nhà',
      },
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ soDienThoai: '0900000003', matKhau: runtimePassword }),
    })
  })

  it('FR-AUT-01 requests the current user with the bearer token and surfaces 401 responses', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            id: 3,
            hoTen: 'Quản lý Toà A',
            soDienThoai: '0900000003',
            vaiTro: 'QUAN_LY',
            tenVaiTro: 'Quản lý toà nhà',
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ thongBao: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchCurrentUser('header.payload.signature')).resolves.toEqual({
      id: 3,
      hoTen: 'Quản lý Toà A',
      soDienThoai: '0900000003',
      vaiTro: 'QUAN_LY',
      tenVaiTro: 'Quản lý toà nhà',
    })
    await expect(fetchCurrentUser('expired-token')).rejects.toEqual(
      new ApiError(401, 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn'),
    )
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/auth/me', {
      headers: { Authorization: 'Bearer header.payload.signature' },
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/auth/me', {
      headers: { Authorization: 'Bearer expired-token' },
    })
  })

  it('FR-POR-01 fetches the tenant latest-invoice portal envelope', async () => {
    const response = {
      coHoaDon: true,
      hoaDon: {
        hoaDonId: 10,
        maHoaDon: 'TN-A-101-202608',
        kyId: 8,
        hopDongId: 11,
        soPhong: '101',
        nguoiThue: 'Người thuê 101',
        ngayPhatHanh: '2026-08-31',
        hanThanhToan: '2026-09-07',
        trangThai: 'DA_PHAT_HANH',
        tongTien: '3889500.00',
        daThu: '0.00',
        conLai: '3889500.00',
        cacDong: [],
      },
    }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(response))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchHoaDonMoiNhatCuaNguoiThue('tenant-token')).resolves.toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith('/api/cong/hoa-don-moi-nhat', {
      headers: { Authorization: 'Bearer tenant-token' },
    })
  })

  it('FR-POR-03 fetches the tenant invoice history and a tenant-owned invoice detail', async () => {
    const history = [{
      hoaDonId: 10,
      maHoaDon: 'TN-A-101-202608',
      toaNhaId: 1,
      kyId: 8,
      hopDongId: 11,
      nam: 2026,
      thang: 8,
      soPhong: '101',
      trangThai: 'DA_PHAT_HANH',
      trangThaiThanhToan: 'CHUA_THANH_TOAN',
      tongTien: '3889500.00',
      daThu: '0.00',
      conLai: '3889500.00',
      hopDongTrangThai: 'HIEU_LUC',
    }]
    const detail = { hoaDonId: 10, maHoaDon: 'TN-A-101-202608' }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse(history))
      .mockResolvedValueOnce(jsonResponse(detail))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchLichSuHoaDonCuaNguoiThue('tenant-token')).resolves.toEqual(history)
    await expect(fetchHoaDonCuaNguoiThue('tenant-token', 10)).resolves.toEqual(detail)
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/cong/hoa-don', {
      headers: { Authorization: 'Bearer tenant-token' },
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/cong/hoa-don/10', {
      headers: { Authorization: 'Bearer tenant-token' },
    })
  })

  it('FR-POR-05 fetches twelve tenant consumption periods through the relative portal endpoint', async () => {
    const response = {
      dien: [{ kyId: 8, hoaDonId: 10, nam: 2026, thang: 8, soPhong: '101', donVi: 'kWh', mucTieuThu: '25.00' }],
      nuoc: [{ kyId: 8, hoaDonId: 10, nam: 2026, thang: 8, soPhong: '101', donVi: 'm3', mucTieuThu: '6.25' }],
    }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(response))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchTieuThuCuaNguoiThue('tenant-token')).resolves.toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith('/api/cong/tieu-thu?soKy=12', {
      headers: { Authorization: 'Bearer tenant-token' },
    })
  })

  it('FR-POR-07 BR-14 fetches the tenant-owned contract list through the portal endpoint', async () => {
    const response = [{
      id: 11,
      phongId: 101,
      soPhong: '101',
      nguoiThueId: 10,
      hoTenNguoiThue: 'Người thuê 101',
      ngayBatDau: '2026-01-01',
      ngayKetThuc: '2026-12-31',
      giaThue: '3500000.00',
      tienCoc: '3500000.00',
      soNgayBaoTruoc: 30,
      trangThai: 'HIEU_LUC',
      tenTrangThai: 'Hiệu lực',
      sapHetHan: false,
      soNgayConLai: 114,
      dichVuApDung: [],
      quyetToan: null,
    }]
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(response))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchHopDongCuaNguoiThue('tenant-token')).resolves.toEqual(response)
    expect(fetchMock).toHaveBeenCalledWith('/api/cong/hop-dong', {
      headers: { Authorization: 'Bearer tenant-token' },
    })
  })

  it('FR-AUT-06 fetches the account list with the bearer token', async () => {
    const account = accountFixture()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse([account]))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchNguoiDungQuanLy('admin-token')).resolves.toEqual([account])
    expect(fetchMock).toHaveBeenCalledWith('/api/nguoi-dung', {
      headers: { Authorization: 'Bearer admin-token' },
    })
  })

  it('FR-AUT-06 fetches available buildings for account assignment', async () => {
    const buildings = [buildingFixture()]
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(buildings))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchToaNha('admin-token')).resolves.toEqual(buildings)
    expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha', {
      headers: { Authorization: 'Bearer admin-token' },
    })
  })

  it('FR-MTR-06 posts meter photos as multipart form data when saving a reading', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        phongId: 11,
        dichVuId: 21,
        chiSoDau: '1240.00',
        chiSoCuoi: '1252.75',
        mucTieuThu: '12.75',
        coThayCongTo: false,
        anhCongToId: 77,
      }, 201),
    )
    vi.stubGlobal('fetch', fetchMock)
    const tep = new File([new Uint8Array([1, 2, 3, 4])], 'cong-to.jpg', { type: 'image/jpeg' })

    await expect(ghiChiSoDichVu('meter-token', 1, 8, {
      phongId: 11,
      dichVuId: 21,
      chiSoCuoi: '1252.75',
      coThayCongTo: false,
      tep,
    } as any)).resolves.toEqual({
      phongId: 11,
      dichVuId: 21,
      chiSoDau: '1240.00',
      chiSoCuoi: '1252.75',
      mucTieuThu: '12.75',
      coThayCongTo: false,
      anhCongToId: 77,
    })

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/toa-nha/1/ky-thanh-toan/8/chi-so')
    expect(init?.method).toBe('POST')
    expect(init?.body).toBeInstanceOf(FormData)
    const body = init?.body as FormData
    expect(body.get('phongId')).toBe('11')
    expect(body.get('dichVuId')).toBe('21')
    expect(body.get('chiSoCuoi')).toBe('1252.75')
    expect(body.get('coThayCongTo')).toBe('false')
    expect(body.get('tep')).toBeInstanceOf(File)
    expect((body.get('tep') as File).name).toBe('cong-to.jpg')
  })

  it('FR-MTR-04 includes anomaly acknowledgement in multipart meter-photo saves', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        phongId: 11,
        dichVuId: 21,
        chiSoDau: '136.00',
        chiSoCuoi: '160.00',
        mucTieuThu: '24.00',
        coThayCongTo: false,
        anhCongToId: 77,
        canhBaoTieuThuBatThuong: { coCanhBao: true },
      }, 201),
    )
    vi.stubGlobal('fetch', fetchMock)
    const tep = new File([new Uint8Array([1, 2, 3, 4])], 'cong-to.jpg', { type: 'image/jpeg' })

    await ghiChiSoDichVu('meter-token', 1, 8, {
      phongId: 11,
      dichVuId: 21,
      chiSoCuoi: '160.00',
      coThayCongTo: false,
      xacNhanCanhBao: true,
      tep,
    })

    const [, init] = fetchMock.mock.calls[0]
    expect(init?.body).toBeInstanceOf(FormData)
    expect((init?.body as FormData).get('xacNhanCanhBao')).toBe('true')
    expect((init?.body as FormData).get('tep')).toBe(tep)
  })

  it('FR-MTR-09 CR-004 sends replacement readings through multipart meter-photo saves', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      phongId: 11,
      dichVuId: 21,
      chiSoDau: '1240.00',
      chiSoCuoi: '15.25',
      mucTieuThu: '50.75',
      coThayCongTo: true,
      chiSoCuoiCongToCu: '1275.50',
      chiSoDauCongToMoi: '0.00',
    }, 201))
    vi.stubGlobal('fetch', fetchMock)
    const tep = new File([new Uint8Array([1, 2, 3, 4])], 'cong-to.jpg', { type: 'image/jpeg' })

    await ghiChiSoDichVu('meter-token', 1, 8, {
      phongId: 11,
      dichVuId: 21,
      chiSoCuoi: '15.25',
      coThayCongTo: true,
      chiSoCuoiCongToCu: '1275.50',
      chiSoDauCongToMoi: '0.00',
      tep,
    })

    const [, init] = fetchMock.mock.calls[0]
    const body = init?.body as FormData
    expect(body.get('chiSoCuoiCongToCu')).toBe('1275.50')
    expect(body.get('chiSoDauCongToMoi')).toBe('0.00')
  })

  it('FR-MTR-08 fetches the missing-room list for a payment period', async () => {
    const missingRooms = [
      { id: 11, soPhong: '101', tang: 1 },
      { id: 12, soPhong: '202', tang: 2 },
    ]
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(missingRooms))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchPhongChuaGhiChiSo('meter-token', 1, 8)).resolves.toEqual(missingRooms)
    expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/1/ky-thanh-toan/8/thieu-chi-so', {
      headers: { Authorization: 'Bearer meter-token' },
    })
  })

  it('FR-MTR-08 returns the missing-room list when closing is rejected', async () => {
    const missingRooms = [
      { id: 11, soPhong: '101', tang: 1 },
    ]
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(missingRooms, 409),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(chotKyThanhToan('meter-token', 1, 8)).resolves.toEqual({
      phongThieuChiSo: missingRooms,
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/toa-nha/1/ky-thanh-toan/8/chot', {
      method: 'POST',
      headers: { Authorization: 'Bearer meter-token' },
    })
  })

  it('FR-MTR-08 routes close-period 409 error objects through API error conversion', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({ thongBao: 'Kỳ thanh toán không còn ở trạng thái mở.' }, 409),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(chotKyThanhToan('meter-token', 1, 8)).rejects.toEqual(
      new ApiError(409, 'Kỳ thanh toán không còn ở trạng thái mở.'),
    )
  })

  it('FR-AUT-06 fetches server-owned role labels for the account form', async () => {
    const roles = [
      { vaiTro: 'THO', tenVaiTro: 'Thợ sửa chữa' },
    ]
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(roles))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchVaiTro('admin-token')).resolves.toEqual(roles)
    expect(fetchMock).toHaveBeenCalledWith('/api/nguoi-dung/vai-tro', {
      headers: { Authorization: 'Bearer admin-token' },
    })
  })

  it('FR-AUT-06 sends account creation data without a password field', async () => {
    const account = accountFixture()
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(account, 201))
    vi.stubGlobal('fetch', fetchMock)
    const payload = {
      hoTen: 'Tài khoản mới',
      soDienThoai: '0901000001',
      vaiTro: 'THO',
      toaNhaIds: [1, 2],
    }

    await expect(taoNguoiDungQuanLy('admin-token', payload)).resolves.toEqual(account)
    expect(fetchMock).toHaveBeenCalledWith('/api/nguoi-dung', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  })

  it('FR-AUT-06 updates and locks an account through the management endpoints', async () => {
    const account = accountFixture()
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(account))
      .mockResolvedValueOnce(jsonResponse({ ...account, trangThai: 'BI_KHOA', tenTrangThai: 'Bị khoá' }))
    vi.stubGlobal('fetch', fetchMock)
    const payload = {
      hoTen: account.hoTen,
      soDienThoai: account.soDienThoai,
      vaiTro: account.vaiTro,
      toaNhaIds: account.toaNhaIds,
    }

    await expect(capNhatNguoiDungQuanLy('admin-token', account.id, payload)).resolves.toEqual(account)
    await expect(khoaNguoiDungQuanLy('admin-token', account.id)).resolves.toEqual({
      ...account,
      trangThai: 'BI_KHOA',
      tenTrangThai: 'Bị khoá',
    })
    expect(fetchMock).toHaveBeenNthCalledWith(1, `/api/nguoi-dung/${account.id}`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer admin-token',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, `/api/nguoi-dung/${account.id}/khoa`, {
      method: 'POST',
      headers: { Authorization: 'Bearer admin-token' },
    })
  })

  it('FR-MNT-04 fetches only the authenticated worker work list', async () => {
    const work = [{
      id: 42,
      soPhong: '302',
      tang: 3,
      toaNha: 'Toà A',
      moTa: 'Vòi nước bồn rửa bị rỉ',
      mucDo: 'KHAN_CAP',
      tenMucDo: 'Khẩn cấp',
      soDienThoaiLienHe: '0907000110',
      anh: [{ id: 501 }],
      trangThai: 'DA_PHAN_CONG',
    }]
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(work))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchViecCuaToi('worker-token')).resolves.toEqual(work)
    expect(fetchMock).toHaveBeenCalledWith('/api/tho/viec-cua-toi', {
      headers: { Authorization: 'Bearer worker-token' },
    })
  })

  it('FR-MNT-02 FR-MNT-04 FR-INV-08 fetches the authenticated notification inbox and unread count', async () => {
    const inbox = {
      thongBao: [{
        maThamChieu: '11111111-1111-4111-8111-111111111111',
        tieuDe: 'Yêu cầu sửa chữa mới',
        noiDung: 'Phòng 302 báo hỏng: vòi nước bị rỉ — Gấp',
        daDoc: false,
        docLuc: null,
        taoLuc: '2026-09-08T12:00:00Z',
      }],
      soChuaDoc: 1,
    }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(inbox))
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchThongBao('manager-token')).resolves.toEqual(inbox)
    expect(fetchMock).toHaveBeenCalledWith('/api/thong-bao', {
      headers: { Authorization: 'Bearer manager-token' },
    })
  })

  it('FR-MNT-02 marks an owned notification as read through the notification endpoint', async () => {
    const notification = {
      maThamChieu: '11111111-1111-4111-8111-111111111111',
      tieuDe: 'Yêu cầu sửa chữa mới',
      noiDung: 'Phòng 302 báo hỏng: vòi nước bị rỉ — Gấp',
      daDoc: true,
      docLuc: '2026-09-08T12:05:00Z',
      taoLuc: '2026-09-08T12:00:00Z',
    }
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(notification))
    vi.stubGlobal('fetch', fetchMock)

    await expect(danhDauThongBaoDaDoc('manager-token', '11111111-1111-4111-8111-111111111111')).resolves.toEqual(notification)
    expect(fetchMock).toHaveBeenCalledWith('/api/thong-bao/11111111-1111-4111-8111-111111111111/da-doc', {
      method: 'POST',
      headers: { Authorization: 'Bearer manager-token' },
    })
  })

  it('FR-MNT-04 completes a repair work item through start then finish in order', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ trangThai: 'DANG_XU_LY' }))
      .mockResolvedValueOnce(jsonResponse({ trangThai: 'CHO_XAC_NHAN' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(hoanThanhViecCuaToi('worker-token', 42)).resolves.toEqual({ trangThai: 'CHO_XAC_NHAN' })
    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/yeu-cau-sua-chua/42/bat-dau-xu-ly', {
      method: 'POST',
      headers: { Authorization: 'Bearer worker-token' },
    })
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/yeu-cau-sua-chua/42/hoan-thanh', {
      method: 'POST',
      headers: { Authorization: 'Bearer worker-token' },
    })
  })

  it('FR-MNT-04 resumes completion when the start step was already committed', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(409, 'Yêu cầu đã bắt đầu xử lý'))
      .mockResolvedValueOnce(jsonResponse({ trangThai: 'CHO_XAC_NHAN' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(hoanThanhViecCuaToi('worker-token', 42)).resolves.toEqual({ trangThai: 'CHO_XAC_NHAN' })
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/yeu-cau-sua-chua/42/hoan-thanh', {
      method: 'POST',
      headers: { Authorization: 'Bearer worker-token' },
    })
  })

  it('FR-MNT-04 reconciles a lost finish response when the server already moved the work to confirmation', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ trangThai: 'DANG_XU_LY' }))
      .mockRejectedValueOnce(new ApiError(409, 'Yêu cầu đã hoàn tất'))
      .mockResolvedValueOnce(jsonResponse([{ id: 42, trangThai: 'CHO_XAC_NHAN' }]))
    vi.stubGlobal('fetch', fetchMock)

    await expect(hoanThanhViecCuaToi('worker-token', 42)).resolves.toEqual({ id: 42, trangThai: 'CHO_XAC_NHAN' })
    expect(fetchMock).toHaveBeenNthCalledWith(3, '/api/tho/viec-cua-toi', {
      headers: { Authorization: 'Bearer worker-token' },
    })
  })
})

function accountFixture(): ThongTinQuanLyNguoiDung {
  return {
    id: 3,
    hoTen: 'Quản lý Toà A',
    soDienThoai: '0900000003',
    vaiTro: 'QUAN_LY',
    tenVaiTro: 'Quản lý toà nhà',
    trangThai: 'HOAT_DONG',
    tenTrangThai: 'Hoạt động',
    toaNhaIds: [1],
  }
}

function buildingFixture() {
  return {
    id: 1,
    maToa: 'A',
    ten: 'Toà A',
    diaChi: 'Địa chỉ Toà A',
    soTang: 5,
    ngayChotSo: 25,
    soNgayHanTt: 7,
    maNganHang: '970405',
    tkNganHang: '123456789',
    nguongThatThoat: '20.00',
    batBuocAnhCongTo: false,
  }
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function createRuntimePassword() {
  return `runtime-${Math.random().toString(36).slice(2)}-${Date.now()}`
}
