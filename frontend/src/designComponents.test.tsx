// @vitest-environment jsdom

import { act, useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Button } from './design/core/Button'
import { Figure } from './design/core/Figure'
import { Glyph } from './design/core/Glyph'
import { ConfirmDialog } from './design/feedback/ConfirmDialog'
import { MeterInput } from './design/forms/MeterInput'
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
})
