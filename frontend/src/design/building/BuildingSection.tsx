import type * as React from 'react'
import { SysLabel } from '../core/SysLabel'
import { RoomCell, type RoomCellProps } from './RoomCell'

export interface Floor {
  /** "T4", "T3"… Tầng cao nhất đứng đầu mảng. */
  name: string
  rooms: RoomCellProps[]
}

/**
 * Mặt cắt toà nhà — cách MiniApart trình bày trạng thái cả toà trong một hình.
 * Thay cho bảng danh sách phòng ở mọi màn tổng quan.
 * @startingPoint section="Building" subtitle="Mặt cắt 4 tầng, việc neo vào đúng phòng" viewport="700x360"
 */
export interface BuildingSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nhãn hệ thống phía trên, ví dụ "Mặt cắt toà A · 4 tầng · 24 phòng". */
  label?: string
  floors: Floor[]
  /** Số phòng mỗi tầng. Mặc định 6. */
  columns?: number
  /** Cột thang bộ bên phải. Bật mặc định. */
  showStairs?: boolean
}

/** Mặt cắt toà nhà: tầng cao nhất ở trên, mái và móng vẽ bằng dải gạch chéo. */
export function BuildingSection({ label, floors, columns = 6, showStairs = true, style, ...rest }: BuildingSectionProps): React.ReactElement {
  const grid = `34px repeat(${columns}, 1fr)${showStairs ? " 30px" : ""}`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, ...(style || {}) }} {...rest}>
      {label ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 2 }}>
          <SysLabel style={{ fontSize: 10, letterSpacing: "0.12em" }}>{label}</SysLabel>
          <SysLabel style={{ fontSize: 10, letterSpacing: "0.12em" }}>Sân thượng</SysLabel>
        </div>
      ) : null}
      <div
        style={{
          height: 6,
          borderTop: "2px solid var(--ma-ink-900)",
          background:
            "repeating-linear-gradient(135deg, var(--ma-line-300) 0 2px, transparent 2px 5px)",
        }}
      />
      {floors.map((floor) => (
        <section key={floor.name} className="room-floor-section" data-testid="room-floor-section" aria-labelledby={`floor-title-${floor.name}`} style={{ display: "grid", gridTemplateColumns: grid, gap: 6, alignItems: "stretch" }}>
          <div
            style={{
              fontFamily: "var(--ma-font-mono)",
              fontSize: 12,
              fontWeight: 600,
              color: "var(--ma-text-secondary)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <h4 id={`floor-title-${floor.name}`} style={{ margin: 0, font: 'inherit' }}>Tầng {floor.name.replace(/^T/, '')}</h4>
          </div>
          <div className="room-floor-grid" data-testid="room-floor-grid" data-compact-layout="true" style={{ display: 'contents' }}>
            {floor.rooms.map(({ className, onClick, onKeyDown, ...r }) => <RoomCell key={r.room} className={`room-tile ${className ?? ''}`} data-testid="room-tile" role="button" tabIndex={0} onClick={onClick} onKeyDown={(event) => { onKeyDown?.(event); if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClick?.(event as unknown as React.MouseEvent<HTMLDivElement>) } }} {...r} />)}
          </div>
          {showStairs ? <div style={{ borderLeft: "1px solid var(--ma-border-default)" }} /> : null}
        </section>
      ))}
      <div style={{ borderTop: "2px solid var(--ma-ink-900)", marginTop: 2 }} />
      <div
        style={{
          height: 7,
          background: "repeating-linear-gradient(135deg, var(--ma-line-200) 0 2px, transparent 2px 5px)",
        }}
      />
    </div>
  );
}
