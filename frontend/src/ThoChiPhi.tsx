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
import { Icon } from './design/core/Icon'
import { FilterChip } from './design/forms/FilterChip'
import { Card } from './design/layout/Card'
import { DataTable, type DataTableColumn } from './design/table/DataTable'
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
  const [locChip, setLocChip] = useState('TAT_CA')
  const [tuKhoa, setTuKhoa] = useState('')
  const [soHienThi, setSoHienThi] = useState(10)

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
      const rows = await fetchThoCongViec(token, { toaNhaId })
      setDanhSach(rows)
    } catch (err: unknown) {
      setLoiTai(err instanceof Error ? err.message : 'Không thể tải danh sách chi phí')
    } finally {
      setDangTai(false)
    }
  }, [token, toaNhaId])

  useEffect(() => {
    taiDuLieu()
  }, [taiDuLieu])

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

  const timDuoc = useMemo(() => {
    const k = tuKhoa.trim().toLowerCase()
    return k ? danhSach.filter((r) => [r.maYeuCau, r.toaNha, r.soPhong, r.hangMuc, r.moTa].filter(Boolean).join(' ').toLowerCase().includes(k)) : danhSach
  }, [danhSach, tuKhoa])
  const danhSachLoc = useMemo(() => timDuoc.filter((r) => khop(r, locChip)), [timDuoc, locChip])

  const cot: DataTableColumn<ThongTinViecThoRow>[] = [
    {
      key: 'viec',
      label: 'Mã việc & hạng mục',
      render: (row) => (
        <>
          <div style={{ fontWeight: 600 }}>{row.maYeuCau}</div>
          <div>{row.hangMuc}</div>
          {row.moTa ? <div className="t-meta" style={{ ...styleCat, maxWidth: 200 }} title={row.moTa}>{row.moTa}</div> : null}
        </>
      ),
      sortValue: (row) => row.maYeuCau,
      sortable: true,
    },
    { key: 'phong', label: 'Toà / phòng', render: (row) => <div style={{ minWidth: 120 }}><div>{row.soPhong} (T{row.tang})</div><div className="t-meta">{row.toaNha}</div></div> },
    {
      key: 'trangThai',
      label: 'Trạng thái việc & báo giá',
      render: (row) => (
        <div style={{ display: 'grid', gap: 6, justifyItems: 'start' }}>
          <StatusTag tone={tongTrangThai(row)}>{row.tenTrangThaiHieuLuc || row.tenTrangThai}</StatusTag>
          {baoGiaTag(row)}
          {tinhHang(row).daDuyet ? tienDoTag(row) : null}
        </div>
      ),
    },
    {
      key: 'giaTri',
      label: 'Giá trị duyệt',
      align: 'num',
      sortValue: (row) => tinhHang(row).giaTri,
      sortable: true,
      render: (row) => {
        const h = tinhHang(row)
        return !h.daDuyet ? <span className="t-2">—</span> : h.giaTri === 0 ? <StatusTag tone="neutral">0 đ (Bảo hành)</StatusTag> : <b>{dinhDangTien(h.giaTri)}</b>
      },
    },
    {
      key: 'daNhan',
      label: 'Đã nhận',
      align: 'num',
      render: (row) => { const h = tinhHang(row); return h.daTra > 0 ? <b style={{ color: 'var(--ma-done-text)' }}>{dinhDangTien(h.daTra)}</b> : <span className="t-2">0 đ</span> },
    },
    {
      key: 'conLai',
      label: 'Còn lại',
      align: 'num',
      sortValue: (row) => tinhHang(row).conLai,
      sortable: true,
      render: (row) => {
        const h = tinhHang(row)
        return !h.daDuyet ? <span className="t-2">—</span> : h.conLai > 0 ? <b style={{ color: 'var(--ma-urgent)' }}>{dinhDangTien(h.conLai)}</b> : <span style={{ color: 'var(--ma-done-text)' }}>Đã hết nợ</span>
      },
    },
    {
      key: 'thaoTac',
      label: 'Thao tác',
      the: 'hanh-dong',
      render: (row) => (
        <div style={{ display: 'grid', gap: 4, justifyItems: 'start' }}>
          {tinhHang(row).daDuyet && (
            <Button variant="secondary" size="sm" onClick={() => moChungTu(row.id)} blocked={dangTaiVoucher} style={{ minHeight: 44 }}>
              Xem phiếu
            </Button>
          )}
          {onNavigateToTicket && (
            <Button variant="text" size="sm" onClick={() => onNavigateToTicket(row.id)} style={{ minHeight: 44 }}>
              Chi tiết →
            </Button>
          )}
        </div>
      ),
    },
  ]

  const TieuDe = mobile ? 'h2' : 'h1'
  return (
    <div style={{ maxWidth: 1360, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
      <div className="spread" style={{ alignItems: 'flex-start' }}>
        <div>
          {/* Mobile: khung đã có h1 (tên trang) → tiêu đề màn là h2 để mỗi trang chỉ một h1. */}
          <TieuDe style={{ margin: 0, font: '600 24px/1.2 var(--ma-font-ui)', letterSpacing: '-0.01em' }}>Báo giá & thanh toán</TieuDe>
          <div style={{ font: 'var(--ma-text-caption)', color: 'var(--ma-text-muted)' }}>Chi phí vật tư, công thợ & chứng từ đối soát</div>
        </div>
        <button type="button" className="icon-btn boxed" aria-label="Làm mới dữ liệu" title="Làm mới dữ liệu" aria-disabled={dangTai || undefined} onClick={() => { if (!dangTai) taiDuLieu() }}>
          <Icon name="refresh" />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'repeat(4, minmax(0, 1fr))', gap: mobile ? 8 : 16 }}>
        <Card style={mobile ? { gridColumn: '1 / -1' } : undefined}>
          <span className="t-sm t-2">Còn phải trả (công nợ)</span>
          <div className="kpi-value" style={{ color: tongMetrics.tongConNo > 0 ? 'var(--ma-urgent)' : undefined }}>
            {dinhDangTien(tongMetrics.tongConNo)}<span className="unit">đ</span>
          </div>
          <div className="kpi-desc" style={{ marginTop: 8 }}>Khoản thợ được nhận sau khi nghiệm thu</div>
        </Card>
        <div style={styleO}>
          <span style={styleNhan}>Giá trị đã chốt</span>
          <b style={styleSo}>{dinhDangTien(tongMetrics.tongChot)}</b>
          <span style={styleMoTa}>Tính trên các phiên bản báo giá đã được duyệt</span>
        </div>
        <div style={styleO}>
          <span style={styleNhan}>Tiền đã nhận</span>
          <b style={{ ...styleSo, color: 'var(--ma-done-text)' }}>{dinhDangTien(tongMetrics.tongDaNhan)}</b>
          <span style={styleMoTa}>Tổng giao dịch thanh toán quản lý đã xác nhận</span>
        </div>
        <div style={{ ...styleO, ...(mobile ? { gridColumn: '1 / -1' } : {}) }}>
          <span style={styleNhan}>Đơn đã đối soát xong</span>
          <b style={styleSo}>
            {tongMetrics.soDonDaTraDu}
            <span className="t-sm t-2" style={{ fontWeight: 400, marginLeft: 6 }}>+ {tongMetrics.soDonBaoHanh} đơn 0đ (bảo hành)</span>
          </b>
          <span style={styleMoTa}>Không còn công nợ phát sinh</span>
        </div>
      </div>


      {dangTai && <EmptyState kind="loading" title="Đang tải danh sách báo giá & thanh toán" />}

      {loiTai && <EmptyState kind="error" title="Không thể tải danh sách chi phí" body={loiTai} actionLabel="Thử lại" actionSize="md" onAction={taiDuLieu} />}

      {!dangTai && !loiTai && danhSach.length === 0 && (
        <EmptyState
          title="Không tìm thấy bản ghi nào"
          body={toaNhaId ? 'Thử đổi toà nhà để xem danh sách.' : 'Hiện tại bạn chưa có yêu cầu sửa chữa nào có hồ sơ báo giá.'}
        />
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
        <select
        className="select"
        value={toaNhaId ?? ''}
        onChange={(e) => setToaNhaId(e.target.value ? Number(e.target.value) : undefined)}
        aria-label="Chọn tòa nhà"
        style={{ flex: mobile ? undefined : '0 0 220px' }}
      >
        <option value="">Tất cả tòa nhà</option>
        {danhSachToa.map((t) => (
          <option key={t.id} value={t.id}>
            {t.ten}
          </option>
        ))}
      </select>
        {danhSach.length > 0 && !loiTai && (
          <>
            <label className="input-wrap" style={{ flex: mobile ? '1 1 100%' : '0 1 320px' }}>
              <span className="sr-only">Tìm theo mã việc, tòa, phòng, nội dung</span>
              <Icon name="search" />
              <input className="input" type="search" placeholder="Tìm theo mã việc, tòa, phòng, nội dung…" value={tuKhoa} onChange={(e) => { setTuKhoa(e.target.value); setSoHienThi(10) }} />
            </label>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2, maxWidth: '100%' }}>
              {CHIP_THANH_TOAN.map(([key, label]) => (
                <FilterChip key={key} active={locChip === key} count={timDuoc.filter((r) => khop(r, key)).length} onClick={() => { setLocChip(key); setSoHienThi(10) }}>
                  {label}
                </FilterChip>
              ))}
            </div>
          </>
        )}
      </div>

      {!dangTai && !loiTai && danhSach.length > 0 && (
        <>
          {danhSachLoc.length === 0 ? (
            <EmptyState kind="filtered" title="Không có việc nào khớp bộ lọc" body="Đổi nhóm thanh toán hoặc xoá từ khoá để xem lại danh sách." actionLabel="Xoá bộ lọc" onAction={() => { setLocChip('TAT_CA'); setTuKhoa('') }} />
          ) : mobile ? (
            <>
              {danhSachLoc.slice(0, soHienThi).map((row) => {
                const h = tinhHang(row)
                return (
                  <article key={row.id} className="m-card" style={{ display: 'grid', gap: 10 }} aria-label={row.maYeuCau}>
                    <div className="spread">
                      <StatusTag tone={tongTrangThai(row)}>{row.tenTrangThaiHieuLuc || row.tenTrangThai}</StatusTag>
                      <span className="t-meta">{row.maYeuCau}</span>
                    </div>
                    <h2 className="h3" style={{ margin: 0, fontSize: 18 }}>{row.hangMuc}</h2>
                    <div className="t-sm t-2" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="pin" size="sm" />
                      <span style={styleCat} title={`${row.toaNha} · Phòng ${row.soPhong} · Tầng ${row.tang}`}>{row.toaNha} · Phòng {row.soPhong} · Tầng {row.tang}</span>
                    </div>
                    {h.daDuyet ? (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 }}>
                        <div className="fact"><div className="k">Giá trị</div><div className="v">{h.giaTri === 0 ? '0 đ' : dinhDangTien(h.giaTri)}</div></div>
                        <div className="fact"><div className="k">Đã nhận</div><div className="v" style={{ color: h.daTra > 0 ? 'var(--ma-done-text)' : undefined }}>{dinhDangTien(h.daTra)}</div></div>
                        <div className="fact"><div className="k">Còn lại</div><div className="v" style={{ color: h.conLai > 0 ? 'var(--ma-urgent)' : undefined }}>{h.conLai > 0 ? dinhDangTien(h.conLai) : 'Đã hết nợ'}</div></div>
                      </div>
                    ) : null}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {baoGiaTag(row)}
                      {h.daDuyet ? tienDoTag(row) : null}
                      {h.daDuyet && h.giaTri === 0 ? <StatusTag tone="neutral">0 đ (Bảo hành)</StatusTag> : null}
                    </div>
                    {(h.daDuyet || onNavigateToTicket) ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {h.daDuyet ? <Button variant="secondary" className="btn-touch" style={{ flex: 1 }} onClick={() => moChungTu(row.id)} blocked={dangTaiVoucher}>Xem phiếu</Button> : null}
                        {onNavigateToTicket ? <Button variant="text" className="btn-touch" style={{ flex: h.daDuyet ? '0 0 auto' : 1 }} onClick={() => onNavigateToTicket(row.id)}>Chi tiết đơn →</Button> : null}
                      </div>
                    ) : null}
                  </article>
                )
              })}
              {danhSachLoc.length > soHienThi ? (
                <Button variant="secondary" className="btn-touch" onClick={() => setSoHienThi((n) => n + 10)}>
                  Xem thêm ({danhSachLoc.length - soHienThi} việc)
                </Button>
              ) : null}
            </>
          ) : (
            <Card>
              <DataTable rows={danhSachLoc} columns={cot} getRowId={(r) => r.id} noun="việc" pageSize={10} rowLabel={(r) => r.maYeuCau} />
            </Card>
          )}
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

