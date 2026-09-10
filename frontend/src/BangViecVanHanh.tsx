import { useEffect, useState } from 'react'
import { ApiError, fetchBangViecVanHanh, fetchToaNha, type ThongTinBangViecVanHanh as BangViecData, type ThongTinToaNha } from './api'
import { EmptyState } from './design/feedback/EmptyState'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { ScreenHeader, ScreenNotice, ScreenSurface } from './design/layout/Screen'

type Props = { token: string; mobile?: boolean }

/** FR-NTF-01 shows the server-scoped operational workboard; status text carries urgency beyond color. */
export function BangViecVanHanh({ token, mobile = false }: Props): React.ReactElement {
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [toaNhaId, setToaNhaId] = useState<number | null>(() => docToaNhaIdTuUrl())
  const [bangViec, setBangViec] = useState<BangViecData | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    fetchToaNha(token)
      .then((items) => {
        if (!mounted) return
        setToaNha(items)
        setToaNhaId((current) => current ?? items[0]?.id ?? null)
      })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải danh sách toà nhà.')
      })
    return () => { mounted = false }
  }, [token])

  useEffect(() => {
    if (toaNhaId === null) {
      setDangTai(false)
      return undefined
    }
    const query = new URLSearchParams(window.location.search)
    query.set('toaNhaId', String(toaNhaId))
    window.history.replaceState({}, '', `${window.location.pathname}?${query.toString()}`)

    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchBangViecVanHanh(token, toaNhaId)
      .then((data) => { if (mounted) setBangViec(data) })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải bảng việc vận hành.')
      })
      .finally(() => { if (mounted) setDangTai(false) })
    return () => { mounted = false }
  }, [token, toaNhaId])

  return (
    <ScreenSurface data-testid="operational-dashboard-screen" data-layout-variant={mobile ? 'mobile' : 'desktop'} aria-labelledby="operational-dashboard-title">
      <ScreenHeader>
        <SysLabel>FR-NTF-01 · BR-14</SysLabel>
        <h3 id="operational-dashboard-title" style={{ margin: '8px 0 0' }}>Bảng việc vận hành</h3>
        <p style={{ margin: '8px 0 0', color: 'var(--ma-text-secondary)' }}>Các việc cần xử lý theo đúng phạm vi toà nhà được phân quyền.</p>
      </ScreenHeader>

      {toaNha.length > 0 ? (
        <label style={{ display: 'grid', gap: 6, maxWidth: 420 }}>
          <span>Toà nhà</span>
          <select value={toaNhaId ?? ''} onChange={(event) => setToaNhaId(Number(event.target.value))} style={styleInput}>
            {toaNha.map((item) => <option key={item.id} value={item.id}>{item.ten}</option>)}
          </select>
        </label>
      ) : null}

      {dangTai ? <p aria-live="polite">Đang tải bảng việc vận hành…</p>
        : loi ? <div role="alert"><ScreenNotice tone="urgent">{loi}</ScreenNotice></div>
          : !bangViec ? <EmptyState title="Chưa có toà nhà được phân quyền." body="Bảng việc chỉ hiển thị trong phạm vi được máy chủ cấp quyền." />
            : <section aria-label="Các nhóm việc vận hành" style={styleGrid}>
              {bangViec.nhomViec.map((group) => <NhomViec key={group.ma} group={group} />)}
            </section>}
    </ScreenSurface>
  )
}

function NhomViec({ group }: { group: BangViecData['nhomViec'][number] }): React.ReactElement {
  const daXong = group.trangThai === 'DA_XONG'
  const chuaSanSang = group.trangThai === 'CHUA_SAN_SANG'
  return (
    <article data-dashboard-group={group.ma} style={styleCard} aria-label={`${group.tieuDe}: ${group.tenTrangThai}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <SysLabel>{group.ma}</SysLabel>
          <h4 style={{ margin: 0, fontSize: 18 }}>{group.tieuDe}</h4>
        </div>
        <strong style={{ fontFamily: 'var(--ma-font-mono)', fontSize: 28 }} aria-label={group.soLuong === null ? 'Chưa có nguồn dữ liệu' : `Số lượng ${group.soLuong}`}>
          {group.soLuong ?? '—'}
        </strong>
      </div>
      <StatusTag tone={chuaSanSang ? 'waiting' : daXong ? 'done' : 'urgent'}>{group.tenTrangThai}</StatusTag>
      {group.khanCap && !daXong ? <p style={styleUrgentText}>Ưu tiên xử lý ngay.</p> : null}
      {group.lienKet ? <a data-dashboard-link href={group.lienKet} style={styleLink}>{chuaSanSang ? 'Mở khu vực an toàn' : daXong ? 'Xem lại bộ lọc' : 'Mở danh sách đã lọc'}</a> : null}
    </article>
  )
}

function docToaNhaIdTuUrl(): number | null {
  const value = new URLSearchParams(window.location.search).get('toaNhaId')
  if (!value || !/^\d+$/.test(value)) return null
  return Number(value)
}

const styleGrid: React.CSSProperties = { display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))' }
const styleCard: React.CSSProperties = { display: 'grid', gap: 14, padding: 18, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-card)', minHeight: 180 }
const styleInput: React.CSSProperties = { minHeight: 'var(--ma-hit-mobile)', padding: '0 12px', border: '1px solid var(--ma-border-strong)', background: 'var(--ma-bg-card)', color: 'var(--ma-text-primary)', font: 'var(--ma-text-body)' }
const styleLink: React.CSSProperties = { color: 'var(--ma-text-primary)', fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: 3 }
const styleUrgentText: React.CSSProperties = { margin: 0, color: 'var(--ma-text-primary)', fontWeight: 700 }
