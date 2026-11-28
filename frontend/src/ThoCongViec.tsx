import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  fetchThoCongViec,
  fetchThoChiTietCongViec,
  capNhatKhaoSat,
  taoBaoGia,
  guiDuyetBaoGia,
  baoXongViecTho,
  fetchThoChungTu,
  type ThongTinViecThoRow,
  type ChiTietViecTho,
  type ChungTuThanhToanTho,
} from './workerDashboardApi'
import { fetchCurrentUser, fetchLienKetAnh } from './api'
import { dinhDangTien } from './design/core/format'
import { dinhDangSdt } from './tienTheoNguoi'
import { Button } from './design/core/Button'
import { Icon } from './design/core/Icon'
import { Tieu } from './CanTra'
import { StatusTag } from './design/core/StatusTag'
import { ThanhBuoc } from './design/core/ThanhBuoc'
import { Card } from './design/layout/Card'
import { ChanDinh } from './design/layout/ChanDinh'
import { Field, Input } from './design/forms/Field'
import { EmptyState } from './design/feedback/EmptyState'
import { Toast } from './design/feedback/Toast'
import { useDialogTrap } from './design/feedback/useDialogTrap'

export type ThoCongViecProps = {
  token: string
  mobile?: boolean
  initialTicketId?: number | null
}

type DongForm = { tenHangMuc: string; soLuong: string; donGia: string }
// Cỡ chữ ≥ 16 của mật độ "thoang" nằm ở components.css; ở đây chỉ còn bố cục riêng của màn Thợ.
export const CSS_THO = `
.tho-cv .irow { padding: 6px 0; }
.tho-cv .ma-buoc li, .tho-cv .ma-dongviec-mt { font: var(--ma-text-body-sm); }
@media (min-width: 768px) { .tho-cv .ma-chandinh { position: static; margin: 0; padding: 0; border: 0; background: none; } .tho-cv .ma-chandinh .btn { flex: none; } }
.tho-cv .ma-dautrang .btn-ghost { padding-left: 0; }
`
const DONG_TRONG: DongForm = { tenHangMuc: '', soLuong: '1', donGia: '' }
const thamSo = (k: string) => (typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get(k))
const docId = () => { const v = thamSo('yeuCauId'); return v ? Number(v) : null }