const CHIP_THANH_TOAN: ReadonlyArray<readonly [string, string]> = [
  ['TAT_CA', 'Tất cả'],
  ['DA_TRA_DU', 'Đã nhận đủ'],
  ['TRA_MOT_PHAN', 'Trả một phần'],
  ['CHUA_TRA', 'Chưa thanh toán'],
  ['BAO_HANH_0D', 'Bảo hành (0đ)'],
  ['CHUA_BAO_GIA', 'Chưa chốt giá'],
]

function tinhHang(row: ThongTinViecThoRow) {
  return {
    giaTri: Number(row.giaTriBaoGia || 0),
    daTra: Number(row.daThanhToan || 0),
    conLai: Number(row.conPhaiTra || 0),
    daDuyet: row.trangThaiBaoGia === 'DA_DUYET',
  }
}

function tongTrangThai(row: ThongTinViecThoRow): 'done' | 'waiting' | 'neutral' {
  return row.trangThaiHieuLuc === 'DA_DONG' ? 'done' : row.trangThaiHieuLuc === 'DANG_XU_LY' || row.trangThaiHieuLuc === 'CHO_XAC_NHAN' ? 'waiting' : 'neutral'
}

function baoGiaTag(row: ThongTinViecThoRow): React.ReactElement {
  return row.trangThaiBaoGia === 'DA_DUYET' ? <StatusTag tone="done">Đã duyệt hiệu lực</StatusTag>
    : row.trangThaiBaoGia === 'CHO_DUYET' ? <StatusTag tone="waiting">Chờ quản lý duyệt</StatusTag>
    : row.trangThaiBaoGia === 'TU_CHOI' ? <StatusTag tone="urgent">Bị từ chối</StatusTag>
    : row.trangThaiBaoGia === 'NHAP' ? <StatusTag tone="draft">Bản nháp</StatusTag>
    : <span className="t-2">Chưa tạo báo giá</span>
}

