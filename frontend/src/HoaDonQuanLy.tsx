import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ApiError, fetchHoaDonQuanLy, fetchKyThanhToan, fetchToaNha, type ThongTinHoaDonQuanLy, type ThongTinToaNha, type ThongTinKyThanhToan } from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { useDialogTrap } from './design/feedback/useDialogTrap'
import { ScreenHeader, ScreenNotice, ScreenSurface } from './design/layout/Screen'
import { SysLabel } from './design/core/SysLabel'
import { Button } from './design/core/Button'
import { bulkInvoice, type BulkResult } from './financeApi'

type Props = { token: string; mobile?: boolean; vaiTro?: string }

export type BoLocHoaDonQuanLy = {
  toaNhaId: number | null
  trangThai: string
}

export function mapTrangThaiHoaDon(trangThai: string): { nhan: string; tone: 'neutral' | 'waiting' | 'done' | 'urgent' | 'strong' } {
  switch (trangThai) {
    case 'NHAP':
      return { nhan: 'Bản nháp', tone: 'neutral' }
    case 'DA_PHAT_HANH':
      return { nhan: 'Đã phát hành', tone: 'waiting' }
    case 'DA_THU_MOT_PHAN':
      return { nhan: 'Thu một phần', tone: 'waiting' }
    case 'DA_THANH_TOAN':
      return { nhan: 'Đã thanh toán', tone: 'done' }
    case 'QUA_HAN':
      return { nhan: 'Quá hạn', tone: 'urgent' }
    case 'DA_HUY':
      return { nhan: 'Đã huỷ', tone: 'neutral' }
    default:
      return { nhan: trangThai, tone: 'neutral' }
  }
}

/** FR-INV-02 keeps the manager invoice worklist query shareable from the operational dashboard. */
export function layBoLocHoaDonQuanLyTuUrl(url: string | URL): BoLocHoaDonQuanLy {
  const searchParams = new URL(url, 'http://miniapart.local').searchParams
  return {
    toaNhaId: soNguyenDuong(searchParams.get('toaNhaId')),
    trangThai: searchParams.get('trangThai') || 'NO_QUA_HAN',
  }
}

