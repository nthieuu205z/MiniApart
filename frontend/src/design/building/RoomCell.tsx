import type * as React from 'react'
import { Glyph } from '../core/Glyph'
import type { GlyphName } from '../core/GlyphName'

export interface RoomCellProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Số phòng, ví dụ "302". */
  room: string
  /** recorded=đã ghi · missing=chưa ghi số · debt=còn nợ · repair=chờ thợ · vacant=trống · multi=nhiều việc */
  state?: 'recorded' | 'missing' | 'debt' | 'repair' | 'vacant' | 'multi'
  /** Nhãn chữ dưới số phòng: "Đã ghi · 58 kWh", "Nợ 1.720.000", "Trống 12 ngày". */
  label?: string
  /** Chỉ dùng với state="multi": số việc đang tồn ở phòng đó. */
  taskCount?: number
  /** Chỉ dùng với state="multi": liệt kê ngắn, ví dụ "Chưa ghi · rò nước · HĐ 12 ngày". */
  multiSummary?: string
}

type SingleRoomState = Exclude<NonNullable<RoomCellProps['state']>, 'multi'>

type RoomStateStyle = {
  glyph: GlyphName
  glyphColor: string
  flag: string | null
  labelColor: string
  labelWeight: number
  border?: string
  mono?: boolean
  dashed?: boolean
}

const STATES: Record<SingleRoomState, RoomStateStyle> = {
  recorded: { glyph: "da-ghi", glyphColor: "var(--ma-ink-400)", flag: null, labelColor: "var(--ma-text-secondary)", labelWeight: 400 },
  missing:  { glyph: "thieu-so", glyphColor: "var(--ma-urgent)", flag: "var(--ma-urgent)", border: "1px solid var(--ma-urgent)", labelColor: "var(--ma-urgent)", labelWeight: 700 },
  debt:     { glyph: "con-no", glyphColor: "var(--ma-urgent)", flag: "var(--ma-urgent)", labelColor: "var(--ma-urgent)", labelWeight: 700, mono: true },
  repair:   { glyph: "cho-tho", glyphColor: "var(--ma-waiting)", flag: "var(--ma-waiting-border)", labelColor: "var(--ma-waiting)", labelWeight: 700 },
  vacant:   { glyph: "phong-trong", glyphColor: "var(--ma-ink-300)", flag: null, labelColor: "var(--ma-text-disabled)", labelWeight: 400, dashed: true },
};

/** Một phòng trên mặt cắt toà nhà. Phòng nhiều việc thì dùng multi — đổi sang nền mực, KHÔNG xếp nhiều ký hiệu. */
export function RoomCell({ room, state = 'recorded', label, taskCount, multiSummary, style, ...rest }: RoomCellProps): React.ReactElement {
  if (state === "multi") {
    return (
      <div
        style={{
          background: "var(--ma-bg-inverse)",
          border: "1px solid var(--ma-bg-inverse)",
          color: "var(--ma-text-on-inverse)",
          padding: "9px 10px",
          borderRadius: 0,
          fontFamily: "var(--ma-font-ui)",
          ...(style || {}),
        }}
        {...rest}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span className="room-tile__number" style={{ fontFamily: "var(--ma-font-mono)", fontSize: 15, fontWeight: 700 }}>{room}</span>
          <span style={{ fontFamily: "var(--ma-font-mono)", fontSize: 10, fontWeight: 700, background: "var(--ma-urgent)", padding: "1px 5px" }}>
            {taskCount}
          </span>
        </div>
        <div className="room-tile__status" style={{ fontSize: 11, marginTop: 5, color: "var(--ma-text-secondary-on-inverse)" }}>{multiSummary}</div>
      </div>
    );
  }

  const s = STATES[state];
  return (
    <div
      style={{
        background: s.dashed ? "var(--ma-bg-sunken)" : "var(--ma-bg-card)",
        border: s.border || (s.dashed ? "1px dashed var(--ma-border-dashed)" : "1px solid var(--ma-border-default)"),
        boxShadow: s.flag ? `inset 0 -3px 0 ${s.flag}` : undefined,
        padding: "9px 10px",
        borderRadius: 0,
        fontFamily: "var(--ma-font-ui)",
        ...(style || {}),
      }}
      {...rest}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          className="room-tile__number"
          style={{
            fontFamily: "var(--ma-font-mono)",
            fontSize: 15,
            fontWeight: 600,
            color: s.dashed ? "var(--ma-text-disabled)" : "var(--ma-text-primary)",
          }}
        >
          {room}
        </span>
        <Glyph name={s.glyph} color={s.glyphColor} size={13} strokeWidth={1.7} />
      </div>
      <div
        className="room-tile__status"
        style={{
          fontFamily: s.mono ? "var(--ma-font-mono)" : "var(--ma-font-ui)",
          fontSize: 11,
          fontWeight: s.labelWeight,
          color: s.labelColor,
          marginTop: 5,
        }}
      >
        {label}
      </div>
    </div>
  );
}
