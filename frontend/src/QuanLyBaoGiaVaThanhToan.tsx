import { useEffect, useState } from 'react'
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
import { Icon } from './design/core/Icon'
import { Field } from './design/forms/Field'
import { EmptyState } from './design/feedback/EmptyState'
import { Feedback } from './ManagementShared'

const TRANG_THAI_BAO_GIA = {
  DA_DUYET: { tone: 'done', nhan: 'Đã duyệt hiệu lực' },
  CHO_DUYET: { tone: 'waiting', nhan: 'Chờ duyệt' },
  TU_CHOI: { tone: 'urgent', nhan: 'Đã từ chối' },
  BI_THAY_THE: { tone: 'closed', nhan: 'Đã bị thay thế' },
} as const
const PHUONG_THUC: Record<string, string> = { CHUYEN_KHOAN: 'Chuyển khoản', TIEN_MAT: 'Tiền mặt' }
const num = { textAlign: 'right', fontVariantNumeric: 'tabular-nums' } as const

export type QuanLyBaoGiaVaThanhToanProps = {
  token: string
  yeuCauId: number
  /** Báo dữ liệu mới nhất lên ngăn sự cố để nó tính bước tiến độ + nút chính. */
  onDuLieu?: (baoGia: BaoGiaSuaChua[], thanhToan: ThanhToanTho[]) => void
  /** Ngăn sự cố tự vẽ báo giá chờ duyệt (bảng + Duyệt/Từ chối ở chân thẻ); khối này chỉ giữ các bản còn lại. */
  anChoDuyet?: boolean
}

