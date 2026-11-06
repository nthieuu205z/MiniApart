import { useEffect, useState, useId } from 'react'
import {
  ApiError,
  fetchDashboardChu,
  fetchToaNha,
  type ThongTinDashboardChu as DashboardData,
  type ThongTinToaNha,
} from './api'
import { dinhDangTien, dinhDangSo } from './design/core/format'
import { Button } from './design/core/Button'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { ScreenHeader, ScreenNotice, ScreenSurface } from './design/layout/Screen'
import { EmptyState } from './design/feedback/EmptyState'
import { BangViecVanHanh } from './BangViecVanHanh'

type Props = {
  token: string
  mobile?: boolean
}

type TabKey = 'kinh-doanh' | 'dien-nuoc' | 'van-hanh'
type PeriodQuickOption = '6_thang' | 'thang_nay' | 'thang_truoc' | '12_thang'

export function ChuDashboard({ token, mobile = false }: Props): React.ReactElement {
  const [toaNhaList, setToaNhaList] = useState<ThongTinToaNha[]>([])
  const [toaNhaId, setToaNhaId] = useState<number | null>(() => docToaNhaIdTuUrl())
  const [tab, setTab] = useState<TabKey>('kinh-doanh')
  const [quickPeriod, setQuickPeriod] = useState<PeriodQuickOption>('6_thang')
  const [tuNgay, setTuNgay] = useState(() => {
    const now = new Date()
    return layNgayDinhDang(new Date(now.getFullYear(), now.getMonth() - 5, 1))
  })
  const [denNgay, setDenNgay] = useState(() => layNgayDinhDang(new Date()))
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [hienBangDuLieu, setHienBangDuLieu] = useState(false)
  const [soLanTaiLai, setSoLanTaiLai] = useState(0)

  const tabId = useId()

  // Load building list
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

  // Handle Quick Period selection
  const chonKyNhanh = (opt: PeriodQuickOption) => {
    setQuickPeriod(opt)
    const now = new Date()
    if (opt === 'thang_nay') {
      setTuNgay(layNgayDinhDang(new Date(now.getFullYear(), now.getMonth(), 1)))
      setDenNgay(layNgayDinhDang(new Date(now.getFullYear(), now.getMonth() + 1, 0)))
    } else if (opt === 'thang_truoc') {
      setTuNgay(layNgayDinhDang(new Date(now.getFullYear(), now.getMonth() - 1, 1)))
      setDenNgay(layNgayDinhDang(new Date(now.getFullYear(), now.getMonth(), 0)))
    } else if (opt === '6_thang') {
      setTuNgay(layNgayDinhDang(new Date(now.getFullYear(), now.getMonth() - 5, 1)))
      setDenNgay(layNgayDinhDang(now))
    } else if (opt === '12_thang') {
      setTuNgay(layNgayDinhDang(new Date(now.getFullYear(), now.getMonth() - 11, 1)))
      setDenNgay(layNgayDinhDang(now))
    }
  }

  // Load Dashboard Data with anti-stale protection
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

    fetchDashboardChu(token, toaNhaId, tuNgay, denNgay)
      .then((data) => {
        if (mounted) setDashboard(data)
      })
      .catch((err: unknown) => {
        if (mounted) setLoi(err instanceof ApiError ? err.message : 'Không thể tải dữ liệu dashboard.')
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })

    return () => {
      mounted = false
    }
  }, [token, toaNhaId, tuNgay, denNgay, soLanTaiLai])

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

  const kpi = dashboard?.kpi

  return (
    <ScreenSurface
      data-testid="owner-dashboard-screen"
      data-layout-variant={mobile ? 'mobile' : 'desktop'}
      aria-labelledby="owner-dashboard-title"
      style={{ minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' }}
    >
      <ScreenHeader>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <SysLabel>DASHBOARD CHỦ NHÀ</SysLabel>
            <h2 id="owner-dashboard-title" style={{ margin: '6px 0 2px', fontSize: mobile ? 22 : 28 }}>
              Tổng quan kinh doanh & vận hành
            </h2>
            <p style={{ margin: 0, color: 'var(--ma-text-secondary)', fontSize: 14 }}>
              Số liệu kinh doanh, dòng tiền thực thu, tỷ lệ lấp đầy và đối soát điện nước các toà nhà.
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

      {/* FILTER CONTROLS */}
      <section
        aria-label="Bộ lọc dashboard"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          alignItems: 'flex-end',
          padding: '12px 16px',
          background: 'var(--ma-bg-card)',
          border: '1px solid var(--ma-border-default)',
          borderRadius: 8,
          marginBottom: 16,
        }}
      >
        <label style={{ display: 'grid', gap: 4, minWidth: mobile ? '100%' : 240 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Phạm vi toà nhà</span>
          <select
            value={toaNhaId ?? ''}
            onChange={(e) => setToaNhaId(e.target.value ? Number(e.target.value) : null)}
            style={styleInput}
            aria-label="Chọn toà nhà xem dashboard"
          >
            <option value="">Tất cả toà được phân quyền</option>
            {toaNhaList.map((tn) => (
              <option key={tn.id} value={tn.id}>
                {tn.ten}
              </option>
            ))}
          </select>
        </label>

        <div style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Khoảng thời gian</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => chonKyNhanh('thang_nay')}
              style={styleChip(quickPeriod === 'thang_nay')}
            >
              Tháng này
            </button>
            <button
              type="button"
              onClick={() => chonKyNhanh('thang_truoc')}
              style={styleChip(quickPeriod === 'thang_truoc')}
            >
              Tháng trước
            </button>
            <button
              type="button"
              onClick={() => chonKyNhanh('6_thang')}
              style={styleChip(quickPeriod === '6_thang')}
            >
              6 tháng gần nhất
            </button>
            <button
              type="button"
              onClick={() => chonKyNhanh('12_thang')}
              style={styleChip(quickPeriod === '12_thang')}
            >
              12 tháng
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: mobile ? 0 : 'auto', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span>Từ:</span>
            <input
              type="date"
              value={tuNgay}
              onChange={(e) => {
                setTuNgay(e.target.value)
                setQuickPeriod('6_thang')
              }}
              style={{ ...styleInput, padding: '4px 8px', fontSize: 13 }}
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span>Đến:</span>
            <input
              type="date"
              value={denNgay}
              onChange={(e) => {
                setDenNgay(e.target.value)
                setQuickPeriod('6_thang')
              }}
              style={{ ...styleInput, padding: '4px 8px', fontSize: 13 }}
            />
          </label>
        </div>
      </section>

      {/* ERROR NOTICE */}
      {loi ? (
        <div role="alert" style={{ marginBottom: 16 }}>
          <ScreenNotice tone="urgent">{loi}</ScreenNotice>
        </div>
      ) : null}

      {/* LOADING STATE */}
      {dangTai && !dashboard ? (
        <p aria-live="polite" style={{ padding: 24, textAlign: 'center', color: 'var(--ma-text-secondary)' }}>
          Đang tổng hợp dữ liệu dashboard…
        </p>
      ) : null}

      {dashboard && kpi ? (
        <>
          {/* TOP KPI CARDS */}
          <section
            aria-label="Chỉ số hoạt động chính"
            style={{
              display: 'grid',
              gridTemplateColumns: mobile ? '1fr' : 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
              marginBottom: 20,
            }}
          >
            {/* Card 1: Doanh thu phát hành */}
            <article
              style={styleKpiCard}
              onClick={() => dieuHuongToi(taoUrlDieuHuong('/bao-cao', { toaNhaId }))}
              title="Xem báo cáo doanh thu chi tiết"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styleKpiLabel}>Doanh thu phát hành</span>
                <span style={styleKpiUnit}>₫</span>
              </div>
              <strong style={styleKpiValue}>{dinhDangTien(kpi.doanhThuPhatHanh)}</strong>
              <div style={styleKpiSub}>Tổng hoá đơn phát hành trong kỳ</div>
            </article>

            {/* Card 2: Tiền thực thu */}
            <article
              style={styleKpiCard}
              onClick={() => dieuHuongToi(taoUrlDieuHuong('/thu-tien', { toaNhaId }))}
              title="Xem nhật ký thu tiền thực tế"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styleKpiLabel}>Dòng tiền thực thu</span>
                <StatusTag tone="done">Tiền về</StatusTag>
              </div>
              <strong style={{ ...styleKpiValue, color: 'var(--ma-accent)' }}>{dinhDangTien(kpi.thucThu)}</strong>
              <div style={styleKpiSub}>Tổng tiền thu thực tế theo ngày nộp</div>
            </article>

            {/* Card 3: Công nợ hiện tại */}
            <article
              style={{ ...styleKpiCard, borderColor: Number(kpi.congNoHienTai) > 0 ? 'var(--ma-border-warning, #f59e0b)' : 'var(--ma-border-default)' }}
              onClick={() => dieuHuongToi(taoUrlDieuHuong('/cong-no', { toaNhaId }))}
              title="Xem danh sách công nợ chi tiết"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styleKpiLabel}>Công nợ hiện tại</span>
                {kpi.soHoaDonQuaHan > 0 ? <StatusTag tone="urgent">{kpi.soHoaDonQuaHan} quá hạn</StatusTag> : <StatusTag tone="done">Tốt</StatusTag>}
              </div>
              <strong style={{ ...styleKpiValue, color: Number(kpi.congNoHienTai) > 0 ? 'var(--ma-urgent)' : 'inherit' }}>
                {dinhDangTien(kpi.congNoHienTai)}
              </strong>
              <div style={styleKpiSub}>Chưa thu tại thời điểm đối soát</div>
            </article>

            {/* Card 4: Tỷ lệ lấp đầy */}
            <article
              style={styleKpiCard}
              onClick={() => dieuHuongToi(taoUrlDieuHuong('/toa-nha', { toaNhaId }))}
              title="Xem danh mục toà nhà & phòng"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styleKpiLabel}>Tỷ lệ lấp đầy</span>
                <span style={styleKpiUnit}>%</span>
              </div>
              <strong style={{ ...styleKpiValue, color: 'var(--ma-brand-accent, #0D9488)' }}>{dinhDangSo(kpi.tyLeLapDay)}%</strong>
              <div style={styleKpiSub}>
                {kpi.soPhongDangThue} / {kpi.tongSoPhong} phòng đang thuê
              </div>
            </article>

            {/* Card 5: Phòng trống */}
            <article
              style={styleKpiCard}
              onClick={() => dieuHuongToi(taoUrlDieuHuong('/toa-nha', { toaNhaId }))}
              title="Xem danh mục toà nhà & phòng"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styleKpiLabel}>Phòng trống / Sửa</span>
                <StatusTag tone="waiting">{kpi.soPhongTrong} trống</StatusTag>
              </div>
              <strong style={styleKpiValue}>
                {kpi.soPhongTrong} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ma-text-secondary)' }}>/ {kpi.soPhongDangSua} sửa</span>
              </strong>
              <div style={styleKpiSub}>Sẵn sàng đón khách mới</div>
            </article>

            {/* Card 6: Chi phí bảo trì */}
            <article
              style={styleKpiCard}
              onClick={() => dieuHuongToi(taoUrlDieuHuong('/bao-cao/chi-phi-bao-tri', { toaNhaId }))}
              title="Xem báo cáo chi phí bảo trì"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styleKpiLabel}>Chi phí bảo trì</span>
                <span style={styleKpiUnit}>₫</span>
              </div>
              <strong style={styleKpiValue}>{dinhDangTien(kpi.chiPhiBaoTri)}</strong>
              <div style={styleKpiSub}>{kpi.soSuCoDangMo} sự cố đang xử lý</div>
            </article>
          </section>

          {/* TAB NAVIGATION */}
          <nav
            aria-label="Chuyển phân hệ dashboard"
            style={{
              display: 'flex',
              gap: 8,
              borderBottom: '2px solid var(--ma-border-default)',
              marginBottom: 20,
            }}
          >
            <button
              id={`${tabId}-tab-kd`}
              type="button"
              role="tab"
              aria-selected={tab === 'kinh-doanh'}
              aria-controls={`${tabId}-panel-kd`}
              onClick={() => setTab('kinh-doanh')}
              style={styleTabBtn(tab === 'kinh-doanh')}
            >
              Kinh doanh & phòng
            </button>
            <button
              id={`${tabId}-tab-dn`}
              type="button"
              role="tab"
              aria-selected={tab === 'dien-nuoc'}
              aria-controls={`${tabId}-panel-dn`}
              onClick={() => setTab('dien-nuoc')}
              style={styleTabBtn(tab === 'dien-nuoc')}
            >
              Điện nước & khu vực chung
            </button>
            <button
              id={`${tabId}-tab-vh`}
              type="button"
              role="tab"
              aria-selected={tab === 'van-hanh'}
              aria-controls={`${tabId}-panel-vh`}
              onClick={() => setTab('van-hanh')}
              style={styleTabBtn(tab === 'van-hanh')}
            >
              Vận hành & việc cần làm
            </button>
          </nav>

          {/* TAB 1: KINH DOANH & PHÒNG */}
          {tab === 'kinh-doanh' ? (
            <div id={`${tabId}-panel-kd`} role="tabpanel" aria-labelledby={`${tabId}-tab-kd`} style={{ display: 'grid', gap: 20 }}>
              {/* Row 1: Tài chính theo tháng & Cơ cấu phòng */}
              <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'minmax(0, 1.6fr) minmax(0, 1fr)', gap: 16 }}>
                {/* Chart 1: Tài chính theo tháng */}
                <section style={styleChartCard} aria-labelledby="chart-finance-title">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div>
                      <SysLabel>BIỂU ĐỒ TÀI CHÍNH</SysLabel>
                      <h4 id="chart-finance-title" style={{ margin: '4px 0 0', fontSize: 16 }}>
                        Doanh thu phát hành vs Dòng tiền thực thu
                      </h4>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => setHienBangDuLieu((v) => !v)}>
                      {hienBangDuLieu ? 'Xem biểu đồ' : 'Xem bảng'}
                    </Button>
                  </div>

                  {hienBangDuLieu ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                        <thead>
                          <tr style={{ borderBottom: '2px solid var(--ma-border-default)' }}>
                            <th style={{ padding: '8px 4px' }}>Tháng</th>
                            <th style={{ padding: '8px 4px', textAlign: 'right' }}>Phát hành (₫)</th>
                            <th style={{ padding: '8px 4px', textAlign: 'right' }}>Thực thu (₫)</th>
                            <th style={{ padding: '8px 4px', textAlign: 'right' }}>Công nợ kỳ (₫)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboard.taiChinhTheoThang.map((row) => (
                            <tr key={row.thang} style={{ borderBottom: '1px solid var(--ma-border-subtle)' }}>
                              <td style={{ padding: '8px 4px', fontWeight: 600 }}>{row.nhan}</td>
                              <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: 'var(--ma-font-mono)' }}>{dinhDangTien(row.doanhThuPhatHanh)}</td>
                              <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: 'var(--ma-font-mono)', color: 'var(--ma-accent)' }}>{dinhDangTien(row.thucThu)}</td>
                              <td style={{ padding: '8px 4px', textAlign: 'right', fontFamily: 'var(--ma-font-mono)', color: 'var(--ma-urgent)' }}>{dinhDangTien(row.congNo)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <BarChartFinance data={dashboard.taiChinhTheoThang} />
                  )}

                  <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--ma-text-secondary)', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 12, height: 12, background: 'var(--ma-primary, #1e3a8a)', borderRadius: 2 }} />
                      Doanh thu phát hành (ngày phát hành)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 12, height: 12, background: 'var(--ma-accent, #0d9488)', borderRadius: 2 }} />
                      Thực thu (ngày nộp tiền)
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 12, height: 12, background: 'var(--ma-urgent, #dc2626)', borderRadius: 2 }} />
                      Công nợ còn lại
                    </span>
                  </div>
                </section>

                {/* Chart 2: Cơ cấu trạng thái phòng */}
                <section style={styleChartCard} aria-labelledby="chart-room-status-title">
                  <SysLabel>CƠ CẤU PHÒNG</SysLabel>
                  <h4 id="chart-room-status-title" style={{ margin: '4px 0 14px', fontSize: 16 }}>
                    Hiện trạng khai thác căn hộ
                  </h4>

                  <RoomCompositionBar coCau={dashboard.coCauPhong} />

                  <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
                    <RoomLegendRow
                      color="var(--ma-accent, #0d9488)"
                      label="Đang thuê"
                      count={dashboard.coCauPhong.dangThue}
                      percent={dashboard.coCauPhong.tyLeDangThue}
                    />
                    <RoomLegendRow
                      color="var(--ma-border-warning, #f59e0b)"
                      label="Trống (sẵn sàng đón khách)"
                      count={dashboard.coCauPhong.trong}
                      percent={dashboard.coCauPhong.tyLeTrong}
                    />
                    <RoomLegendRow
                      color="var(--ma-urgent, #dc2626)"
                      label="Đang sửa chữa"
                      count={dashboard.coCauPhong.dangSua}
                      percent={dashboard.coCauPhong.tyLeDangSua}
                    />
                    <RoomLegendRow
                      color="var(--ma-text-secondary, #64748b)"
                      label="Ngừng khai thác / Khác"
                      count={dashboard.coCauPhong.ngung}
                      percent={dashboard.coCauPhong.tyLeNgung}
                    />
                  </div>
                </section>
              </div>

              {/* Row 2: So sánh các toà nhà & Tuổi nợ */}
              <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 16 }}>
                {/* Chart 3: So sánh các toà */}
                <section style={styleChartCard} aria-labelledby="chart-buildings-title">
                  <SysLabel>SO SÁNH TOÀ NHÀ</SysLabel>
                  <h4 id="chart-buildings-title" style={{ margin: '4px 0 14px', fontSize: 16 }}>
                    Hiệu quả kinh doanh giữa các toà được cấp quyền
                  </h4>

                  {dashboard.soSanhToaNha.length === 0 ? (
                    <EmptyState title="Chưa có toà nhà" body="Bạn chưa được phân quyền toà nhà nào." />
                  ) : (
                    <BuildingComparisonTable list={dashboard.soSanhToaNha} />
                  )}
                </section>

                {/* Chart 4: Tuổi nợ */}
                <section style={styleChartCard} aria-labelledby="chart-debt-aging-title">
                  <SysLabel>PHÂN TÍCH THU HỒI</SysLabel>
                  <h4 id="chart-debt-aging-title" style={{ margin: '4px 0 14px', fontSize: 16 }}>
                    Tuổi nợ hoá đơn tại thời điểm đối soát
                  </h4>

                  <DebtAgingBuckets tuoiNo={dashboard.tuoiNo} />
                </section>
              </div>
            </div>
          ) : null}

          {/* TAB 2: ĐIỆN NƯỚC & DÙNG CHUNG */}
          {tab === 'dien-nuoc' ? (
            <div id={`${tabId}-panel-dn`} role="tabpanel" aria-labelledby={`${tabId}-tab-dn`} style={{ display: 'grid', gap: 20 }}>
              {/* Tiêu thụ điện & nước */}
              <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'minmax(0, 1fr) minmax(0, 1fr)', gap: 16 }}>
                {/* Điện */}
                <section style={styleChartCard} aria-labelledby="chart-electricity-title">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <SysLabel>TIÊU THỤ ĐIỆN</SysLabel>
                      <h4 id="chart-electricity-title" style={{ margin: '4px 0 0', fontSize: 16 }}>
                        Điện năng tiêu thụ qua các kỳ
                      </h4>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ma-brand-accent, #0d9488)' }}>kWh</span>
                  </div>
                  <UtilityTrendBar series={dashboard.tieuThuDienNuoc.dien} donVi="kWh" color="var(--ma-brand-primary, #0f172a)" />
                </section>

                {/* Nước */}
                <section style={styleChartCard} aria-labelledby="chart-water-title">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <SysLabel>TIÊU THỤ NƯỚC</SysLabel>
                      <h4 id="chart-water-title" style={{ margin: '4px 0 0', fontSize: 16 }}>
                        Khối lượng nước qua các kỳ
                      </h4>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ma-accent)' }}>m³</span>
                  </div>
                  <UtilityTrendBar series={dashboard.tieuThuDienNuoc.nuoc} donVi="m³" color="var(--ma-accent, #0d9488)" />
                </section>
              </div>

              {/* Đối soát công tơ tổng & khu vực chung */}
              <section style={styleChartCard} aria-labelledby="reconciliation-panel-title">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                  <div>
                    <SysLabel>ĐỐI SOÁT & KHU VỰC CHUNG</SysLabel>
                    <h4 id="reconciliation-panel-title" style={{ margin: '4px 0 0', fontSize: 18 }}>
                      Đối soát công tơ tổng & Tiêu thụ khu vực chung
                    </h4>
                    {dashboard.dienNuocDungChung.doiSoat?.tenToaNha ? (
                      <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: 'var(--ma-brand-primary, #0f172a)' }}>
                        Toà nhà: {dashboard.dienNuocDungChung.doiSoat.tenToaNha} {dashboard.dienNuocDungChung.doiSoat.tenKy ? `· ${dashboard.dienNuocDungChung.doiSoat.tenKy}` : ''}
                      </p>
                    ) : null}
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ma-text-secondary)' }}>
                      Công thức chuẩn: <code style={{ fontFamily: 'var(--ma-font-mono)', color: 'var(--ma-brand-primary, #0f172a)' }}>Chênh lệch = Công tơ tổng − Tổng phòng − Khu vực chung đo riêng</code>
                    </p>
                  </div>

                  {dashboard.dienNuocDungChung.doiSoat ? (
                    <StatusTag
                      tone={
                        dashboard.dienNuocDungChung.doiSoat.trangThai === 'KHOP_DOI_SOAT'
                          ? 'done'
                          : dashboard.dienNuocDungChung.doiSoat.trangThai === 'CANH_BAO_THAT_THOAT'
                          ? 'urgent'
                          : 'waiting'
                      }
                    >
                      {dashboard.dienNuocDungChung.doiSoat.trangThai === 'KHOP_DOI_SOAT'
                        ? 'Khớp đối soát'
                        : dashboard.dienNuocDungChung.doiSoat.trangThai === 'CANH_BAO_THAT_THOAT'
                        ? 'Cảnh báo thất thoát'
                        : dashboard.dienNuocDungChung.doiSoat.trangThai === 'CHON_TOA_NHA'
                        ? 'Cần chọn toà nhà'
                        : 'Chưa đủ dữ liệu đối soát'}
                    </StatusTag>
                  ) : null}
                </div>

                {dashboard.dienNuocDungChung.doiSoat ? (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: mobile ? 'minmax(0, 1fr)' : 'repeat(4, minmax(0, 1fr))',
                      gap: 12,
                      padding: 12,
                      background: 'var(--ma-bg-sunken, #f8fafc)',
                      border: '1px solid var(--ma-border-subtle)',
                      borderRadius: 6,
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--ma-text-secondary)' }}>Công tơ tổng</span>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--ma-font-mono)' }}>
                        {dashboard.dienNuocDungChung.doiSoat.mucTong !== null ? `${dinhDangSo(dashboard.dienNuocDungChung.doiSoat.mucTong)} ${dashboard.dienNuocDungChung.doiSoat.donVi}` : 'Chưa có'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--ma-text-secondary)' }}>Tổng tiêu thụ phòng</span>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--ma-font-mono)' }}>
                        {dashboard.dienNuocDungChung.doiSoat.mucPhong !== null ? `${dinhDangSo(dashboard.dienNuocDungChung.doiSoat.mucPhong)} ${dashboard.dienNuocDungChung.doiSoat.donVi}` : 'Chưa có'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--ma-text-secondary)' }}>Khu vực chung đo riêng</span>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--ma-font-mono)' }}>
                        {dashboard.dienNuocDungChung.doiSoat.mucChungDoRieng !== null ? `${dinhDangSo(dashboard.dienNuocDungChung.doiSoat.mucChungDoRieng)} ${dashboard.dienNuocDungChung.doiSoat.donVi}` : '0.00'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: 12, color: 'var(--ma-text-secondary)' }}>Chênh lệch đối soát</span>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 700,
                          fontFamily: 'var(--ma-font-mono)',
                          color: dashboard.dienNuocDungChung.doiSoat.vuotNguong ? 'var(--ma-urgent)' : 'var(--ma-accent)',
                        }}
                      >
                        {dashboard.dienNuocDungChung.doiSoat.chenhLech !== null
                          ? `${dinhDangSo(dashboard.dienNuocDungChung.doiSoat.chenhLech)} ${dashboard.dienNuocDungChung.doiSoat.donVi}`
                          : '—'}
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Danh sách các điểm đo khu vực chung */}
                <h5 style={{ margin: '14px 0 8px', fontSize: 14 }}>Chi tiết các điểm đo khu vực chung</h5>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--ma-border-default)' }}>
                        <th style={{ padding: '8px 6px' }}>Mã công tơ</th>
                        <th style={{ padding: '8px 6px' }}>Tên điểm đo</th>
                        <th style={{ padding: '8px 6px' }}>Khu vực</th>
                        <th style={{ padding: '8px 6px', textAlign: 'right' }}>Tiêu thụ</th>
                        <th style={{ padding: '8px 6px', textAlign: 'right' }}>Đơn giá mua (₫)</th>
                        <th style={{ padding: '8px 6px', textAlign: 'right' }}>Chi phí ước tính (₫)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.dienNuocDungChung.khuVucChung.map((kv) => (
                        <tr key={kv.diemDoId} style={{ borderBottom: '1px solid var(--ma-border-subtle)' }}>
                          <td style={{ padding: '8px 6px', fontFamily: 'var(--ma-font-mono)' }}>{kv.maCongTo}</td>
                          <td style={{ padding: '8px 6px', fontWeight: 600 }}>{kv.tenCongTo}</td>
                          <td style={{ padding: '8px 6px' }}>{anhXaKhuVuc(kv.khuVuc)}</td>
                          <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'var(--ma-font-mono)' }}>
                            {dinhDangSo(kv.mucTieuThu)} {kv.donVi}
                          </td>
                          <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'var(--ma-font-mono)' }}>{dinhDangTien(kv.donGiaMua)}</td>
                          <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'var(--ma-font-mono)', fontWeight: 600 }}>{dinhDangTien(kv.chiPhi)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : null}

          {/* TAB 3: VẬN HÀNH & VIỆC CẦN LÀM */}
          {tab === 'van-hanh' ? (
            <div id={`${tabId}-panel-vh`} role="tabpanel" aria-labelledby={`${tabId}-tab-vh`} style={{ display: 'grid', gap: 20 }}>
              {/* Tái sử dụng Bảng việc vận hành */}
              <section style={styleChartCard}>
                <SysLabel>KHU HÀNH ĐỘNG</SysLabel>
                <h4 style={{ margin: '4px 0 14px', fontSize: 18 }}>Việc cần xử lý ngay theo phạm vi toà nhà</h4>
                <BangViecVanHanh token={token} mobile={mobile} toaNhaId={toaNhaId} />
              </section>

              {/* Chi phí bảo trì theo tháng */}
              <section style={styleChartCard} aria-labelledby="maintenance-chart-title">
                <SysLabel>LỊCH SỬ BẢO TRÌ</SysLabel>
                <h4 id="maintenance-chart-title" style={{ margin: '4px 0 14px', fontSize: 16 }}>
                  Chi phí bảo trì & sửa chữa đã nghiệm thu theo tháng
                </h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--ma-border-default)' }}>
                        <th style={{ padding: '8px 6px' }}>Tháng</th>
                        <th style={{ padding: '8px 6px', textAlign: 'right' }}>Số sự cố xử lý</th>
                        <th style={{ padding: '8px 6px', textAlign: 'right' }}>Chi phí ghi nhận (₫)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.chiPhiBaoTri.map((item) => (
                        <tr key={item.thang} style={{ borderBottom: '1px solid var(--ma-border-subtle)' }}>
                          <td style={{ padding: '8px 6px', fontWeight: 600 }}>{item.nhan}</td>
                          <td style={{ padding: '8px 6px', textAlign: 'right' }}>{item.soSuCo} sự cố</td>
                          <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'var(--ma-font-mono)', fontWeight: 600 }}>
                            {dinhDangTien(item.chiPhi)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          ) : null}
        </>
      ) : null}
    </ScreenSurface>
  )
}

