import { useEffect, useState, useRef } from 'react'
import {
  ApiError,
  fetchDashboardQuanLy,
  fetchToaNha,
  capNhatCanhBaoTieuThu,
  capNhatTrangThaiLichHen,
  fetchKyThanhToan,
  ghiChiSoDungChung,
  type ThongTinDashboardQuanLy as DashboardData,
  type ThongTinToaNha,
} from './api'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { Card } from './design/layout/Card'
import { ScreenNotice } from './design/layout/Screen'
import { EmptyState } from './design/feedback/EmptyState'
import { useDialogTrap } from './design/feedback/useDialogTrap'
import { BangViecVanHanh } from './BangViecVanHanh'

type Props = {
  token: string
  mobile?: boolean
}

export function QuanLyDashboard({ token, mobile = false }: Props): React.ReactElement {
  const [toaNhaList, setToaNhaList] = useState<ThongTinToaNha[]>([])
  const [toaNhaId, setToaNhaId] = useState<number | null>(() => docToaNhaIdTuUrl())
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [soLanTaiLai, setSoLanTaiLai] = useState(0)
  const [ngayChot, setNgayChot] = useState<string | null>(null)
  const [loiLichHen, setLoiLichHen] = useState<string | null>(null)

  // Dialog xử lý cảnh báo
  const [canhBaoDangChon, setCanhBaoDangChon] = useState<DashboardData['canhBaoDienNuoc'][number] | null>(null)
  const [trangThaiMoi, setTrangThaiMoi] = useState<string>('DANG_KIEM_TRA')
  const [ghiChuXuLy, setGhiChuXuLy] = useState('')
  const [dangLuuCanhBao, setDangLuuCanhBao] = useState(false)
  const [loiCanhBao, setLoiCanhBao] = useState<string | null>(null)

  const dialogRef = useRef<HTMLDivElement>(null)
  useDialogTrap({ open: Boolean(canhBaoDangChon), dialogRef, onClose: () => setCanhBaoDangChon(null) })

  // Dialog ghi chỉ số công tơ dùng chung
  const [diemDoGhiSo, setDiemDoGhiSo] = useState<DashboardData['congToChuaGhi']['danhSachChuaGhi'][number] | null>(null)
  const [chiSoDauInput, setChiSoDauInput] = useState('')
  const [chiSoCuoiInput, setChiSoCuoiInput] = useState('')
  const [coThayCongTo, setCoThayCongTo] = useState(false)
  const [chiSoCuoiCongToCuInput, setChiSoCuoiCongToCuInput] = useState('')
  const [chiSoDauCongToMoiInput, setChiSoDauCongToMoiInput] = useState('')
  const [ghiChuGhiSo, setGhiChuGhiSo] = useState('')
  const [dangLuuGhiSo, setDangLuuGhiSo] = useState(false)
  const [loiGhiSo, setLoiGhiSo] = useState<string | null>(null)
  const [thongBaoThanhCong, setThongBaoThanhCong] = useState<string | null>(null)

  const ghiSoDialogRef = useRef<HTMLDivElement>(null)
  useDialogTrap({ open: Boolean(diemDoGhiSo), dialogRef: ghiSoDialogRef, onClose: () => setDiemDoGhiSo(null) })

  // Load building list assigned to this manager
  useEffect(() => {
    let mounted = true
    fetchToaNha(token)
      .then((items) => {
        if (!mounted) return
        setToaNhaList(items)
      })
      .catch((err: unknown) => {
        if (mounted) setLoi(err instanceof ApiError ? err.message : 'Không thể tải danh sách toà nhà.')
      })
    return () => {
      mounted = false
    }
  }, [token])

  // Load Manager Dashboard with anti-stale protection
  useEffect(() => {
    let mounted = true
    setDangTai(true)
    setLoi(null)
    setDashboard(null)

    const query = new URLSearchParams(window.location.search)
    if (toaNhaId) {
      query.set('toaNhaId', String(toaNhaId))
    } else {
      query.delete('toaNhaId')
    }
    window.history.replaceState({}, '', `${window.location.pathname}?${query.toString()}`)

    fetchDashboardQuanLy(token, toaNhaId)
      .then((data) => {
        if (mounted) setDashboard(data)
      })
      .catch((err: unknown) => {
        if (mounted) setLoi(err instanceof ApiError ? err.message : 'Không thể tải dashboard vận hành.')
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })

    return () => {
      mounted = false
    }
  }, [token, toaNhaId, soLanTaiLai])

  // Ngày chốt số của kỳ đang mở: chỉ để hiện trên tiêu đề, lỗi thì bỏ qua phần "chốt số ngày".
  const dashToaNhaId = dashboard?.toaNhaId
  const kyHienTaiId = dashboard?.congToChuaGhi.kyHienTaiId
  useEffect(() => {
    setNgayChot(null)
    if (!dashToaNhaId || !kyHienTaiId) return undefined
    let mounted = true
    fetchKyThanhToan(token, dashToaNhaId)
      .then((ky) => { if (mounted) setNgayChot(ky.find((k) => k.id === kyHienTaiId)?.ngayKetThuc ?? null) })
      .catch(() => undefined)
    return () => { mounted = false }
  }, [token, dashToaNhaId, kyHienTaiId])

  const xacNhanLichHen = async (id: number) => {
    setLoiLichHen(null)
    try {
      await capNhatTrangThaiLichHen(token, id, 'DA_XAC_NHAN')
      setSoLanTaiLai((n) => n + 1)
    } catch (err: unknown) {
      setLoiLichHen(err instanceof ApiError ? err.message : 'Không thể xác nhận lịch hẹn.')
    }
  }

  const dieuHuongToi = (duongDan: string) => {
    window.location.href = duongDan
  }

  const taoUrlDieuHuong = (duongDan: string, params?: Record<string, string | number | null | undefined>): string => {
    if (!params) return duongDan
    const sp = new URLSearchParams()
    for (const [k, v] of Object.entries(params)) {
      if (v !== null && v !== undefined && v !== '') {
        sp.set(k, String(v))
      }
    }
    const qs = sp.toString()
    return qs ? `${duongDan}?${qs}` : duongDan
  }

  const moDialogXuLy = (cb: DashboardData['canhBaoDienNuoc'][number]) => {
    setCanhBaoDangChon(cb)
    setTrangThaiMoi(cb.trangThai === 'MOI_PHAT_HIEN' ? 'DANG_KIEM_TRA' : cb.trangThai)
    setGhiChuXuLy(cb.ghiChuXuLy || '')
    setLoiCanhBao(null)
  }

  const moDialogGhiSoChung = (d: DashboardData['congToChuaGhi']['danhSachChuaGhi'][number]) => {
    setDiemDoGhiSo(d)
    setChiSoDauInput(d.chiSoCuoiKyTruoc != null ? String(d.chiSoCuoiKyTruoc) : '')
    setChiSoCuoiInput('')
    setCoThayCongTo(false)
    setChiSoCuoiCongToCuInput('')
    setChiSoDauCongToMoiInput('')
    setGhiChuGhiSo('')
    setLoiGhiSo(null)
  }

  const luuChiSoDungChung = async () => {
    if (!diemDoGhiSo) return
    const cuoi = parseFloat(chiSoCuoiInput)
    if (isNaN(cuoi) || cuoi < 0) {
      setLoiGhiSo('Vui lòng nhập chỉ số cuối hợp lệ (không âm).')
      return
    }
    const dau = chiSoDauInput ? parseFloat(chiSoDauInput) : null
    if (dau !== null && (isNaN(dau) || dau < 0)) {
      setLoiGhiSo('Chỉ số đầu không hợp lệ (không âm).')
      return
    }

    let cuoiCu: number | null = null
    let dauMoi: number | null = null
    if (coThayCongTo) {
      cuoiCu = parseFloat(chiSoCuoiCongToCuInput)
      dauMoi = parseFloat(chiSoDauCongToMoiInput)
      if (isNaN(cuoiCu) || cuoiCu < 0 || isNaN(dauMoi) || dauMoi < 0) {
        setLoiGhiSo('Vui lòng nhập đầy đủ chỉ số công tơ cũ và mới khi thay công tơ.')
        return
      }
    }

    setDangLuuGhiSo(true)
    setLoiGhiSo(null)
    try {
      await ghiChiSoDungChung(token, {
        diemDoId: diemDoGhiSo.viTriId,
        kyId: diemDoGhiSo.kyId,
        chiSoDau: dau,
        chiSoCuoi: cuoi,
        coThayCongTo,
        chiSoCuoiCongToCu: cuoiCu,
        chiSoDauCongToMoi: dauMoi,
        ghiChu: ghiChuGhiSo || undefined,
      })
      setDiemDoGhiSo(null)
      setThongBaoThanhCong(`Đã ghi chỉ số thành công cho ${diemDoGhiSo.tenViTri}. Hệ thống đã tự động đánh giá bất thường tiêu thụ.`)
      setSoLanTaiLai((n) => n + 1)
    } catch (err: unknown) {
      setLoiGhiSo(err instanceof ApiError ? err.message : 'Không thể lưu chỉ số công tơ dùng chung.')
    } finally {
      setDangLuuGhiSo(false)
    }
  }

  const luuXuLyCanhBao = async () => {
    if (!canhBaoDangChon) return
    setDangLuuCanhBao(true)
    setLoiCanhBao(null)
    try {
      await capNhatCanhBaoTieuThu(token, canhBaoDangChon.id, trangThaiMoi, ghiChuXuLy)
      setCanhBaoDangChon(null)
      setSoLanTaiLai((n) => n + 1)
    } catch (err: unknown) {
      setLoiCanhBao(err instanceof ApiError ? err.message : 'Không thể cập nhật trạng thái cảnh báo.')
    } finally {
      setDangLuuCanhBao(false)
    }
  }

  const kpi = dashboard?.kpi
  const cong = dashboard?.congToChuaGhi
  const tenToa = toaNhaList.find((t) => t.id === (toaNhaId ?? dashboard?.toaNhaId))?.ten ?? dashboard?.tenToaNha ?? ''
  const conNgay = ngayChot ? Math.ceil((new Date(`${ngayChot}T23:59:59`).getTime() - Date.now()) / 86_400_000) : null
  // Máy chủ trả "Kỳ 11/2026 - <tên toà>": chỉ lấy phần kỳ cho tiêu đề.
  const tenKy = (cong?.tenKyHienTai ?? '').split(' - ')[0]
  const tieuDePhu = [
    tenToa,
    tenKy ? `${tenKy.replace(/^Kỳ/, 'kỳ')} đang mở` : null,
    ngayChot ? `chốt số ngày ${dinhDangNgayIso(ngayChot)}${conNgay !== null && conNgay >= 0 ? ` (còn ${conNgay} ngày)` : ''}` : null,
  ].filter(Boolean).join(' · ')
  const soChuaGhi = cong?.soCongToChuaGhi ?? 0
  const congTo = cong?.danhSachChuaGhi ?? []
  const laDiemDoChung = (d: (typeof congTo)[number]) => d.loaiDiemDo === 'KHU_VUC_CHUNG' || d.loaiDiemDo === 'CHUNG'
  const diemDoChungDauTien = congTo.find(laDiemDoChung)
  const phanTram = (n: number, tong: number) => (tong > 0 ? Math.min(100, (n / tong) * 100) : 0)

  return (
    <section
      data-testid="manager-dashboard-screen"
      data-layout-variant={mobile ? 'mobile' : 'desktop'}
      aria-labelledby="manager-dashboard-title"
      className="stack"
      style={{ minWidth: 0, maxWidth: '100%', gap: 16 }}
    >
      <style>{CSS_QUAN_LY}</style>
      <header className="topbar" style={{ flexWrap: 'wrap' }}>
        <div className="title-block" style={{ flex: '1 1 260px' }}>
          <h1 className="h1" id="manager-dashboard-title">Nhắc việc</h1>
          {tieuDePhu ? <p className="sub">{tieuDePhu}</p> : null}
        </div>
        <div className="topbar-actions" style={{ flexWrap: 'wrap' }}>
          <label className="sr-only" htmlFor="quan-ly-chon-toa">Chọn toà nhà quản lý</label>
          <select
            id="quan-ly-chon-toa"
            className="select"
            style={{ width: mobile ? '100%' : 220 }}
            value={toaNhaId ?? ''}
            onChange={(e) => setToaNhaId(e.target.value ? Number(e.target.value) : null)}
            aria-label="Chọn toà nhà quản lý"
          >
            <option value="">Tất cả toà được phân công</option>
            {toaNhaList.map((tn) => (
              <option key={tn.id} value={tn.id}>{tn.ten}</option>
            ))}
          </select>
          {dashboard?.thoiDiemCapNhat ? (
            <Button variant="text" size="sm" onClick={() => setSoLanTaiLai((n) => n + 1)} title={`Cập nhật lúc ${dinhDangGio(dashboard.thoiDiemCapNhat)}`}>
              <Icon name="refresh" size="sm" />Làm mới
            </Button>
          ) : null}
          {soChuaGhi > 0 ? (
            <a className="btn btn-primary" href={taoUrlDieuHuong('/ghi-chi-so', { toaNhaId: toaNhaId ?? dashboard?.toaNhaId })}>
              <Icon name="meter" />Ghi {soChuaGhi} công tơ còn thiếu
            </a>
          ) : null}
        </div>
      </header>

      {loi ? (
        <div role="alert">
          <ScreenNotice tone="urgent">{loi}</ScreenNotice>
        </div>
      ) : null}

      {thongBaoThanhCong ? (
        <div role="status" className="banner banner-success">{thongBaoThanhCong}</div>
      ) : null}

      {dangTai && !dashboard ? (
        <p aria-live="polite" style={{ padding: 24, textAlign: 'center', color: 'var(--ma-text-secondary)' }}>
          Đang tải dữ liệu điều hành vận hành…
        </p>
      ) : null}

      {dashboard && kpi && cong ? (
        <div className="grid">
          <div className="c-8 stack" style={{ minWidth: 0 }}>
            <BangViecVanHanh token={token} mobile={mobile} toaNhaId={toaNhaId} />

            <Card
              aria-labelledby="anomaly-alerts-title"
              title={<span id="anomaly-alerts-title">Cảnh báo bất thường điện nước</span>}
              action={<span className="t-meta">{dashboard.canhBaoDienNuoc.length} cảnh báo được ghi nhận</span>}
            >
              {dashboard.canhBaoDienNuoc.length === 0 ? (
                <EmptyState title="Không có cảnh báo tiêu thụ" body="Toàn bộ điểm đo và công tơ khu vực chung hoạt động trong ngưỡng bình thường." />
              ) : (
                <ul className="list">
                  {dashboard.canhBaoDienNuoc.map((cb) => (
                    <li key={cb.id} className="list-row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
                      <span className="avatar sm h1" aria-hidden="true"><Icon name={cb.loaiDichVu === 'DIEN' ? 'bolt' : 'droplet'} size="sm" /></span>
                      <div className="body" style={{ minWidth: 200 }}>
                        <div className="name" style={{ whiteSpace: 'normal' }}>
                          {cb.tenToaNha} · {cb.tenDiemDo || (cb.soPhong ? `Phòng ${cb.soPhong}` : 'Khu vực chung')} · {cb.tenKy}
                        </div>
                        <div className="sub" style={{ whiteSpace: 'normal' }}>{cb.lyDo}</div>
                        {cb.ghiChuXuLy ? (
                          <div className="sub" style={{ whiteSpace: 'normal' }}>
                            <strong>Ghi chú xử lý:</strong> {cb.ghiChuXuLy} {cb.nguoiXacNhan ? `(bởi ${cb.nguoiXacNhan})` : ''}
                          </div>
                        ) : null}
                      </div>
                      <StatusTag tone={cb.trangThai === 'MOI_PHAT_HIEN' ? 'urgent' : cb.trangThai === 'DANG_KIEM_TRA' ? 'waiting' : 'done'}>
                        {cb.trangThai === 'MOI_PHAT_HIEN' ? 'Mới phát hiện' : cb.trangThai === 'DANG_KIEM_TRA' ? 'Đang kiểm tra' : 'Đã xử lý'}
                      </StatusTag>
                      <div className="row" style={{ gap: 8 }}>
                        <Button
                          variant="text"
                          size="sm"
                          onClick={() => {
                            if (cb.diemDoId) {
                              moDialogGhiSoChung({
                                viTriId: cb.diemDoId,
                                tenViTri: cb.tenDiemDo || 'Điểm đo chung',
                                toaNhaId: cb.toaNhaId,
                                tenToaNha: cb.tenToaNha,
                                tenDichVu: cb.loaiDichVu === 'DIEN' ? 'Điện' : 'Nước',
                                donVi: cb.loaiDichVu === 'DIEN' ? 'kWh' : 'm³',
                                loaiDiemDo: 'CHUNG',
                                kyId: cb.kyId,
                              })
                            } else {
                              dieuHuongToi(cb.duongDanHanhDong || `/ghi-chi-so?toaNhaId=${cb.toaNhaId}`)
                            }
                          }}
                        >
                          Xem chỉ số
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => moDialogXuLy(cb)}>
                          {cb.trangThai === 'MOI_PHAT_HIEN' ? 'Xác nhận kiểm tra' : 'Cập nhật xử lý'}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card
              aria-labelledby="schedule-title"
              title={<span id="schedule-title">Lịch hẹn xem phòng</span>}
              action={<a className="link-more" href="/lich-hen">Tất cả lịch hẹn <Icon name="arrow-right" size="sm" /></a>}
            >
              {loiLichHen ? <div role="alert"><ScreenNotice tone="urgent">{loiLichHen}</ScreenNotice></div> : null}
              {dashboard.lichHenSapToi.length === 0 ? (
                <EmptyState title="Chưa có lịch hẹn" body="Không có lịch hẹn xem phòng hoặc bàn giao nào sắp tới." />
              ) : (
                <ul className="list">
                  {dashboard.lichHenSapToi.map((lh, i) => (
                    <li key={lh.id} className="list-row" style={{ flexWrap: 'wrap' }}>
                      <span className={`avatar h${(i % 5) + 1}`} aria-hidden="true">{chuCaiDau(lh.hoTen)}</span>
                      <div className="body" style={{ minWidth: 160 }}>
                        <div className="name" style={{ whiteSpace: 'normal' }}>{lh.hoTen} · {lh.soDienThoai}</div>
                        <div className="sub" style={{ whiteSpace: 'normal' }}>Xem phòng {lh.soPhong} · {dinhDangNgayGio(lh.thoiGian)}</div>
                      </div>
                      {lh.trangThai === 'CHO_XAC_NHAN' ? <StatusTag tone="waiting">Chờ xác nhận</StatusTag>
                        : lh.trangThai === 'DA_XAC_NHAN' ? <StatusTag tone="done">Đã xác nhận</StatusTag>
                          : <StatusTag tone="neutral">{lh.trangThai}</StatusTag>}
                      {lh.trangThai === 'CHO_XAC_NHAN' ? (
                        <Button variant="secondary" size="sm" onClick={() => void xacNhanLichHen(lh.id)}>Xác nhận</Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="c-4 stack" style={{ minWidth: 0 }}>
            <Card title="Còn phải thu">
              <p className="kpi-value" style={{ fontSize: 36, color: kpi.soHoaDonQuaHan > 0 ? 'var(--ma-urgent)' : undefined }}>
                {dinhDangTien(kpi.khoanConPhaiThu)}<span className="unit">₫</span>
              </p>
              <p className="kpi-desc">
                {kpi.soHoaDonQuaHan > 0
                  ? `${kpi.soHoaDonQuaHan} hoá đơn quá hạn, tổng ${dinhDangTien(kpi.tienQuaHan)} ₫.`
                  : 'Không có hoá đơn quá hạn.'}
              </p>
              <div className="card-foot">
                <a className="link-more" href={taoUrlDieuHuong('/hoa-don', { toaNhaId, trangThai: 'NO_QUA_HAN' })}>Xem hoá đơn quá hạn <Icon name="arrow-right" size="sm" /></a>
              </div>
            </Card>

            <Card
              aria-labelledby="unrecorded-meters-title"
              title={<span id="unrecorded-meters-title">Công tơ {tenKy.replace(/^Kỳ/, 'kỳ')}</span>}
              action={<span className="t-strong">{cong.soCongToDaGhi}/{cong.tongSoCongTo}</span>}
            >
              <div className="progress" role="progressbar" aria-valuenow={cong.soCongToDaGhi} aria-valuemin={0} aria-valuemax={cong.tongSoCongTo} aria-label={`Đã ghi ${cong.soCongToDaGhi} trên ${cong.tongSoCongTo} công tơ`}>
                <span style={{ width: `${phanTram(cong.soCongToDaGhi, cong.tongSoCongTo)}%` }} />
              </div>
              {congTo.length === 0 ? (
                <p className="t-sm t-2" style={{ marginTop: 14 }}>Đã ghi đủ chỉ số trong kỳ đang mở.</p>
              ) : (
                <>
                  <p className="t-sm t-2" style={{ margin: '14px 0 10px' }}>Còn thiếu</p>
                  <div className="meters">
                    {congTo.slice(0, 8).map((d, i) => (
                      <span key={`${d.viTriId}-${d.tenDichVu}-${i}`} className="meter-chip" title={d.tenToaNha}>
                        <Icon name={d.tenDichVu.startsWith('Nước') ? 'droplet' : 'bolt'} />
                        <span className="meter-chip-text">{d.tenViTri.replace(/^Phòng\s+/i, '')} · {d.tenDichVu.split(' ')[0]}</span>
                      </span>
                    ))}
                  </div>
                  {congTo.length > 8 ? <p className="t-sm t-2" style={{ marginTop: 10 }}>và {congTo.length - 8} công tơ khác</p> : null}
                  {diemDoChungDauTien ? (
                    <div style={{ marginTop: 14 }}>
                      <Button variant="secondary" size="sm" onClick={() => moDialogGhiSoChung(diemDoChungDauTien)}>
                        Ghi ngay điểm đo chung
                      </Button>
                    </div>
                  ) : null}
                </>
              )}
            </Card>

            <Card title="Phòng" action={<span className="t-meta">{dashboard.coCauPhong.tongSo} phòng</span>} aria-labelledby={undefined}>
              <div className="hbars">
                {([
                  ['Đang thuê', dashboard.coCauPhong.dangThue, undefined],
                  ['Trống', dashboard.coCauPhong.trong, 'warm'],
                  ['Đã cọc', dashboard.coCauPhong.daCoc, undefined],
                  ['Đang sửa', dashboard.coCauPhong.dangSua, undefined],
                  ['Ngưng khai thác', dashboard.coCauPhong.ngung, undefined],
                ] as const).filter(([, n], i) => i < 2 || n > 0).map(([nhan, n, tone]) => (
                  <div className="hbar" key={nhan}>
                    <span className="hbar-label">{nhan}</span>
                    <span className="hbar-value">{n}</span>
                    <div className="hbar-track"><div className={`hbar-fill${tone ? ` ${tone}` : ''}`} style={{ width: `${phanTram(n, dashboard.coCauPhong.tongSo)}%` }} /></div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {/* DIALOG XỬ LÝ CẢNH BÁO TIÊU THỤ */}
      {canhBaoDangChon ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-alert-title"
          style={styleModalBackdrop}
        >
          <div ref={dialogRef} style={styleModalBox}>
            <h3 id="dialog-alert-title" style={{ margin: '0 0 12px' }}>
              Xử lý cảnh báo tiêu thụ
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--ma-text-secondary)' }}>
              {canhBaoDangChon.tenToaNha} — {canhBaoDangChon.tenDiemDo || (canhBaoDangChon.soPhong ? `Phòng ${canhBaoDangChon.soPhong}` : 'Khu vực chung')}
            </p>

            <div style={{ padding: '8px 12px', background: 'var(--ma-bg-sunken, #f8fafc)', borderRadius: 6, marginBottom: 14, fontSize: 13 }}>
              {canhBaoDangChon.lyDo}
            </div>

            {loiCanhBao ? (
              <div role="alert" style={{ marginBottom: 12 }}>
                <ScreenNotice tone="urgent">{loiCanhBao}</ScreenNotice>
              </div>
            ) : null}

            <label style={{ display: 'grid', gap: 6, marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Trạng thái xử lý</span>
              <select
                value={trangThaiMoi}
                onChange={(e) => setTrangThaiMoi(e.target.value)}
                style={styleInput}
              >
                <option value="DANG_KIEM_TRA">ĐANG KIỂM TRA (Đã phân công thợ/quản lý kiểm tra thực địa)</option>
                <option value="DA_XU_LY">ĐÃ XỬ LÝ (Đã khắc phục sự cố rò rỉ / thay thiết bị)</option>
                <option value="MOI_PHAT_HIEN">MỚI PHÁT HIỆN (Chờ tiếp nhận)</option>
              </select>
            </label>

            <label style={{ display: 'grid', gap: 6, marginBottom: 18 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Ghi chú xử lý</span>
              <textarea
                value={ghiChuXuLy}
                onChange={(e) => setGhiChuXuLy(e.target.value)}
                rows={3}
                placeholder="Nhập chi tiết quá trình kiểm tra, nguyên nhân hoặc biện pháp khắc phục..."
                style={{ ...styleInput, resize: 'vertical' }}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="secondary" onClick={() => setCanhBaoDangChon(null)} blocked={dangLuuCanhBao} blockedReason="Đang cập nhật trạng thái...">
                Đóng
              </Button>
              <Button variant="primary" onClick={luuXuLyCanhBao} blocked={dangLuuCanhBao} blockedReason="Đang cập nhật trạng thái...">
                {dangLuuCanhBao ? 'Đang lưu…' : 'Lưu trạng thái'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* DIALOG GHI CHỈ SỐ CÔNG TƠ DÙNG CHUNG */}
      {diemDoGhiSo ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-meter-title"
          style={styleModalBackdrop}
        >
          <div ref={ghiSoDialogRef} style={styleModalBox}>
            <h3 id="dialog-meter-title" style={{ margin: '0 0 12px' }}>
              Ghi chỉ số điểm đo chung
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--ma-text-secondary)' }}>
              {diemDoGhiSo.tenToaNha} — <strong>{diemDoGhiSo.tenViTri}</strong> ({diemDoGhiSo.tenDichVu}) · Kỳ đang mở
            </p>

            {loiGhiSo ? (
              <div role="alert" style={{ marginBottom: 12 }}>
                <ScreenNotice tone="urgent">{loiGhiSo}</ScreenNotice>
              </div>
            ) : null}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  Chỉ số đầu ({diemDoGhiSo.donVi}) {diemDoGhiSo.chiSoCuoiKyTruoc != null ? `(Kế thừa: ${diemDoGhiSo.chiSoCuoiKyTruoc})` : '*'}
                </span>
                <input
                  type="number"
                  step="any"
                  value={chiSoDauInput}
                  onChange={(e) => setChiSoDauInput(e.target.value)}
                  placeholder={diemDoGhiSo.chiSoCuoiKyTruoc != null ? String(diemDoGhiSo.chiSoCuoiKyTruoc) : 'Bắt buộc kỳ đầu'}
                  style={styleInput}
                />
              </label>

              <label style={{ display: 'grid', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Chỉ số cuối ({diemDoGhiSo.donVi}) *</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={chiSoCuoiInput}
                  onChange={(e) => setChiSoCuoiInput(e.target.value)}
                  placeholder="Nhập số đo mới"
                  style={styleInput}
                />
              </label>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={coThayCongTo}
                onChange={(e) => setCoThayCongTo(e.target.checked)}
              />
              <span style={{ fontSize: 13, fontWeight: 600 }}>Có thay công tơ trong kỳ này</span>
            </label>

            {coThayCongTo ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14, padding: 12, background: 'var(--ma-bg-sunken, #f8fafc)', borderRadius: 6 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Chỉ số cuối công tơ cũ</span>
                  <input
                    type="number"
                    step="any"
                    value={chiSoCuoiCongToCuInput}
                    onChange={(e) => setChiSoCuoiCongToCuInput(e.target.value)}
                    style={styleInput}
                  />
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Chỉ số đầu công tơ mới</span>
                  <input
                    type="number"
                    step="any"
                    value={chiSoDauCongToMoiInput}
                    onChange={(e) => setChiSoDauCongToMoiInput(e.target.value)}
                    style={styleInput}
                  />
                </label>
              </div>
            ) : null}

            <label style={{ display: 'grid', gap: 6, marginBottom: 18 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Ghi chú</span>
              <textarea
                value={ghiChuGhiSo}
                onChange={(e) => setGhiChuGhiSo(e.target.value)}
                rows={2}
                placeholder="Ghi chú về tình trạng công tơ, niêm phong..."
                style={{ ...styleInput, resize: 'vertical' }}
              />
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="secondary" onClick={() => setDiemDoGhiSo(null)} blocked={dangLuuGhiSo} blockedReason="Đang lưu chỉ số...">
                Huỷ
              </Button>
              <Button variant="primary" onClick={luuChiSoDungChung} blocked={dangLuuGhiSo} blockedReason="Đang lưu chỉ số...">
                {dangLuuGhiSo ? 'Đang lưu…' : 'Lưu chỉ số & Kiểm tra'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

/* =========================================================================
 * STYLES & UTILS
 * ========================================================================= */

const styleInput: React.CSSProperties = {
  padding: '6px 10px',
  border: '1px solid var(--ma-border-default)',
  borderRadius: 4,
  background: 'var(--ma-bg-surface, #ffffff)',
  color: 'inherit',
  font: 'inherit',
  fontSize: 14,
}

const CSS_QUAN_LY = `
.meters { display: grid; grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)); gap: 8px; }
.meter-chip { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 14px; background: var(--ma-bg-sunken); font: 500 14px/1.3 var(--ma-font-ui); min-width: 0; }
.meter-chip .ic { color: var(--ma-accent-warm); flex: none; }
.meter-chip-text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`

const styleModalBackdrop: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: 16,
}

const styleModalBox: React.CSSProperties = {
  background: 'var(--ma-bg-card, #ffffff)',
  padding: 24,
  borderRadius: 8,
  width: '100%',
  maxWidth: 520,
  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
}

function docToaNhaIdTuUrl(): number | null {
  const params = new URLSearchParams(window.location.search)
  const val = params.get('toaNhaId')
  return val ? Number(val) : null
}

function dinhDangGio(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  } catch {
    return iso
  }
}

function dinhDangNgayGio(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

function chuCaiDau(ten: string): string {
  return ten.trim().split(/\s+/).slice(-2).map((t) => t[0]?.toUpperCase() ?? '').join('')
}
