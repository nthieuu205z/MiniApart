import { useRef, useState } from 'react'
import type * as React from 'react'
import { Button } from '../core/Button'
import { useDialogTrap } from '../feedback/useDialogTrap'
import { linkZalo, tinNhacNo } from '../../tienTheoNguoi'
import type { NhomNo } from '../../nhomNoTheoNguoi'

/** Ngăn nhắc nợ (client, không API): tin soạn sẵn sửa được, chép tin, mở Zalo. App chưa tự gửi tin — nói thẳng dưới nút. */
export function NganNhacNo(p: { nhom: NhomNo; sdt?: string | null; hanTra: string; onDong: () => void }): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null)
  useDialogTrap({ open: true, dialogRef: ref, onClose: p.onDong })
  const [tin, setTin] = useState(() => tinNhacNo(p.nhom, p.hanTra))
  const [daChep, setDaChep] = useState(false)
  const zalo = linkZalo(p.sdt)
  const chep = async () => { try { await navigator.clipboard.writeText(tin); setDaChep(true) } catch { setDaChep(false) } }
  return (
    <div className="ma-ngan" onClick={(e) => { if (e.target === e.currentTarget) p.onDong() }}>
      <div ref={ref} className="ma-ngan-hop" role="dialog" aria-modal="true" aria-labelledby="ngan-nhac-td" tabIndex={-1}>
        <h2 id="ngan-nhac-td">Nhắc {p.nhom.hoTen}</h2>
        <textarea aria-label="Tin nhắc" value={tin} onChange={(e) => setTin(e.target.value)} />
        <div className="ma-ngan-nut">
          <Button variant="secondary" onClick={chep}>{daChep ? 'Đã chép' : 'Chép tin'}</Button>
          {zalo ? <a className="btn btn-primary" href={zalo} target="_blank" rel="noopener">Mở Zalo</a> : null}
          <Button variant="text" onClick={p.onDong}>Đóng</Button>
        </div>
        <p className="ma-ngan-ghichu">App chưa tự gửi tin. Mở Zalo rồi dán tin.</p>
      </div>
    </div>
  )
}
