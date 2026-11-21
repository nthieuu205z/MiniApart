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
  'table container, consumption bar, topbar notification, and redundant heading reset (now owned by design/base.css and components)': [
    '.ma-table-container',
    '.ma-consumption-bar',
    '.ma-topbar-notification',
    'h1,\nh2,\np {',
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

  it('NFR-USA-01 removes legacy definition-list colors while retaining the margin reset', () => {
    expect(styles).toContain('dl,\ndt,\ndd {\n  margin: 0;')
    expect(styles).not.toMatch(/(?:^|\n)(?:dt|dd)\s*\{[^}]*color\s*:/m)
    expect(styles).not.toMatch(/#[0-9a-fA-F]{3,8}/)
  })

  it('room-catalog dùng DataTable và token thiết kế, không còn style hằng cục bộ', () => {
    expect(roomCatalogSource).toContain('<DataTable')
    expect(roomCatalogSource).not.toContain('styleNhanTruong')
    expect(roomCatalogSource).not.toContain('styleThongBao')
  })
})