export default function HoaDonQuanLy({ token, mobile = false }: Props): React.ReactElement {
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [boLoc, setBoLoc] = useState<BoLocHoaDonQuanLy>(() => (
    typeof window === 'undefined' ? { toaNhaId: null, trangThai: 'NO_QUA_HAN' } : layBoLocHoaDonQuanLyTuUrl(window.location.href)
  ))
  const [hoaDons, setHoaDons] = useState<ThongTinHoaDonQuanLy[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [loiKy, setLoiKy] = useState<string | null>(null)
  const [ky, setKy] = useState<ThongTinKyThanhToan[]>([])
  const [kyId, setKyId] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<BulkResult | null>(null)
  const [xacNhanPhatHanh, setXacNhanPhatHanh] = useState(false)
  const [reload, setReload] = useState(0)
  const variant = mobile ? 'mobile' : 'desktop'

  useEffect(() => {
    let mounted = true
    fetchToaNha(token)
      .then((data) => {
        if (!mounted) return
        setToaNha(data)
        setBoLoc((current) => ({ ...current, toaNhaId: current.toaNhaId ?? data[0]?.id ?? null }))
      })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải danh sách toà nhà.')
      })
    return () => { mounted = false }
  }, [token])

  useEffect(() => {
    if (boLoc.toaNhaId === null) { setKy([]); setKyId(null); return }
    let active = true
    setKy([]); setKyId(null); setResult(null); setLoiKy(null)
    fetchKyThanhToan(token, boLoc.toaNhaId).then((data) => {
      if (!active) return
      setKy(data); setKyId(null)
    }).catch((cause: unknown) => { if (active) setLoiKy(cause instanceof Error ? cause.message : 'Không thể tải kỳ thanh toán.') })
    return () => { active = false }
  }, [token, boLoc.toaNhaId])

  useEffect(() => {
    if (typeof window === 'undefined' || boLoc.toaNhaId === null) return
    const query = new URLSearchParams({ toaNhaId: String(boLoc.toaNhaId), trangThai: boLoc.trangThai })
    window.history.replaceState({}, '', `/hoa-don?${query.toString()}`)
  }, [boLoc])

  useEffect(() => {
    if (boLoc.toaNhaId === null) {
      setHoaDons([])
      setDangTai(false)
      return undefined
    }
    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchHoaDonQuanLy(token, boLoc.toaNhaId, boLoc.trangThai)
      .then((data) => { if (mounted) setHoaDons(data) })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải danh sách hoá đơn.')
      })
      .finally(() => { if (mounted) setDangTai(false) })
    return () => { mounted = false }
  }, [boLoc.toaNhaId, boLoc.trangThai, token, reload])

  async function runBulk(action: 'tao-hang-loat' | 'phat-hanh-hang-loat') {
    if (busy || boLoc.toaNhaId === null || kyId === null) return
    setBusy(true); setLoi(null); setResult(null)
    try { setResult(await bulkInvoice(token, boLoc.toaNhaId, kyId, action)); setBoLoc((value) => ({ ...value, trangThai: action === 'tao-hang-loat' ? 'NHAP' : '' })); setReload((value) => value + 1) }
    catch (cause) { setLoi(cause instanceof Error ? cause.message : 'Không thể xử lý hoá đơn hàng loạt.') }
    finally { setBusy(false) }
  }

  const visible = kyId === null ? hoaDons : hoaDons.filter((value) => value.kyId === kyId)

  const tieuDeBoLoc = useMemo(() => {
    if (boLoc.trangThai === 'NO_QUA_HAN') return 'Nợ quá hạn'
    if (!boLoc.trangThai) return 'Tất cả trạng thái'
    return mapTrangThaiHoaDon(boLoc.trangThai).nhan
  }, [boLoc.trangThai])

  return (
    <ScreenSurface data-testid="manager-invoice-screen" data-layout-variant={variant} aria-labelledby="manager-invoice-title">
      <ScreenHeader>
        <SysLabel>QUẢN LÝ THU TIỀN & HOÁ ĐƠN</SysLabel>
        <h3 id="manager-invoice-title" style={{ margin: '8px 0 0' }}>Danh sách hoá đơn quản lý</h3>
        <p style={{ margin: '8px 0 0', color: 'var(--ma-text-secondary)', lineHeight: 1.55 }}>Danh sách hoá đơn theo toà nhà và trạng thái vận hành.</p>
      </ScreenHeader>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          alignItems: 'end',
          margin: '16px 0',
        }}
      >
        <label style={styleField}>Toà nhà
          <select
            data-invoice-building-select
            value={boLoc.toaNhaId ?? ''}
            onChange={(event) => setBoLoc((current) => ({ ...current, toaNhaId: soNguyenDuong(event.target.value) }))}
            style={styleInput}
          >
            <option value="">Chọn toà nhà</option>
            {toaNha.map((item) => <option key={item.id} value={item.id}>{item.ten}</option>)}
          </select>
        </label>

        <label style={styleField}>Trạng thái
          <select aria-label="Lọc trạng thái hoá đơn" value={boLoc.trangThai} onChange={(event) => setBoLoc((value) => ({ ...value, trangThai: event.target.value }))} style={styleInput}>
            <option value="">Tất cả trạng thái</option>
            <option value="NO_QUA_HAN">Nợ quá hạn</option>
            <option value="NHAP">Bản nháp</option>
            <option value="DA_PHAT_HANH">Đã phát hành</option>
            <option value="DA_THU_MOT_PHAN">Đã thu một phần</option>
            <option value="DA_THANH_TOAN">Đã thanh toán</option>
            <option value="QUA_HAN">Quá hạn</option>
            <option value="DA_HUY">Đã huỷ</option>
          </select>
        </label>

        <label style={styleField}>Kỳ thanh toán
          <select aria-label="Lọc kỳ hoá đơn" value={kyId ?? ''} onChange={(event) => { setKyId(event.target.value ? Number(event.target.value) : null); setResult(null) }} style={styleInput}>
            <option value="">Tất cả kỳ</option>
            {ky.map((value) => <option key={value.id} value={value.id}>{value.thang}/{value.nam} · {value.trangThai}</option>)}
          </select>
        </label>
      </div>

      {loiKy ? <p role="status">{loiKy}</p> : null}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button
            blocked={busy || kyId === null}
            blockedReason={busy ? 'Đang xử lý hoá đơn hàng loạt…' : kyId === null ? 'Cần chọn kỳ thanh toán' : undefined}
            onClick={() => void runBulk('tao-hang-loat')}
          >
            Tạo hoá đơn nháp hàng loạt
          </Button>
          <Button
            variant="secondary"
            blocked={busy || kyId === null}
            blockedReason={busy ? 'Đang xử lý hoá đơn hàng loạt…' : kyId === null ? 'Cần chọn kỳ thanh toán' : undefined}
            onClick={() => setXacNhanPhatHanh(true)}
          >
            Phát hành hoá đơn trong kỳ
          </Button>
        </div>
        {busy ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ma-waiting)' }}>
            ⏳ Hệ thống đang xử lý hoá đơn hàng loạt, vui lòng chờ…
          </p>
        ) : kyId === null && boLoc.toaNhaId !== null ? (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ma-text-secondary)' }}>
            💡 Chọn một kỳ thanh toán cụ thể để thực hiện tạo nháp hoặc phát hành hoá đơn hàng loạt.
          </p>
        ) : null}
      </div>

      {xacNhanPhatHanh && (
        <XacNhanPhatHanhModal
          kyTen={ky.find((k) => k.id === kyId) ? `${ky.find((k) => k.id === kyId)!.thang}/${ky.find((k) => k.id === kyId)!.nam}` : ''}
          onClose={() => setXacNhanPhatHanh(false)}
          onConfirm={() => {
            setXacNhanPhatHanh(false)
            void runBulk('phat-hanh-hang-loat')
          }}
        />
      )}

      {result ? (
        <div
          role="status"
          style={{
            padding: '14px 18px',
            background: 'var(--ma-bg-sunken)',
            border: '1px solid var(--ma-border-default)',
            borderRadius: 'var(--ma-radius)',
            display: 'grid',
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ma-done-text)' }}>
            ✓ Đã xử lý: Tạo mới {result.soHoaDonTaoMoi ?? 0} hoá đơn · Phát hành {result.soHoaDonDaPhatHanh ?? 0} hoá đơn · Đã có sẵn: {result.soHoaDonDaTonTai ?? result.soHoaDonDaOTrangThaiKhac ?? 0}
          </div>
          {result.lyDoBoQua && result.lyDoBoQua.length > 0 && (
            <details style={{ fontSize: 13, color: 'var(--ma-text-secondary)' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>
                Xem chi tiết {result.lyDoBoQua.length} phòng được bỏ qua
              </summary>
              <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
                {result.lyDoBoQua.map((item, index) => (
                  <li key={`${item.phongId}-${index}`} style={{ marginTop: 3 }}>
                    Phòng #{item.phongId}: {item.moTa}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      ) : null}

      <p data-invoice-active-filter style={styleActiveFilter}>Đang lọc: {tieuDeBoLoc}</p>
      {dangTai ? <p aria-live="polite">Đang tải danh sách hoá đơn…</p>
        : loi ? <div role="alert"><ScreenNotice tone="urgent">{loi}</ScreenNotice></div>
          : boLoc.toaNhaId === null ? <EmptyState title="Chọn một toà nhà để xem hoá đơn." />
            : visible.length === 0 ? <EmptyState title="Không có hoá đơn phù hợp bộ lọc." />
              : <div data-invoice-list={variant} style={styleList}>{visible.map((hoaDon) => <HoaDonQuanLyRow key={hoaDon.hoaDonId} toaNhaId={boLoc.toaNhaId!} hoaDon={hoaDon} />)}</div>}
    </ScreenSurface>
  )
}

function HoaDonQuanLyRow({ toaNhaId, hoaDon }: { toaNhaId: number; hoaDon: ThongTinHoaDonQuanLy }): React.ReactElement {
  const href = hoaDon.kyId === null
    ? null
    : `/hoa-don?toaNhaId=${toaNhaId}&kyId=${hoaDon.kyId}&hoaDonId=${hoaDon.hoaDonId}`
  const status = mapTrangThaiHoaDon(hoaDon.trangThai)
  return (
    <article data-invoice-row={hoaDon.hoaDonId} style={styleRow}>
      <div style={styleRowMain}>
        {href ? <a data-invoice-detail-link href={href} style={styleLink}>{hoaDon.maHoaDon}</a> : <strong data-invoice-without-period>{hoaDon.maHoaDon}</strong>}
        <strong>Phòng {hoaDon.soPhong} · {hoaDon.nguoiThue}</strong>
        <span style={styleMuted}>Hạn thanh toán: {dinhDangNgayIso(hoaDon.hanThanhToan)}</span>
        {href ? null : <span style={styleMuted}>Hoá đơn quyết toán không thuộc kỳ thanh toán.</span>}
      </div>
      <StatusTag tone={status.tone}>{status.nhan}</StatusTag>
      <div style={styleMoney}>
        <span>Tổng: {dinhDangTien(hoaDon.tongTien)} ₫</span>
        <strong style={{ color: Number(hoaDon.conLai) > 0 ? 'var(--ma-urgent)' : 'var(--ma-done-text)' }}>
          Còn lại: {dinhDangTien(hoaDon.conLai)} ₫
        </strong>
      </div>
      {href ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <a
            href={href}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--ma-radius)',
              background: 'var(--ma-bg-card)',
              color: 'var(--ma-brand-accent)',
              border: '1px solid var(--ma-border-strong)',
              fontWeight: 600,
              fontSize: 12.5,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            Chi tiết →
          </a>
        </div>
      ) : null}
    </article>
  )
}

function soNguyenDuong(value: string | null): number | null {
  if (value === null || !/^[1-9]\d*$/.test(value)) return null
  const parsed = Number(value)
  return Number.isSafeInteger(parsed) ? parsed : null
}

const styleList: CSSProperties = { display: 'grid', gap: 12 }
const styleRow: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 14rem), 1fr))',
  alignItems: 'center',
  gap: 16,
  padding: '16px 20px',
  border: '1px solid var(--ma-border-default)',
  borderRadius: 'var(--ma-radius-md)',
  boxShadow: 'var(--ma-shadow-sm)',
  background: 'var(--ma-bg-card)',
  minWidth: 0,
  transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
}
const styleRowMain: CSSProperties = { display: 'grid', gap: 4, minWidth: 0, overflowWrap: 'anywhere' }
const styleMoney: CSSProperties = {
  display: 'grid',
  gap: 4,
  justifyItems: 'end',
  color: 'var(--ma-text-secondary)',
  textAlign: 'right',
  fontFamily: 'var(--ma-font-mono)',
  fontVariantNumeric: 'tabular-nums',
  fontSize: 13,
}
const styleMuted: CSSProperties = { color: 'var(--ma-text-secondary)', fontSize: 13 }
const styleField: CSSProperties = { display: 'grid', gap: 6, width: '100%', fontSize: 13, fontWeight: 600, color: 'var(--ma-text-secondary)' }
const styleInput: CSSProperties = {
  minHeight: 'var(--ma-hit-mobile)',
  padding: '10px 14px',
  border: '1px solid var(--ma-border-strong)',
  borderRadius: 'var(--ma-radius)',
  background: 'var(--ma-bg-card)',
  color: 'var(--ma-text-primary)',
  font: 'inherit',
  boxShadow: 'var(--ma-shadow-sm)',
}
const styleLink: CSSProperties = {
  color: 'var(--ma-brand-accent)',
  fontFamily: 'var(--ma-font-mono)',
  fontWeight: 700,
  textDecoration: 'none',
  fontSize: 14,
}
const styleActiveFilter: CSSProperties = {
  margin: 0,
  padding: '10px 14px',
  border: '1px solid var(--ma-border-default)',
  borderRadius: 'var(--ma-radius)',
  background: 'var(--ma-bg-sunken)',
  color: 'var(--ma-text-primary)',
  fontWeight: 600,
  fontSize: 13.5,
}

function XacNhanPhatHanhModal({
  kyTen,
  onClose,
  onConfirm,
}: {
  kyTen: string
  onClose: () => void
  onConfirm: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogTrap({ open: true, dialogRef, onClose })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-phat-hanh-title"
        tabIndex={-1}
        style={{
          background: 'var(--ma-bg-card)',
          borderRadius: 'var(--ma-radius-md)',
          border: '1px solid var(--ma-border-default)',
          boxShadow: 'var(--ma-shadow-lg)',
          padding: '24px 28px',
          maxWidth: 480,
          width: '100%',
          display: 'grid',
          gap: 16,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h4 id="confirm-phat-hanh-title" style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>
          Xác nhận phát hành hoá đơn kỳ {kyTen}?
        </h4>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ma-text-secondary)', lineHeight: 1.55 }}>
          Toàn bộ hoá đơn dự thảo trong kỳ của toà nhà sẽ được chuyển sang trạng thái <strong>ĐÃ PHÁT HÀNH</strong>. Khách thuê sẽ nhìn thấy hoá đơn và có thể tiến hành thanh toán.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onClose} style={{ minHeight: 40 }}>
            Để sau
          </Button>
          <Button
            variant="primary"
            onClick={onConfirm}
            style={{ minHeight: 40 }}
          >
            Xác nhận phát hành
          </Button>
        </div>
      </div>
    </div>
  )
}
