import glyphs from './assets/icons/glyphs.json'
import { describe, expect, it } from 'vitest'

const EXPECTED_GLYPH_NAMES = [
  'da-ghi',
  'thieu-so',
  'con-no',
  'cho-tho',
  'phong-trong',
  'bi-chan',
  'hop-dong',
  'cong-to',
  'nhac-viec',
  'so-do-phong',
  'hoa-don',
  'cong-no',
  'bang-gia',
  'sua-chua',
  'thong-bao-cu-dan',
  'toa-nha',
  'tim',
  'thong-bao',
  'lich-su-ky',
  'mo-xuong',
  'goi-dien',
  'gap',
  'o-vuong',
] as const

describe('MiniApart glyph assets', () => {
  it('keeps all 23 nghiệp vụ glyph names in the source asset', () => {
    expect(Object.keys(glyphs)).toEqual(EXPECTED_GLYPH_NAMES)
    expect(Object.keys(glyphs)).toHaveLength(23)
  })
})
