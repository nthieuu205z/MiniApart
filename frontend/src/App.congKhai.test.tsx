// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { clearStoredToken, storeToken } from './authSession'
import { TRANG_DAU, type VaiTro } from './dinhTuyen'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const TOA = [
  { id: 1, maToa: 'A', ten: 'Toà An Nhiên', diaChi: 'Số 1, Hà Nội', soTang: 5, soPhongTrong: 2 },
  { id: 2, maToa: 'B', ten: 'Toà Bình Minh', diaChi: 'Số 2, Đà Nẵng', soTang: 5, soPhongTrong: 0 },
  { id: 3, maToa: 'TN', ten: 'Toà thử nghiệm', diaChi: 'Số 3, Hà Nội', soTang: 1, soPhongTrong: 0 }, // không có phòng công khai → không hiện
]
const dichVu = [
  { id: 1, ten: 'Điện sinh hoạt', donVi: 'kWh', donGia: 3500, cachTinh: 'THEO_CHI_SO', cheDoGia: 'DON_GIA' },
  { id: 2, ten: 'Nước sạch', donVi: 'm³', donGia: 25000, cachTinh: 'THEO_CHI_SO', cheDoGia: 'DON_GIA' },
]
const phong = (id: number, o: Record<string, unknown> = {}) => ({ id, soPhong: String(100 + id), toaNhaId: 1, tenToaNha: 'Toà An Nhiên', diaChiToaNha: 'Số 1, Hà Nội', tang: 1, dienTich: 22, sucChua: 2, giaThue: 3600000, loaiPhong: 'Studio', trangThai: 'TRONG', nhanTrangThai: '', tienIch: ['Điều hòa'], moTa: 'Phòng thoáng.', anhDaiDien: '/rooms/annhien_co_ban.webp', bangGiaDichVu: dichVu, ...o })
const PHONG = [
  phong(1),
  phong(2, { giaThue: 5600000, tienIch: ['Điều hoà', 'Ban công'], loaiPhong: 'Studio ban công' }),
  phong(3, { toaNhaId: 2, tenToaNha: 'Toà Bình Minh', diaChiToaNha: 'Số 2, Đà Nẵng', trangThai: 'DANG_THUE', giaThue: 3000000 }),
]
const NGUOI: Record<VaiTro, { id: number; hoTen: string; soDienThoai: string; vaiTro: VaiTro; tenVaiTro: string }> = {
  CHU: { id: 1, hoTen: 'Hoàng Phúc', soDienThoai: '0999000011', vaiTro: 'CHU', tenVaiTro: 'Chủ sở hữu' },
  QUAN_LY: { id: 2, hoTen: 'Quản Lý', soDienThoai: '0999000020', vaiTro: 'QUAN_LY', tenVaiTro: 'Quản lý' },
  QTHT: { id: 3, hoTen: 'Quản Trị', soDienThoai: '0999000001', vaiTro: 'QTHT', tenVaiTro: 'Quản trị' },
  THO: { id: 4, hoTen: 'Thợ Sửa', soDienThoai: '0999000031', vaiTro: 'THO', tenVaiTro: 'Thợ' },
  NGUOI_THUE: { id: 5, hoTen: 'Người Thuê', soDienThoai: '0999100001', vaiTro: 'NGUOI_THUE', tenVaiTro: 'Người thuê' },
}

let posts: Array<{ url: string; body: Record<string, unknown> }> = []
let vaiTroDangNhap: VaiTro = 'CHU'
function mockFetch(opts: { me?: VaiTro; datLichLoi?: boolean } = {}) {
  posts = []
  vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url
    if (init?.method === 'POST') posts.push({ url, body: JSON.parse(String(init.body ?? '{}')) })
    if (url === '/api/health') return json({ status: 'UP', database: 'UP' })
    if (url === '/api/auth/me') return opts.me ? json(NGUOI[opts.me]) : json({ thongBao: 'Chưa đăng nhập' }, 401)
    if (url === '/api/auth/login') return json({ token: 't', nguoiDung: NGUOI[vaiTroDangNhap] })
    if (url === '/api/public/toa-nha') return json(TOA)
    if (url.startsWith('/api/public/phong')) return json(PHONG)
    if (url === '/api/public/dat-lich-hen') return opts.datLichLoi ? json({ thongBao: 'Phòng này vừa có người đặt.' }, 409) : json({ thanhCong: true, lichHenId: 99, thongBao: 'ok' }, 201)
    if (url === '/api/thong-bao') return json({ thongBao: [], soChuaDoc: 0 })
    return json({ thongBao: 'không có trong mock' }, 404)
  }))
}

