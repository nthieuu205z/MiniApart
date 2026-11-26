// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import components from './design/components.css?raw'
import colors from './tokens/colors.css?raw'
import typography from './tokens/typography.css?raw'

const nguon = import.meta.glob<string>(['./**/*.tsx', '!./**/*.test.tsx'], { query: '?raw', import: 'default', eager: true })
// V3: mọi file CSS của app (token, design, CSS cạnh màn) — để chặn Inter/teal sót lại.
const css = import.meta.glob<string>(['./**/*.css'], { query: '?raw', import: 'default', eager: true })

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

  // V3 đổi 2 giá trị khoá: hover hàng #F9F7F6 (kem) → #F7F8FA (xám lạnh), font Inter → IBM Plex Sans (03 §1, §4).
  it('exposes the paper and UI font tokens at the document root', () => {
    const styles = getComputedStyle(document.documentElement)

    expect(styles.getPropertyValue('--ma-paper-1').trim()).toBe('#F7F8FA')
    expect(styles.getPropertyValue('--ma-font-ui').trim()).toContain('IBM Plex Sans')
  })

  it('components.css không chứa reset toàn cục và chỉ có hex chép từ design', () => {
    expect(components).not.toMatch(/^(body \{|h1, h2)/m)
    // Hex còn lại là màu cố định của design (trên nền tối/avatar/banner); hex mới phải thêm vào đây có chủ đích.
    // V3: bỏ 3 hex teal (#8fd3c8, #e6f2f0, #115e59), thêm 3 hex V3 (#a9c7ff link trên toast, #2a313a hover nút mực, #eceef1 nền chip).
    // Hex ấm v2 còn lại (#fdf1dc, #efece7, #57534e…) lô nền thay bằng var(--ma-…) rồi XOÁ khỏi tập này; ghi từng hex bỏ/thêm vào báo cáo.
    const allowed = new Set(['#fff', '#932015', '#fdf1dc', '#92400e', '#eaf0fc', '#1e4fc2', '#f3e8e2', '#8a3b12', '#efece7', '#57534e', '#e7f5ec', '#166534', '#f6a49b', '#1a3e96', '#7a350c', '#8e1c13', '#a9c7ff', '#2a313a', '#eceef1'])
    const found = (components.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).map((h) => h.toLowerCase())
    expect(found.filter((h) => !allowed.has(h))).toEqual([])
  })

  // V3 guard mới: không còn Inter, không còn teal/kem của v1–v2 trong bất kỳ file CSS nào của app.
  it('không file CSS nào còn font Inter hay mã màu teal/kem của v2', () => {
    // Tên font trong nháy (khai font-family) chứ không phải chữ "Inter" trong chú thích.
    const cam = /["']Inter["']|#0f766e|#115e59|#0d9488|#e6f2f0|#8fd3c8|#f4f2ee|#f9f7f6|#eef6f4/i
    expect(Object.entries(css).filter(([, text]) => cam.test(text)).map(([file]) => file)).toEqual([])
  })

  // Thiết kế: không chữ mono, không IN HOA giãn cách. Có lý do chính đáng (mã vạch…) thì thêm vào đây kèm chú thích.
  const duocPhep: Record<string, string[]> = {}
  const camTheoQuyTac: Array<[string, RegExp]> = [
    ['IBM Plex Mono', /IBM Plex Mono/],
    ['--ma-font-mono', /--ma-font-mono/],
    ["textTransform: 'uppercase'", /textTransform:\s*['"]uppercase['"]/],
    ['letterSpacing dương (giãn cách)', /letterSpacing:\s*['"](?:0?\.\d+|[1-9]\d*(?:\.\d+)?)(?:em|px)['"]/],
  ]
  for (const [ten, mau] of camTheoQuyTac) {
    it(`không file .tsx nào (trừ test) còn ${ten}`, () => {
      const viPham = Object.entries(nguon).filter(([file, text]) => mau.test(text) && !(duocPhep[file] ?? []).includes(ten)).map(([file]) => file)
      expect(viPham).toEqual([])
    })
  }
})