export function QuanLyBaoGiaVaThanhToan({ token, yeuCauId, onDuLieu, anChoDuyet = false }: QuanLyBaoGiaVaThanhToanProps): React.ReactElement {
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
      onDuLieu?.(bgList, ttList)
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
      setLoi(`Số tiền (${dinhDangTien(amount)} ₫) không được vượt quá số tiền còn lại (${dinhDangTien(conPhaiTra)} ₫).`)
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

  if (dangTai) return <EmptyState kind="loading" title="Đang tải báo giá và thanh toán" />

  return (
    <div className="stack" style={{ borderTop: '1px solid var(--ma-line-200)', paddingTop: 'var(--ma-space-4)' }} data-testid="bao-gia-thanh-toan">
      <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
        <h3 className="h3" style={{ margin: 0 }}>Báo giá và chi phí thợ</h3>
        {baoGiaHieuLuc && <Button variant="secondary" size="sm" onClick={handleXemChungTu}><Icon name="receipt" />Xem phiếu chi phí và thanh toán</Button>}
      </div>

      <Feedback error={loi} success={thongBao} />

      {danhSachBaoGia.length === 0 ? (
        <p className="t-sm" style={{ color: 'var(--ma-text-secondary)' }}>Thợ chưa gửi báo giá cho yêu cầu này.</p>
      ) : (
        <div className="stack">
          {danhSachBaoGia.filter((bg) => !(anChoDuyet && bg.trangThai === 'CHO_DUYET')).map((bg) => {
            const tt = TRANG_THAI_BAO_GIA[bg.trangThai as keyof typeof TRANG_THAI_BAO_GIA] ?? { tone: 'draft', nhan: 'Bản nháp' }
            return (
              <div key={bg.id} className="stack" style={{ gap: 8, paddingBottom: 12, borderBottom: '1px solid var(--ma-line-100)' }}>
                <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
                  <div className="row-wrap">
                    <span className="t-strong">Báo giá v{bg.phienBan} ({bg.maBaoGia})</span>
                    <StatusTag tone={tt.tone}>{tt.nhan}</StatusTag>
                  </div>
                  <span className="t-strong" style={num}>{bg.tongTien === 0 ? '0 ₫ (Bảo hành)' : `${dinhDangTien(bg.tongTien)} ₫`}</span>
                </div>
                {bg.moTa && <p className="t-sm" style={{ color: 'var(--ma-text-secondary)' }}>{bg.moTa}</p>}
                {bg.dongBaoGia && bg.dongBaoGia.length > 0 && (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="table">
                      <thead><tr><th>Hạng mục</th><th className="num">SL</th><th className="num">Đơn giá</th><th className="num">Thành tiền</th></tr></thead>
                      <tbody>
                        {bg.dongBaoGia.map((d, idx) => (
                          <tr key={idx}>
                            <td>{d.tenHangMuc}</td>
                            <td className="num">{d.soLuong} {d.donVi}</td>
                            <td className="num">{dinhDangTien(d.donGia)}</td>
                            <td className="num"><span className="t-strong">{dinhDangTien(d.thanhTien)}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {bg.lyDoTuChoi && <p className="t-sm" style={{ color: 'var(--ma-urgent)' }}>Lý do từ chối: {bg.lyDoTuChoi}</p>}
                {bg.trangThai === 'CHO_DUYET' && (
                  <div className="row-wrap">
                    <Button variant="primary" size="sm" onClick={() => handleDuyet(bg.id)} blocked={dangXuLy}><Icon name="check" />Phê duyệt báo giá</Button>
                    <Button variant="danger" size="sm" onClick={() => { setTuChoiBaoGiaId(bg.id); setLyDoTuChoi('') }} blocked={dangXuLy}><Icon name="x" />Từ chối…</Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tuChoiBaoGiaId && (
        <div className="stack" style={{ gap: 10 }}>
          <Field label="Lý do từ chối (thợ sẽ thấy lý do này để chỉnh lại báo giá)">
            <input className="input" type="text" value={lyDoTuChoi} onChange={(e) => setLyDoTuChoi(e.target.value)} placeholder="Ví dụ: giá vật tư quá cao, cần khảo sát lại" />
          </Field>
          <div className="row-wrap">
            <Button variant="danger" size="sm" onClick={handleTuChoi} blocked={dangXuLy}>Xác nhận từ chối</Button>
            <Button variant="text" size="sm" onClick={() => setTuChoiBaoGiaId(null)}>Không từ chối</Button>
          </div>
        </div>
      )}

      {baoGiaHieuLuc && (
        <div className="stack" style={{ gap: 10 }}>
          <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
            <div>
              <span className="t-strong">Tiến độ thanh toán cho thợ</span>
              <p className="t-sm" style={{ color: 'var(--ma-text-secondary)', marginTop: 2 }}>
                Đã duyệt: <span className="t-strong">{dinhDangTien(tongGiaTri)} ₫</span> · Đã trả: <span className="t-strong" style={{ color: 'var(--ma-done-text)' }}>{dinhDangTien(tongDaTra)} ₫</span> · Còn lại: <span className="t-strong" style={{ color: conPhaiTra > 0 ? 'var(--ma-waiting)' : 'var(--ma-done-text)' }}>{dinhDangTien(conPhaiTra)} ₫</span>
              </p>
            </div>
            {conPhaiTra > 0 && !hienFormThanhToan && (
              <Button variant="secondary" size="sm" onClick={() => { setHienFormThanhToan(true); setSoTienTra(String(conPhaiTra)) }}><Icon name="plus" />Ghi nhận trả thợ</Button>
            )}
          </div>

          {danhSachThanhToan.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead><tr><th>Thời điểm</th><th>Mã GD</th><th>Phương thức</th><th>Tham chiếu</th><th className="num">Số tiền</th></tr></thead>
                <tbody>
                  {danhSachThanhToan.map((tt) => (
                    <tr key={tt.id}>
                      <td>{new Date(tt.xacNhanLuc).toLocaleDateString('vi-VN')}</td>
                      <td>{tt.maThanhToan}</td>
                      <td>{PHUONG_THUC[tt.phuongThuc] ?? '0đ'}</td>
                      <td>{tt.maThamChieu || '—'}</td>
                      <td className="num"><span className="t-strong" style={{ color: 'var(--ma-done-text)' }}>{dinhDangTien(tt.soTien)} ₫</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {hienFormThanhToan && (
            <form onSubmit={handleGhiNhanThanhToan} className="stack">
              <span className="t-strong">Ghi nhận thanh toán cho thợ (còn lại tối đa {dinhDangTien(conPhaiTra)} ₫)</span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 170px), 1fr))', gap: 12 }}>
                <Field label="Số tiền (₫)">
                  <input className="input" type="number" min="1" max={conPhaiTra} step="1000" required value={soTienTra} onChange={(e) => setSoTienTra(e.target.value)} />
                </Field>
                <Field label="Hình thức">
                  <select className="select" value={phuongThuc} onChange={(e) => setPhuongThuc(e.target.value as PhuongThucThanhToanTho)}>
                    <option value="CHUYEN_KHOAN">Chuyển khoản</option>
                    <option value="TIEN_MAT">Tiền mặt</option>
                  </select>
                </Field>
                <Field label="Mã tham chiếu giao dịch">
                  <input className="input" type="text" placeholder="Mã UNC hoặc số bill" value={maThamChieu} onChange={(e) => setMaThamChieu(e.target.value)} />
                </Field>
              </div>
              <Field label="Ghi chú nội bộ">
                <input className="input" type="text" value={ghiChuThanhToan} onChange={(e) => setGhiChuThanhToan(e.target.value)} />
              </Field>
              <div className="row-wrap">
                <Button type="submit" variant="primary" size="sm" blocked={dangXuLy}>Lưu giao dịch thanh toán</Button>
                <Button variant="text" size="sm" onClick={() => setHienFormThanhToan(false)}>Không ghi nhận</Button>
              </div>
            </form>
          )}
        </div>
      )}

      {chungTu && (
        <div role="dialog" aria-modal="true" aria-label={`Chứng từ ${chungTu.maChungTu}`} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ maxWidth: 520, width: '90%', gap: 12 }}>
            <div className="row-wrap" style={{ justifyContent: 'space-between' }}>
              <h3 className="h2">Chứng từ {chungTu.maChungTu}</h3>
              <div className="row-wrap">
                <Button variant="secondary" size="sm" onClick={() => window.print()}><Icon name="download" />In</Button>
                <Button variant="text" size="sm" onClick={() => setChungTu(null)}>Đóng</Button>
              </div>
            </div>
            <div className="t-sm stack" style={{ gap: 6 }}>
              <div><span className="t-strong">Hạng mục:</span> {chungTu.hangMuc}</div>
              <div><span className="t-strong">Toà / Phòng:</span> {chungTu.toaNha} - Phòng {chungTu.soPhong}</div>
              <div><span className="t-strong">Thợ phụ trách:</span> {chungTu.tenTho} ({chungTu.sdtTho})</div>
              <div><span className="t-strong">Tổng chi phí duyệt:</span> {dinhDangTien(chungTu.tongTienBaoGia)} ₫</div>
              <div><span className="t-strong">Đã thanh toán:</span> {dinhDangTien(chungTu.tongDaTra)} ₫</div>
              <div><span className="t-strong">Còn nợ:</span> {dinhDangTien(chungTu.conLai)} ₫</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