/* =========================================================================
 * HELPER CHART & PRESENTATIONAL SUBCOMPONENTS
 * ========================================================================= */

function BarChartFinance({ data }: { data: DashboardData['taiChinhTheoThang'] }) {
  const maxVal = Math.max(
    ...data.map((d) => Math.max(Number(d.doanhThuPhatHanh), Number(d.thucThu), Number(d.congNo))),
    1
  )

  return (
    <div
      role="group"
      aria-label="Biểu đồ tài chính theo tháng"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(0, 1fr))`,
        gap: 8,
        alignItems: 'flex-end',
        height: 180,
        padding: '12px 4px 4px',
        borderBottom: '1px solid var(--ma-border-default)',
        minWidth: 0,
      }}
    >
      {data.map((item) => {
        const hPhatHanh = Math.max(Math.round((Number(item.doanhThuPhatHanh) / maxVal) * 100), 2)
        const hThucThu = Math.max(Math.round((Number(item.thucThu) / maxVal) * 100), 2)
        const hCongNo = Math.max(Math.round((Number(item.congNo) / maxVal) * 100), 2)

        return (
          <div key={item.thang} style={{ display: 'grid', justifyItems: 'center', gap: 4, height: '100%', alignItems: 'flex-end', minWidth: 0 }}>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: '100%', width: '100%', justifyContent: 'center' }}>
              <div
                title={`Phát hành: ${dinhDangTien(item.doanhThuPhatHanh)} ₫`}
                style={{ width: '28%', height: `${hPhatHanh}%`, background: 'var(--ma-brand-primary, #0F172A)', borderRadius: '2px 2px 0 0' }}
              />
              <div
                title={`Thực thu: ${dinhDangTien(item.thucThu)} ₫`}
                style={{ width: '28%', height: `${hThucThu}%`, background: 'var(--ma-accent, #0d9488)', borderRadius: '2px 2px 0 0' }}
              />
              <div
                title={`Công nợ: ${dinhDangTien(item.congNo)} ₫`}
                style={{ width: '28%', height: `${hCongNo}%`, background: 'var(--ma-urgent, #dc2626)', borderRadius: '2px 2px 0 0' }}
              />
            </div>
            <span style={{ fontSize: 11, color: 'var(--ma-text-secondary)', whiteSpace: 'nowrap' }}>{item.nhan}</span>
          </div>
        )
      })}
    </div>
  )
}

function RoomCompositionBar({ coCau }: { coCau: DashboardData['coCauPhong'] }) {
  return (
    <div
      role="group"
      aria-label={`Cơ cấu phòng: ${coCau.dangThue} đang thuê, ${coCau.trong} trống, ${coCau.dangSua} đang sửa`}
      style={{
        display: 'flex',
        height: 22,
        borderRadius: 4,
        overflow: 'hidden',
        background: 'var(--ma-bg-sunken, #f1f5f9)',
      }}
    >
      {Number(coCau.tyLeDangThue) > 0 ? (
        <div
          title={`Đang thuê: ${coCau.dangThue} phòng (${coCau.tyLeDangThue}%)`}
          style={{ width: `${coCau.tyLeDangThue}%`, background: 'var(--ma-accent, #0d9488)' }}
        />
      ) : null}
      {Number(coCau.tyLeTrong) > 0 ? (
        <div
          title={`Trống: ${coCau.trong} phòng (${coCau.tyLeTrong}%)`}
          style={{ width: `${coCau.tyLeTrong}%`, background: 'var(--ma-border-warning, #f59e0b)' }}
        />
      ) : null}
      {Number(coCau.tyLeDangSua) > 0 ? (
        <div
          title={`Đang sửa: ${coCau.dangSua} phòng (${coCau.tyLeDangSua}%)`}
          style={{ width: `${coCau.tyLeDangSua}%`, background: 'var(--ma-urgent, #dc2626)' }}
        />
      ) : null}
      {Number(coCau.tyLeNgung) > 0 ? (
        <div
          title={`Ngừng khai thác: ${coCau.ngung} phòng (${coCau.tyLeNgung}%)`}
          style={{ width: `${coCau.tyLeNgung}%`, background: 'var(--ma-text-secondary, #64748b)' }}
        />
      ) : null}
    </div>
  )
}

function RoomLegendRow({ color, label, count, percent }: { color: string; label: string; count: number; percent: number | string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        <span>{label}</span>
      </span>
      <span>
        <strong>{count}</strong> <span style={{ color: 'var(--ma-text-secondary)', fontSize: 12 }}>({percent}%)</span>
      </span>
    </div>
  )
}

function BuildingComparisonTable({ list }: { list: DashboardData['soSanhToaNha'] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--ma-border-default)' }}>
            <th style={{ padding: '8px 6px' }}>Toà nhà</th>
            <th style={{ padding: '8px 6px', textAlign: 'right' }}>Lấp đầy</th>
            <th style={{ padding: '8px 6px', textAlign: 'right' }}>Phát hành (₫)</th>
            <th style={{ padding: '8px 6px', textAlign: 'right' }}>Thực thu (₫)</th>
            <th style={{ padding: '8px 6px', textAlign: 'right' }}>Công nợ (₫)</th>
          </tr>
        </thead>
        <tbody>
          {list.map((row) => (
            <tr key={row.toaNhaId} style={{ borderBottom: '1px solid var(--ma-border-subtle)' }}>
              <td style={{ padding: '8px 6px', fontWeight: 600 }}>{row.tenToaNha}</td>
              <td style={{ padding: '8px 6px', textAlign: 'right' }}>
                <span style={{ fontWeight: 700, color: 'var(--ma-brand-accent, #0D9488)' }}>{dinhDangSo(row.tyLeLapDay)}%</span>
                <span style={{ fontSize: 11, color: 'var(--ma-text-secondary)', display: 'block' }}>
                  {row.soPhongDangThue}/{row.tongSoPhong}
                </span>
              </td>
              <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'var(--ma-font-mono)' }}>{dinhDangTien(row.doanhThuPhatHanh)}</td>
              <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'var(--ma-font-mono)', color: 'var(--ma-accent)' }}>{dinhDangTien(row.thucThu)}</td>
              <td style={{ padding: '8px 6px', textAlign: 'right', fontFamily: 'var(--ma-font-mono)', color: Number(row.congNo) > 0 ? 'var(--ma-urgent)' : 'inherit' }}>
                {dinhDangTien(row.congNo)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DebtAgingBuckets({ tuoiNo }: { tuoiNo: DashboardData['tuoiNo'] }) {
  const buckets = [
    { label: 'Chưa đến hạn', count: tuoiNo.chuaDenHan.soLuong, amount: tuoiNo.chuaDenHan.soTien, tone: 'done' as const },
    { label: 'Quá hạn 1–7 ngày', count: tuoiNo.quaHan1Den7.soLuong, amount: tuoiNo.quaHan1Den7.soTien, tone: 'waiting' as const },
    { label: 'Quá hạn 8–30 ngày', count: tuoiNo.quaHan8Den30.soLuong, amount: tuoiNo.quaHan8Den30.soTien, tone: 'urgent' as const },
    { label: 'Quá hạn > 30 ngày', count: tuoiNo.quaHanTren30.soLuong, amount: tuoiNo.quaHanTren30.soTien, tone: 'urgent' as const },
  ]

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      {buckets.map((b) => (
        <div
          key={b.label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 10px',
            background: 'var(--ma-bg-sunken, #f8fafc)',
            border: '1px solid var(--ma-border-subtle)',
            borderRadius: 6,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{b.label}</div>
            <div style={{ fontSize: 12, color: 'var(--ma-text-secondary)' }}>{b.count} hoá đơn</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontFamily: 'var(--ma-font-mono)', fontWeight: 700, fontSize: 14 }}>{dinhDangTien(b.amount)} ₫</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function UtilityTrendBar({
  series,
  donVi,
  color,
}: {
  series: DashboardData['tieuThuDienNuoc']['dien']
  donVi: string
  color: string
}) {
  const maxVal = Math.max(...series.map((s) => Number(s.tong)), 1)

  return (
    <div style={{ marginTop: 12 }}>
      <div
        role="group"
        aria-label={`Biểu đồ tiêu thụ đơn vị ${donVi}`}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(series.length, 1)}, minmax(0, 1fr))`,
          gap: 8,
          alignItems: 'flex-end',
          height: 140,
          borderBottom: '1px solid var(--ma-border-default)',
          paddingBottom: 4,
          minWidth: 0,
        }}
      >
        {series.map((s, idx) => {
          const h = Math.max(Math.round((Number(s.tong) / maxVal) * 100), 4)
          return (
            <div key={idx} style={{ display: 'grid', justifyItems: 'center', gap: 4, height: '100%', alignItems: 'flex-end' }}>
              <div
                title={`${s.nhan}: Tổng ${dinhDangSo(s.tong)} ${donVi}`}
                style={{ width: '60%', height: `${h}%`, background: color, borderRadius: '2px 2px 0 0' }}
              />
              <span style={{ fontSize: 11, color: 'var(--ma-text-secondary)', whiteSpace: 'nowrap' }}>{s.nhan}</span>
            </div>
          )
        })}
      </div>
    </div>
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