export function ThoCongViec({ token, mobile = false, initialTicketId }: ThoCongViecProps): React.ReactElement {
  const [danhSach, setDanhSach] = useState<ThongTinViecThoRow[]>([])
  const [dangTai, setDangTai] = useState(true)
  const [loiTai, setLoiTai] = useState<string | null>(null)
  const [tuKhoa, setTuKhoa] = useState('')
  const [hoTen, setHoTen] = useState<string>()
  const [tab, setTab] = useState<'dang-lam' | 'xong'>(() => (thamSo('loc') === 'xong' ? 'xong' : 'dang-lam'))

  // Màn đang mở: danh sách | chi tiết (?yeuCauId) | báo giá (?yeuCauId&baoGia=1)
  const [chiTietId, setChiTietId] = useState<number | null>(() => initialTicketId || docId())
  const [moBaoGia, setMoBaoGia] = useState(() => thamSo('baoGia') === '1')
  const [chiTiet, setChiTiet] = useState<ChiTietViecTho | null>(null)
  const [dangTaiChiTiet, setDangTaiChiTiet] = useState(false)
  const [loiChiTiet, setLoiChiTiet] = useState<string | null>(null)
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({})

  const [ghiChuKhaoSat, setGhiChuKhaoSat] = useState('')
  const [dangBaoXong, setDangBaoXong] = useState(false)
  const [ketQua, setKetQua] = useState('')
  const [dong, setDong] = useState<DongForm[]>([DONG_TRONG])
  const [ghiChuBaoGia, setGhiChuBaoGia] = useState('')
  const [dangGui, setDangGui] = useState(false)
  const [loiHanhDong, setLoiHanhDong] = useState<string | null>(null)
  const [thongBao, setThongBao] = useState<string | null>(null)
  const [voucherData, setVoucherData] = useState<ChungTuThanhToanTho | null>(null)
  const voucherRef = useRef<HTMLDivElement | null>(null)
  useDialogTrap({ open: Boolean(voucherData), dialogRef: voucherRef, onClose: () => setVoucherData(null) })

  useEffect(() => {
    function onPop() {
      setChiTietId(docId())
      setMoBaoGia(thamSo('baoGia') === '1')
      setTab(thamSo('loc') === 'xong' ? 'xong' : 'dang-lam')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    let active = true
    fetchCurrentUser(token).then((u) => { if (active) setHoTen(u.hoTen) }).catch(() => {})
    return () => { active = false }
  }, [token])

  const taiDanhSach = useCallback(async () => {
    setDangTai(true)
    setLoiTai(null)
    try {
      setDanhSach(await fetchThoCongViec(token, { nhom: 'TAT_CA', tuKhoa: tuKhoa || undefined }))
    } catch (err: unknown) {
      setLoiTai(err instanceof Error ? err.message : 'Không thể tải danh sách công việc')
    } finally {
      setDangTai(false)
    }
  }, [token, tuKhoa])
  useEffect(() => { void taiDanhSach() }, [taiDanhSach])

  const taiChiTiet = useCallback(async (id: number) => {
    const d = await fetchThoChiTietCongViec(token, id)
    setChiTiet(d)
    setGhiChuKhaoSat(d.ghiChuKhaoSat ?? '')
    return d
  }, [token])

  useEffect(() => {
    if (!chiTietId) { setChiTiet(null); return }
    let active = true
    setDangTaiChiTiet(true)
    setLoiChiTiet(null)
    setDangBaoXong(false)
    setLoiHanhDong(null)
    taiChiTiet(chiTietId)
      .then((d) => {
        if (!active) return
        setKetQua(d.ketQuaSuaChua ?? '')
        d.anhTruocIds.forEach((pid) => fetchLienKetAnh(token, pid).then((url) => active && setPhotoUrls((m) => ({ ...m, [pid]: url }))).catch(() => {}))
      })
      .catch((err: Error) => { if (active) setLoiChiTiet(err.message) })
      .finally(() => { if (active) setDangTaiChiTiet(false) })
    return () => { active = false }
  }, [token, chiTietId, taiChiTiet])

  function dieuHuong(id: number | null, baoGia = false) {
    const url = new URL(window.location.href)
    if (id) url.searchParams.set('yeuCauId', String(id)); else url.searchParams.delete('yeuCauId')
    if (id && baoGia) url.searchParams.set('baoGia', '1'); else url.searchParams.delete('baoGia')
    window.history.pushState({}, '', url.toString())
    setChiTietId(id)
    setMoBaoGia(Boolean(id) && baoGia)
    setThongBao(null)
  }

  function chonTab(t: 'dang-lam' | 'xong') {
    setTab(t)
    const url = new URL(window.location.href)
    url.searchParams.set('loc', t)
    window.history.replaceState({}, '', url.toString())
  }

  // Chạy một thao tác ghi: lỗi báo ngay trong khối, giữ nguyên chữ đã nhập.
  async function chay(viec: () => Promise<void>, loiMacDinh: string) {
    setDangGui(true)
    setLoiHanhDong(null)
    try {
      await viec()
    } catch (err: unknown) {
      setLoiHanhDong(err instanceof Error ? err.message : loiMacDinh)
    } finally {
      setDangGui(false)
    }
  }

  const lamMoi = async (id: number) => { await taiChiTiet(id); void taiDanhSach() }

  async function batDauKhaoSat(id: number, tuDanhSach = false) {
    await chay(async () => {
      await capNhatKhaoSat(token, id, '')
      if (tuDanhSach) dieuHuong(id)
      else await lamMoi(id)
      void taiDanhSach()
    }, 'Lỗi khi nhận việc')
  }

  const dongHopLe = dong.filter((l) => l.tenHangMuc.trim() && Number(l.soLuong) > 0 && Number(l.donGia) > 0)
  const tongBaoGia = dongHopLe.reduce((a, l) => a + Number(l.soLuong) * Number(l.donGia), 0)

  async function guiBaoGia() {
    if (!chiTietId) return
    await chay(async () => {
      const bg = await taoBaoGia(token, chiTietId, {
        moTa: ghiChuBaoGia || undefined,
        dongBaoGia: dongHopLe.map((l) => ({ tenHangMuc: l.tenHangMuc.trim(), soLuong: Number(l.soLuong), donVi: 'gói', donGia: Number(l.donGia) })),
        guiDuyetNgay: false,
      })
      await guiDuyetBaoGia(token, chiTietId, bg.id)
      setDong([DONG_TRONG])
      setGhiChuBaoGia('')
      dieuHuong(chiTietId)
      setThongBao('Đã gửi báo giá. Chờ quản lý duyệt.')
      void taiDanhSach()
    }, 'Lỗi khi gửi báo giá')
  }

  async function baoXong() {
    if (!chiTietId) return
    await chay(async () => {
      await baoXongViecTho(token, chiTietId, ketQua.trim())
      setDangBaoXong(false)
      setThongBao('Đã báo xong. Chờ quản lý nghiệm thu.')
      await lamMoi(chiTietId)
    }, 'Lỗi khi báo xong')
  }

  async function xemChungTu(id: number) {
    try { setVoucherData(await fetchThoChungTu(token, id)) } catch (err: unknown) { setLoiHanhDong(err instanceof Error ? err.message : 'Không thể tải chứng từ') }
  }

  const sapXep = useMemo(() => {
    const hang = { KHAN_CAP: 0, GAP: 1, THUONG: 2 }
    return [...danhSach].sort((a, b) => hang[a.mucDo] - hang[b.mucDo] || Date.parse(a.taoLuc) - Date.parse(b.taoLuc))
  }, [danhSach])
  const dangLam = sapXep.filter((r) => !daXong(r))
  const xong = sapXep.filter(daXong)

  const khung = (children: React.ReactNode) => <div className="tho-cv" style={styleKhung} data-testid="worker-jobs-screen"><style>{CSS_THO}</style>{children}{voucherData ? <ChungTu data={voucherData} voucherRef={voucherRef} dong={() => setVoucherData(null)} /> : null}</div>

  // ---------- T3 · Báo giá ----------
  if (chiTietId && moBaoGia) {
    const lyDo = dongHopLe.length === 0 ? 'Thêm ít nhất một dòng có đơn giá.' : undefined
    return khung(
      <>
        <Dau mobile={mobile} tieuDe="Báo giá" phu={chiTiet ? `${chiTiet.hangMuc} · phòng ${phongCua(chiTiet.soPhong)} · ${chiTiet.toaNha}` : undefined} quay={() => dieuHuong(chiTietId)} />
        {dong.map((l, i) => (
          <Card key={i} aria-label={`Dòng ${i + 1}`} style={styleLuoi}>
            <Field label={`Dòng ${i + 1}: vật tư hoặc công`}>
              <Input value={l.tenHangMuc} onChange={(e) => setDong((c) => c.map((x, k) => (k === i ? { ...x, tenHangMuc: e.target.value } : x)))} />
            </Field>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 12 }}>
              <Field label="Số lượng">
                <Input type="number" inputMode="decimal" min={0} step="any" value={l.soLuong} style={{ textAlign: 'right' }} onChange={(e) => setDong((c) => c.map((x, k) => (k === i ? { ...x, soLuong: e.target.value } : x)))} />
              </Field>
              <Field label="Đơn giá (₫)">
                <Input type="number" inputMode="numeric" min={0} step={1} value={l.donGia} style={{ textAlign: 'right' }} onChange={(e) => setDong((c) => c.map((x, k) => (k === i ? { ...x, donGia: e.target.value } : x)))} />
              </Field>
            </div>
            <div className="spread">
              <span style={{ color: 'var(--ma-text-secondary)' }}>Thành tiền</span>
              <b>{dinhDangTien((Number(l.soLuong) || 0) * (Number(l.donGia) || 0))} ₫</b>
            </div>
            {dong.length > 1 ? <Button variant="text" onClick={() => setDong((c) => c.filter((_, k) => k !== i))}>Xoá dòng {i + 1}</Button> : null}
          </Card>
        ))}
        <Button variant="secondary" onClick={() => setDong((c) => [...c, DONG_TRONG])}><Icon name="plus" />Thêm dòng</Button>
        <Field label="Ghi chú cho quản lý (không bắt buộc)">
          <textarea rows={3} style={styleTextarea} value={ghiChuBaoGia} placeholder="Ví dụ: cần cắt điện phòng 20 phút" onChange={(e) => setGhiChuBaoGia(e.target.value)} />
        </Field>
        <Card>
          <span style={{ color: 'var(--ma-text-secondary)' }}>Tổng báo giá</span>
          <b style={{ font: 'var(--ma-text-figure-lg)' }}>{dinhDangTien(tongBaoGia)} ₫</b>
        </Card>
        {loiHanhDong ? <p role="alert" style={styleLoi}>{loiHanhDong}</p> : null}
        <ChanDinh>
          <Button variant="primary" blocked={dongHopLe.length === 0 || dangGui} blockedReason={lyDo} onClick={() => void guiBaoGia()}>Gửi báo giá {dinhDangTien(tongBaoGia)} ₫</Button>
        </ChanDinh>
      </>,
    )
  }

  // ---------- T2 · Chi tiết (+ T4 báo xong) ----------
  if (chiTietId) {
    const d = chiTiet
    const nut = d ? nutChinhChiTiet(d) : null
    const baoGiaNhap = d?.danhSachBaoGia.find((b) => b.trangThai === 'NHAP')
    const lichSu = (d?.lichSuTrangThai ?? []).map((h, i, a) => ({
      ten: h.tenHanhDong,
      moTa: h.nguoiThucHien,
      trangThai: (i === a.length - 1 ? 'nay' : 'xong') as 'nay' | 'xong',
    }))
    const sdtKhach = d && (d.soDienThoaiLienHe || d.nguoiBaoSoDienThoai)
    const lienHe = d ? [
      { vaiTro: 'Người thuê', ten: d.nguoiLienHeHoTen || d.nguoiBaoHoTen, sdt: sdtKhach },
      { vaiTro: 'Quản lý toà', ten: d.quanLyPhuTrachHoTen, sdt: d.quanLyPhuTrachSoDienThoai },
    ].filter((x) => x.ten) : []
    return khung(
      <>
        <Dau mobile={mobile} tieuDe={d ? `${d.hangMuc} · phòng ${phongCua(d.soPhong)}` : 'Chi tiết việc'} phu={d?.maYeuCau} quay={() => dieuHuong(null)} />
        {dangTaiChiTiet ? <EmptyState kind="loading" title="Đang tải chi tiết việc" /> : loiChiTiet ? (
          <EmptyState kind="error" title="Không tải được chi tiết việc" body={loiChiTiet} actionLabel="Tải lại" actionSize="md" onAction={() => { setLoiChiTiet(null); setDangTaiChiTiet(true); taiChiTiet(chiTietId).catch((e: Error) => setLoiChiTiet(e.message)).finally(() => setDangTaiChiTiet(false)) }} />
        ) : d ? (
          <>
            {thongBao ? <Toast role="status">{thongBao}</Toast> : null}
            <Card style={styleLuoi}>
              <div style={styleHang}>
                <TrangThai r={d} />
                {d.mucDo !== 'THUONG' ? <StatusTag tone={d.mucDo === 'KHAN_CAP' ? 'urgent' : 'waiting'}>{d.mucDo === 'KHAN_CAP' ? 'Khẩn' : 'Gấp'}</StatusTag> : null}
              </div>
              <p style={{ margin: 0 }}>{d.moTa}</p>
              <div>
                <div><b>{d.toaNha} · tầng {d.tang}</b></div>
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(d.diaChiToaNha)}`} target="_blank" rel="noreferrer" style={{ color: 'var(--ma-text-link)' }}>{d.diaChiToaNha}</a>
              </div>
              {d.anhTruocIds.length > 0 ? (
                <div style={styleHang}>
                  {d.anhTruocIds.map((pid) => photoUrls[pid] ? <img key={pid} src={photoUrls[pid]} alt="Ảnh hiện trạng" style={styleAnh} /> : <span key={pid} style={styleAnh} aria-busy="true" />)}
                </div>
              ) : null}
            </Card>
            {lienHe.length > 0 ? (
              <Card>
                {lienHe.map((l) => (
                  <div key={l.vaiTro} className="spread" style={{ padding: '8px 0' }}>
                    <div><div style={{ color: 'var(--ma-text-secondary)' }}>{l.vaiTro}</div><b>{l.ten}</b>{l.sdt ? <div style={{ color: 'var(--ma-text-secondary)' }}>{dinhDangSdt(l.sdt)}</div> : null}</div>
                    {l.sdt ? <a className="btn btn-secondary" href={`tel:${l.sdt}`} aria-label={`Gọi ${l.vaiTro} ${l.ten}`}><Icon name="phone" />Gọi</a> : null}
                  </div>
                ))}
              </Card>
            ) : null}
            {lichSu.length > 0 ? <Card title="Đã làm gì"><ThanhBuoc doc nhan="Đã làm gì" buoc={lichSu} /></Card> : null}
            {d.danhSachBaoGia.length > 0 ? (
              <Card title="Báo giá">
                {d.danhSachBaoGia.map((bg) => (
                  <div key={bg.id} style={{ padding: '8px 0', display: 'grid', gap: 4 }}>
                    <div className="spread"><b>{bg.maBaoGia} · bản {bg.phienBan}</b><StatusTag tone={bg.trangThai === 'DA_DUYET' ? 'done' : bg.trangThai === 'TU_CHOI' ? 'urgent' : 'waiting'}>{dichTrangThaiBaoGia(bg.trangThai)}</StatusTag></div>
                    {bg.dongBaoGia.map((x, k) => <div key={k} className="spread"><span>{x.tenHangMuc} × {x.soLuong}</span><span>{dinhDangTien(x.thanhTien)} ₫</span></div>)}
                    <div className="spread"><span style={{ color: 'var(--ma-text-secondary)' }}>Tổng</span><b>{dinhDangTien(bg.tongTien)} ₫</b></div>
                    {bg.lyDoTuChoi ? <div style={{ color: 'var(--ma-urgent)' }}>Lý do từ chối: {bg.lyDoTuChoi}</div> : null}
                  </div>
                ))}
                {d.baoGiaHieuLuc ? <Button variant="secondary" onClick={() => void xemChungTu(d.id)}>Xem chứng từ</Button> : null}
              </Card>
            ) : null}
            {d.trangThaiHieuLuc === 'DANG_XU_LY' ? (
              <Card title="Ghi chú khảo sát">
                <textarea rows={3} aria-label="Ghi chú khảo sát" style={styleTextarea} value={ghiChuKhaoSat} placeholder="Nguyên nhân, hiện trạng, linh kiện cần chuẩn bị" onChange={(e) => setGhiChuKhaoSat(e.target.value)} />
                <div><Button variant="secondary" blocked={dangGui} onClick={() => void chay(async () => { await capNhatKhaoSat(token, d.id, ghiChuKhaoSat); setThongBao('Đã lưu ghi chú khảo sát.') }, 'Lỗi khi lưu khảo sát')}>Lưu ghi chú</Button></div>
              </Card>
            ) : null}
            {dangBaoXong ? (
              <Card title="Báo đã sửa xong">
                <Field label="Đã làm gì">
                  <textarea rows={4} style={styleTextarea} value={ketQua} placeholder="Ví dụ: thay công tắc nhà tắm, đã thử điện" onChange={(e) => setKetQua(e.target.value)} />
                </Field>
              </Card>
            ) : null}
            {loiHanhDong ? <p role="alert" style={styleLoi}>{loiHanhDong}</p> : null}
            {dangBaoXong ? (
              <ChanDinh><Button variant="primary" blocked={dangGui || !ketQua.trim()} blockedReason={!ketQua.trim() ? 'Nhập việc đã làm.' : undefined} onClick={() => void baoXong()}>Gửi báo xong</Button></ChanDinh>
            ) : nut ? (
              <ChanDinh>
                <Button variant="primary" blocked={dangGui} onClick={() => {
                  if (nut.hanhDong === 'NHAN_VIEC') void batDauKhaoSat(d.id)
                  else if (nut.hanhDong === 'BAO_XONG') setDangBaoXong(true)
                  else if (nut.hanhDong === 'GUI_NHAP' && baoGiaNhap) void chay(async () => { await guiDuyetBaoGia(token, d.id, baoGiaNhap.id); setThongBao('Đã gửi báo giá. Chờ quản lý duyệt.'); await lamMoi(d.id) }, 'Lỗi khi gửi duyệt')
                  else dieuHuong(d.id, true)
                }}>{nut.nhan}</Button>
              </ChanDinh>
            ) : null}
          </>
        ) : null}
      </>,
    )
  }

  // ---------- T1 · Việc ----------
  const lamTruoc = dangLam[0]
  const khac = dangLam.slice(1)
  const hanhDong = lamTruoc ? nutChinhCuaViec(lamTruoc) : null
  const danhSachXong = tab === 'xong' ? xong : []
  return khung(
    <>
      <header className="ma-dautrang">
        <Tieu mobile={mobile} className={mobile ? 'sr-only' : 'h1'} style={{ margin: 0 }}>Việc của tôi</Tieu>
        {hoTen ? <p className="ma-dautrang-phu">{hoTen}</p> : null}
      </header>
      <nav className="seg seg-links" aria-label="Lọc việc">
        {([['dang-lam', `Đang làm ${dangLam.length}`], ['xong', `Đã xong ${xong.length}`]] as const).map(([k, nhan]) => (
          <a key={k} href={`?loc=${k}`} aria-current={tab === k ? 'true' : undefined} onClick={(e) => { e.preventDefault(); chonTab(k) }}>{nhan}</a>
        ))}
      </nav>
      {danhSach.length > 12 || tuKhoa ? (
        <Field label="Tìm việc"><Input type="search" value={tuKhoa} placeholder="Phòng, mã việc, hạng mục" onChange={(e) => setTuKhoa(e.target.value)} /></Field>
      ) : null}
      {dangTai && danhSach.length === 0 ? <EmptyState kind="loading" title="Đang tải danh sách việc" /> : loiTai ? (
        <EmptyState kind="error" title="Không tải được danh sách việc" body={loiTai} actionLabel="Tải lại" actionSize="md" onAction={() => void taiDanhSach()} />
      ) : tab === 'xong' ? (
        danhSachXong.length === 0 ? <EmptyState title="Chưa có việc nào xong" body="Việc quản lý đã nghiệm thu sẽ hiện ở đây." /> : (
          <Card>{danhSachXong.map((r) => <HangViec key={r.id} r={r} mo={() => dieuHuong(r.id)} />)}</Card>
        )
      ) : !lamTruoc ? (
        <EmptyState title="Chưa có việc nào được giao" body="Khi quản lý giao việc, bạn sẽ nhận thông báo." />
      ) : (
        <>
          <Card aria-labelledby={`viec-${lamTruoc.id}`} data-testid={`worker-task-row-${lamTruoc.id}`} style={styleLuoi}>
            <div className="spread"><span style={{ color: 'var(--ma-text-secondary)' }}>Làm trước</span><TrangThai r={lamTruoc} /></div>
            <h2 id={`viec-${lamTruoc.id}`} style={{ margin: 0, font: 'var(--ma-text-block-title)' }}>{lamTruoc.hangMuc} · phòng {phongCua(lamTruoc.soPhong)}</h2>
            <div>{lamTruoc.toaNha}, tầng {lamTruoc.tang}</div>
            <p style={{ margin: 0 }}>{lamTruoc.moTa}</p>
            <div style={styleHang}>
              <a className="btn btn-secondary" href={`tel:${lamTruoc.soDienThoaiLienHe}`} aria-label={`Gọi khách ${lamTruoc.nguoiLienHeHoTen}`}><Icon name="phone" />Gọi khách</a>
              {hanhDong?.hanhDong === 'KHONG' || hanhDong?.hanhDong === 'XEM' ? (
                <Button variant="secondary" onClick={() => dieuHuong(lamTruoc.id)}>Xem chi tiết</Button>
              ) : hanhDong ? (
                <Button variant="primary" blocked={dangGui} onClick={() => {
                  if (hanhDong.hanhDong === 'NHAN_VIEC') void batDauKhaoSat(lamTruoc.id, true)
                  else dieuHuong(lamTruoc.id, hanhDong.hanhDong === 'LAP_BAO_GIA')
                }}>{hanhDong.nhan}</Button>
              ) : null}
            </div>
            {loiHanhDong ? <p role="alert" style={styleLoi}>{loiHanhDong}</p> : null}
          </Card>
          {khac.length > 0 ? (
            <Card title={`Việc khác (${khac.length} việc)`}>{khac.map((r) => <HangViec key={r.id} r={r} mo={() => dieuHuong(r.id)} />)}</Card>
          ) : null}
        </>
      )}
    </>,
  )
}

function Dau({ mobile, tieuDe, phu, quay }: { mobile: boolean; tieuDe: string; phu?: string; quay: () => void }) {
  return (
    <header className="ma-dautrang">
      <div><Button variant="text" onClick={quay}><Icon name="chevron-left" />Quay lại</Button></div>
      <Tieu mobile={mobile} className={mobile ? 'sr-only' : 'h1'} style={{ margin: 0 }}>{tieuDe}</Tieu>
      {mobile ? <div aria-hidden="true" style={{ font: 'var(--ma-text-block-title)' }}>{tieuDe}</div> : null}
      {phu ? <p className="ma-dautrang-phu">{phu}</p> : null}
    </header>
  )
}

function HangViec({ r, mo }: { r: ThongTinViecThoRow; mo: () => void }) {
  return (
    <a className="irow" href={`?yeuCauId=${r.id}`} data-testid={`worker-task-row-${r.id}`} onClick={(e) => { e.preventDefault(); mo() }}>
      <div className="body">
        <div className="t">{r.hangMuc} · phòng {phongCua(r.soPhong)}</div>
        <div className="s" style={{ whiteSpace: 'normal' }}>{r.toaNha} · {tenTrangThai(r).toLowerCase()}</div>
      </div>
      <Icon name="chevron-right" />
    </a>
  )
}

function TrangThai({ r }: { r: Pick<ThongTinViecThoRow, 'trangThaiHieuLuc'> }) {
  const t = r.trangThaiHieuLuc
  return <StatusTag tone={t === 'DA_DONG' ? 'done' : t === 'CHO_XAC_NHAN' ? 'waiting' : t === 'DA_HUY' ? 'closed' : 'neutral'}>{tenTrangThai(r)}</StatusTag>
}

function ChungTu({ data, voucherRef, dong }: { data: ChungTuThanhToanTho; voucherRef: React.RefObject<HTMLDivElement | null>; dong: () => void }) {
  const voucherData = data
  const setVoucherData = (_: null) => dong()
  return (
    <>
      {/* VOUCHER PRINTABLE MODAL */}
      {voucherData ? (
        <div style={styleDrawerOverlay} role="dialog" aria-modal="true" aria-labelledby="voucher-title">
          <style>{`
            @media print {
              body * { visibility: hidden !important; }
              #printable-voucher-congviec, #printable-voucher-congviec * { visibility: visible !important; }
              #printable-voucher-congviec {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                padding: 20px !important;
                margin: 0 !important;
                box-shadow: none !important;
                background: var(--ma-bg-card) !important;
              }
              .ma-no-print { display: none !important; }
            }
          `}</style>
          <div id="printable-voucher-congviec" ref={voucherRef} style={{ background: 'var(--ma-bg-card)', color: 'var(--ma-text-primary)', width: 'min(92%, 760px)', maxHeight: '90vh', overflowY: 'auto', borderRadius: 12, padding: 32, boxShadow: 'var(--ma-shadow-md)' }} tabIndex={-1}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--ma-text-primary)', paddingBottom: 16, marginBottom: 20 }}>
              <div>
                <h2 id="voucher-title" style={{ margin: '0 0 4px', fontSize: 22 }}>
                  Phiếu chi phí & Thanh toán sửa chữa
                </h2>
                <div style={{ fontSize: 13, color: 'var(--ma-text-secondary)' }}>
                  Số chứng từ: <strong>{voucherData.maChungTu}</strong> · Ngày lập: {voucherData.ngayLap}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }} className="ma-no-print">
                <Button onClick={() => window.print()} style={{ fontSize: 13 }}>
                  🖨 In chứng từ
                </Button>
                <Button variant="secondary" onClick={() => setVoucherData(null)} style={{ fontSize: 13 }}>
                  Đóng
                </Button>
              </div>
            </div>

            {/* Voucher Details */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 13, marginBottom: 20 }}>
              <div>
                <div><strong>Toà nhà:</strong> {voucherData.toaNha}</div>
                <div><strong>Địa chỉ:</strong> {voucherData.diaChiToaNha}</div>
                <div><strong>Phòng:</strong> {voucherData.soPhong} (Tầng {voucherData.tang})</div>
                <div><strong>Mã yêu cầu:</strong> {voucherData.maYeuCau}</div>
                <div><strong>Hạng mục:</strong> {voucherData.hangMuc}</div>
              </div>
              <div>
                <div><strong>Thợ sửa chữa:</strong> {voucherData.tenTho} ({voucherData.sdtTho})</div>
                <div><strong>Quản lý xác nhận:</strong> {voucherData.tenQuanLy} ({voucherData.sdtQuanLy})</div>
                <div><strong>Người báo / liên hệ:</strong> {voucherData.tenNguoiBao} ({voucherData.sdtNguoiBao})</div>
                <div><strong>Trạng thái sửa chữa:</strong> {voucherData.trangThaiYeuCau}</div>
              </div>
            </div>

            {/* Line items table */}
            <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Chi tiết chi phí (Phiên bản {voucherData.baoGiaPhienBan})</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 20 }}>
              <thead>
                <tr style={{ background: 'var(--ma-bg-sunken)', borderBottom: '1px solid var(--ma-line-300)' }}>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>STT</th>
                  <th style={{ padding: '8px 10px', textAlign: 'left' }}>Hạng mục vật tư / công sửa</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>Số lượng</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Đơn giá (đ)</th>
                  <th style={{ padding: '8px 10px', textAlign: 'right' }}>Thành tiền (đ)</th>
                </tr>
              </thead>
              <tbody>
                {voucherData.dongBaoGia.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid var(--ma-line-200)' }}>
                    <td style={{ padding: '8px 10px' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 10px' }}>{item.tenHangMuc}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'center' }}>{item.soLuong} {item.donVi}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{dinhDangTien(item.donGia)}</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>{dinhDangTien(item.thanhTien)}</td>
                  </tr>
                ))}
                <tr style={{ fontWeight: 600, background: 'var(--ma-bg-sunken)' }}>
                  <td colSpan={4} style={{ padding: '10px', textAlign: 'right' }}>Tổng chi phí được duyệt:</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{dinhDangTien(voucherData.tongTienBaoGia)} đ</td>
                </tr>
              </tbody>
            </table>

            {/* Payment history */}
            <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>Lịch sử giao dịch thanh toán</h4>
            {voucherData.lichSuThanhToan.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--ma-text-secondary)', marginBottom: 24 }}>Chưa ghi nhận giao dịch thanh toán.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 24 }}>
                <thead>
                  <tr style={{ background: 'var(--ma-bg-sunken)', borderBottom: '1px solid var(--ma-line-300)' }}>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Mã GD</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Thời điểm</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Phương thức</th>
                    <th style={{ padding: '6px 10px', textAlign: 'left' }}>Tham chiếu</th>
                    <th style={{ padding: '6px 10px', textAlign: 'right' }}>Số tiền (đ)</th>
                  </tr>
                </thead>
                <tbody>
                  {voucherData.lichSuThanhToan.map((tt) => (
                    <tr key={tt.id} style={{ borderBottom: '1px solid var(--ma-line-200)' }}>
                      <td style={{ padding: '6px 10px' }}>{tt.maThanhToan}</td>
                      <td style={{ padding: '6px 10px' }}>{new Date(tt.xacNhanLuc).toLocaleDateString('vi-VN')}</td>
                      <td style={{ padding: '6px 10px' }}>{dichPhuongThuc(tt.phuongThuc)}</td>
                      <td style={{ padding: '6px 10px' }}>{tt.maThamChieu ?? '—'}</td>
                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>{dinhDangTien(tt.soTien)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 600, background: 'var(--ma-bg-sunken)' }}>
                    <td colSpan={4} style={{ padding: '8px 10px', textAlign: 'right' }}>Đã thanh toán / Còn lại:</td>
                    <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                      {dinhDangTien(voucherData.tongDaTra)} đ / {dinhDangTien(voucherData.conLai)} đ
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {/* Signatures */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, textAlign: 'center', marginTop: 40, fontSize: 13 }}>
              <div>
                <strong>Người báo / Cư dân</strong>
                <div style={{ height: 60 }} />
                <div>{voucherData.tenNguoiBao}</div>
              </div>
              <div>
                <strong>Thợ sửa chữa</strong>
                <div style={{ height: 60 }} />
                <div>{voucherData.tenTho}</div>
              </div>
              <div>
                <strong>Đại diện Ban quản trị</strong>
                <div style={{ height: 60 }} />
                <div>{voucherData.tenQuanLy}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

type HanhDongChinh = 'NHAN_VIEC' | 'LAP_BAO_GIA' | 'GUI_NHAP' | 'BAO_XONG' | 'XEM' | 'KHONG'

const TEN_BUOC = ['Khảo sát', 'Báo giá', 'Sửa', 'Nhận tiền']

/** Bước 1..4 của việc: nhận việc → báo giá → sửa (báo giá đã duyệt) → nhận tiền (chờ xác nhận/đã đóng). */
export function buocViecTho(r: Pick<ThongTinViecThoRow, 'trangThaiHieuLuc' | 'trangThaiBaoGia'>): { so: number; nhan: string } {
  const so =
    r.trangThaiHieuLuc === 'DA_PHAN_CONG' ? 1
    : r.trangThaiHieuLuc === 'DANG_XU_LY' ? (r.trangThaiBaoGia === 'DA_DUYET' ? 3 : 2)
    : 4
  return { so, nhan: `Bước ${so}/4 · ${TEN_BUOC[so - 1]}` }
}

const daXong = (r: Pick<ThongTinViecThoRow, 'trangThaiHieuLuc'>) => r.trangThaiHieuLuc === 'DA_DONG' || r.trangThaiHieuLuc === 'DA_HUY'
const phongCua = (s: string) => s.replace(/^P\.?\s*/i, '')

function tenTrangThai(r: Pick<ThongTinViecThoRow, 'trangThaiHieuLuc'>): string {
  switch (r.trangThaiHieuLuc) {
    case 'DA_PHAN_CONG': return 'Mới giao'
    case 'DANG_XU_LY': return 'Đang làm'
    case 'CHO_XAC_NHAN': return 'Chờ nghiệm thu'
    case 'DA_DONG': return 'Đã xong'
    case 'DA_HUY': return 'Đã huỷ'
    default: return r.trangThaiHieuLuc
  }
}

/** Đúng một nút chính theo trạng thái; báo giá đang chờ duyệt / chờ nghiệm thu thì không có. */
function nutChinhCuaViec(r: Pick<ThongTinViecThoRow, 'trangThaiHieuLuc' | 'trangThaiBaoGia'>): { hanhDong: HanhDongChinh; nhan: string } {
  if (r.trangThaiHieuLuc === 'DA_PHAN_CONG') return { hanhDong: 'NHAN_VIEC', nhan: 'Bắt đầu khảo sát' }
  if (r.trangThaiHieuLuc === 'DANG_XU_LY') {
    if (r.trangThaiBaoGia === 'DA_DUYET') return { hanhDong: 'BAO_XONG', nhan: 'Báo đã sửa xong' }
    if (r.trangThaiBaoGia === 'NHAP' || r.trangThaiBaoGia === 'CHO_DUYET') return { hanhDong: 'XEM', nhan: 'Xem báo giá' }
    return { hanhDong: 'LAP_BAO_GIA', nhan: 'Gửi báo giá' }
  }
  return { hanhDong: 'KHONG', nhan: '' }
}

function nutChinhChiTiet(d: ChiTietViecTho): { hanhDong: HanhDongChinh; nhan: string } | null {
  const hl = d.baoGiaHieuLuc?.trangThai ?? d.danhSachBaoGia.find((b) => b.trangThai !== 'TU_CHOI' && b.trangThai !== 'BI_THAY_THE')?.trangThai
  const n = nutChinhCuaViec({ trangThaiHieuLuc: d.trangThaiHieuLuc, trangThaiBaoGia: hl })
  if (n.hanhDong === 'KHONG') return null
  if (n.hanhDong === 'XEM') return hl === 'NHAP' ? { hanhDong: 'GUI_NHAP', nhan: 'Gửi duyệt báo giá' } : null
  return n
}

function dichTrangThaiBaoGia(tt: string): string {
  switch (tt) {
    case 'NHAP': return 'Bản nháp'
    case 'CHO_DUYET': return 'Chờ duyệt'
    case 'DA_DUYET': return 'Đã duyệt'
    case 'TU_CHOI': return 'Bị từ chối'
    case 'BI_THAY_THE': return 'Bị thay thế'
    default: return tt
  }
}

function dichPhuongThuc(pt: string): string {
  switch (pt) {
    case 'CHUYEN_KHOAN': return 'Chuyển khoản'
    case 'TIEN_MAT': return 'Tiền mặt'
    case 'KHONG_THU_PHI': return 'Bảo hành (0 đ)'
    default: return pt
  }
}

const styleKhung: CSSProperties = { maxWidth: 720, display: 'grid', gap: 16, alignContent: 'start' }
const styleLuoi: CSSProperties = { display: 'grid', gap: 12 }
const styleHang: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }
const styleLoi: CSSProperties = { margin: 0, color: 'var(--ma-urgent)' }
const styleAnh: CSSProperties = { width: 90, height: 90, borderRadius: 6, objectFit: 'cover', background: 'var(--ma-bg-sunken)' }
const styleTextarea: CSSProperties = { width: '100%', boxSizing: 'border-box', padding: 12, borderRadius: 6, border: '1px solid var(--ma-line-600)', background: 'var(--ma-bg-card)', color: 'var(--ma-text-primary)', font: 'inherit' }
const styleDrawerOverlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(20, 24, 29, 0.4)', display: 'grid', placeItems: 'center', zIndex: 1000 }
