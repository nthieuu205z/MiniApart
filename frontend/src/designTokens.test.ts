// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import components from './design/components.css?raw'
import colors from './tokens/colors.css?raw'
import typography from './tokens/typography.css?raw'

describe('MiniApart design tokens', () => {
  beforeEach(() => {
    const style = document.createElement('style')
    style.dataset.test = 'miniapart-tokens'
    style.textContent = `${colors}\n${typography}`
    document.head.appendChild(style)
  })

  afterEach(() => {
    document.querySelector('style[data-test="miniapart-tokens"]')?.remove()
  })

  it('exposes the paper and UI font tokens at the document root', () => {
    const styles = getComputedStyle(document.documentElement)

    expect(styles.getPropertyValue('--ma-paper-1').trim()).toBe('#F9F7F6')
    expect(styles.getPropertyValue('--ma-font-ui').trim()).toContain('Archivo')
  })

  it('components.css không chứa reset toàn cục và chỉ có hex chép từ design', () => {
    expect(components).not.toMatch(/^(body \{|h1, h2)/m)
    // Hex còn lại là màu cố định của design (trên nền tối/avatar/banner); hex mới phải thêm vào đây có chủ đích.
    const allowed = new Set(['#fff', '#932015', '#fdf1dc', '#92400e', '#eaf0fc', '#1e4fc2', '#f3e8e2', '#8a3b12', '#efece7', '#57534e', '#e7f5ec', '#166534', '#8fd3c8', '#f6a49b', '#1a3e96', '#7a350c', '#8e1c13'])
    const found = (components.match(/#[0-9a-fA-F]{3,8}/g) ?? []).map((h) => h.toLowerCase())
    expect(found.filter((h) => !allowed.has(h))).toEqual([])
  })
})
