import { useEffect, useState, type CSSProperties } from 'react'
import {
  fetchBaoGiaYeuCau,
  fetchThanhToanYeuCau,
  duyetBaoGia,
  tuChoiBaoGia,
  ghiNhanThanhToanTho,
  fetchChungTuThanhToanQuanLy,
  type BaoGiaSuaChua,
  type ThanhToanTho,
  type ChungTuThanhToanTho,
  type PhuongThucThanhToanTho,
} from './workerDashboardApi'
import { dinhDangTien } from './design/core/format'
import { Button } from './design/core/Button'
import { StatusTag } from './design/core/StatusTag'

export type QuanLyBaoGiaVaThanhToanProps = {
  token: string
  yeuCauId: number
}

export function QuanLyBaoGiaVaThanhToan({ token, yeuCauId }: QuanLyBaoGiaVaThanhToanProps): React.ReactElement {
  const [danhSachBaoGia, setDanhSachBaoGia] = useState<BaoGiaSuaChua[]>([])
  const [danhSachThanhToan, setDanhSachThanhToan] = useState<ThanhToanTho[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [thongBao, setThongBao] = useState<string | null>(null)

  // Rejection modal / input state
  const [tuChoiBaoGiaId, setTuChoiBaoGiaId] = useState<number | null>(null)
  const [lyDoTuChoi, setLyDoTuChoi] = useState('')
  const [dangXuLy, setDangXuLy] = useState(false)

  // Payment form state
  const [hienFormThanhToan, setHienFormThanhToan] = useState(false)
  const [soTienTra, setSoTienTra] = useState('')
  const [phuongThuc, setPhuongThuc] = useState<PhuongThucThanhToanTho>('CHUYEN_KHOAN')
  const [maThamChieu, setMaThamChieu] = useState('')
  const [ghiChuThanhToan, setGhiChuThanhToan] = useState('')

  // Voucher view
  const [chungTu, setChungTu] = useState<ChungTuThanhToanTho | null>(null)

  const taiDuLieu = async () => {
    setDangTai(true)
    setLoi(null)
    try {
      const [bgList, ttList] = await Promise.all([
        fetchBaoGiaYeuCau(token, yeuCauId),
        fetchThanhToanYeuCau(token, yeuCauId),
      ])
      setDanhSachBaoGia(bgList)
      setDanhSachThanhToan(ttList)
    } catch (err: unknown) {
      setLoi(err instanceof Error ? err.message : 'Không thể tải thông tin báo giá & thanh toán')
    } finally {
      setDangTai(false)
    }
  }

  useEffect(() => {
    taiDuLieu()
  }, [token, yeuCauId])

  const baoGiaHieuLuc = danhSachBaoGia.find((b) => b.trangThai === 'DA_DUYET')
  const tongGiaTri = baoGiaHieuLuc ? Number(baoGiaHieuLuc.tongTien) : 0
  const tongDaTra = danhSachThanhToan.reduce((acc, t) => acc + Number(t.soTien), 0)
  const conPhaiTra = Math.max(0, tongGiaTri - tongDaTra)

  const handleDuyet = async (baoGiaId: number) => {
    if (!window.confirm('Xác nhận phê duyệt báo giá này cho thợ thi công?')) return
    setDangXuLy(true)
    setLoi(null)
    setThongBao(null)
    try {
      await duyetBaoGia(token, yeuCauId, baoGiaId)
      setThongBao('Đã phê duyệt báo giá thành công.')
      await taiDuLieu()
    } catch (err: unknown) {
      setLoi(err instanceof Error ? err.message : 'Duyệt báo giá thất bại')
    } finally {
      setDangXuLy(false)
    }
  }

  const handleTuChoi = async () => {
    if (!tuChoiBaoGiaId) return
    if (!lyDoTuChoi.trim()) {
      setLoi('Vui lòng nhập lý do từ chối để thợ điều chỉnh lại báo giá.')
      return
    }
    setDangXuLy(true)
    setLoi(null)
    try {
      await tuChoiBaoGia(token, yeuCauId, tuChoiBaoGiaId, lyDoTuChoi.trim())
      setThongBao('Đã từ chối báo giá và yêu cầu thợ điều chỉnh.')
      setTuChoiBaoGiaId(null)
      setLyDoTuChoi('')
      await taiDuLieu()
    } catch (err: unknown) {
      setLoi(err instanceof Error ? err.message : 'Từ chối báo giá thất bại')
    } finally {
      setDangXuLy(false)
    }
  }

  const handleGhiNhanThanhToan = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(soTienTra)
    if (isNaN(amount) || amount <= 0) {
      setLoi('Số tiền thanh toán phải lớn hơn 0.')
      return
    }
    if (amount > conPhaiTra) {
      setLoi(`Số tiền (${dinhDangTien(amount)} đ) không được vượt quá số tiền còn lại (${dinhDangTien(conPhaiTra)} đ).`)
      return
    }

    setDangXuLy(true)
    setLoi(null)
    try {
      await ghiNhanThanhToanTho(token, yeuCauId, {
        soTien: amount,
        phuongThuc,
        maThamChieu: maThamChieu.trim() || undefined,
        ghiChu: ghiChuThanhToan.trim() || undefined,
      })
      setThongBao('Đã ghi nhận thanh toán cho thợ thành công.')
      setHienFormThanhToan(false)
      setSoTienTra('')
      setMaThamChieu('')
      setGhiChuThanhToan('')
      await taiDuLieu()
    } catch (err: unknown) {
      setLoi(err instanceof Error ? err.message : 'Ghi nhận thanh toán thất bại')
    } finally {
      setDangXuLy(false)
    }
  }

  const handleXemChungTu = async () => {
    try {
      const ct = await fetchChungTuThanhToanQuanLy(token, yeuCauId)
      setChungTu(ct)
    } catch (err: unknown) {
      setLoi(err instanceof Error ? err.message : 'Không thể tải chứng từ thanh toán')
    }
  }

  if (dangTai) {
    return <div style={{ fontSize: 13, color: '#64748b', padding: '8px 0' }}>Đang tải thông tin báo giá & thanh toán...</div>
  }

  return (
    <div style={styles.cardContainer}>
      <div style={styles.header}>
        <span style={styles.title}>Quản lý Báo giá & Chi phí thợ</span>
        {baoGiaHieuLuc && (
          <Button variant="secondary" onClick={handleXemChungTu} style={styles.btnSm}>
            📄 Xem phiếu chi phí & thanh toán
          </Button>
        )}
      </div>

      {loi && <div style={styles.error}>{loi}</div>}
      {thongBao && <div style={styles.success}>{thongBao}</div>}

      {/* Quote section */}
      <div style={{ marginTop: 8 }}>
        {danhSachBaoGia.length === 0 ? (
          <div style={styles.mutedText}>Thợ chưa gửi báo giá cho yêu cầu này.</div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {danhSachBaoGia.map((bg) => (
              <div
                key={bg.id}
                style={{
                  ...styles.quoteItem,
                  ...(bg.trangThai === 'DA_DUYET' ? styles.quoteItemApproved : {}),
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong>Báo giá v{bg.phienBan} ({bg.maBaoGia})</strong>
                    <StatusTag
                      tone={
                        bg.trangThai === 'DA_DUYET'
                          ? 'done'
                          : bg.trangThai === 'CHO_DUYET'
                          ? 'waiting'
                          : bg.trangThai === 'TU_CHOI'
                          ? 'urgent'
                          : bg.trangThai === 'BI_THAY_THE'
                          ? 'closed'
                          : 'draft'
                      }
                    >
                      {bg.trangThai === 'DA_DUYET'
                        ? 'Đã duyệt hiệu lực'
                        : bg.trangThai === 'CHO_DUYET'
                        ? 'Chờ duyệt'
                        : bg.trangThai === 'TU_CHOI'
                        ? 'Đã từ chối'
                        : bg.trangThai === 'BI_THAY_THE'
                        ? 'Đã bị thay thế'
                        : 'Bản nháp'}
                    </StatusTag>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>
                    {bg.tongTien === 0 ? '0 đ (Bảo hành)' : `${dinhDangTien(bg.tongTien)} đ`}
                  </span>
                </div>

                {bg.moTa && <div style={{ fontSize: 12.5, color: '#475569', marginTop: 4 }}>{bg.moTa}</div>}

                {/* Items */}
                {bg.dongBaoGia && bg.dongBaoGia.length > 0 && (
                  <div style={{ marginTop: 6, fontSize: 12 }}>
                    <table style={styles.itemTable}>
                      <thead>
                        <tr style={{ background: '#f8fafc', color: '#64748b' }}>
                          <th style={{ padding: '4px 8px', textAlign: 'left' }}>Hạng mục</th>
                          <th style={{ padding: '4px 8px', textAlign: 'center' }}>SL</th>
                          <th style={{ padding: '4px 8px', textAlign: 'right' }}>Đơn giá</th>
                          <th style={{ padding: '4px 8px', textAlign: 'right' }}>Thành tiền</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bg.dongBaoGia.map((d, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '4px 8px' }}>{d.tenHangMuc}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'center' }}>{d.soLuong} {d.donVi}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right' }}>{dinhDangTien(d.donGia)}</td>
                            <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600 }}>{dinhDangTien(d.thanhTien)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {bg.lyDoTuChoi && (
                  <div style={{ fontSize: 12, color: '#b91c1c', marginTop: 4, fontStyle: 'italic' }}>
                    Lý do từ chối: {bg.lyDoTuChoi}
                  </div>
                )}

                {/* Manager actions if CHO_DUYET */}
                {bg.trangThai === 'CHO_DUYET' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Button
                      variant="primary"
                      onClick={() => handleDuyet(bg.id)}
                      blocked={dangXuLy}
                      style={styles.btnSm}
                    >
                      ✓ Phê duyệt báo giá
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setTuChoiBaoGiaId(bg.id)
                        setLyDoTuChoi('')
                      }}
                      blocked={dangXuLy}
                      style={styles.btnSm}
                    >
                      ✕ Từ chối / Yêu cầu sửa
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal / prompt */}
      {tuChoiBaoGiaId && (
        <div style={styles.promptBox}>
          <label style={{ fontSize: 12.5, fontWeight: 600, color: '#b91c1c' }}>
            Lý do từ chối báo giá (thợ sẽ thấy lý do này để chỉnh sửa lại):
          </label>
          <input
            type="text"
            value={lyDoTuChoi}
            onChange={(e) => setLyDoTuChoi(e.target.value)}
            placeholder="Ví dụ: Giá vật tư quá cao, cần khảo sát lại..."
            style={styles.input}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <Button variant="primary" onClick={handleTuChoi} blocked={dangXuLy} style={styles.btnSm}>
              Xác nhận từ chối
            </Button>
            <Button variant="secondary" onClick={() => setTuChoiBaoGiaId(null)} style={styles.btnSm}>
              Hủy
            </Button>
          </div>
        </div>
      )}

      {/* Payments section if approved quote exists */}
      {baoGiaHieuLuc && (
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Tiến độ thanh toán cho thợ</span>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Đã duyệt: <strong>{dinhDangTien(tongGiaTri)} đ</strong> · Đã trả:{' '}
                <strong style={{ color: '#16a34a' }}>{dinhDangTien(tongDaTra)} đ</strong> · Còn lại:{' '}
                <strong style={{ color: conPhaiTra > 0 ? '#ea580c' : '#16a34a' }}>{dinhDangTien(conPhaiTra)} đ</strong>
              </div>
            </div>

            {conPhaiTra > 0 && !hienFormThanhToan && (
              <Button
                variant="secondary"
                onClick={() => {
                  setHienFormThanhToan(true)
                  setSoTienTra(String(conPhaiTra))
                }}
                style={styles.btnSm}
              >
                + Ghi nhận trả thợ
              </Button>
            )}
          </div>

          {/* Payment records */}
          {danhSachThanhToan.length > 0 && (
            <div style={{ marginTop: 8, fontSize: 12 }}>
              <table style={styles.itemTable}>
                <thead>
                  <tr style={{ background: '#f8fafc', color: '#64748b' }}>
                    <th style={{ padding: '4px 8px', textAlign: 'left' }}>Thời điểm</th>
                    <th style={{ padding: '4px 8px', textAlign: 'left' }}>Mã GD</th>
                    <th style={{ padding: '4px 8px', textAlign: 'left' }}>Phương thức</th>
                    <th style={{ padding: '4px 8px', textAlign: 'left' }}>Tham chiếu</th>
                    <th style={{ padding: '4px 8px', textAlign: 'right' }}>Số tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {danhSachThanhToan.map((tt) => (
                    <tr key={tt.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '4px 8px' }}>{new Date(tt.xacNhanLuc).toLocaleDateString('vi-VN')}</td>
                      <td style={{ padding: '4px 8px', fontFamily: 'monospace' }}>{tt.maThanhToan}</td>
                      <td style={{ padding: '4px 8px' }}>
                        {tt.phuongThuc === 'CHUYEN_KHOAN' ? 'Chuyển khoản' : tt.phuongThuc === 'TIEN_MAT' ? 'Tiền mặt' : '0đ'}
                      </td>
                      <td style={{ padding: '4px 8px' }}>{tt.maThamChieu || '—'}</td>
                      <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>
                        {dinhDangTien(tt.soTien)} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Form ghi nhận thanh toán */}
          {hienFormThanhToan && (
            <form onSubmit={handleGhiNhanThanhToan} style={styles.payForm}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                Ghi nhận thanh toán cho thợ (Hạn mức còn lại: {dinhDangTien(conPhaiTra)} đ)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 8 }}>
                <div>
                  <label style={styles.fieldLabel}>Số tiền (đ):</label>
                  <input
                    type="number"
                    min="1"
                    max={conPhaiTra}
                    step="1000"
                    required
                    value={soTienTra}
                    onChange={(e) => setSoTienTra(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.fieldLabel}>Hình thức:</label>
                  <select
                    value={phuongThuc}
                    onChange={(e) => setPhuongThuc(e.target.value as PhuongThucThanhToanTho)}
                    style={styles.select}
                  >
                    <option value="CHUYEN_KHOAN">Chuyển khoản</option>
                    <option value="TIEN_MAT">Tiền mặt</option>
                  </select>
                </div>
                <div>
                  <label style={styles.fieldLabel}>Mã tham chiếu GD:</label>
                  <input
                    type="text"
                    placeholder="Mã UNC / bill..."
                    value={maThamChieu}
                    onChange={(e) => setMaThamChieu(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
              <div style={{ marginTop: 8 }}>
                <label style={styles.fieldLabel}>Ghi chú:</label>
                <input
                  type="text"
                  placeholder="Ghi chú nội bộ..."
                  value={ghiChuThanhToan}
                  onChange={(e) => setGhiChuThanhToan(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <Button type="submit" variant="primary" blocked={dangXuLy} style={styles.btnSm}>
                  Lưu giao dịch thanh toán
                </Button>
                <Button variant="secondary" onClick={() => setHienFormThanhToan(false)} style={styles.btnSm}>
                  Hủy
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Voucher modal */}
      {chungTu && (
        <div style={styles.voucherModal}>
          <div style={styles.voucherBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Chứng từ {chungTu.maChungTu}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button onClick={() => window.print()} style={styles.btnSm}>🖨 In</Button>
                <Button variant="secondary" onClick={() => setChungTu(null)} style={styles.btnSm}>Đóng</Button>
              </div>
            </div>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <div><strong>Hạng mục:</strong> {chungTu.hangMuc}</div>
              <div><strong>Tòa / Phòng:</strong> {chungTu.toaNha} - Phòng {chungTu.soPhong}</div>
              <div><strong>Thợ phụ trách:</strong> {chungTu.tenTho} ({chungTu.sdtTho})</div>
              <div><strong>Tổng chi phí duyệt:</strong> {dinhDangTien(chungTu.tongTienBaoGia)} đ</div>
              <div><strong>Đã thanh toán:</strong> {dinhDangTien(chungTu.tongDaTra)} đ</div>
              <div><strong>Còn nợ:</strong> {dinhDangTien(chungTu.conLai)} đ</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles: Record<string, CSSProperties> = {
  cardContainer: {
    marginTop: 12,
    padding: '12px 14px',
    background: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 13.5,
    fontWeight: 700,
    color: '#1e3a8a',
  },
  btnSm: {
    fontSize: 12,
    padding: '4px 10px',
  },
  error: {
    fontSize: 12,
    color: '#b91c1c',
    background: '#fef2f2',
    padding: '6px 10px',
    borderRadius: 4,
    marginBottom: 6,
  },
  success: {
    fontSize: 12,
    color: '#15803d',
    background: '#f0fdf4',
    padding: '6px 10px',
    borderRadius: 4,
    marginBottom: 6,
  },
  mutedText: {
    fontSize: 12.5,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  quoteItem: {
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    padding: '10px 12px',
  },
  quoteItemApproved: {
    borderColor: '#86efac',
    background: '#f0fdf4',
  },
  itemTable: {
    width: '100%',
    borderCollapse: 'collapse',
    background: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 4,
    marginTop: 4,
  },
  promptBox: {
    marginTop: 8,
    padding: 10,
    background: '#fff1f2',
    border: '1px solid #fecdd3',
    borderRadius: 6,
  },
  payForm: {
    marginTop: 10,
    padding: 12,
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
  },
  fieldLabel: {
    display: 'block',
    fontSize: 12,
    fontWeight: 600,
    color: '#475569',
    marginBottom: 2,
  },
  input: {
    width: '100%',
    padding: '6px 8px',
    fontSize: 12.5,
    border: '1px solid #cbd5e1',
    borderRadius: 4,
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '6px 8px',
    fontSize: 12.5,
    border: '1px solid #cbd5e1',
    borderRadius: 4,
    boxSizing: 'border-box',
    background: '#ffffff',
  },
  voucherModal: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  voucherBox: {
    background: '#ffffff',
    padding: 24,
    borderRadius: 8,
    maxWidth: 500,
    width: '90%',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
}
