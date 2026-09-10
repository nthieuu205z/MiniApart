import { useEffect, useState, type CSSProperties } from 'react'
import {
  ApiError,
  fetchCongNoBaoCao,
  fetchToaNha,
  type ThongTinKhoanNoBaoCao,
  type ThongTinToaNha,
  type ThongTinCongNoBaoCao,
} from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { EmptyState } from './design/feedback/EmptyState'
import { ScreenHeader, ScreenNotice, ScreenSurface, TableCell, TableFrame, TableHeadCell } from './design/layout/Screen'
import { SysLabel } from './design/core/SysLabel'

type Props = { token: string; mobile?: boolean }

export type BoLocCongNo = { toaNhaId: number | null }

/** FR-RPT-02 keeps the owner debt filter shareable without allowing a client-side scope override. */
export function layBoLocCongNoTuUrl(url: string | URL): BoLocCongNo {
  const searchParams = new URL(url, 'http://miniapart.local').searchParams
  const raw = searchParams.get('toaNhaId')
  if (raw === null || !/^[1-9]\d*$/.test(raw)) return { toaNhaId: null }
  const toaNhaId = Number(raw)
  return Number.isSafeInteger(toaNhaId) ? { toaNhaId } : { toaNhaId: null }
}

/** FR-RPT-02/FR-RPT-03 renders the server-sorted debt report and exact invoice drill-down links. */
export default function CongNoBaoCao({ token, mobile = false }: Props): React.ReactElement {
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [boLoc, setBoLoc] = useState<BoLocCongNo>(() => (
    typeof window === 'undefined' ? { toaNhaId: null } : layBoLocCongNoTuUrl(window.location.href)
  ))
  const [baoCao, setBaoCao] = useState<ThongTinCongNoBaoCao | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const variant = mobile ? 'mobile' : 'desktop'

  useEffect(() => {
    let mounted = true
    fetchToaNha(token)
      .then((items) => {
        if (mounted) setToaNha(items)
      })
      .catch((reason: unknown) => {
        if (mounted) setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải danh sách toà nhà.')
      })
    return () => { mounted = false }
  }, [token])

  useEffect(() => {
    const query = new URLSearchParams()
    if (boLoc.toaNhaId !== null) query.set('toaNhaId', String(boLoc.toaNhaId))
    const queryString = query.toString()
    window.history.replaceState({}, '', queryString ? `/cong-no?${queryString}` : '/cong-no')

    let mounted = true
    setDangTai(true)
    setLoi(null)
    fetchCongNoBaoCao(token, boLoc.toaNhaId)
      .then((data) => {
        if (mounted) setBaoCao(data)
      })
      .catch((reason: unknown) => {
        if (mounted) {
          setBaoCao(null)
          setLoi(reason instanceof ApiError ? reason.message : 'Không thể tải báo cáo công nợ.')
        }
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })
    return () => { mounted = false }
  }, [boLoc.toaNhaId, token])

  useEffect(() => {
    function docLaiBoLocTuLichSu() {
      setBoLoc(layBoLocCongNoTuUrl(window.location.href))
    }

    window.addEventListener('popstate', docLaiBoLocTuLichSu)
    return () => window.removeEventListener('popstate', docLaiBoLocTuLichSu)
  }, [])

  if (dangTai && !baoCao) {
    return <ScreenSurface data-testid="debt-report-screen" data-layout-variant={variant} aria-busy="true" aria-live="polite">Đang tải báo cáo công nợ…</ScreenSurface>
  }
  if (loi && !baoCao) {
    return (
      <ScreenSurface data-testid="debt-report-screen" data-layout-variant={variant} role="alert">
        <SysLabel>FR-RPT-02 · FR-RPT-03</SysLabel>
        <ScreenNotice tone="urgent">{loi}</ScreenNotice>
      </ScreenSurface>
    )
  }
  if (!baoCao) {
    return <ScreenSurface data-testid="debt-report-screen" data-layout-variant={variant}><EmptyState title="Chưa có báo cáo công nợ để hiển thị." /></ScreenSurface>
  }

  return (
    <ScreenSurface data-testid="debt-report-screen" data-layout-variant={variant} aria-labelledby="debt-report-title">
      <ScreenHeader>
        <SysLabel>FR-RPT-02 · FR-RPT-03</SysLabel>
        <h3 id="debt-report-title" style={{ margin: '8px 0 0' }}>Báo cáo công nợ</h3>
        <p style={styleMuted}>Nợ được đọc từ sổ thanh toán tại thời điểm xem và đã sắp theo số ngày quá hạn từ cao xuống thấp.</p>
      </ScreenHeader>

      <label style={styleField}>
        <span>Toà nhà</span>
        <select
          aria-label="Lọc công nợ theo toà nhà"
          value={boLoc.toaNhaId === null ? '' : String(boLoc.toaNhaId)}
          onChange={(event) => setBoLoc({ toaNhaId: event.target.value ? Number(event.target.value) : null })}
          style={styleInput}
        >
          <option value="">Tất cả toà được phân quyền</option>
          {toaNha.map((item) => <option key={item.id} value={item.id}>{item.ten}</option>)}
        </select>
      </label>

      {dangTai ? <ScreenNotice live>Đang cập nhật báo cáo công nợ…</ScreenNotice> : null}
      {loi ? <ScreenNotice tone="urgent">{loi}</ScreenNotice> : null}
      {baoCao.congNo.length === 0 ? <EmptyState title="Không có hoá đơn còn nợ trong phạm vi này." /> : null}
      {baoCao.congNo.length > 0 && mobile ? <DanhSachNoMobile congNo={baoCao.congNo} /> : null}
      {baoCao.congNo.length > 0 && !mobile ? <DanhSachNoDesktop congNo={baoCao.congNo} /> : null}
      <p style={{ ...styleMuted, margin: 0 }}>Tính lúc {baoCao.tinhLuc}. Bấm mã hoá đơn để đối chiếu chi tiết.</p>
    </ScreenSurface>
  )
}

