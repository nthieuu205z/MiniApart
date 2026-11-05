import glyphs from '../../assets/icons/glyphs.json'

/** Tên glyph lấy trực tiếp từ bộ mô tả tài sản, không viết lại bằng tay. */
export type GlyphName = keyof typeof glyphs

export const GLYPH_NAMES = Object.freeze(Object.keys(glyphs) as GlyphName[])
