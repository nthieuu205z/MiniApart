import { useEffect, useRef, useState } from 'react'
import type * as React from 'react'
import { mocTruc } from './bieuDo'

/** Chữ trục 14 đơn vị: sau khi co theo thẻ vẫn ≥ 12px (CSS `.chart text` đặt 12px nên phải ghi đè từng thẻ). */
const CHU = { fontSize: 14 }
const KHUNG = { cao: 232, trai: 56, phai: 12, tren: 22, duoi: 28 }

export type ChuoiCot = { ten: string; mau: string; giaTri: ReadonlyArray<number | null> }

/** Số tiền rút gọn cho trục và nhãn cột: 1,5 tr / 500k. */
export function rutGonTien(v: number): string {
  if (v >= 1e6) return `${(v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`
  if (v >= 1e3) return `${(v / 1e3).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}k`
  return v.toLocaleString('vi-VN')
}

/**
 * Biểu đồ cột nhóm: mỗi nhãn (tháng) một nhóm, mỗi chuỗi một cột. giaTri null = chưa ghi nhận (không vẽ cột, hiện "—"), khác với 0.
 * `thuocTinhNhom` gắn data-* lên từng nhóm; `moTaNhom` là chú thích đọc màn hình. Kèm bảng số ẩn.
 */
export function BieuDoCot({ nhan, chuoi, tieuDe, thuocTinhNhom, moTaNhom, dinhDang = rutGonTien }: {
  nhan: readonly string[]
  chuoi: readonly ChuoiCot[]
  tieuDe: string
  thuocTinhNhom?: (i: number) => Record<string, string>
  moTaNhom?: (i: number) => string
  dinhDang?: (v: number) => string
}): React.ReactElement {
  // Vẽ đúng bằng bề rộng thật của thẻ (không co giãn viewBox) để chữ trục luôn 14px, kể cả ở điện thoại.
  const khung = useRef<HTMLDivElement>(null)
  const [rong, setRong] = useState(600)
  useEffect(() => {
    const el = khung.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const doRong = () => setRong(Math.max(280, Math.round(el.clientWidth)))
    doRong()
    const ro = new ResizeObserver(doRong)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const lon = Math.max(0, ...chuoi.flatMap((c) => c.giaTri.map((v) => v ?? 0)))
  const moc = mocTruc(lon)
  const tran = moc[moc.length - 1]
  const day = KHUNG.cao - KHUNG.duoi
  const cao = day - KHUNG.tren
  const y = (v: number) => day - (tran > 0 ? (Math.min(v, tran) / tran) * cao : 0)
  const n = nhan.length
  const itCot = n * chuoi.length <= 9
  // Ít cột: cột rộng 56 để nhãn số vừa; nhiều cột: 28.
  const bocNhom = (rong - KHUNG.trai - KHUNG.phai) / Math.max(1, n)
  const rongCot = Math.min(itCot ? 56 : 28, (bocNhom * 0.78) / Math.max(1, chuoi.length))
  const nhomRong = rongCot * chuoi.length
  const buoc = Math.max(1, Math.ceil((n * 64) / (rong - KHUNG.trai - KHUNG.phai)))
  const ghiSo = itCot && rongCot >= 28
  const trucY = (m: number) => (m === 0 ? '0' : dinhDang(m))
  return (
    <div ref={khung}>
      <svg className="chart" viewBox={`0 0 ${rong} ${KHUNG.cao}`} width={rong} height={KHUNG.cao} role="img" aria-label={tieuDe}>
        <title>{tieuDe}</title>
        {moc.map((m) => (
          <g key={m}>
            <line className={m === 0 ? 'base-line' : 'grid-line'} x1={KHUNG.trai} x2={rong - KHUNG.phai} y1={y(m)} y2={y(m)} />
            <text x={KHUNG.trai - 8} y={y(m) + 4} textAnchor="end" style={CHU}>{trucY(m)}</text>
          </g>
        ))}
        {nhan.map((ten, i) => {
          const x0 = KHUNG.trai + bocNhom * i + (bocNhom - nhomRong) / 2
          return (
            <g key={ten} {...thuocTinhNhom?.(i)}>
              {moTaNhom ? <title>{moTaNhom(i)}</title> : null}
              {chuoi.map((c, j) => {
                const v = c.giaTri[i]
                const x = x0 + rongCot * j
                if (v === null || v === undefined) {
                  return ghiSo ? <text key={c.ten} x={x + rongCot / 2} y={day - 6} textAnchor="middle" style={CHU}>—</text> : null
                }
                const top = y(v)
                return (
                  <g key={c.ten}>
                    <rect x={x + 1} y={top} width={Math.max(1, rongCot - 2)} height={Math.max(v > 0 ? 2 : 0, day - top)} rx={3} style={{ fill: c.mau }} />
                    {ghiSo ? <text x={x + rongCot / 2} y={top - 5} textAnchor="middle" style={{ ...CHU, fill: 'var(--ma-text-secondary)' }}>{dinhDang(v)}</text> : null}
                  </g>
                )
              })}
              {i % buoc === 0 ? <text x={KHUNG.trai + bocNhom * (i + 0.5)} y={KHUNG.cao - 6} textAnchor="middle" style={CHU}>{ten}</text> : null}
            </g>
          )
        })}
      </svg>
      <div className="sr-only"> {/* bọc div: bảng đặt trực tiếp sr-only vẫn tràn ra ngoài */}
        <table>
          <caption>{tieuDe}</caption>
          <thead><tr><th>Tháng</th>{chuoi.map((c) => <th key={c.ten}>{c.ten}</th>)}</tr></thead>
          <tbody>
            {nhan.map((ten, i) => (
              <tr key={ten}><th>{ten}</th>{chuoi.map((c) => <td key={c.ten}>{c.giaTri[i] === null || c.giaTri[i] === undefined ? 'Chưa ghi nhận' : dinhDang(c.giaTri[i]!)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