function DanhSachNoDesktop({ congNo }: { congNo: ThongTinKhoanNoBaoCao[] }): React.ReactElement {
  return (
    <div data-debt-list aria-label="Danh sách công nợ, sắp xếp từ nợ quá hạn lâu nhất" style={styleTableWrap}>
      <TableFrame minWidth={900}>
        <thead>
          <tr>
            <TableHeadCell>Toà / phòng</TableHeadCell>
            <TableHeadCell>Người thuê</TableHeadCell>
            <TableHeadCell>Hoá đơn</TableHeadCell>
            <TableHeadCell>Hạn thanh toán</TableHeadCell>
            <TableHeadCell align="right">Quá hạn</TableHeadCell>
            <TableHeadCell align="right">Còn nợ</TableHeadCell>
          </tr>
        </thead>
        <tbody>{congNo.map((no) => <DongNo key={no.hoaDonId} no={no} />)}</tbody>
      </TableFrame>
    </div>
  )
}

function DanhSachNoMobile({ congNo }: { congNo: ThongTinKhoanNoBaoCao[] }): React.ReactElement {
  return (
    <div data-debt-list aria-label="Danh sách công nợ, sắp xếp từ nợ quá hạn lâu nhất" style={styleCards}>
      {congNo.map((no) => (
        <article key={no.hoaDonId} data-debt-row={no.hoaDonId} style={styleCard}>
          <div style={styleCardHeading}>
            <a href={`/hoa-don?hoaDonId=${no.hoaDonId}`} style={styleLink}>{no.maHoaDon}</a>
            <strong>{dinhDangTien(no.conLai)} ₫</strong>
          </div>
          <span>{no.tenToaNha} · Phòng {no.soPhong}</span>
          <span style={styleMuted}>{no.hoTenNguoiThue}</span>
          <span style={styleMuted}>Hạn {dinhDangNgayIso(no.hanThanhToan)} · {no.soNgayQuaHan} ngày quá hạn</span>
        </article>
      ))}
    </div>
  )
}

function DongNo({ no }: { no: ThongTinKhoanNoBaoCao }): React.ReactElement {
  return (
    <tr data-debt-row={no.hoaDonId}>
      <TableCell header>{no.tenToaNha} · {no.soPhong}</TableCell>
      <TableCell>{no.hoTenNguoiThue}</TableCell>
      <TableCell><a href={`/hoa-don?hoaDonId=${no.hoaDonId}`} style={styleLink}>{no.maHoaDon}</a></TableCell>
      <TableCell>{dinhDangNgayIso(no.hanThanhToan)}</TableCell>
      <TableCell align="right">{no.soNgayQuaHan} ngày</TableCell>
      <TableCell align="right"><strong>{dinhDangTien(no.conLai)} ₫</strong></TableCell>
    </tr>
  )
}

const styleMuted: CSSProperties = { margin: '8px 0 0', color: 'var(--ma-text-secondary)', lineHeight: 1.6 }
const styleField: CSSProperties = { display: 'grid', gap: 6, maxWidth: 420 }
const styleInput: CSSProperties = { width: '100%', minHeight: 'var(--ma-hit-mobile)', padding: '0 10px', border: '1px solid var(--ma-border-strong)', borderRadius: 0, background: 'var(--ma-bg-card)', color: 'var(--ma-text-primary)', font: 'var(--ma-text-body)' }
const styleTableWrap: CSSProperties = { minWidth: 0, overflowX: 'auto' }
const styleCards: CSSProperties = { display: 'grid', gap: 10 }
const styleCard: CSSProperties = { display: 'grid', gap: 7, minWidth: 0, padding: 16, border: '1px solid var(--ma-border-default)', background: 'var(--ma-bg-card)' }
const styleCardHeading: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, minWidth: 0 }
const styleLink: CSSProperties = { color: 'var(--ma-text-primary)', fontWeight: 800, textDecoration: 'underline', textUnderlineOffset: 3, overflowWrap: 'anywhere' }
