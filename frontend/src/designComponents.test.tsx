// @vitest-environment jsdom

import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Button } from './design/core/Button'
import { Figure } from './design/core/Figure'
import { Glyph } from './design/core/Glyph'
import { MeterInput } from './design/forms/MeterInput'

// @ts-expect-error ButtonProps intentionally omits native disabled; use blocked instead.
const buttonWithDisabledProp = <Button disabled>Không hợp lệ</Button>
void buttonWithDisabledProp

let container: HTMLDivElement
let root: Root

describe('MiniApart design components', () => {
  beforeEach(() => {
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
})