const setValue = (el: HTMLInputElement | HTMLSelectElement, v: string) => {
  const proto = el instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value')?.set?.call(el, v)
  el.dispatchEvent(new Event(el instanceof HTMLSelectElement ? 'change' : 'input', { bubbles: true }))
}

describe('Phần công khai trong App', () => {
  let container: HTMLDivElement
  let root: Root
  const mount = async (path: string, opts: Parameters<typeof mockFetch>[0] = {}) => {
    window.history.replaceState({}, '', path)
    mockFetch(opts)
    if (opts.me) storeToken('t')
    root = createRoot(container)
    await act(async () => root.render(<App />))
  }
  const cho = (fn: () => void) => vi.waitFor(fn, { timeout: 3000 })

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    clearStoredToken()
    vi.stubGlobal('scrollTo', vi.fn()) // jsdom chưa có scrollTo; khung công khai cuộn lên đầu khi đổi trang
  })
  afterEach(async () => {
    await act(async () => root?.unmount())
    container.remove()
    clearStoredToken()
    vi.unstubAllGlobals()
    window.history.replaceState({}, '', '/')
  })

  it('"/" là trang chủ cho khách: một h1, số liệu từ API, không có khối chủ nhà, Cổng cư dân dẫn tới /dang-nhap', async () => {
    await mount('/')
    await cho(() => expect(container.textContent).toContain('2 phòng đang trống ở 2 toà'))
    expect(container.querySelectorAll('h1').length).toBe(1)
    expect(container.querySelector('h1')?.textContent).toContain('Chỗ ở tử tế')
    expect(container.textContent).not.toMatch(/chủ nhà|Zalo/i)
    expect(container.textContent).not.toContain('Toà thử nghiệm')
    expect(container.querySelector('header a.dau-cong')?.getAttribute('href')).toBe('/dang-nhap')
    expect(container.querySelector('header a.dau-cong')?.textContent).toBe('Cổng cư dân')
    expect(container.querySelector('header nav a[href="/tim-phong"]')).not.toBeNull()
    expect(document.querySelector('em.n, [style*="Newsreader"]')).toBeNull()
  })

  it.each(['CHU', 'QUAN_LY', 'QTHT', 'THO', 'NGUOI_THUE'] as VaiTro[])('đã đăng nhập vai %s vào "/": vẫn thấy trang chủ, nút "Vào trang của tôi" dẫn tới trang đầu theo vai', async (vai) => {
    await mount('/', { me: vai })
    await cho(() => expect(container.querySelector('header a.dau-cong')?.textContent).toContain('Vào trang của tôi'))
    expect(window.location.pathname).toBe('/')
    expect(container.querySelector('h1')?.textContent).toContain('Chỗ ở tử tế')
    expect(container.querySelector('header a.dau-cong')?.getAttribute('href')).toBe(TRANG_DAU[vai])
    expect(container.querySelector('a[href="/dang-nhap"]')).toBeNull() // không còn lối vào cổng cư dân khi đã có phiên
  })

  it('bấm "Vào trang của tôi" sang trang đầu của Chủ', async () => {
    await mount('/', { me: 'CHU' })
    const nut = await vi.waitFor(() => { const a = container.querySelector('header a.dau-cong') as HTMLAnchorElement; expect(a?.textContent).toContain('Vào trang'); return a })
    await act(async () => nut.click())
    expect(window.location.pathname).toBe('/hom-nay')
  })

  it('đã đăng nhập vẫn xem được /tim-phong và /phong-trong/:id mà không bị chuyển hướng', async () => {
    await mount('/tim-phong', { me: 'QUAN_LY' })
    await cho(() => expect(container.querySelector('[data-testid="card-phong-101"]')).not.toBeNull())
    expect(window.location.pathname).toBe('/tim-phong')
    await act(async () => { window.history.pushState({}, '', '/phong-trong/1'); window.dispatchEvent(new PopStateEvent('popstate')) })
    await cho(() => expect(container.querySelector('h1')?.textContent).toBe('Phòng 101'))
    expect(window.location.pathname).toBe('/phong-trong/1')
  })

  it('/kham-pha chuyển sang /tim-phong và giữ query', async () => {
    await mount('/kham-pha?toa=1')
    await cho(() => expect(window.location.pathname).toBe('/tim-phong'))
    expect(window.location.search).toContain('toa=1')
    await cho(() => expect(container.querySelector('h1')?.textContent).toBe('Tìm phòng'))
  })

  it('khách vào trang của app thì về /dang-nhap; đã đăng nhập vào /dang-nhap thì về trang đầu theo vai', async () => {
    await mount('/hom-nay')
    await cho(() => expect(window.location.pathname).toBe('/dang-nhap'))
    expect(container.querySelector('input[autocomplete="username"]')).not.toBeNull()
    await act(async () => root.unmount())
    root = createRoot(container)
    window.history.replaceState({}, '', '/dang-nhap')
    mockFetch({ me: 'THO' }); storeToken('t')
    await act(async () => root.render(<App />))
    await cho(() => expect(window.location.pathname).toBe('/viec-cua-toi'))
  })

  it('đăng nhập ở /dang-nhap vào đúng trang đầu theo vai; đăng xuất về trang chủ', async () => {
    vaiTroDangNhap = 'CHU'
    await mount('/dang-nhap')
    const form = await vi.waitFor(() => { const f = container.querySelector('form'); expect(f).not.toBeNull(); return f as HTMLFormElement })
    await act(async () => {
      setValue(form.querySelector('input[autocomplete="username"]') as HTMLInputElement, '0999000011')
      setValue(form.querySelector('input[type="password"]') as HTMLInputElement, 'x')
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
    })
    await cho(() => expect(window.location.pathname).toBe('/hom-nay'))
    const dangXuat = await vi.waitFor(() => { const b = container.querySelector('[data-testid="topbar-logout"], [data-testid="nav-logout"]') as HTMLElement; expect(b).not.toBeNull(); return b })
    await act(async () => dangXuat.click())
    await cho(() => expect(window.location.pathname).toBe('/'))
    await cho(() => expect(container.querySelector('h1')?.textContent).toContain('Chỗ ở tử tế'))
    expect(container.querySelector('header a.dau-cong')?.getAttribute('href')).toBe('/dang-nhap')
  })

  it('khung đăng nhập: 360px xếp một cột (CSS), form nằm trong hộp tối đa 420px', async () => {
    await mount('/dang-nhap')
    await cho(() => expect(container.querySelector('.dn-hop form')).not.toBeNull())
    const css = (await import('./congKhai/congKhai.css?raw')).default
    expect(css).toMatch(/@media \(max-width: 899px\)[\s\S]*\.cong \.dn \{[^}]*grid-template-columns: 1fr/)
    expect(css).toMatch(/\.cong \.dn-hop \{[^}]*min\(100%, 420px\)/)
    expect(container.querySelector('a[href="/tim-phong"]')).not.toBeNull()
  })

  describe('Tìm phòng', () => {
    it('chỉ hiện phòng trống mặc định, lọc theo tiện ích (hòa/hoà là một) và mức giá, ghi bộ lọc lên URL', async () => {
      await mount('/tim-phong')
      await cho(() => expect(container.querySelector('[data-testid="card-phong-101"]')).not.toBeNull())
      expect(container.querySelector('[data-testid="card-phong-103"]')).toBeNull() // đang thuê
      expect(container.querySelectorAll('h1').length).toBe(1)
      const chip = (nhan: string) => [...container.querySelectorAll<HTMLButtonElement>('.loc-chip')].find((b) => b.textContent?.startsWith(nhan))!
      await act(async () => chip('Ban công').click())
      expect(container.querySelector('[data-testid="card-phong-101"]')).toBeNull()
      expect(container.querySelector('[data-testid="card-phong-102"]')).not.toBeNull()
      expect(window.location.search).toContain('ti=Ban+c%C3%B4ng')
      await act(async () => chip('Ban công').click())
      const gia = container.querySelectorAll('select')[1] as HTMLSelectElement
      await act(async () => setValue(gia, 'DUOI_3_5'))
      await cho(() => expect(container.textContent).toContain('Không có phòng nào khớp'))
      expect(container.textContent).toContain('1 phòng khớp điều kiện nhưng đang có người thuê')
      await act(async () => ([...container.querySelectorAll('button')].find((b) => b.textContent === 'Xem cả phòng đang có người thuê') as HTMLButtonElement).click())
      expect(container.querySelector('[data-testid="card-phong-103"]')?.className).toContain('het')
      await act(async () => ([...container.querySelectorAll('button')].find((b) => b.textContent === 'Đặt lại bộ lọc') as HTMLButtonElement).click())
      expect(window.location.search).toBe('')
    })

    it('đọc bộ lọc từ URL (?toa=…&gia=…)', async () => {
      await mount('/tim-phong?gia=TREN_5')
      await cho(() => expect(container.querySelector('[data-testid="card-phong-102"]')).not.toBeNull())
      expect(container.querySelector('[data-testid="card-phong-101"]')).toBeNull()
    })

    it('lỗi mạng: báo lỗi và có nút Tải lại', async () => {
      window.history.replaceState({}, '', '/tim-phong')
      vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('Mất mạng') }))
      root = createRoot(container)
      await act(async () => root.render(<App />))
      await cho(() => expect(container.querySelector('[role="alert"]')?.textContent).toContain('Mất mạng'))
    })
  })

  describe('Chi tiết phòng và đặt lịch xem', () => {
    const dien = async (sdt: string) => {
      const f = container.querySelector('#dat-lich') as HTMLFormElement
      await act(async () => {
        setValue(f.querySelector('[name="hoTen"]') as HTMLInputElement, 'Nguyễn Văn An')
        setValue(f.querySelector('[name="soDienThoai"]') as HTMLInputElement, sdt)
      })
      await act(async () => f.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
    }

    it('gửi POST /api/public/dat-lich-hen đúng phòng, toà, số điện thoại đã gọn; hiện bảng xác nhận kèm mã', async () => {
      await mount('/phong-trong/2')
      await cho(() => expect(container.querySelector('#dat-lich')).not.toBeNull())
      expect(container.querySelector('h1')?.textContent).toBe('Phòng 102')
      expect(container.textContent).toContain('Điện sinh hoạt')
      await dien('0912 345 678')
      await cho(() => expect(container.querySelector('#dat-lich[role="status"]')).not.toBeNull())
      expect(posts).toHaveLength(1)
      expect(posts[0].url).toBe('/api/public/dat-lich-hen')
      expect(posts[0].body).toMatchObject({ hoTen: 'Nguyễn Văn An', soDienThoai: '0912345678', phongId: 2, toaNhaId: 1 })
      expect(container.textContent).toContain('Mã lịch hẹn')
      expect(container.textContent).toContain('0912 345 678')
    })

    it('số điện thoại sai: báo ngay dưới ô, không gửi', async () => {
      await mount('/phong-trong/1')
      await cho(() => expect(container.querySelector('#dat-lich')).not.toBeNull())
      await dien('12345')
      expect(container.querySelector('#l-soDienThoai')?.textContent).toBe('Số điện thoại gồm đúng 10 chữ số.')
      expect(container.querySelector('[name="soDienThoai"]')?.getAttribute('aria-invalid')).toBe('true')
      expect(posts).toHaveLength(0)
    })

    it('máy chủ từ chối: hiện lời báo, form còn nguyên để gửi lại', async () => {
      await mount('/phong-trong/1', { datLichLoi: true })
      await cho(() => expect(container.querySelector('#dat-lich')).not.toBeNull())
      await dien('0912345678')
      await cho(() => expect(container.querySelector('#dat-lich [role="alert"]')?.textContent).toContain('vừa có người đặt'))
      expect(container.querySelector('#dat-lich')?.tagName).toBe('FORM')
    })

    it('phòng đang thuê: không có form, có đường dẫn tới phòng trống cùng toà; phòng không tồn tại: báo không tìm thấy', async () => {
      await mount('/phong-trong/3')
      await cho(() => expect(container.querySelector('h1')?.textContent).toBe('Phòng 103'))
      expect(container.querySelector('#dat-lich')).toBeNull()
      expect(container.textContent).toContain('Đang có người thuê')
      await act(async () => root.unmount())
      root = createRoot(container)
      window.history.replaceState({}, '', '/phong-trong/999')
      mockFetch()
      await act(async () => root.render(<App />))
      await cho(() => expect(container.querySelector('h1')?.textContent).toBe('Không tìm thấy phòng này'))
    })

    it('ước tính một tháng đổi theo số điện nhập', async () => {
      await mount('/phong-trong/1')
      await cho(() => expect(container.querySelector('#uoc-tinh')).not.toBeNull())
      const tong = () => container.querySelector('.ut-tong b')?.textContent?.replace(/\s/g, ' ')
      const truoc = tong()
      await act(async () => setValue(container.querySelector('#uoc-tinh [name="kwh"]') as HTMLInputElement, '200'))
      expect(tong()).not.toBe(truoc)
    })
  })
})
