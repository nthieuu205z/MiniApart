// @vitest-environment jsdom

import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Button } from './design/core/Button'
import { Figure } from './design/core/Figure'
import { Glyph } from './design/core/Glyph'
import { StatusTag } from './design/core/StatusTag'
import { FilterChip } from './design/forms/FilterChip'
import { EmptyState } from './design/feedback/EmptyState'
import { Field, Input } from './design/forms/Field'
import { NavPanel, type NavItem } from './design/shell/NavPanel'
import { Breadcrumb } from './design/shell/Breadcrumb'
import { ChonToa } from './design/shell/ChonToa'
import { TabTrang } from './design/shell/TabTrang'
import { ToaDangChonProvider } from './toaDangChon'
import type { ThongTinToaNha } from './api'
import { Card } from './design/layout/Card'
import { ConfirmDialog } from './design/feedback/ConfirmDialog'
import { MeterInput } from './design/forms/MeterInput'
import { DauTrang } from './design/layout/DauTrang'
import { KhoiSo } from './design/layout/KhoiSo'
import { ChanDinh } from './design/layout/ChanDinh'
import { DongViec } from './design/building/DongViec'
import { DongNguoiNo } from './design/money/DongNguoiNo'
import { NganNhacNo } from './design/money/NganNhacNo'
import { ThanhBuoc } from './design/core/ThanhBuoc'
import { HangTong } from './design/table/HangTong'
import { DataTable } from './design/table/DataTable'
import { NhanMinhHoa } from './design/feedback/NhanMinhHoa'
import type { NhomNo } from './nhomNoTheoNguoi'
import { MetaItem, TableCell, TableHeadCell } from './design/layout/Screen'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined
}

// @ts-expect-error ButtonProps intentionally omits native disabled; use blocked instead.
const buttonWithDisabledProp = <Button disabled>Không hợp lệ</Button>
void buttonWithDisabledProp

let container: HTMLDivElement
let root: Root

