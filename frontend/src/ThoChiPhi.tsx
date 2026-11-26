import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { fetchThoCongViec, fetchThoChungTu, type ThongTinViecThoRow, type ChungTuThanhToanTho } from './workerDashboardApi'
import { fetchCurrentUser } from './api'
import { dinhDangTien } from './design/core/format'
import { Button } from './design/core/Button'
import { Tieu } from './CanTra'
import { CSS_THO } from './ThoCongViec'
import { Card } from './design/layout/Card'
import { EmptyState } from './design/feedback/EmptyState'
import { useDialogTrap } from './design/feedback/useDialogTrap'

export type ThoChiPhiProps = {
  token: string
  mobile?: boolean
  onNavigateToTicket?: (ticketId: number) => void
}

export function ThoChiPhi({ token, mobile = false, onNavigateToTicket }: ThoChiPhiProps): React.ReactElement {
  const [danhSach, setDanhSach] = useState<ThongTinViecThoRow[]>([])
  const [hoTen, setHoTen] = useState<string>()
  const [dangTai, setDangTai] = useState(true)
  const [loiTai, setLoiTai] = useState<string | null>(null)
  const [voucherData, setVoucherData] = useState<ChungTuThanhToanTho | null>(null)
  const [dangTaiVoucher, setDangTaiVoucher] = useState(false)
  const [loiVoucher, setLoiVoucher] = useState<string | null>(null)
  const voucherRef = useRef<HTMLDivElement | null>(null)
  useDialogTrap({ open: Boolean(voucherData), dialogRef: voucherRef, onClose: () => setVoucherData(null) })

  useEffect(() => {
    let active = true
    fetchCurrentUser(token).then((u) => { if (active) setHoTen(u.hoTen) }).catch(() => {})
    return () => { active = false }
  }, [token])

  const taiDuLieu = useCallback(async () => {
    setDangTai(true)
    setLoiTai(null)
    try {
      setDanhSach(await fetchThoCongViec(token, {}))
    } catch (err: unknown) {
      setLoiTai(err instanceof Error ? err.message : 'Không thể tải danh sách chi phí')
    } finally {
      setDangTai(false)
    }
  }, [token])
  useEffect(() => { void taiDuLieu() }, [taiDuLieu])

  const moChungTu = async (id: number) => {
    setDangTaiVoucher(true)
    setLoiVoucher(null)
    try {
      setVoucherData(await fetchThoChungTu(token, id))
    } catch (err: unknown) {
      setLoiVoucher(err instanceof Error ? err.message : 'Không thể tải chứng từ thanh toán')
    } finally {
      setDangTaiVoucher(false)
    }
  }

  const xong = useMemo(() => danhSach.filter((r) => r.trangThaiHieuLuc === 'DA_DONG'), [danhSach])
  // Còn được nhận = phần chưa trả của các việc đã nghiệm thu xong (báo giá đã duyệt).
  const conNhan = xong.reduce((a, r) => a + (r.trangThaiBaoGia === 'DA_DUYET' ? Number(r.conPhaiTra || 0) : 0), 0)
  const handlePrint = () => window.print()

  return (
    <div className="tho-cv" style={{ maxWidth: 720, display: 'grid', gap: 16, alignContent: 'start' }}>
      <style>{CSS_THO}</style>
      <header className="ma-dautrang">
        <Tieu mobile={mobile} className={mobile ? 'sr-only' : 'h1'} style={{ margin: 0 }}>Tiền công</Tieu>
        <p className="ma-dautrang-phu">{hoTen ?? ''}</p>
      </header>

      {dangTai && danhSach.length === 0 ? <EmptyState kind="loading" title="Đang tải tiền công" /> : null}
      {loiTai ? <EmptyState kind="error" title="Không tải được tiền công" body={loiTai} actionLabel="Tải lại" actionSize="md" onAction={() => void taiDuLieu()} /> : null}

      {!loiTai && !(dangTai && danhSach.length === 0) ? (
        <>
          <Card style={{ display: 'grid', gap: 8 }}>
            <span style={{ color: 'var(--ma-text-secondary)' }}>Còn được nhận</span>
            <b style={{ font: 'var(--ma-text-figure-lg)', color: conNhan > 0 ? 'var(--ma-urgent)' : undefined }} data-con-nhan>{dinhDangTien(conNhan)} ₫</b>
            <span>{conNhan > 0 ? 'Quản lý chưa trả hết tiền cho các việc đã nghiệm thu.' : 'Chưa có việc nào nghiệm thu xong mà chưa trả tiền.'}</span>
          </Card>
          {loiVoucher ? <p role="alert" style={{ margin: 0, color: 'var(--ma-urgent)' }}>{loiVoucher}</p> : null}
          <Card title="Đã xong">
            {xong.length === 0 ? <p style={{ margin: 0 }}>Chưa có việc nào xong.</p> : xong.map((r) => {
              const duyet = r.trangThaiBaoGia === 'DA_DUYET'
              return (
                <div key={r.id} data-testid={`tien-cong-${r.id}`}>
                  <a className="irow" href={`/viec-cua-toi?yeuCauId=${r.id}`} onClick={(e) => { if (onNavigateToTicket) { e.preventDefault(); onNavigateToTicket(r.id) } }}>
                    <div className="body">
                      <div className="t">{r.hangMuc} · phòng {r.soPhong.replace(/^P\.?\s*/i, '')}</div>
                      <div className="s" style={{ whiteSpace: 'normal' }}>{r.toaNha}</div>
                    </div>
                    <b className="money">{duyet ? `${dinhDangTien(r.giaTriBaoGia ?? 0)} ₫` : '—'}</b>
                  </a>
                  {duyet ? <Button variant="secondary" onClick={() => void moChungTu(r.id)} blocked={dangTaiVoucher}>Xem phiếu</Button> : null}
                </div>
              )
            })}
          </Card>
        </>
      ) : null}

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
                    background: var(--ma-bg-card) !important;
                  }
                }
              `}</style>
              <div style={styles.voucherHeaderLeft}>
                <span style={styles.voucherDocType}>Phiếu chi phí và thanh toán sửa chữa</span>
                <span style={styles.voucherDocCode}>Số: {voucherData.maChungTu}</span>
              </div>
              <div style={styles.voucherHeaderActions}>
                <Button variant="secondary" onClick={handlePrint} style={{ marginRight: 8 }}>
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
                  <div style={styles.brandTitle}>Hệ thống quản lý căn hộ MiniApart</div>
                  <div style={styles.brandAddress}>Bộ phận Kỹ thuật & Bảo trì căn hộ dịch vụ</div>
                </div>
                <div style={styles.sheetMeta}>
                  <div><strong>Mã chứng từ:</strong> {voucherData.maChungTu}</div>
                  <div><strong>Ngày lập:</strong> {voucherData.ngayLap}</div>
                  <div><strong>Mã yêu cầu:</strong> {voucherData.maYeuCau}</div>
                </div>
              </div>

              <div style={styles.sheetDivider} />

              <h2 style={styles.sheetTitle}>Phiếu xác nhận chi phí và thanh toán sửa chữa</h2>
              <p style={styles.sheetSubtitle}>
                (Dùng cho đối soát nội bộ công tác bảo trì kỹ thuật giữa Ban quản lý và Thợ thi công)
              </p>

              {/* Information Grid */}
              <div style={styles.sheetInfoGrid}>
                <div style={styles.sheetInfoCol}>
                  <div style={styles.sheetSectionTitle}>1. Địa điểm và sự cố</div>
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
                  <div style={styles.sheetSectionTitle}>2. Các bên liên quan</div>
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
                  3. Chi tiết báo giá vật tư và nhân công đã duyệt (Phiên bản v{voucherData.baoGiaPhienBan})
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
                        <td colSpan={6} style={{ ...styles.voucherItemTd, textAlign: 'center', color: 'var(--ma-text-secondary)' }}>
                          Không có danh mục chi phí hoặc đơn sửa chữa bảo hành (0 đ).
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr style={styles.voucherItemsFootRow}>
                      <td colSpan={5} style={{ ...styles.voucherItemTd, textAlign: 'right', fontWeight: 600 }}>
                        Tổng giá trị phê duyệt:
                      </td>
                      <td style={{ ...styles.voucherItemTd, textAlign: 'right', fontWeight: 600, color: 'var(--ma-text-primary)' }}>
                        {dinhDangTien(voucherData.tongTienBaoGia)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment History */}
              <div style={{ marginTop: 20 }}>
                <div style={styles.sheetSectionTitle}>4. Lịch sử giao dịch thanh toán cho thợ</div>
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
                          <td style={{ ...styles.voucherItemTd, fontVariantNumeric: 'tabular-nums' }}>{tt.maThanhToan}</td>
                          <td style={styles.voucherItemTd}>
                            {tt.phuongThuc === 'CHUYEN_KHOAN'
                              ? 'Chuyển khoản'
                              : tt.phuongThuc === 'TIEN_MAT'
                              ? 'Tiền mặt'
                              : 'Không thu phí'}
                          </td>
                          <td style={styles.voucherItemTd}>{tt.maThamChieu || tt.ghiChu || '—'}</td>
                          <td style={{ ...styles.voucherItemTd, textAlign: 'right', fontWeight: 600, color: 'var(--ma-done-text)' }}>
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
                  <span style={{ ...styles.settlementValue, color: 'var(--ma-done-text)' }}>{dinhDangTien(voucherData.tongDaTra)}</span>
                </div>
                <div style={styles.settlementItem}>
                  <span style={styles.settlementLabel}>Còn nợ:</span>
                  <span style={{ ...styles.settlementValue, color: voucherData.conLai > 0 ? 'var(--ma-urgent)' : 'var(--ma-text-primary)' }}>
                    {dinhDangTien(voucherData.conLai)}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div style={styles.signaturesRow}>
                <div style={styles.sigBlock}>
                  <div style={styles.sigTitle}>Thợ thi công</div>
                  <div style={styles.sigNote}>(Ký, ghi rõ họ tên)</div>
                  <div style={styles.sigName}>{voucherData.tenTho}</div>
                </div>
                <div style={styles.sigBlock}>
                  <div style={styles.sigTitle}>Cư dân nghiệm thu</div>
                  <div style={styles.sigNote}>(Ký, ghi rõ họ tên)</div>
                  <div style={styles.sigName}>{voucherData.tenNguoiBao}</div>
                </div>
                <div style={styles.sigBlock}>
                  <div style={styles.sigTitle}>Quản lý phê duyệt</div>
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(20, 24, 29, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    
  },
  voucherDialog: {
    background: 'var(--ma-bg-card)',
    borderRadius: '10px',
    maxWidth: '850px',
    width: '100%',
    maxHeight: '92vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--ma-shadow-md)',
    overflow: 'hidden',
  },
  voucherHeaderBar: {
    padding: '14px 20px',
    background: 'var(--ma-bg-sunken)',
    borderBottom: '1px solid var(--ma-line-200)',
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
    fontWeight: 600,
    color: 'var(--ma-text-secondary)',
  },
  voucherDocCode: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--ma-text-primary)',
    fontVariantNumeric: 'tabular-nums',
  },
  voucherHeaderActions: {
    display: 'flex',
    alignItems: 'center',
  },
  printableSheet: {
    padding: '32px 36px',
    overflowY: 'auto',
    background: 'var(--ma-bg-card)',
    color: 'var(--ma-text-primary)',
    fontSize: '0.875rem',
    lineHeight: 1.5,
  },
  voucherSheetTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandTitle: {
    fontWeight: 600,
    fontSize: '1rem',
    color: 'var(--ma-text-primary)',
  },
  brandAddress: {
    fontSize: '0.8rem',
    color: 'var(--ma-text-secondary)',
  },
  sheetMeta: {
    textAlign: 'right',
    fontSize: '0.8rem',
    color: 'var(--ma-text-secondary)',
  },
  sheetDivider: {
    height: '2px',
    background: 'var(--ma-text-primary)',
    margin: '16px 0 20px 0',
  },
  sheetTitle: {
    textAlign: 'center',
    fontSize: '1.35rem',
    fontWeight: 600,
    color: 'var(--ma-text-primary)',
    margin: '0 0 4px 0',
  },
  sheetSubtitle: {
    textAlign: 'center',
    fontSize: '0.85rem',
    color: 'var(--ma-text-secondary)',
    margin: '0 0 24px 0',
    
  },
  sheetInfoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    background: 'var(--ma-bg-sunken)',
    padding: '16px 20px',
    borderRadius: '6px',
    border: '1px solid var(--ma-line-200)',
  },
  sheetInfoCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  sheetSectionTitle: {
    fontWeight: 600,
    fontSize: '0.8rem',
    color: 'var(--ma-text-primary)',
    marginBottom: '4px',
  },
  sheetInfoRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '0.85rem',
  },
  sheetInfoLabel: {
    color: 'var(--ma-text-secondary)',
    minWidth: '100px',
  },
  voucherItemsTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '8px',
    fontSize: '0.85rem',
  },
  voucherItemsThRow: {
    background: 'var(--ma-bg-sunken)',
    borderBottom: '1px solid var(--ma-line-300)',
  },
  voucherItemTh: {
    padding: '8px 10px',
    fontSize: '0.75rem',
    fontWeight: 600,
    color: 'var(--ma-text-secondary)',
    textAlign: 'left',
  },
  voucherItemsTr: {
    borderBottom: '1px solid var(--ma-line-200)',
  },
  voucherItemTd: {
    padding: '8px 10px',
  },
  voucherItemsFootRow: {
    borderTop: '2px solid var(--ma-line-300)',
    background: 'var(--ma-bg-sunken)',
  },
  noPaymentNotice: {
    background: 'var(--ma-bg-sunken)',
    padding: '12px 16px',
    borderRadius: '6px',
    color: 'var(--ma-text-secondary)',
    
    fontSize: '0.85rem',
    border: '1px dashed var(--ma-line-300)',
    marginTop: '8px',
  },
  settlementBox: {
    marginTop: '20px',
    background: 'var(--ma-bg-sunken)',
    border: '1px solid var(--ma-line-200)',
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
    color: 'var(--ma-text-secondary)',
  },
  settlementValue: {
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--ma-text-primary)',
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
    fontWeight: 600,
    fontSize: '0.85rem',
    color: 'var(--ma-text-primary)',
  },
  sigNote: {
    fontSize: '0.75rem',
    color: 'var(--ma-text-secondary)',
    marginTop: '2px',
  },
  sigName: {
    marginTop: '56px',
    fontWeight: 600,
    color: 'var(--ma-text-primary)',
    fontSize: '0.85rem',
  },
}
