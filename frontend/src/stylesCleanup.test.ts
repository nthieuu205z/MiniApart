import { describe, expect, it } from 'vitest'
import roomCatalogSource from './DanhMucPhong.tsx?raw'
import styles from './styles.css?raw'

const removedGroups = {
  'shell, authentication, and navigation': [
    '.page-shell',
    '.hero',
    '.auth-card',
    '.status-card',
    '.login-form',
    '.welcome-panel',
    '.dashboard-panel',
    '.identity-list',
    '.role-menu',
    '.route-panel',
  ],
  'invoice and account management': [
    '.invoice-screen',
    '.invoice-toolbar',
    '.invoice-meta',
    '.invoice-table',
    '.invoice-total',
    '.account-management',
    '.account-table',
    '.account-form',
    '.building-picker',
    '.checkbox-field',
  ],
  'meter entry, responsive, and dark-mode overrides': [
    '.meter-screen',
    '.meter-header',
    '.meter-toolbar',
    '.meter-room',
    '.meter-service',
    '.meter-input',
    '@media (min-width: 720px)',
    '@media (prefers-color-scheme: dark)',
  ],
} as const

describe('Ticket 08 legacy stylesheet cleanup', () => {
  for (const [group, selectors] of Object.entries(removedGroups)) {
    it(`keeps the ${group} group out of the global stylesheet`, () => {
      for (const selector of selectors) expect(styles).not.toContain(selector)
    })
  }

  it('preserves the global reset and active screen-reader utility contract', () => {
    expect(styles).toContain(':root {')
    expect(styles).toContain('* {\n  box-sizing: border-box;')
    expect(styles).toContain('body {')
    expect(styles).toContain('button,\ninput,\ntextarea,\nselect {\n  font: inherit;')
    expect(styles).toContain('.sr-only {')
  })

  it('keeps compatibility class names while room-catalog presentation remains token-owned inline', () => {
    for (const compatibilityClass of ['eyebrow', 'field', 'status-message']) {
      expect(roomCatalogSource).toMatch(
        new RegExp(`className=(?:"[^"]*\\b${compatibilityClass}\\b[^"]*"|\\{[^}]*['\"][^'\"]*\\b${compatibilityClass}\\b[^'\"]*['\"][^}]*\\})[^>]*\\bstyle=`),
      )
    }

    expect(roomCatalogSource).toContain("color: 'var(--ma-text-secondary)'")
    expect(roomCatalogSource).toContain("font: 'var(--ma-text-syslabel)'")
    expect(roomCatalogSource).toContain('style={styleNhanTruong}')
    expect(roomCatalogSource).toContain('style={styleThongBao}')
  })
})