describe('MiniApart design components', () => {
  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  it('keeps a blocked action focusable while suppressing pointer and keyboard activation', async () => {
    let activationCount = 0
    await act(async () => {
      root.render(
        <Button
          blocked
          blockedReason="Cần đủ chỉ số 24/24 phòng. Hiện còn 3 phòng thiếu."
          onClick={() => {
            activationCount += 1
          }}
        >
          Chốt kỳ 08/2026
        </Button>,
      )
    })

    const button = container.querySelector('button')
    expect(button).not.toBeNull()
    expect(button?.disabled).toBe(false)
    expect(button?.getAttribute('aria-disabled')).toBe('true')
    expect(container.textContent).toContain('Hiện còn 3 phòng thiếu.')

    button?.focus()
    expect(document.activeElement).toBe(button)

    button?.click()
    const keyboardEventAccepted = button?.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    }))
    expect(keyboardEventAccepted).toBe(false)
    expect(activationCount).toBe(0)
  })

  it('renders a named glyph with the requested size and stroke', async () => {
    await act(async () => {
      root.render(<Glyph name="con-no" size={20} strokeWidth={1.7} title="Còn nợ" />)
    })

    const glyph = container.querySelector('svg')
    expect(glyph?.getAttribute('width')).toBe('20')
    expect(glyph?.getAttribute('height')).toBe('20')
    expect(glyph?.getAttribute('stroke-width')).toBe('1.7')
    expect(glyph?.textContent).toContain('Còn nợ')
  })

  it('shows meter consumption immediately beside the entered value', async () => {
    await act(async () => {
      root.render(
        <MeterInput label="Chỉ số mới — phòng 302" value="1298" consumption="58 kWh" state="filled" />,
      )
    })

    expect(container.textContent).toContain('Chỉ số mới — phòng 302')
    expect(container.textContent).toContain('= 58 kWh')
  })

  it('renders the interactive input supplied by the meter screen', async () => {
    await act(async () => {
      root.render(
        <MeterInput label="Chỉ số mới — phòng 302" value="1298" state="filled">
          <input name="chiSoCuoi-302-21" value="1298" readOnly />
        </MeterInput>,
      )
    })

    const input = container.querySelector('input[name="chiSoCuoi-302-21"]')
    expect(input).not.toBeNull()
    expect((input as HTMLInputElement).value).toBe('1298')
  })

  it('renders figures with their unit as a separate readable value', async () => {
    await act(async () => {
      root.render(<Figure value="8.450.000" unit="đ" tone="urgent" />)
    })

    expect(container.textContent).toContain('8.450.000')
    expect(container.textContent).toContain('đ')
  })

  it('FR-INV-02 distinguishes column and invoice line-item row header scopes', async () => {
    await act(async () => {
      root.render(
        <table>
          <thead><tr><TableHeadCell>Khoản mục</TableHeadCell></tr></thead>
          <tbody><tr><TableCell header>Tiền điện</TableCell></tr></tbody>
        </table>,
      )
    })

    expect(container.querySelector('thead th')?.getAttribute('scope')).toBe('col')
    expect(container.querySelector('tbody th')?.getAttribute('scope')).toBe('row')
  })

  it('FR-INV-02 keeps definition-list metadata colors owned by design tokens', async () => {
    await act(async () => {
      root.render(<dl><MetaItem label="Phòng">101</MetaItem></dl>)
    })

    expect(container.querySelector('dt')?.style.color).toBe('var(--ma-text-secondary)')
    expect(container.querySelector('dd')?.style.color).toBe('var(--ma-text-primary)')
    expect(container.querySelector('dd')?.style.fontWeight).toBe('800')
  })

  it('FR-AUT-06 preserves caller-provided confirmation dialog semantics', async () => {
    await act(async () => {
      root.render(
        <ConfirmDialog
          title="Khoá tài khoản Người quản lý?"
          consequence="Người dùng sẽ không đăng nhập được nữa."
          confirmLabel="Khoá tài khoản"
          role="alertdialog"
          aria-label="Xác nhận khoá tài khoản"
        />,
      )
    })

    const dialog = container.querySelector('[role]') as HTMLElement
    expect(dialog.getAttribute('role')).toBe('alertdialog')
    expect(dialog.getAttribute('aria-label')).toBe('Xác nhận khoá tài khoản')
    expect(dialog.getAttribute('aria-labelledby')).toBeNull()
  })

  it('FR-AUT-06 keeps an open confirmation modal named, focused, and isolated from the background', async () => {
    function Harness() {
      const [open, setOpen] = useState(false)
      return <>
        <button type="button" onClick={() => setOpen(true)}>Mở xác nhận</button>
        {open ? (
          <ConfirmDialog
            title="Khoá tài khoản Người quản lý?"
            consequence={<>
              <input type="hidden" aria-label="Không thể nhận focus" />
              <div hidden><button type="button">Nút ẩn</button></div>
              <div inert><button type="button">Nút không hoạt động</button></div>
              Người dùng sẽ không đăng nhập được nữa.
            </>}
            confirmLabel="Khoá tài khoản"
            onCancel={() => setOpen(false)}
            tabIndex={0}
          />
        ) : null}
      </>
    }

    await act(async () => root.render(<Harness />))
    const opener = container.querySelector('button') as HTMLButtonElement
    opener.focus()
    await act(async () => opener.click())

    const dialog = container.querySelector('[role="dialog"]') as HTMLElement
    const confirm = [...dialog.querySelectorAll('button')].find((item) => item.textContent === 'Khoá tài khoản') as HTMLButtonElement
    const cancel = [...dialog.querySelectorAll('button')].find((item) => item.textContent === 'Để sau') as HTMLButtonElement

    const labelledBy = dialog.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    expect(document.getElementById(labelledBy!)?.textContent).toBe('Khoá tài khoản Người quản lý?')
    expect(dialog.tabIndex).toBe(0)
    expect(document.activeElement).toBe(confirm)
    expect(opener.hasAttribute('inert')).toBe(true)
    expect(confirm.style.minHeight).toBe('44px')
    expect(cancel.style.minHeight).toBe('44px')

    cancel.focus()
    await act(async () => cancel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })))
    expect(document.activeElement).toBe(confirm)

    confirm.focus()
    await act(async () => confirm.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true })))
    expect(document.activeElement).toBe(cancel)

    await act(async () => cancel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })))
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(opener.hasAttribute('inert')).toBe(false)
    expect(document.activeElement).toBe(opener)
  })

  it('maps Button primary to the design btn-primary class', async () => {
    await act(async () => root.render(<Button variant="primary" type="submit">Lưu</Button>))
    const btn = container.querySelector('button')!
    expect(btn.classList.contains('btn-primary')).toBe(true)
    expect(btn.type).toBe('submit')
  })

  it('shows StatusTag with an icon and text', async () => {
    await act(async () => root.render(<StatusTag tone="urgent">Quá hạn</StatusTag>))
    const tag = container.querySelector('.tag')!
    expect(tag.querySelector('svg')).not.toBeNull()
    expect(tag.textContent).toBe('Quá hạn')
  })

  it('exposes FilterChip active state and count', async () => {
    await act(async () => root.render(<FilterChip active count={9}>Hiệu lực</FilterChip>))
    const chip = container.querySelector('button.chip')!
    expect(chip.getAttribute('aria-pressed')).toBe('true')
    expect(chip.textContent).toContain('9')
  })

  it('links Field error to the control with aria-describedby', async () => {
    await act(async () => root.render(<Field label="Số điện thoại" error="Thiếu số"><Input /></Field>))
    const input = container.querySelector('input')!
    expect(input.getAttribute('aria-invalid')).toBe('true')
    const err = container.querySelector('.error-text')!
    expect(input.getAttribute('aria-describedby')).toBe(err.id)
  })

  it('renders EmptyState loading as a busy skeleton', async () => {
    await act(async () => root.render(<EmptyState kind="loading" title="Đang tải" />))
    expect(container.querySelector('[aria-busy="true"] .skel')).not.toBeNull()
  })

  it('renders Card title as h2', async () => {
    await act(async () => root.render(<Card title="Thực thu">x</Card>))
    expect(container.querySelector('h2')?.textContent).toBe('Thực thu')
  })

  const navItems = (n: number): NavItem[] =>
    Array.from({ length: n }, (_, i) => ({ label: `Mục ${i + 1}`, glyph: 'toa-nha' as const, href: `/m${i + 1}`, active: i === 0 }))

  it('bottom-nav shows all 5 items without the "Thêm" button', async () => {
    await act(async () => root.render(<NavPanel mobile groups={[{ label: 'g', items: navItems(5) }]} />))
    expect(container.querySelectorAll('[data-testid="mobile-nav-bar"] a')).toHaveLength(5)
    expect(container.querySelector('[data-testid="mobile-nav-more"]')).toBeNull()
    expect(container.querySelector('a[aria-current="page"]')).not.toBeNull()
  })

  it('bottom-nav keeps 4 items + "Thêm" when there are more than 5', async () => {
    await act(async () => root.render(<NavPanel mobile groups={[{ label: 'g', items: navItems(6) }]} />))
    expect(container.querySelectorAll('[data-testid="mobile-nav-bar"] a')).toHaveLength(4)
    expect(container.querySelector('[data-testid="mobile-nav-more"]')).not.toBeNull()
  })
})

