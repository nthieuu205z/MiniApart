import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  fetchThoCongViec,
  fetchThoChungTu,
  fetchThoTongQuan,
  type ThongTinViecThoRow,
  type ChungTuThanhToanTho,
  type ToaNhaOption,
} from './workerDashboardApi'
import { dinhDangTien } from './design/core/format'
import { Button } from './design/core/Button'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { EmptyState } from './design/feedback/EmptyState'
import { useDialogTrap } from './design/feedback/useDialogTrap'

export type ThoChiPhiProps = {
  token: string
  mobile?: boolean
  onNavigateToTicket?: (ticketId: number) => void
}

export function ThoChiPhi({ token, mobile = false, onNavigateToTicket }: ThoChiPhiProps): React.ReactElement {
  const [danhSach, setDanhSach] = useState<ThongTinViecThoRow[]>([])
  const [danhSachToa, setDanhSachToa] = useState<ToaNhaOption[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loiTai, setLoiTai] = useState<string | null>(null)

  // Filters
  const [toaNhaId, setToaNhaId] = useState<number | undefined>(undefined)
  const [locThanhToan, setLocThanhToan] = useState<'TAT_CA' | 'DA_TRA_DU' | 'TRA_MOT_PHAN' | 'CHUA_TRA' | 'BAO_HANH_0D' | 'CHUA_BAO_GIA'>('TAT_CA')
  const [tuKhoa, setTuKhoa] = useState('')

  // Voucher modal state
  const [voucherData, setVoucherData] = useState<ChungTuThanhToanTho | null>(null)
  const [dangTaiVoucher, setDangTaiVoucher] = useState(false)
  const [loiVoucher, setLoiVoucher] = useState<string | null>(null)
  const voucherRef = useRef<HTMLDivElement | null>(null)

  useDialogTrap({
    open: Boolean(voucherData),
    dialogRef: voucherRef,
    onClose: () => setVoucherData(null),
  })

  // Load buildings & summary from TongQuan
  useEffect(() => {
    let active = true
    fetchThoTongQuan(token)
      .then((data) => {
        if (!active) return
        setDanhSachToa(data.danhSachToa || [])
      })
      .catch(() => {
        // Fallback: don't block
      })
    return () => {
      active = false
    }
  }, [token])

  // Load all jobs
  const taiDuLieu = useCallback(async () => {
    setDangTai(true)
    setLoiTai(null)
    try {
      const rows = await fetchThoCongViec(token, {
        toaNhaId,
        tuKhoa: tuKhoa.trim() || undefined,
      })
      setDanhSach(rows)
    } catch (err: unknown) {
      setLoiTai(err instanceof Error ? err.message : 'Không thể tải danh sách chi phí')
    } finally {
      setDangTai(false)
    }
  }, [token, toaNhaId, tuKhoa])

  useEffect(() => {
    taiDuLieu()
  }, [taiDuLieu])

  // Client filtering on payment category
  const danhSachLoc = useMemo(() => {
    return danhSach.filter((row) => {
      const giaTri = Number(row.giaTriBaoGia || 0)
      const daTra = Number(row.daThanhToan || 0)
      const conLai = Number(row.conPhaiTra || 0)
      const coBaoGiaDuyet = row.trangThaiBaoGia === 'DA_DUYET'

      if (locThanhToan === 'TAT_CA') return true
      if (locThanhToan === 'CHUA_BAO_GIA') return !coBaoGiaDuyet
      if (locThanhToan === 'BAO_HANH_0D') return coBaoGiaDuyet && giaTri === 0
      if (locThanhToan === 'DA_TRA_DU') return coBaoGiaDuyet && giaTri > 0 && conLai <= 0
      if (locThanhToan === 'TRA_MOT_PHAN') return coBaoGiaDuyet && daTra > 0 && conLai > 0
      if (locThanhToan === 'CHUA_TRA') return coBaoGiaDuyet && giaTri > 0 && daTra === 0
      return true
    })
  }, [danhSach, locThanhToan])

  // Metrics
  const tongMetrics = useMemo(() => {
    let tongChot = 0
    let tongDaNhan = 0
    let tongConNo = 0
    let soDonBaoHanh = 0
    let soDonDaTraDu = 0

    danhSach.forEach((r) => {
      if (r.trangThaiBaoGia === 'DA_DUYET') {
        const val = Number(r.giaTriBaoGia || 0)
        const paid = Number(r.daThanhToan || 0)
        const remain = Number(r.conPhaiTra || 0)
        tongChot += val
        tongDaNhan += paid
        tongConNo += remain
        if (val === 0) soDonBaoHanh++
        if (val > 0 && remain <= 0) soDonDaTraDu++
      }
    })

    return { tongChot, tongDaNhan, tongConNo, soDonBaoHanh, soDonDaTraDu }
  }, [danhSach])

  const moChungTu = async (yeuCauId: number) => {
    setDangTaiVoucher(true)
    setLoiVoucher(null)
    try {
      const ct = await fetchThoChungTu(token, yeuCauId)
      setVoucherData(ct)
    } catch (err: unknown) {
      setLoiVoucher(err instanceof Error ? err.message : 'Không thể tải chứng từ thanh toán')
    } finally {
      setDangTaiVoucher(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <SysLabel tone="primary">BÁO GIÁ & THANH TOÁN</SysLabel>
            <span style={styles.headerSubtitle}>Quản lý chi phí vật tư, công thợ & chứng từ đối soát</span>
          </div>
          <h1 style={styles.headerTitle}>Hồ sơ Báo giá & Quyết toán công thợ</h1>
        </div>
        <div style={styles.headerActions}>
          <Button variant="secondary" onClick={taiDuLieu} blocked={dangTai}>
            {dangTai ? 'Đang làm mới...' : '↻ Làm mới dữ liệu'}
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>TỔNG GIÁ TRỊ ĐÃ CHỐT</span>
          <div style={styles.kpiValueHighlight}>{dinhDangTien(tongMetrics.tongChot)}</div>
          <span style={styles.kpiHint}>Tính trên các phiên bản báo giá đã được duyệt</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>TIỀN ĐÃ NHẬN</span>
          <div style={{ ...styles.kpiValueHighlight, color: 'var(--color-success, #16a34a)' }}>
            {dinhDangTien(tongMetrics.tongDaNhan)}
          </div>
          <span style={styles.kpiHint}>Tổng giao dịch thanh toán quản lý đã xác nhận</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>CÒN PHẢI TRẢ (CÔNG NỢ)</span>
          <div
            style={{
              ...styles.kpiValueHighlight,
              color: tongMetrics.tongConNo > 0 ? 'var(--color-warning, #ea580c)' : 'var(--color-muted, #64748b)',
            }}
          >
            {dinhDangTien(tongMetrics.tongConNo)}
          </div>
          <span style={styles.kpiHint}>Khoản thợ được nhận sau khi nghiệm thu</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>ĐƠN ĐÃ ĐỐI SOÁT XONG</span>
          <div style={styles.kpiValueCount}>
            <span style={{ color: 'var(--color-success, #16a34a)', fontWeight: 700 }}>{tongMetrics.soDonDaTraDu}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--color-muted, #64748b)', fontWeight: 'normal' }}>
              {' '}+ {tongMetrics.soDonBaoHanh} đơn 0đ (bảo hành)
            </span>
          </div>
          <span style={styles.kpiHint}>Không còn công nợ phát sinh</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={styles.filterBar}>
        <div style={styles.searchBox}>
          <input
            type="text"
            placeholder="Tìm theo mã việc, tòa, phòng, nội dung..."
            value={tuKhoa}
            onChange={(e) => setTuKhoa(e.target.value)}
            style={styles.searchInput}
          />
          {tuKhoa && (
            <button type="button" onClick={() => setTuKhoa('')} style={styles.clearBtn} aria-label="Xóa từ khóa">
              ✕
            </button>
          )}
        </div>

        <select
          value={toaNhaId ?? ''}
          onChange={(e) => setToaNhaId(e.target.value ? Number(e.target.value) : undefined)}
          style={styles.select}
          aria-label="Chọn tòa nhà"
        >
          <option value="">Tất cả tòa nhà</option>
          {danhSachToa.map((t) => (
            <option key={t.id} value={t.id}>
              {t.ten}
            </option>
          ))}
        </select>

        <div style={styles.tabPills}>
          {[
            { id: 'TAT_CA', label: 'Tất cả' },
            { id: 'DA_TRA_DU', label: 'Đã nhận đủ' },
            { id: 'TRA_MOT_PHAN', label: 'Trả một phần' },
            { id: 'CHUA_TRA', label: 'Chưa thanh toán' },
            { id: 'BAO_HANH_0D', label: 'Bảo hành (0đ)' },
            { id: 'CHUA_BAO_GIA', label: 'Chưa chốt giá' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLocThanhToan(tab.id as typeof locThanhToan)}
              style={{
                ...styles.tabPill,
                ...(locThanhToan === tab.id ? styles.tabPillActive : {}),
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {dangTai && (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <span>Đang tải danh sách báo giá & thanh toán...</span>
        </div>
      )}

      {loiTai && (
        <div style={styles.errorBanner}>
          <span>{loiTai}</span>
          <Button variant="secondary" onClick={taiDuLieu} style={{ marginLeft: 12 }}>
            Thử lại
          </Button>
        </div>
      )}

      {!dangTai && !loiTai && danhSachLoc.length === 0 && (
        <EmptyState
          title="Không tìm thấy bản ghi nào"
          body={
            tuKhoa || toaNhaId || locThanhToan !== 'TAT_CA'
              ? 'Thử thay đổi bộ lọc hoặc xóa từ khóa tìm kiếm để xem danh sách.'
              : 'Hiện tại bạn chưa có yêu cầu sửa chữa nào có hồ sơ báo giá.'
          }
        />
      )}

      {!dangTai && !loiTai && danhSachLoc.length > 0 && (
        <>
          {/* Desktop Table View */}
          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>MÃ VIỆC & HẠNG MỤC</th>
                  <th style={styles.th}>TÒA / PHÒNG</th>
                  <th style={styles.th}>TRẠNG THÁI VIỆC</th>
                  <th style={styles.th}>TÌNH TRẠNG BÁO GIÁ</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>GIÁ TRỊ DUYỆT</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>ĐÃ NHẬN</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>CÒN LẠI</th>
                  <th style={styles.th}>TIẾN ĐỘ CHI TRẢ</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>THAO TÁC</th>
                </tr>
              </thead>
              <tbody>
                {danhSachLoc.map((row) => {
                  const giaTri = Number(row.giaTriBaoGia || 0)
                  const daTra = Number(row.daThanhToan || 0)
                  const conLai = Number(row.conPhaiTra || 0)
                  const daDuyet = row.trangThaiBaoGia === 'DA_DUYET'

                  return (
                    <tr key={row.id} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.ticketCode}>{row.maYeuCau}</div>
                        <div style={styles.ticketTitle}>{row.hangMuc}</div>
                        <div style={styles.ticketDesc}>{row.moTa}</div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.roomBadge}>
                          {row.soPhong} (T{row.tang})
                        </div>
                        <div style={styles.buildingName}>{row.toaNha}</div>
                      </td>
                      <td style={styles.td}>
                        <StatusTag
                          tone={
                            row.trangThaiHieuLuc === 'DA_DONG'
                              ? 'done'
                              : row.trangThaiHieuLuc === 'DANG_XU_LY'
                              ? 'waiting'
                              : row.trangThaiHieuLuc === 'CHO_XAC_NHAN'
                              ? 'waiting'
                              : 'neutral'
                          }
                        >
                          {row.tenTrangThaiHieuLuc || row.tenTrangThai}
                        </StatusTag>
                      </td>
                      <td style={styles.td}>
                        {daDuyet ? (
                          <StatusTag tone="done">Đã duyệt hiệu lực</StatusTag>
                        ) : row.trangThaiBaoGia === 'CHO_DUYET' ? (
                          <StatusTag tone="waiting">Chờ quản lý duyệt</StatusTag>
                        ) : row.trangThaiBaoGia === 'TU_CHOI' ? (
                          <StatusTag tone="urgent">Bị từ chối</StatusTag>
                        ) : row.trangThaiBaoGia === 'NHAP' ? (
                          <StatusTag tone="draft">Bản nháp</StatusTag>
                        ) : (
                          <span style={styles.textMuted}>Chưa tạo báo giá</span>
                        )}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        {daDuyet ? (
                          giaTri === 0 ? (
                            <span style={styles.zeroCostBadge}>0 đ (Bảo hành)</span>
                          ) : (
                            <span style={styles.valApproved}>{dinhDangTien(giaTri)}</span>
                          )
                        ) : (
                          <span style={styles.textMuted}>—</span>
                        )}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        {daTra > 0 ? (
                          <span style={styles.valPaid}>{dinhDangTien(daTra)}</span>
                        ) : (
                          <span style={styles.textMuted}>0 đ</span>
                        )}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right' }}>
                        {daDuyet ? (
                          conLai > 0 ? (
                            <span style={styles.valRemain}>{dinhDangTien(conLai)}</span>
                          ) : (
                            <span style={styles.valSettled}>Đã hết nợ</span>
                          )
                        ) : (
                          <span style={styles.textMuted}>—</span>
                        )}
                      </td>
                      <td style={styles.td}>
                        {daDuyet ? (
                          giaTri === 0 ? (
                            <StatusTag tone="neutral">Đối soát 0đ</StatusTag>
                          ) : conLai <= 0 ? (
                            <StatusTag tone="done">Đã thanh toán đủ</StatusTag>
                          ) : daTra > 0 ? (
                            <StatusTag tone="waiting">Đã trả 1 phần</StatusTag>
                          ) : (
                            <StatusTag tone="urgent">Chưa thanh toán</StatusTag>
                          )
                        ) : (
                          <span style={styles.textMuted}>Chưa duyệt</span>
                        )}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <div style={styles.actionCell}>
                          {daDuyet && (
                            <Button
                              variant="secondary"
                              onClick={() => moChungTu(row.id)}
                              blocked={dangTaiVoucher}
                              style={styles.btnSmall}
                            >
                              📄 Xem phiếu
                            </Button>
                          )}
                          {onNavigateToTicket && (
                            <Button
                              variant="text"
                              onClick={() => onNavigateToTicket(row.id)}
                              style={styles.btnSmall}
                            >
                              Chi tiết đơn →
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Voucher Viewer Dialog */}
      {voucherData && (
        <div style={styles.modalOverlay}>
          <div ref={voucherRef} style={styles.voucherDialog} role="dialog" aria-modal="true" aria-label="Phiếu xác nhận thanh toán & chi phí">
            <div style={styles.voucherHeaderBar}>
              <style>{`
                @media print {
                  body * { visibility: hidden !important; }
                  #printable-voucher, #printable-voucher * { visibility: visible !important; }
                  #printable-voucher {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    padding: 20px !important;
                    margin: 0 !important;
                    box-shadow: none !important;
                    background: #ffffff !important;
                  }
                }
              `}</style>
              <div style={styles.voucherHeaderLeft}>
                <span style={styles.voucherDocType}>PHIẾU CHI PHÍ & THANH TOÁN SỬA CHỮA</span>
                <span style={styles.voucherDocCode}>Số: {voucherData.maChungTu}</span>
              </div>
              <div style={styles.voucherHeaderActions}>
                <Button variant="primary" onClick={handlePrint} style={{ marginRight: 8 }}>
                  🖨 In phiếu
                </Button>
                <Button variant="secondary" onClick={() => setVoucherData(null)}>
                  ✕ Đóng
                </Button>
              </div>
            </div>

            {/* Printable Document Sheet */}
            <div style={styles.printableSheet} id="printable-voucher">
              {/* Header */}
              <div style={styles.voucherSheetTop}>
                <div>
                  <div style={styles.brandTitle}>HỆ THỐNG QUẢN LÝ CĂN HỘ CHUNG CƯ MINIAPART</div>
                  <div style={styles.brandAddress}>Bộ phận Kỹ thuật & Bảo trì căn hộ dịch vụ</div>
                </div>
                <div style={styles.sheetMeta}>
                  <div><strong>Mã chứng từ:</strong> {voucherData.maChungTu}</div>
                  <div><strong>Ngày lập:</strong> {voucherData.ngayLap}</div>
                  <div><strong>Mã yêu cầu:</strong> {voucherData.maYeuCau}</div>
                </div>
              </div>

              <div style={styles.sheetDivider} />

              <h2 style={styles.sheetTitle}>PHIẾU XÁC NHẬN CHI PHÍ & THANH TOÁN SỬA CHỮA</h2>
              <p style={styles.sheetSubtitle}>
                (Dùng cho đối soát nội bộ công tác bảo trì kỹ thuật giữa Ban quản lý và Thợ thi công)
              </p>

              {/* Information Grid */}
              <div style={styles.sheetInfoGrid}>
                <div style={styles.sheetInfoCol}>
                  <div style={styles.sheetSectionTitle}>1. ĐỊA ĐIỂM & SỰ CỐ</div>
                  <div style={styles.sheetInfoRow}>
                    <span style={styles.sheetInfoLabel}>Tòa nhà:</span>
                    <span>{voucherData.toaNha}</span>
                  </div>
                  <div style={styles.sheetInfoRow}>
                    <span style={styles.sheetInfoLabel}>Địa chỉ:</span>
                    <span>{voucherData.diaChiToaNha || 'Chưa cập nhật địa chỉ'}</span>
                  </div>
                  <div style={styles.sheetInfoRow}>
                    <span style={styles.sheetInfoLabel}>Vị trí:</span>
                    <span>Phòng {voucherData.soPhong} (Tầng {voucherData.tang})</span>
                  </div>
                  <div style={styles.sheetInfoRow}>
                    <span style={styles.sheetInfoLabel}>Hạng mục:</span>
                    <strong>{voucherData.hangMuc}</strong>
                  </div>
                </div>

                <div style={styles.sheetInfoCol}>
                  <div style={styles.sheetSectionTitle}>2. CÁC BÊN LIÊN QUAN</div>
                  <div style={styles.sheetInfoRow}>
                    <span style={styles.sheetInfoLabel}>Thợ phụ trách:</span>
                    <span><strong>{voucherData.tenTho}</strong> ({voucherData.sdtTho})</span>
                  </div>
                  <div style={styles.sheetInfoRow}>
                    <span style={styles.sheetInfoLabel}>Quản lý duyệt:</span>
                    <span><strong>{voucherData.tenQuanLy}</strong> ({voucherData.sdtQuanLy})</span>
                  </div>
                  <div style={styles.sheetInfoRow}>
                    <span style={styles.sheetInfoLabel}>Người báo:</span>
                    <span>{voucherData.tenNguoiBao} ({voucherData.sdtNguoiBao})</span>
                  </div>
                  <div style={styles.sheetInfoRow}>
                    <span style={styles.sheetInfoLabel}>Trạng thái đơn:</span>
                    <span>{voucherData.trangThaiYeuCau}</span>
                  </div>
                </div>
              </div>

              {/* Cost Items Table */}
              <div style={{ marginTop: 20 }}>
                <div style={styles.sheetSectionTitle}>
                  3. CHI TIẾT BÁO GIÁ VẬT TƯ & NHÂN CÔNG ĐÃ DUYỆT (Phiên bản v{voucherData.baoGiaPhienBan})
                </div>
                <table style={styles.voucherItemsTable}>
                  <thead>
                    <tr style={styles.voucherItemsThRow}>
                      <th style={{ ...styles.voucherItemTh, width: 40, textAlign: 'center' }}>STT</th>
                      <th style={styles.voucherItemTh}>Tên hạng mục / Vật tư / Nhân công</th>
                      <th style={{ ...styles.voucherItemTh, width: 70, textAlign: 'right' }}>Số lượng</th>
                      <th style={{ ...styles.voucherItemTh, width: 70, textAlign: 'center' }}>Đơn vị</th>
                      <th style={{ ...styles.voucherItemTh, width: 110, textAlign: 'right' }}>Đơn giá (VNĐ)</th>
                      <th style={{ ...styles.voucherItemTh, width: 120, textAlign: 'right' }}>Thành tiền (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voucherData.dongBaoGia && voucherData.dongBaoGia.length > 0 ? (
                      voucherData.dongBaoGia.map((dong, idx) => (
                        <tr key={idx} style={styles.voucherItemsTr}>
                          <td style={{ ...styles.voucherItemTd, textAlign: 'center' }}>{dong.thuTu || idx + 1}</td>
                          <td style={styles.voucherItemTd}>{dong.tenHangMuc}</td>
                          <td style={{ ...styles.voucherItemTd, textAlign: 'right' }}>{dong.soLuong}</td>
                          <td style={{ ...styles.voucherItemTd, textAlign: 'center' }}>{dong.donVi}</td>
                          <td style={{ ...styles.voucherItemTd, textAlign: 'right' }}>{dinhDangTien(dong.donGia)}</td>
                          <td style={{ ...styles.voucherItemTd, textAlign: 'right', fontWeight: 600 }}>
                            {dinhDangTien(dong.thanhTien)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ ...styles.voucherItemTd, textAlign: 'center', color: '#64748b' }}>
                          Không có danh mục chi phí hoặc đơn sửa chữa bảo hành (0 đ).
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={styles.voucherItemsFootRow}>
                      <td colSpan={5} style={{ ...styles.voucherItemTd, textAlign: 'right', fontWeight: 700 }}>
                        TỔNG GIÁ TRỊ PHÊ DUYỆT:
                      </td>
                      <td style={{ ...styles.voucherItemTd, textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                        {dinhDangTien(voucherData.tongTienBaoGia)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment History */}
              <div style={{ marginTop: 20 }}>
                <div style={styles.sheetSectionTitle}>4. LỊCH SỬ GIAO DỊCH THANH TOÁN CHO THỢ</div>
                {voucherData.lichSuThanhToan && voucherData.lichSuThanhToan.length > 0 ? (
                  <table style={styles.voucherItemsTable}>
                    <thead>
                      <tr style={styles.voucherItemsThRow}>
                        <th style={{ ...styles.voucherItemTh, width: 130 }}>Thời điểm</th>
                        <th style={{ ...styles.voucherItemTh, width: 100 }}>Mã GD</th>
                        <th style={{ ...styles.voucherItemTh, width: 120 }}>Phương thức</th>
                        <th style={styles.voucherItemTh}>Mã tham chiếu</th>
                        <th style={{ ...styles.voucherItemTh, width: 130, textAlign: 'right' }}>Số tiền (VNĐ)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voucherData.lichSuThanhToan.map((tt) => (
                        <tr key={tt.id} style={styles.voucherItemsTr}>
                          <td style={styles.voucherItemTd}>
                            {new Date(tt.xacNhanLuc).toLocaleDateString('vi-VN')} {new Date(tt.xacNhanLuc).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ ...styles.voucherItemTd, fontFamily: 'monospace' }}>{tt.maThanhToan}</td>
                          <td style={styles.voucherItemTd}>
                            {tt.phuongThuc === 'CHUYEN_KHOAN'
                              ? 'Chuyển khoản'
                              : tt.phuongThuc === 'TIEN_MAT'
                              ? 'Tiền mặt'
                              : 'Không thu phí'}
                          </td>
                          <td style={styles.voucherItemTd}>{tt.maThamChieu || tt.ghiChu || '—'}</td>
                          <td style={{ ...styles.voucherItemTd, textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                            {dinhDangTien(tt.soTien)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={styles.noPaymentNotice}>
                    {voucherData.tongTienBaoGia === 0
                      ? 'Đơn sửa chữa bảo hành / không phát sinh chi phí. Đã hoàn thành đối soát tài chính 0 VNĐ.'
                      : 'Chưa có giao dịch thanh toán nào được ghi nhận cho công việc này.'}
                  </div>
                )}
              </div>

              {/* Settlement Summary */}
              <div style={styles.settlementBox}>
                <div style={styles.settlementItem}>
                  <span style={styles.settlementLabel}>Tổng giá trị phê duyệt:</span>
                  <span style={styles.settlementValue}>{dinhDangTien(voucherData.tongTienBaoGia)}</span>
                </div>
                <div style={styles.settlementItem}>
                  <span style={styles.settlementLabel}>Đã thanh toán thực tế:</span>
                  <span style={{ ...styles.settlementValue, color: '#16a34a' }}>{dinhDangTien(voucherData.tongDaTra)}</span>
                </div>
                <div style={styles.settlementItem}>
                  <span style={styles.settlementLabel}>Công nợ còn lại:</span>
                  <span style={{ ...styles.settlementValue, color: voucherData.conLai > 0 ? '#ea580c' : '#0f172a' }}>
                    {dinhDangTien(voucherData.conLai)}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div style={styles.signaturesRow}>
                <div style={styles.sigBlock}>
                  <div style={styles.sigTitle}>THỢ THI CÔNG</div>
                  <div style={styles.sigNote}>(Ký, ghi rõ họ tên)</div>
                  <div style={styles.sigName}>{voucherData.tenTho}</div>
                </div>
                <div style={styles.sigBlock}>
                  <div style={styles.sigTitle}>CƯ DÂN NGHIỆM THU</div>
                  <div style={styles.sigNote}>(Ký, ghi rõ họ tên)</div>
                  <div style={styles.sigName}>{voucherData.tenNguoiBao}</div>
                </div>
                <div style={styles.sigBlock}>
                  <div style={styles.sigTitle}>QUẢN LÝ PHÊ DUYỆT</div>
                  <div style={styles.sigNote}>(Ký, ghi rõ họ tên)</div>
                  <div style={styles.sigName}>{voucherData.tenQuanLy}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: '24px',
    maxWidth: 1360,
    margin: '0 auto',
    fontFamily: 'inherit',
    color: 'var(--color-text, #0f172a)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
  },
  headerSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--color-muted, #64748b)',
  },
  headerTitle: {
    fontSize: '1.65rem',
    fontWeight: 700,
    margin: 0,
    color: 'var(--color-heading, #0f172a)',
  },
  headerActions: {
    display: 'flex',
    gap: '8px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  kpiCard: {
    background: '#ffffff',
    borderRadius: '8px',
    padding: '16px 20px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  kpiLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.04em',
    marginBottom: '8px',
  },
  kpiValueHighlight: {
    fontSize: '1.5rem',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '6px',
  },
  kpiValueCount: {
    fontSize: '1.35rem',
    marginBottom: '6px',
  },
  kpiHint: {
    fontSize: '0.8rem',
    color: '#94a3b8',
  },
  filterBar: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    alignItems: 'center',
    marginBottom: '20px',
    background: '#f8fafc',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  searchBox: {
    position: 'relative',
    flex: '1 1 260px',
    minWidth: 200,
  },
  searchInput: {
    width: '100%',
    padding: '8px 30px 8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.875rem',
    boxSizing: 'border-box',
    outline: 'none',
  },
  clearBtn: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#94a3b8',
    fontSize: '0.9rem',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.875rem',
    background: '#ffffff',
    outline: 'none',
  },
  tabPills: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
  },
  tabPill: {
    padding: '6px 12px',
    borderRadius: '16px',
    border: '1px solid #cbd5e1',
    background: '#ffffff',
    fontSize: '0.8rem',
    cursor: 'pointer',
    color: '#475569',
    transition: 'all 0.15s ease',
  },
  tabPillActive: {
    background: '#2563eb',
    color: '#ffffff',
    borderColor: '#2563eb',
    fontWeight: 600,
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 0',
    color: '#64748b',
    gap: '12px',
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBanner: {
    padding: '12px 16px',
    borderRadius: '8px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#b91c1c',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
  },
  tableCard: {
    background: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    overflowX: 'auto',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.875rem',
  },
  thRow: {
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '12px 16px',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.04em',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background 0.15s ease',
  },
  td: {
    padding: '14px 16px',
    verticalAlign: 'middle',
  },
  ticketCode: {
    fontFamily: 'monospace',
    fontWeight: 600,
    color: '#2563eb',
    fontSize: '0.8rem',
  },
  ticketTitle: {
    fontWeight: 600,
    color: '#0f172a',
    marginTop: '2px',
  },
  ticketDesc: {
    fontSize: '0.8rem',
    color: '#64748b',
    marginTop: '2px',
    maxWidth: '240px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  roomBadge: {
    fontWeight: 600,
    color: '#0f172a',
  },
  buildingName: {
    fontSize: '0.8rem',
    color: '#64748b',
    marginTop: '2px',
  },
  valApproved: {
    fontWeight: 600,
    color: '#0f172a',
  },
  valPaid: {
    fontWeight: 600,
    color: '#16a34a',
  },
  valRemain: {
    fontWeight: 600,
    color: '#ea580c',
  },
  valSettled: {
    fontSize: '0.8rem',
    color: '#16a34a',
  },
  zeroCostBadge: {
    background: '#f1f5f9',
    color: '#475569',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.8rem',
  },
  textMuted: {
    color: '#94a3b8',
    fontSize: '0.85rem',
  },
  actionCell: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnSmall: {
    fontSize: '0.8rem',
    padding: '4px 10px',
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    backdropFilter: 'blur(2px)',
  },
  voucherDialog: {
    background: '#ffffff',
    borderRadius: '10px',
    maxWidth: '850px',
    width: '100%',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
  },
  voucherHeaderBar: {
    padding: '14px 20px',
    background: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voucherHeaderLeft: {
    display: 'flex',
    flexDirection: 'column',
  },
  voucherDocType: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.05em',
  },
  voucherDocCode: {
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  voucherHeaderActions: {
    display: 'flex',
    alignItems: 'center',
  },
  printableSheet: {
    padding: '32px 36px',
    overflowY: 'auto',
    background: '#ffffff',
    color: '#0f172a',
    fontSize: '0.875rem',
    lineHeight: 1.5,
  },
  voucherSheetTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandTitle: {
    fontWeight: 700,
    fontSize: '1rem',
    color: '#1e3a8a',
    letterSpacing: '0.02em',
  },
  brandAddress: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
  sheetMeta: {
    textAlign: 'right',
    fontSize: '0.8rem',
    color: '#475569',
  },
  sheetDivider: {
    height: '2px',
    background: '#0f172a',
    margin: '16px 0 20px 0',
  },
  sheetTitle: {
    textAlign: 'center',
    fontSize: '1.35rem',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 4px 0',
    letterSpacing: '0.03em',
  },
  sheetSubtitle: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#64748b',
    margin: '0 0 24px 0',
    fontStyle: 'italic',
  },
  sheetInfoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    background: '#f8fafc',
    padding: '16px 20px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  sheetInfoCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sheetSectionTitle: {
    fontWeight: 700,
    fontSize: '0.8rem',
    color: '#1e3a8a',
    letterSpacing: '0.03em',
    marginBottom: '4px',
  },
  sheetInfoRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '0.85rem',
  },
  sheetInfoLabel: {
    color: '#64748b',
    minWidth: '100px',
  },
  voucherItemsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '8px',
    fontSize: '0.85rem',
  },
  voucherItemsThRow: {
    background: '#f1f5f9',
    borderBottom: '1px solid #cbd5e1',
  },
  voucherItemTh: {
    padding: '8px 10px',
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#475569',
    textAlign: 'left',
  },
  voucherItemsTr: {
    borderBottom: '1px solid #e2e8f0',
  },
  voucherItemTd: {
    padding: '8px 10px',
  },
  voucherItemsFootRow: {
    borderTop: '2px solid #cbd5e1',
    background: '#f8fafc',
  },
  noPaymentNotice: {
    background: '#f8fafc',
    padding: '12px 16px',
    borderRadius: '6px',
    color: '#64748b',
    fontStyle: 'italic',
    fontSize: '0.85rem',
    border: '1px dashed #cbd5e1',
    marginTop: '8px',
  },
  settlementBox: {
    marginTop: '20px',
    background: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '14px 20px',
    display: 'flex',
    justifyContent: 'space-around',
  },
  settlementItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  settlementLabel: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
  settlementValue: {
    fontSize: '1.15rem',
    fontWeight: 700,
    color: '#0f172a',
  },
  signaturesRow: {
    marginTop: '36px',
    display: 'flex',
    justifyContent: 'space-between',
    textAlign: 'center',
  },
  sigBlock: {
    flex: 1,
  },
  sigTitle: {
    fontWeight: 700,
    fontSize: '0.85rem',
    color: '#0f172a',
  },
  sigNote: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '2px',
  },
  sigName: {
    marginTop: '56px',
    fontWeight: 600,
    color: '#0f172a',
    fontSize: '0.85rem',
  },
}
