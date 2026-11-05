import type * as React from 'react'
import glyphs from '../../assets/icons/glyphs.json'
import type { GlyphName } from './GlyphName'

export type { GlyphName } from './GlyphName'

export interface GlyphProps extends Omit<React.SVGProps<SVGSVGElement>, 'name' | 'color'> {
  name: GlyphName
  /** px. Mặc định 16. Trong menu 16–18, trong chú giải 13, trong thẻ specimen tối đa 28. */
  size?: number
  /** Mặc định currentColor. Chỉ dùng token màu: --ma-urgent, --ma-waiting, --ma-ink-*. */
  color?: string
  strokeWidth?: number
  /** Đặt khi ký hiệu mang nghĩa độc lập; bỏ trống thì ký hiệu bị ẩn khỏi trình đọc màn hình. */
  title?: string
}

/** Một ký hiệu trong bộ vẽ riêng của MiniApart. Không bao giờ đứng một mình — luôn có nhãn chữ bên cạnh. */
export function Glyph({ name, size = 16, color = 'currentColor', strokeWidth = 1.6, title, style, ...rest }: GlyphProps): React.ReactElement | null {
  const body = glyphs[name]
  if (!body) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      style={{ flex: 'none', display: 'block', ...style }}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <g dangerouslySetInnerHTML={{ __html: body }} />
    </svg>
  )
}