describe('Khung UX v2: ô chọn toà, tab trang, breadcrumb, sidebar', () => {
  const toa = (id: number, ten: string) => ({ id, ten, maToa: `T${id}`, diaChi: '', soTang: 4 }) as unknown as ThongTinToaNha
  const BA_TOA = [toa(1, 'Bình Minh Riverside'), toa(2, 'Mộc Lan Home'), toa(3, 'An Nhiên Residence')]
  const phim = (el: Element, key: string) => act(async () => { el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })) })

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true
    localStorage.clear()
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })
  afterEach(async () => {
    await act(async () => root.unmount())
    container.remove()
  })

  async function veChonToa(vaiTro: string, ds = BA_TOA) {
    await act(async () => root.render(<ToaDangChonProvider token="t" vaiTro={vaiTro} search="" taiToa={async () => ds}><ChonToa /></ToaDangChonProvider>))
  }

  it('ChonToa (Chủ): Enter mở, mũi tên chọn, Enter xác nhận, Esc đóng và trả focus về nút', async () => {
    await veChonToa('CHU')
    const nut = container.querySelector('button.sb-toa') as HTMLButtonElement
    expect(nut.getAttribute('aria-haspopup')).toBe('listbox')
    expect(nut.textContent).toContain('Tất cả 3 toà')
    await act(async () => nut.focus())
    await act(async () => nut.click()) // Enter trên nút = click
    const ds = container.querySelector('[role="listbox"]') as HTMLElement
    expect(ds).not.toBeNull()
    expect(nut.getAttribute('aria-expanded')).toBe('true')
    expect(document.activeElement).toBe(ds)
    expect([...ds.querySelectorAll('[role="option"]')].map((o) => o.textContent)).toEqual(['Tất cả 3 toà', 'Bình Minh Riverside', 'Mộc Lan Home', 'An Nhiên Residence'])
    await phim(ds, 'ArrowDown')
    await phim(ds, 'ArrowDown')
    await phim(ds, 'Enter')
    expect(container.querySelector('[role="listbox"]')).toBeNull()
    expect(nut.textContent).toContain('Mộc Lan Home')
    expect(localStorage.getItem('ma.toaNhaId')).toBe('2')
    expect(document.activeElement).toBe(nut)

    await act(async () => nut.click())
    await phim(container.querySelector('[role="listbox"]') as HTMLElement, 'Escape')
    expect(container.querySelector('[role="listbox"]')).toBeNull()
    expect(document.activeElement).toBe(nut)
    expect(nut.textContent).toContain('Mộc Lan Home')
  })

  it('ChonToa (Quản lý): ô tĩnh, không phải nút', async () => {
    await veChonToa('QUAN_LY', [toa(3, 'An Nhiên Residence')])
    expect(container.querySelector('button')).toBeNull()
    expect(container.querySelector('.sb-toa.static')?.textContent).toContain('An Nhiên Residence')
    expect(container.querySelector('.sb-toa.static')?.textContent).toContain('được phân công')
  })

  it('TabTrang: link thật, tab đang ở là aria-current, không có role="tab"; trang ngoài nhóm không có tab', async () => {
    await act(async () => root.render(<TabTrang vaiTro="CHU" duongDan="/bao-cao/tieu-thu" search="" />))
    const links = [...container.querySelectorAll('a.tab')]
    expect(links.map((a) => a.textContent)).toEqual(['Tổng quan', 'Doanh thu & lấp đầy', 'Tiêu thụ điện nước', 'Chi phí bảo trì', 'Nhật ký thao tác'])
    expect(links.map((a) => a.getAttribute('aria-current'))).toEqual([null, null, 'page', null, null])
    expect(container.querySelector('[role="tab"]')).toBeNull()
    await act(async () => root.render(<TabTrang vaiTro="CHU" duongDan="/hop-dong" search="" />))
    expect(container.querySelector('nav')).toBeNull()
    await act(async () => root.render(<TabTrang vaiTro="CHU" duongDan="/thu-tien" search="" />))
    expect(container.querySelector('nav')).toBeNull() // Thu tiền tự có tab trong thẻ
    await act(async () => root.render(<TabTrang vaiTro="QTHT" duongDan="/nhat-ky-thao-tac" search="" />))
    expect(container.querySelector('nav')).toBeNull()
  })

  it('Breadcrumb chỉ hiện từ 2 tầng; tầng trước là link, tầng cuối là trang hiện tại', async () => {
    await act(async () => root.render(<Breadcrumb items={['Toà & phòng']} />))
    expect(container.querySelector('nav')).toBeNull()
    await act(async () => root.render(<Breadcrumb items={[{ nhan: 'Toà & phòng', href: '/toa-nha' }, 'An Nhiên Residence']} />))
    expect(container.querySelector('a[href="/toa-nha"]')?.textContent).toBe('Toà & phòng')
    expect(container.querySelector('[aria-current="page"]')?.textContent).toBe('An Nhiên Residence')
  })

  it('NavPanel side: nhóm có nhãn, số đếm xám/đỏ, chân sidebar, ô toà ở đầu', async () => {
    const mucs: NavItem[] = [
      { label: 'Sự cố', glyph: 'toa-nha', href: '/su-co', count: 2, hot: true },
      { label: 'Lịch hẹn', glyph: 'toa-nha', href: '/lich-hen', count: 3 },
    ]
    await act(async () => root.render(<NavPanel variant="side" toa={<div data-testid="o-toa">ô toà</div>} groups={[{ label: 'Vận hành', items: mucs }]} footerItems={[{ label: 'Dịch vụ & đơn giá', glyph: 'toa-nha', href: '/dich-vu' }]} />))
    const nav = container.querySelector('nav') as HTMLElement
    expect(nav.querySelector('.sb-brand + [data-testid="o-toa"]')).not.toBeNull()
    expect(nav.querySelector('.sb-label')?.textContent).toBe('Vận hành')
    expect(nav.querySelector('a[href="/su-co"] .count')?.className).toContain('hot')
    expect(nav.querySelector('a[href="/lich-hen"] .count')?.className).not.toContain('hot')
    expect([...nav.querySelectorAll('a')].map((a) => a.textContent)).toEqual(['Sự cố2', 'Lịch hẹn3', 'Dịch vụ & đơn giá'])
    expect(nav.querySelector('.sb-name')?.nextElementSibling).toBeNull()
  })

  // ---- y0: component chung V3 ----
  const nhom = { khoa: 'a', nguoiThueId: 1, hoTen: 'Trần Văn An', toaNhaId: 1, tenToaNha: 'Toà A', soPhong: '101', hopDongId: 1, daThu: 0, conLai: 1895000, treLauNhat: 113, coTraMotPhan: false,
    hoaDon: [{ hoaDonId: 7, maHoaDon: 'HD7', kyId: 1, toaNhaId: 1, tenToaNha: 'Toà A', soPhong: '101', hopDongId: 1, nguoiThueId: 1, hoTen: 'Trần Văn An', ngayPhatHanh: '2026-07-01', hanThanhToan: '2026-08-05', tongTien: 1895000, daThu: 0, conLai: 1895000, soNgayQuaHan: 113 }] } as NhomNo

  it('Button: nút chính cao theo token mật độ, danger là nút viền đỏ (không nền đỏ)', async () => {
    await act(async () => root.render(<><Button>Ghi thu</Button><Button size="sm">Nhỏ</Button><Button variant="danger">Thanh lý…</Button></>))
    const [a, b, c] = [...container.querySelectorAll('button')] as HTMLButtonElement[]
    expect(a.style.minHeight).toBe('var(--ma-control-h)')
    expect(b.style.minHeight).toBe('var(--ma-control-h-sm)')
    expect(c.className).toContain('btn-danger')
  })

  it('DauTrang: đúng một h1, breadcrumb, hành động, dòng phụ', async () => {
    await act(async () => root.render(<DauTrang tieuDe="Hôm nay" phu="Việc kế tiếp" hanhDong={<Button>Gửi</Button>} vet={[{ nhan: 'Tiền', href: '/thu-tien' }]} />))
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.querySelector('a[href="/thu-tien"]')?.textContent).toBe('Tiền')
    expect(container.querySelector('.ma-dautrang-phu')?.textContent).toBe('Việc kế tiếp')
    expect(container.querySelector('.ma-dautrang-act button')).not.toBeNull()
  })

  it('KhoiSo: tone no đỏ nhưng số 0 không đỏ; anKhiHep gắn lớp ẩn', async () => {
    await act(async () => root.render(<KhoiSo so={[{ nhan: 'Còn nợ', giaTri: '1.895.000', donVi: '₫', tone: 'no' }, { nhan: 'Trễ', giaTri: 0, tone: 'no' }, { nhan: 'Phòng', giaTri: 27, anKhiHep: true, href: '/phong' }]} />))
    const o = container.querySelectorAll('.ma-oso')
    expect(o[0].className).toContain('no')
    expect(o[1].className).not.toContain('no')
    expect(o[2].className).toContain('an-hep')
    expect(o[2].tagName).toBe('A')
  })

  it('DongViec: nút thường chỉ khi có nutNhan; href → link', async () => {
    await act(async () => root.render(<><DongViec muc="no" tieuDe="A" /><DongViec tieuDe="B" nutNhan="Mở" href="/x" /></>))
    expect(container.querySelectorAll('.ma-dongviec')).toHaveLength(2)
    expect(container.querySelectorAll('.ma-dongviec .btn')).toHaveLength(1)
    expect(container.querySelector('a[href="/x"]')?.textContent).toBe('Mở')
  })

  it('DongNguoiNo: gọi chỉ khi SĐT hợp lệ; mở hàng con từng tháng; nút Nhắc/Ghi thu theo prop', async () => {
    await act(async () => root.render(<DongNguoiNo nhom={nhom} sdt="0999100001" mo onNhac={() => {}} />))
    expect(container.querySelector('a[href="tel:0999100001"]')).not.toBeNull()
    expect(container.textContent).toContain('Tháng 7/2026 · hạn 05/08/2026 · trễ 113 ngày · còn 1.895.000 ₫')
    expect(container.textContent).toContain('từ tháng 7/2026')
    expect([...container.querySelectorAll('button')].map((x) => x.textContent)).toContain('Nhắc')
    expect([...container.querySelectorAll('button')].map((x) => x.textContent)).not.toContain('Ghi thu')
    await act(async () => root.render(<DongNguoiNo nhom={nhom} sdt="abc" rut />))
    expect(container.querySelector('a[href^="tel:"]')).toBeNull()
  })

  it('NganNhacNo: dialog có tin soạn sẵn, Zalo chỉ khi có số, nói thật là chưa tự gửi', async () => {
    let dong = 0
    await act(async () => root.render(<NganNhacNo nhom={nhom} sdt="0999100001" hanTra="30/11/2026" onDong={() => { dong += 1 }} />))
    expect(container.querySelector('[role="dialog"]')).not.toBeNull()
    expect((container.querySelector('textarea') as HTMLTextAreaElement).value).toContain('1.895.000 ₫')
    expect(container.querySelector('a[href="https://zalo.me/0999100001"]')?.getAttribute('rel')).toBe('noopener')
    expect(container.textContent).toContain('App chưa tự gửi tin. Mở Zalo rồi dán tin.')
    await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })) })
    expect(dong).toBe(1)
    await act(async () => root.render(<NganNhacNo nhom={nhom} sdt={null} hanTra="30/11/2026" onDong={() => {}} />))
    expect(container.querySelector('a[href^="https://zalo.me"]')).toBeNull()
  })

  it('ThanhBuoc: bước nay có aria-current=step, xong có dấu ✓, có dòng gọn cho 390', async () => {
    await act(async () => root.render(<ThanhBuoc nhan="Tháng 11" buoc={[{ ten: 'Ghi chỉ số', trangThai: 'xong' }, { ten: 'Khoá chỉ số', trangThai: 'nay' }, { ten: 'Gửi hoá đơn', trangThai: 'cho' }]} />))
    expect(container.querySelector('li[aria-current="step"]')?.textContent).toContain('Khoá chỉ số')
    expect(container.querySelector('li')?.textContent).toContain('✓')
    expect(container.querySelector('.ma-buoc-gon')?.textContent).toBe('Bước 2/3: Khoá chỉ số')
  })

  it('DataTable tongHang và HangTong: tfoot ma-tong, ô số canh phải', async () => {
    await act(async () => root.render(<DataTable rows={[{ id: 1, ten: 'A', tien: 5 }]} getRowId={(r) => r.id} columns={[{ key: 'ten', label: 'Tên', render: (r) => r.ten }, { key: 'tien', label: 'Tiền', align: 'num', render: (r) => r.tien }]} tongHang={['Tổng', '5']} />))
    expect(container.querySelector('tfoot tr.ma-tong')).not.toBeNull()
    expect(container.querySelectorAll('tfoot td')[1].className).toBe('num')
    await act(async () => root.render(<table><tfoot><HangTong o={['T', '9']} canhPhai={[1]} /></tfoot></table>))
    expect(container.querySelector('tr.ma-tong td.num')?.textContent).toBe('9')
  })

  it('NhanMinhHoa mặc định "minh hoạ"; ChanDinh bọc nút chính', async () => {
    await act(async () => root.render(<><NhanMinhHoa /><ChanDinh><Button>Lưu</Button></ChanDinh></>))
    expect(container.querySelector('.ma-nhanmh')?.textContent).toBe('minh hoạ')
    expect(container.querySelector('.ma-chandinh button')).not.toBeNull()
  })
})
