import { useMemo, useState, type ReactNode } from 'react'
import { apDungBang, demTheoChip, doiSapXep, type ChieuSapXep } from './bangDuLieu'

export type DataTableColumn<T> = {
  key: string
  label: string
  align?: 'num'
  sortable?: boolean
  render: (row: T) => ReactNode
  /** Giá trị để sắp xếp; thiếu thì coi là ô rỗng (xuống cuối). */
  sortValue?: (row: T) => string | number | null | undefined
}

export type DataTableChip<T> = { key: string; label: string; match: (row: T) => boolean }
export type DataTableBulkAction<T> = { label: string; onClick: (rows: T[]) => void }

export type DataTableProps<T> = {
  rows: readonly T[]
  columns: DataTableColumn<T>[]
  getRowId: (row: T) => string | number
  chips?: DataTableChip<T>[]
  timTheo?: (row: T) => string
  searchLabel?: string
  bulkActions?: DataTableBulkAction<T>[]
  /** Danh từ đếm trong "Đã chọn N …" và "1–11 trong 11 …". */
  noun?: string
  pageSize?: number
  rowLabel?: (row: T) => string
}

export function DataTable<T>({ rows, columns, getRowId, chips = [], timTheo, searchLabel = 'Tìm', bulkActions, noun = 'dòng', pageSize = 10, rowLabel }: DataTableProps<T>) {
  const [tuKhoa, setTuKhoa] = useState('')
  const [chip, setChip] = useState<string | null>(null)
  const [sapXep, setSapXep] = useState<{ cot: string; chieu: ChieuSapXep } | null>(null)
  const [trang, setTrang] = useState(1)
  const [chon, setChon] = useState<Set<string | number>>(new Set())

  // Số đếm của chip tính trên danh sách đã qua ô tìm.
  const timDuoc = useMemo(() => (timTheo && tuKhoa ? apDungBang(rows, { tuKhoa, timTheo }).hienThi : rows), [rows, tuKhoa, timTheo])
  const dem = useMemo(() => demTheoChip(timDuoc, Object.fromEntries(chips.map((c) => [c.key, c.match]))), [timDuoc, chips])
  const kq = apDungBang(rows, {
    tuKhoa, timTheo, loc: chips.find((c) => c.key === chip)?.match, sapXep, trang, coTrang: pageSize,
    layGiaTri: (d, cot) => columns.find((c) => c.key === cot)?.sortValue?.(d),
  })
  const daChon = rows.filter((r) => chon.has(getRowId(r)))
  const doiChon = (ids: (string | number)[], bat: boolean) => setChon((s) => { const n = new Set(s); ids.forEach((i) => (bat ? n.add(i) : n.delete(i))); return n })
  const tatCaTrang = kq.hienThi.length > 0 && kq.hienThi.every((r) => chon.has(getRowId(r)))

  return <div>
    {(timTheo || chips.length > 0) && <div className="table-toolbar">
      {timTheo && <label className="input-wrap"><span className="sr-only">{searchLabel}</span><input className="input" type="search" placeholder={`${searchLabel}…`} value={tuKhoa} onChange={(e) => { setTuKhoa(e.target.value); setTrang(1) }} /></label>}
      {chips.map((c) => <button key={c.key} type="button" className="chip" aria-pressed={chip === c.key} onClick={() => { setChip(chip === c.key ? null : c.key); setTrang(1) }}>{c.label}<span className="n">{dem[c.key]}</span></button>)}
    </div>}
    {bulkActions && daChon.length > 0 && <div className="bulkbar" role="status"><span>Đã chọn {daChon.length} {noun}</span>{bulkActions.map((a) => <button key={a.label} type="button" className="btn btn-ghost btn-sm" onClick={() => a.onClick(daChon)}>{a.label}</button>)}<button type="button" className="icon-btn sm push" aria-label="Bỏ chọn" onClick={() => setChon(new Set())}>×</button></div>}
    <div className="table-wrap"><table className="table">
      <thead><tr>
        {bulkActions && <th style={{ width: 44 }}><label className="check"><input type="checkbox" aria-label="Chọn tất cả" checked={tatCaTrang} onChange={(e) => doiChon(kq.hienThi.map(getRowId), e.target.checked)} /></label></th>}
        {columns.map((c) => <th key={c.key} className={c.align} aria-sort={c.sortable ? (sapXep?.cot === c.key ? sapXep.chieu : 'none') : undefined}>
          {c.sortable ? <button type="button" className="th-sort" onClick={() => { setSapXep(doiSapXep(sapXep, c.key)); setTrang(1) }}>{c.label}</button> : c.label}
        </th>)}
      </tr></thead>
      <tbody>{kq.hienThi.map((r) => {
        const id = getRowId(r)
        return <tr key={id} className={chon.has(id) ? 'is-selected' : undefined}>
          {bulkActions && <td><label className="check"><input type="checkbox" aria-label={`Chọn ${rowLabel?.(r) ?? id}`} checked={chon.has(id)} onChange={(e) => doiChon([id], e.target.checked)} /></label></td>}
          {columns.map((c) => <td key={c.key} className={c.align}>{c.render(r)}</td>)}
        </tr>
      })}</tbody>
    </table></div>
    <div className="pager"><span>{kq.tu}–{kq.den} trong {kq.tongSauLoc} {noun}</span><span className="push" />
      <button type="button" className="pg" aria-label="Trang trước" disabled={kq.trang <= 1} onClick={() => setTrang(kq.trang - 1)}>‹</button>
      {Array.from({ length: kq.soTrang }, (_, i) => i + 1).map((p) => <button key={p} type="button" className="pg" aria-current={p === kq.trang ? 'page' : undefined} onClick={() => setTrang(p)}>{p}</button>)}
      <button type="button" className="pg" aria-label="Trang sau" disabled={kq.trang >= kq.soTrang} onClick={() => setTrang(kq.trang + 1)}>›</button>
    </div>
  </div>
}