function tienDoTag(row: ThongTinViecThoRow): React.ReactElement {
  const h = tinhHang(row)
  return !h.daDuyet ? <span className="t-2">Chưa duyệt</span>
    : h.giaTri === 0 ? <StatusTag tone="neutral">Đối soát 0đ</StatusTag>
    : h.conLai <= 0 ? <StatusTag tone="done">Đã thanh toán đủ</StatusTag>
    : h.daTra > 0 ? <StatusTag tone="waiting">Đã trả 1 phần</StatusTag>
    : <StatusTag tone="urgent">Chưa thanh toán</StatusTag>
}

function khop(row: ThongTinViecThoRow, loc: string): boolean {
  const { giaTri, daTra, conLai, daDuyet } = tinhHang(row)
  if (loc === 'CHUA_BAO_GIA') return !daDuyet
  if (loc === 'BAO_HANH_0D') return daDuyet && giaTri === 0
  if (loc === 'DA_TRA_DU') return daDuyet && giaTri > 0 && conLai <= 0
  if (loc === 'TRA_MOT_PHAN') return daDuyet && daTra > 0 && conLai > 0
  if (loc === 'CHUA_TRA') return daDuyet && giaTri > 0 && daTra === 0
  return true
}

const styleO: CSSProperties = { background: 'var(--ma-bg-card)', borderRadius: 16, padding: 14, display: 'grid', gap: 2, alignContent: 'start', minWidth: 0 }
const styleSo: CSSProperties = { display: 'block', font: '600 24px/1.2 var(--ma-font-ui)', letterSpacing: '-0.02em' }
const styleNhan: CSSProperties = { font: '500 14px/1.3 var(--ma-font-ui)' }
const styleMoTa: CSSProperties = { font: 'var(--ma-text-caption)', color: 'var(--ma-text-secondary)' }
const styleCat: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 360 }

const styles: Record<string, CSSProperties> = {
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
