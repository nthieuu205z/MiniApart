import { useEffect, useState, useRef } from 'react'
import {
  ApiError,
  fetchDashboardQuanLy,
  fetchToaNha,
  capNhatCanhBaoTieuThu,
  ghiChiSoDungChung,
  type ThongTinDashboardQuanLy as DashboardData,
  type ThongTinToaNha,
} from './api'
import { dinhDangTien, dinhDangSo } from './design/core/format'
import { Button } from './design/core/Button'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { ScreenHeader, ScreenNotice, ScreenSurface } from './design/layout/Screen'
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

  return (
    <ScreenSurface
      data-testid="manager-dashboard-screen"
      data-layout-variant={mobile ? 'mobile' : 'desktop'}
      aria-labelledby="manager-dashboard-title"
      style={{ minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}
    >
      <ScreenHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <SysLabel>DASHBOARD VẬN HÀNH</SysLabel>
            <h2 id="manager-dashboard-title" style={{ margin: '6px 0 2px', fontSize: mobile ? 22 : 28 }}>
              Bảng điều hành & nhắc việc vận hành
            </h2>
            <p style={{ margin: 0, color: 'var(--ma-text-secondary)', fontSize: 14 }}>
              Cảnh báo tiêu thụ, công nợ quá hạn, công tơ cần ghi và sự cố trong các toà nhà được phân công.
            </p>
          </div>
          {dashboard?.thoiDiemCapNhat ? (
            <div style={{ fontSize: 12, color: 'var(--ma-text-secondary)', textAlign: 'right' }}>
              Cập nhật lúc: <strong style={{ fontFamily: 'var(--ma-font-mono)' }}>{dinhDangGio(dashboard.thoiDiemCapNhat)}</strong>
              <Button
                variant="secondary"
                size="sm"
                style={{ marginLeft: 8 }}
                onClick={() => setSoLanTaiLai((n) => n + 1)}
              >
                Làm mới
              </Button>
            </div>
          ) : null}
        </div>
      </ScreenHeader>

      {/* FILTER: TOÀ NHÀ PHÂN CÔNG */}
      <section
        aria-label="Bộ lọc toà nhà quản lý"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'center',
          padding: '12px 16px',
          background: 'var(--ma-bg-card)',
          border: '1px solid var(--ma-border-default)',
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: mobile ? '100%' : 320 }}>
          <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Toà nhà phân công:</span>
          <select
            value={toaNhaId ?? ''}
            onChange={(e) => setToaNhaId(e.target.value ? Number(e.target.value) : null)}
            style={{ ...styleInput, flex: 1 }}
            aria-label="Chọn toà nhà quản lý"
          >
            <option value="">Tất cả toà được phân công</option>
            {toaNhaList.map((tn) => (
              <option key={tn.id} value={tn.id}>
                {tn.ten}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* ERROR NOTICE */}
      {loi ? (
        <div role="alert" style={{ marginBottom: 16 }}>
          <ScreenNotice tone="urgent">{loi}</ScreenNotice>
        </div>
      ) : null}

      {/* SUCCESS NOTICE */}
      {thongBaoThanhCong ? (
        <div
          role="status"
          style={{
            padding: '10px 14px',
            marginBottom: 16,
            background: 'var(--ma-green-100, #ecfdf5)',
            color: 'var(--ma-green-700, #047857)',
            borderRadius: 6,
            border: '1px solid var(--ma-green-600, #059669)',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {thongBaoThanhCong}
        </div>
      ) : null}

      {/* LOADING STATE */}
      {dangTai && !dashboard ? (
        <p aria-live="polite" style={{ padding: 24, textAlign: 'center', color: 'var(--ma-text-secondary)' }}>
          Đang tải dữ liệu điều hành vận hành…
        </p>
      ) : null}

      {dashboard && kpi ? (
        <div style={{ display: 'grid', gap: 20 }}>
          {/* OPERATIONAL KPI CARDS */}
          <section
            aria-label="Chỉ số vận hành hàng ngày"
            style={{
              display: 'grid',
              gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 12,
            }}
          >
            {/* Card 1: Khoản còn phải thu & Quá hạn */}
            <article
              style={{ ...styleKpiCard, borderColor: kpi.soHoaDonQuaHan > 0 ? 'var(--ma-border-warning, #f59e0b)' : 'var(--ma-border-default)' }}
              onClick={() => dieuHuongToi(taoUrlDieuHuong('/hoa-don', { toaNhaId, trangThai: 'NO_QUA_HAN' }))}
              title="Xem danh sách hoá đơn quá hạn"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styleKpiLabel}>Cần thu hồi nợ</span>
                {kpi.soHoaDonQuaHan > 0 ? <StatusTag tone="urgent">{kpi.soHoaDonQuaHan} quá hạn</StatusTag> : <StatusTag tone="done">Đủ</StatusTag>}
              </div>
              <strong style={{ ...styleKpiValue, color: kpi.soHoaDonQuaHan > 0 ? 'var(--ma-urgent)' : 'inherit' }}>
                {dinhDangTien(kpi.khoanConPhaiThu)} <span style={{ fontSize: 13, fontWeight: 400 }}>₫</span>
              </strong>
              <div style={styleKpiSub}>Quá hạn: {dinhDangTien(kpi.tienQuaHan)} ₫</div>
            </article>

            {/* Card 2: Phòng trống & Đang sửa */}
            <article
              style={styleKpiCard}
              onClick={() => dieuHuongToi(taoUrlDieuHuong('/phong', { toaNhaId }))}
              title="Xem danh mục phòng"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styleKpiLabel}>Hiện trạng phòng</span>
                <StatusTag tone="waiting">{kpi.soPhongTrong} trống</StatusTag>
              </div>
              <strong style={styleKpiValue}>
                {kpi.soPhongDangThue} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ma-text-secondary)' }}>/ {kpi.tongSoPhong} thuê</span>
              </strong>
              <div style={styleKpiSub}>{kpi.soPhongDangSua} phòng đang sửa chữa</div>
            </article>

            {/* Card 3: Công tơ chưa ghi */}
            <article
              style={{ ...styleKpiCard, borderColor: kpi.soCongToChuaGhi > 0 ? 'var(--ma-urgent)' : 'var(--ma-border-default)' }}
              onClick={() => dieuHuongToi(taoUrlDieuHuong('/ghi-chi-so', { toaNhaId }))}
              title="Mở màn hình ghi chỉ số"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styleKpiLabel}>Công tơ chưa ghi</span>
                {kpi.soCongToChuaGhi > 0 ? <StatusTag tone="urgent">{kpi.soCongToChuaGhi} chưa ghi</StatusTag> : <StatusTag tone="done">Hoàn thành</StatusTag>}
              </div>
              <strong style={{ ...styleKpiValue, color: kpi.soCongToChuaGhi > 0 ? 'var(--ma-urgent)' : 'inherit' }}>
                {kpi.soCongToChuaGhi} <span style={{ fontSize: 13, fontWeight: 400 }}>điểm đo</span>
              </strong>
              <div style={styleKpiSub}>{dashboard.congToChuaGhi.tenKyHienTai}</div>
            </article>

            {/* Card 4: Sự cố cần xử lý */}
            <article
              style={styleKpiCard}
              onClick={() => dieuHuongToi(taoUrlDieuHuong('/su-co', { toaNhaId }))}
              title="Xem danh sách sự cố"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styleKpiLabel}>Sự cố bảo trì</span>
                {kpi.soSuCoCanXuLy > 0 ? <StatusTag tone="urgent">{kpi.soSuCoCanXuLy} đang mở</StatusTag> : <StatusTag tone="done">Không có</StatusTag>}
              </div>
              <strong style={styleKpiValue}>{kpi.soSuCoCanXuLy} sự cố</strong>
              <div style={styleKpiSub}>Cần thợ hoặc quản lý kiểm tra</div>
            </article>

            {/* Card 5: Cảnh báo điện nước đang mở */}
            <article
              style={{ ...styleKpiCard, borderColor: kpi.soCanhBaoDienNuocDangMo > 0 ? 'var(--ma-border-warning, #f59e0b)' : 'var(--ma-border-default)' }}
              title="Cảnh báo tiêu thụ bất thường"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styleKpiLabel}>Cảnh báo điện nước</span>
                {kpi.soCanhBaoDienNuocDangMo > 0 ? <StatusTag tone="urgent">{kpi.soCanhBaoDienNuocDangMo} cảnh báo</StatusTag> : <StatusTag tone="done">Bình thường</StatusTag>}
              </div>
              <strong style={{ ...styleKpiValue, color: kpi.soCanhBaoDienNuocDangMo > 0 ? 'var(--ma-urgent)' : 'inherit' }}>
                {kpi.soCanhBaoDienNuocDangMo} vụ việc
              </strong>
              <div style={styleKpiSub}>So với baseline 3 kỳ trước</div>
            </article>
          </section>

          {/* SECTION 1: CẢNH BÁO TIÊU THỤ ĐIỆN NƯỚC BẤT THƯỜNG */}
          <section style={styleSectionCard} aria-labelledby="anomaly-alerts-title">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <SysLabel>ƯU TIÊN XỬ LÝ</SysLabel>
                <h3 id="anomaly-alerts-title" style={{ margin: '4px 0 0', fontSize: 18 }}>
                  Cảnh báo bất thường điện nước & thất thoát
                </h3>
              </div>
              <span style={{ fontSize: 13, color: 'var(--ma-text-secondary)' }}>
                {dashboard.canhBaoDienNuoc.length} cảnh báo được ghi nhận
              </span>
            </div>

            {dashboard.canhBaoDienNuoc.length === 0 ? (
              <EmptyState title="Không có cảnh báo tiêu thụ" body="Toàn bộ điểm đo và công tơ khu vực chung hoạt động trong ngưỡng bình thường." />
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {dashboard.canhBaoDienNuoc.map((cb) => (
                  <article
                    key={cb.id}
                    style={{
                      display: 'grid',
                      gap: 8,
                      padding: 14,
                      background: 'var(--ma-bg-sunken, #f8fafc)',
                      border: `1px solid ${cb.trangThai === 'MOI_PHAT_HIEN' ? 'var(--ma-urgent, #dc2626)' : 'var(--ma-border-default)'}`,
                      borderRadius: 6,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 15 }}>{cb.tenToaNha}</strong>
                          <span style={{ color: 'var(--ma-text-secondary)' }}>·</span>
                          <span style={{ fontWeight: 600 }}>{cb.tenDiemDo || (cb.soPhong ? `Phòng ${cb.soPhong}` : 'Khu vực chung')}</span>
                          <span style={{ color: 'var(--ma-text-secondary)' }}>·</span>
                          <span style={{ fontSize: 12, color: 'var(--ma-text-secondary)' }}>{cb.tenKy}</span>
                        </div>
                        <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--ma-text-primary)', lineHeight: 1.5 }}>
                          {cb.lyDo}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StatusTag
                          tone={
                            cb.trangThai === 'MOI_PHAT_HIEN'
                              ? 'urgent'
                              : cb.trangThai === 'DANG_KIEM_TRA'
                              ? 'waiting'
                              : 'done'
                          }
                        >
                          {cb.trangThai === 'MOI_PHAT_HIEN'
                            ? 'Mới phát hiện'
                            : cb.trangThai === 'DANG_KIEM_TRA'
                            ? 'Đang kiểm tra'
                            : 'Đã xử lý'}
                        </StatusTag>
                      </div>
                    </div>

                    {cb.ghiChuXuLy ? (
                      <div style={{ fontSize: 12, color: 'var(--ma-text-secondary)', background: 'var(--ma-bg-card)', padding: '6px 10px', borderRadius: 4 }}>
                        <strong>Ghi chú xử lý:</strong> {cb.ghiChuXuLy} {cb.nguoiXacNhan ? `(bởi ${cb.nguoiXacNhan})` : ''}
                      </div>
                    ) : null}

                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
                      <Button
                        variant="secondary"
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
                      <Button variant="primary" size="sm" onClick={() => moDialogXuLy(cb)}>
                        {cb.trangThai === 'MOI_PHAT_HIEN' ? 'Xác nhận kiểm tra' : 'Cập nhật xử lý'}
                      </Button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* SECTION 2: BẢNG VIỆC VẬN HÀNH HÀNG NGÀY (REUSING BangViecVanHanh) */}
          <section style={styleSectionCard}>
            <SysLabel>CÔNG VIỆC HÀNG NGÀY</SysLabel>
            <h3 style={{ margin: '4px 0 14px', fontSize: 18 }}>Bảng việc vận hành toà nhà</h3>
            <BangViecVanHanh token={token} mobile={mobile} toaNhaId={toaNhaId} />
          </section>

          {/* SECTION 3: CÔNG TƠ CHƯA GHI CHỈ SỐ & ĐỐI SOÁT */}
          <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: 16 }}>
            {/* Công tơ chưa ghi */}
            <section style={styleSectionCard} aria-labelledby="unrecorded-meters-title">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div>
                  <SysLabel>TIẾN ĐỘ CHỐT SỐ</SysLabel>
                  <h4 id="unrecorded-meters-title" style={{ margin: '4px 0 0', fontSize: 16 }}>
                    Điểm đo chưa ghi chỉ số ({dashboard.congToChuaGhi.tenKyHienTai})
                  </h4>
                </div>
                <Button variant="secondary" size="sm" onClick={() => dieuHuongToi(taoUrlDieuHuong('/ghi-chi-so', { toaNhaId }))}>
                  Mở ghi số
                </Button>
              </div>

              {dashboard.congToChuaGhi.danhSachChuaGhi.length === 0 ? (
                <EmptyState title="Đã ghi đủ chỉ số" body="Tất cả các phòng và điểm đo chung trong kỳ đang mở đã được ghi chỉ số đầy đủ." />
              ) : (
                <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--ma-border-default)' }}>
                        <th style={{ padding: '6px 4px' }}>Vị trí</th>
                        <th style={{ padding: '6px 4px' }}>Toà nhà</th>
                        <th style={{ padding: '6px 4px' }}>Dịch vụ</th>
                        <th style={{ padding: '6px 4px', textAlign: 'right' }}>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.congToChuaGhi.danhSachChuaGhi.map((d, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--ma-border-subtle)' }}>
                          <td style={{ padding: '6px 4px', fontWeight: 600 }}>{d.tenViTri}</td>
                          <td style={{ padding: '6px 4px', color: 'var(--ma-text-secondary)' }}>{d.tenToaNha}</td>
                          <td style={{ padding: '6px 4px' }}>{d.tenDichVu}</td>
                          <td style={{ padding: '6px 4px', textAlign: 'right' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => {
                                if (d.loaiDiemDo === 'KHU_VUC_CHUNG' || d.loaiDiemDo === 'CHUNG') {
                                  moDialogGhiSoChung(d)
                                } else {
                                  dieuHuongToi(taoUrlDieuHuong('/ghi-chi-so', { toaNhaId: d.toaNhaId }))
                                }
                              }}
                            >
                              Ghi ngay
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* Lịch hẹn sắp tới */}
            <section style={styleSectionCard} aria-labelledby="schedule-title">
              <SysLabel>LỊCH HẸN & CƯ TRÚ</SysLabel>
              <h4 id="schedule-title" style={{ margin: '4px 0 12px', fontSize: 16 }}>
                Lịch xem phòng & nhận trả phòng sắp tới
              </h4>

              {dashboard.lichHenSapToi.length === 0 ? (
                <EmptyState title="Chưa có lịch hẹn" body="Không có lịch hẹn xem phòng hoặc bàn giao nào sắp tới." />
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {dashboard.lichHenSapToi.map((lh) => (
                    <div
                      key={lh.id}
                      style={{
                        padding: '8px 10px',
                        background: 'var(--ma-bg-sunken, #f8fafc)',
                        border: '1px solid var(--ma-border-subtle)',
                        borderRadius: 6,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{lh.hoTen} · {lh.soDienThoai}</div>
                        <div style={{ fontSize: 12, color: 'var(--ma-text-secondary)' }}>{lh.soPhong}</div>
                      </div>
                      <StatusTag tone="waiting">{dinhDangNgayGio(lh.thoiGian)}</StatusTag>
                    </div>
                  ))}
                </div>
              )}
            </section>
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
    </ScreenSurface>
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

const styleKpiCard: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  padding: '12px 14px',
  background: 'var(--ma-bg-card)',
  border: '1px solid var(--ma-border-default)',
  borderRadius: 8,
  cursor: 'pointer',
}

const styleKpiLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ma-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}

const styleKpiValue: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  fontFamily: 'var(--ma-font-mono)',
}

const styleKpiSub: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--ma-text-secondary)',
  marginTop: 2,
}

const styleSectionCard: React.CSSProperties = {
  padding: 16,
  background: 'var(--ma-bg-card)',
  border: '1px solid var(--ma-border-default)',
  borderRadius: 8,
  minWidth: 0,
  overflowX: 'auto',
}

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
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
  } catch {
    return iso
  }
}
