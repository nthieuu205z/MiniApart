import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import './HoSoHopDongToa.css'
import { ApiError, fetchCongNoBaoCao, fetchHopDongQuanLy, fetchHoaDonQuanLy, type ThongTinHopDong, type ThongTinToaNha } from './api'
import { chuCaiDau, CSS_BANG_QUAN_TRI, MenuThaoTac, MucMenu } from './bangQuanTriChung'
import { Button } from './design/core/Button'
import { dinhDangNgayIso, dinhDangTien } from './design/core/format'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { useDialogTrap } from './design/feedback/useDialogTrap'
import { Card } from './design/layout/Card'
import { Breadcrumb } from './design/shell/Breadcrumb'
import type { TrangProps } from './dinhTuyen'
import HopDongThaoTac from './HopDongThaoTac'
import { downloadManagementFile } from './managementApi'
import { useToaDangChon } from './toaDangChon'

/** Ngăn trượt bên phải (dialog có bẫy focus, Esc đóng). Dùng chung cho hồ sơ hợp đồng và hồ sơ toà. */
export function Ngan({ tieuDe, onDong, children }: { tieuDe: string; onDong: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useDialogTrap({ dialogRef: ref, onClose: onDong })
  return createPortal(
    <div className="nganx-nen">
      <div className="nganx" role="dialog" aria-modal="true" aria-labelledby="ngan-tieu-de" ref={ref} tabIndex={-1}>
        <div className="nganx-h">
          <h2 id="ngan-tieu-de">{tieuDe}</h2>
          <button type="button" className="icon-btn touch" aria-label="Đóng ngăn" onClick={onDong}><Icon name="x" /></button>
        </div>
        <div className="nganx-b">{children}</div>
      </div>
    </div>,
    document.body,
  )
}

type KhoanNo = { id: number; ma: string; han: string; conLai: number }
type DuLieu = { hd: ThongTinHopDong; toa: ThongTinToaNha; no: KhoanNo[] | null }

const ngay = (iso: string) => new Date(`${iso}T00:00:00`).getTime()
const thongBaoLoi = (e: unknown, mau: string) => (e instanceof ApiError || e instanceof Error ? e.message : mau)

/** Tìm hợp đồng theo id trong các toà người dùng được xem (máy chủ chưa trả toaNhaId trong GET /api/hop-dong/{id}). */
async function taiHoSo(token: string, vaiTro: string, id: number, dsToa: ThongTinToaNha[]): Promise<DuLieu | null> {
  const kq = await Promise.all(dsToa.map(async (toa) => ({ toa, hd: (await fetchHopDongQuanLy(token, toa.id)).find((h) => h.id === id) })))
  const t = kq.find((k) => k.hd)
  if (!t?.hd) return null
  let no: KhoanNo[] | null = null
  try {
    // Chủ đọc báo cáo công nợ; Quản lý chỉ có danh sách hoá đơn của toà.
    no = vaiTro === 'CHU'
      ? (await fetchCongNoBaoCao(token, t.toa.id)).congNo.filter((k) => k.hopDongId === id).map((k) => ({ id: k.hoaDonId, ma: k.maHoaDon, han: k.hanThanhToan, conLai: Number(k.conLai) }))
      : (await fetchHoaDonQuanLy(token, t.toa.id)).filter((k) => k.hopDongId === id).map((k) => ({ id: k.hoaDonId, ma: k.maHoaDon, han: k.hanThanhToan, conLai: Number(k.conLai) }))
  } catch { /* công nợ là phần phụ: hiện ghi chú thay vì chặn cả hồ sơ */ }
  return { hd: t.hd, toa: t.toa, no }
}

export default function HoSoHopDong360({ token, vaiTro, thamSo, dieuHuong }: TrangProps) {
  const id = Number(thamSo.id)
  const { danhSach, dangTai: dangTaiToa } = useToaDangChon()
  const [du, setDu] = useState<DuLieu | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [lan, setLan] = useState(0)
  const [ngan, setNgan] = useState<string | null>(null)
  const [thongBaoPdf, setThongBaoPdf] = useState<string | null>(null)

  useEffect(() => {
    if (dangTaiToa) return undefined
    let con = true
    setDangTai(true); setLoi(null)
    taiHoSo(token, vaiTro, id, danhSach)
      .then((d) => { if (con) setDu(d) })
      .catch((e: unknown) => { if (con) setLoi(thongBaoLoi(e, 'Không thể tải hồ sơ hợp đồng.')) })
      .finally(() => { if (con) setDangTai(false) })
    return () => { con = false }
  }, [token, vaiTro, id, danhSach, dangTaiToa, lan])

  const dongNgan = () => { setNgan(null); setLan((n) => n + 1) } // sau thao tác trong ngăn: tải lại hồ sơ
  const tai = async () => {
    setThongBaoPdf(null)
    try { await downloadManagementFile(token, `/api/hop-dong/${id}/xuat-pdf`, `hop-dong-${id}.pdf`) } catch (e) { setThongBaoPdf(thongBaoLoi(e, 'Không thể tải PDF.')) }
  }

  if (dangTai && !du) return <EmptyState kind="loading" title="Đang tải hồ sơ hợp đồng…" />
  if (loi) return <EmptyState kind="error" title="Không tải được hồ sơ hợp đồng" body={`${loi} Dữ liệu chưa bị thay đổi.`} actionLabel="Thử lại" onAction={() => setLan((n) => n + 1)} />
  if (!du) return <EmptyState title="Không tìm thấy hợp đồng này" body="Hợp đồng không tồn tại hoặc không thuộc toà bạn được xem." actionLabel="Danh sách hợp đồng" onAction={() => dieuHuong('/hop-dong')} />

  const { hd, toa, no } = du
  const tong = Math.max(1, (ngay(hd.ngayKetThuc) - ngay(hd.ngayBatDau)) / 86_400_000)
  const qua = Math.max(0, Math.min(100, Math.round((1 - hd.soNgayConLai / tong) * 100)))
  const tongNo = (no ?? []).reduce((t, k) => t + k.conLai, 0)
  const choKy = hd.trangThai === 'CHO_KY'
  const giaHan = hd.trangThai === 'HIEU_LUC' && hd.sapHetHan
  const hieuLuc = hd.trangThai === 'HIEU_LUC'
  const thanhLy = hd.trangThai === 'DA_THANH_LY'
  const moc: Array<[string, string, 'done' | 'cur' | 'todo']> = [
    ['Tạo & ký', dinhDangNgayIso(hd.ngayBatDau), choKy ? 'cur' : 'done'],
    ['Đang hiệu lực', hieuLuc ? `${hd.soNgayConLai} ngày còn lại` : '', hieuLuc ? 'cur' : thanhLy ? 'done' : 'todo'],
    [hd.sapHetHan ? 'Gia hạn hoặc báo trả phòng' : `Báo trước ${hd.soNgayBaoTruoc} ngày`, `trước ${dinhDangNgayIso(hd.ngayKetThuc)}`, thanhLy ? 'done' : 'todo'],
    ['Thanh lý & quyết toán cọc', '', thanhLy ? 'done' : 'todo'],
  ]
  const moNgan = (tieuDe: string) => () => setNgan(tieuDe)

  return (
    <div style={{ display: 'grid', gap: 16, minWidth: 0 }} data-testid="ho-so-hop-dong">
      <style>{CSS_BANG_QUAN_TRI}</style>
      <Breadcrumb items={[{ nhan: 'Hợp đồng', href: '/hop-dong' }, `#${hd.id}`]} />
      <div className="prof">
        <span className="avatar xl h2" aria-hidden="true"><Icon name="contract" /></span>
        <div className="grow">
          <h1 className="h1">Hợp đồng #{hd.id} · Phòng {hd.soPhong}</h1>
          <div className="meta">
            <span><Icon name="building" size="sm" />{toa.ten}</span>
            <span><Icon name="user" size="sm" />{hd.hoTenNguoiThue}</span>
            <span><Icon name="calendar" size="sm" />{dinhDangNgayIso(hd.ngayBatDau)} – {dinhDangNgayIso(hd.ngayKetThuc)}</span>
          </div>
          <div className="tags">
            <StatusTag tone={hieuLuc ? 'done' : choKy ? 'waiting' : 'neutral'}>{hd.tenTrangThai}</StatusTag>
            {hd.sapHetHan ? <StatusTag tone="waiting" icon="clock">Hết hạn sau {hd.soNgayConLai} ngày</StatusTag> : null}
            {tongNo > 0 ? <StatusTag tone="urgent">Nợ {dinhDangTien(tongNo)} ₫</StatusTag> : null}
          </div>
        </div>
        <div className="ph-acts">
          <Button variant="secondary" onClick={() => void tai()}><Icon name="download" />Tải PDF</Button>
          {giaHan ? <Button onClick={moNgan('Gia hạn hợp đồng')}>Gia hạn</Button> : null}
          {choKy ? <Button onClick={moNgan('Ký hợp đồng')}>Ký hợp đồng</Button> : null}
          <MenuThaoTac nhan="Thao tác khác: thanh lý, phụ lục, khoản phát sinh, người ở cùng, giao dịch cọc">
            {(dong) => [
              ['Thanh lý hợp đồng', 'lock'], ['Phụ lục', 'edit'], ['Khoản phát sinh', 'send'], ['Người ở cùng', 'eye'], ['Giao dịch cọc', 'key'],
            ].map(([nhan, icon]) => <MucMenu key={nhan} icon={icon as 'lock'} nguyHiem={nhan === 'Thanh lý hợp đồng'} onClick={() => { dong(); setNgan(nhan) }}>{nhan}</MucMenu>)}
          </MenuThaoTac>
        </div>
      </div>
      {thongBaoPdf ? <div role="alert" className="alert alert-danger"><Icon name="alert" />{thongBaoPdf}</div> : null}

      <div className="cols">
        <div className="side" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
          <Card title="Điều khoản">
            <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
              <div><div className="t-meta">Giá thuê</div><div className="bignum">{dinhDangTien(hd.giaThue)} ₫</div></div>
              <div><div className="t-meta">Tiền cọc</div><div className="bignum">{dinhDangTien(hd.tienCoc)} ₫</div></div>
              <div><div className="t-meta">Báo trước</div><div className="bignum">{hd.soNgayBaoTruoc} ngày</div></div>
            </div>
            <div className="progress" style={{ marginTop: 16 }} role="img" aria-label={`Đã qua ${qua}% thời hạn`}><span style={{ width: `${qua}%` }} /></div>
            <p className="t-meta" style={{ marginTop: 6 }}>Đã qua {qua}% thời hạn · còn {hd.soNgayConLai} ngày</p>
          </Card>
          <Card title="Dịch vụ áp dụng">
            {hd.dichVuApDung.length === 0 ? <p className="t-sm">Hợp đồng chưa áp dụng dịch vụ nào.</p>
              : hd.dichVuApDung.map((d) => <div className="sumrow" key={d.dichVuId}><span>{d.tenDichVu}</span><b>{Number(d.donGiaApDung) > 0 ? `${dinhDangTien(d.donGiaApDung)} ₫` : 'Miễn phí'}</b></div>)}
          </Card>
          <Card title="Hoá đơn theo hợp đồng" action={<span className="t-meta">{no === null ? 'chưa tải được' : no.length ? `${no.length} kỳ còn nợ` : 'không còn nợ'}</span>}>
            {no === null ? <p className="t-sm">Chưa tải được công nợ của hợp đồng này. Dữ liệu chưa bị thay đổi.</p>
              : no.length === 0 ? <p className="t-sm">Không còn khoản nợ nào.</p>
                : <div className="table-wrap table-wrap-cards"><table className="table table-cards"><thead><tr><th scope="col">Hoá đơn</th><th scope="col">Hạn</th><th scope="col" className="num">Còn lại</th></tr></thead>
                  <tbody>{no.map((k) => <tr key={k.id}><td className="td-main" data-label="Hoá đơn" data-the="tieu-de">{k.ma}</td><td data-label="Hạn">{dinhDangNgayIso(k.han)}</td><td className="num t-money t-danger" data-label="Còn lại">{dinhDangTien(k.conLai)} ₫</td></tr>)}</tbody></table></div>}
          </Card>
        </div>
        <div className="side" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
          <Card title="Liên kết">
            <div style={{ margin: '4px -24px -8px' }}>
              <a className="irow" href={`/nguoi-thue/${hd.nguoiThueId}`}><span className={`avatar sm h${(hd.nguoiThueId % 5) + 1}`} aria-hidden="true">{chuCaiDau(hd.hoTenNguoiThue)}</span><div className="body"><div className="t">{hd.hoTenNguoiThue}</div><div className="s">Người thuê chính</div></div><Icon name="chevron-right" size="sm" /></a>
              <a className="irow" href={`/phong/${hd.phongId}?toaNhaId=${toa.id}`}><span className="tile" aria-hidden="true"><Icon name="door" /></span><div className="body"><div className="t">Phòng {hd.soPhong}</div><div className="s">{toa.ten}</div></div><Icon name="chevron-right" size="sm" /></a>
            </div>
          </Card>
          <Card title="Mốc">
            <div className="vsteps" style={{ marginTop: 8 }}>
              {moc.map(([tt, st, tr], i) => (
                <div key={tt} className={`vstep ${tr}`}>
                  <span className="n">{tr === 'done' ? <Icon name="check" size="sm" /> : i + 1}</span>
                  <div><div className="tt">{tt}</div><div className="st">{st}</div></div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {ngan ? (
        <Ngan tieuDe={`${ngan} · hợp đồng #${hd.id}`} onDong={dongNgan}>
          {/* HopDongThaoTac chưa xuất từng phần thao tác (x11 sở hữu): nhúng nguyên chế độ chi tiết, các thao tác nằm trong đó. */}
          <HopDongThaoTac token={token} buildingId={toa.id} selectedHopDongId={hd.id} onDongChiTiet={dongNgan} embedded />
        </Ngan>
      ) : null}
    </div>
  )
}
