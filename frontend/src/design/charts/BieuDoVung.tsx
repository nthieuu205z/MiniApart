import type * as React from 'react'
import { duongVaVung, mocTruc, type KhungVe } from './bieuDo'

/** Chữ trục 14 đơn vị để sau khi co theo thẻ vẫn ≥ 12px (CSS `.chart text` đặt 12px nên phải ghi đè từng thẻ). */
const CHU = { fontSize: 14 }

export type ChuoiVung = { ten: string; mau: string; giaTri: ReadonlyArray<number | null> }

const KHUNG: KhungVe = { rong: 608, cao: 212, trai: 52, phai: 24, tren: 12, duoi: 24 }

/** Biểu đồ vùng hai chuỗi (chuỗi đầu tô vùng). `kyCuoiDangMo` vẽ đoạn cuối nét đứt vì kỳ chưa chốt. Kèm bảng số ẩn cho đọc màn hình. */
export function BieuDoVung({ nhan, chuoi, tieuDe, kyCuoiDangMo = false }: { nhan: readonly string[]; chuoi: readonly ChuoiVung[]; tieuDe: string; kyCuoiDangMo?: boolean }): React.ReactElement {
  const lon = Math.max(0, ...chuoi.flatMap((c) => c.giaTri.map((v) => v ?? 0)))
  const moc = mocTruc(lon / 1e6).map((m) => m * 1e6) // trục tính bằng triệu đồng
  const tran = moc[moc.length - 1]
  const tat = kyCuoiDangMo && nhan.length > 1
  const dayDu = chuoi.map((c) => duongVaVung(c.giaTri, tran, KHUNG))
  const ve = tat ? chuoi.map((c) => duongVaVung(c.giaTri.map((v, i) => (i === nhan.length - 1 ? null : v)), tran, KHUNG)) : dayDu
  const day = dayDu[0]?.day ?? KHUNG.cao - KHUNG.duoi
  const yMoc = (m: number) => day - (tran > 0 ? (m / tran) * (day - KHUNG.tren) : 0)
  return (
    <>
      <svg className="chart" viewBox={`0 0 ${KHUNG.rong} ${KHUNG.cao}`} role="img" aria-label={tieuDe}>
        <title>{tieuDe}</title>
        <defs>
          <linearGradient id="bdv-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" style={{ stopColor: chuoi[0]?.mau, stopOpacity: 0.22 }} />
            <stop offset="1" style={{ stopColor: chuoi[0]?.mau, stopOpacity: 0 }} />
          </linearGradient>
        </defs>
        {moc.map((m) => (
          <g key={m}>
            <line className={m === 0 ? 'base-line' : 'grid-line'} x1={KHUNG.trai} x2={KHUNG.rong - KHUNG.phai} y1={yMoc(m)} y2={yMoc(m)} />
            <text x={KHUNG.trai - 8} y={yMoc(m) + 4} textAnchor="end" style={CHU}>{m === 0 ? '0' : `${m / 1e6} tr`}</text>
          </g>
        ))}
        {ve[0] ? <path d={ve[0].vung} fill="url(#bdv-fade)" /> : null}
        {ve.map((v, i) => (
          <path key={chuoi[i].ten} d={v.duong} fill="none" strokeWidth={i === 0 ? 2.5 : 2} strokeLinejoin="round" style={{ stroke: chuoi[i].mau }} />
        ))}
        {tat ? dayDu.map((v, i) => {
          const [a, b] = v.diem.slice(-2)
          return a && b ? <path key={chuoi[i].ten} d={`M${a.x} ${a.y} L${b.x} ${b.y}`} fill="none" strokeWidth={2} strokeDasharray="4 4" style={{ stroke: chuoi[i].mau }} /> : null
        }) : null}
        {nhan.map((n, i) => (
          <text key={n} x={dayDu[0]?.diem[i]?.x ?? 0} y={KHUNG.cao - 4} textAnchor="middle" style={CHU}>{n}</text>
        ))}
      </svg>
      <div className="sr-only"> {/* bọc div: bảng đặt trực tiếp sr-only vẫn tràn ra ngoài vì CSS không cắt được table */}
      <table>
        <caption>{tieuDe}</caption>
        <thead>
          <tr><th>Kỳ</th>{chuoi.map((c) => <th key={c.ten}>{c.ten}</th>)}</tr>
        </thead>
        <tbody>
          {nhan.map((n, i) => (
            <tr key={n}><th>{n}</th>{chuoi.map((c) => <td key={c.ten}>{c.giaTri[i] ?? '—'}</td>)}</tr>
          ))}
        </tbody>
      </table>
      </div>
    </>
  )
}