const styleChip = (selected: boolean): React.CSSProperties => ({
  padding: '4px 10px',
  borderRadius: 16,
  border: `1px solid ${selected ? 'var(--ma-brand-primary, #0F172A)' : 'var(--ma-border-default)'}`,
  background: selected ? 'var(--ma-brand-primary, #0F172A)' : 'transparent',
  color: selected ? '#ffffff' : 'inherit',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
})

const styleTabBtn = (active: boolean): React.CSSProperties => ({
  padding: '8px 14px',
  background: 'transparent',
  border: 'none',
  borderBottom: active ? '3px solid var(--ma-brand-accent, #0D9488)' : '3px solid transparent',
  color: active ? 'var(--ma-brand-accent, #0D9488)' : 'var(--ma-text-secondary)',
  fontWeight: active ? 700 : 500,
  fontSize: 14,
  cursor: 'pointer',
  marginBottom: -2,
})

const styleKpiCard: React.CSSProperties = {
  display: 'grid',
  gap: 4,
  padding: '12px 14px',
  background: 'var(--ma-bg-card)',
  border: '1px solid var(--ma-border-default)',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'transform 0.1s ease',
}

const styleKpiLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--ma-text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: 0.5,
}

const styleKpiUnit: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: 'var(--ma-text-secondary)',
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

const styleChartCard: React.CSSProperties = {
  padding: 16,
  background: 'var(--ma-bg-card)',
  border: '1px solid var(--ma-border-default)',
  borderRadius: 8,
  minWidth: 0,
  overflowX: 'auto',
}

function layNgayDinhDang(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
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

function anhXaKhuVuc(code: string): string {
  switch (code) {
    case 'HANH_LANG':
      return 'Hành lang & cầu thang'
    case 'THANG_MAY':
      return 'Thang máy'
    case 'MAY_BOM':
      return 'Máy bơm cấp nước'
    case 'GIAT_LA':
      return 'Khu giặt chung'
    case 'BAI_XE':
      return 'Bãi gửi xe'
    default:
      return 'Khu vực chung'
  }
}

