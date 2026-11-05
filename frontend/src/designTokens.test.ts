// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
})
