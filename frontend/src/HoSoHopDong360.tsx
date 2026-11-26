import { Fragment, useEffect, useRef, useState, createElement, type ComponentType, type ReactNode } from 'react'
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
import { DauTrang } from './design/layout/DauTrang'
import { ChanDinh } from './design/layout/ChanDinh'
import { ThanhBuoc, type Buoc } from './design/core/ThanhBuoc'
import type { TrangProps } from './dinhTuyen'
import { GiaHanHopDong, KyHopDong, NguoiOCungHopDong, PhuLucHopDong, ThanhLyHopDong, type ThaoTacConProps } from './HopDongThaoTac'
import { tien } from './HoSoNguoiThue360'
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

export default function HoSoHopDong360({ token, vaiTro, mobile, thamSo, dieuHuong }: TrangProps) {
  const id = Number(thamSo.id)
  const { danhSach, dangTai: dangTaiToa } = useToaDangChon()
  const [du, setDu] = useState<DuLieu | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [lan, setLan] = useState(0)
  const [ngan, setNgan] = useState<string | null>(null)
  const [thaoTac, setThaoTac] = useState<ComponentType<ThaoTacConProps> | null>(null)
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

  const dongNgan = () => { setNgan(null); setThaoTac(null); setLan((n) => n + 1) } // sau thao tác trong ngăn: tải lại hồ sơ
  const tai = async () => {
    setThongBaoPdf(null)
    try { await downloadManagementFile(token, `/api/hop-dong/${id}/xuat-pdf`, `hop-dong-${id}.pdf`) } catch (e) { setThongBaoPdf(thongBaoLoi(e, 'Không thể tải PDF.')) }
  }

  if (dangTai && !du) return <EmptyState kind="loading" title="Đang tải hồ sơ hợp đồng…" />
  if (loi) return <EmptyState kind="error" title="Không tải được hồ sơ hợp đồng" body={`${loi} Dữ liệu chưa bị thay đổi.`} actionLabel="Thử lại" onAction={() => setLan((n) => n + 1)} />
  if (!du) return <EmptyState title="Không tìm thấy hợp đồng này" body="Hợp đồng không tồn tại hoặc không thuộc toà bạn được xem." actionLabel="Danh sách hợp đồng" onAction={() => dieuHuong('/hop-dong')} />

  const { hd, toa, no } = du
  const tongNo = (no ?? []).reduce((t, k) => t + k.conLai, 0)
  const choKy = hd.trangThai === 'CHO_KY'
  const hieuLuc = hd.trangThai === 'HIEU_LUC'
  const giaHan = hieuLuc && hd.sapHetHan
  const thanhLy = hd.trangThai === 'DA_THANH_LY'
  const coc = Number(hd.tienCoc)
  const hoanLai = Math.max(0, coc - tongNo)
  const hanBaoDaQua = hd.soNgayConLai < hd.soNgayBaoTruoc
  const moNgan = (tieuDe: string, Con: ComponentType<ThaoTacConProps>) => () => { setNgan(tieuDe); setThaoTac(() => Con) }
  const buoc: Buoc[] = [
    { ten: 'Tạo hợp đồng', trangThai: 'xong', moTa: dinhDangNgayIso(hd.ngayBatDau) },
    { ten: 'Hai bên ký', trangThai: choKy ? 'nay' : 'xong' },
    { ten: 'Đang hiệu lực', trangThai: choKy ? 'cho' : thanhLy || giaHan ? 'xong' : 'nay', moTa: hieuLuc ? `còn ${hd.soNgayConLai} ngày` : undefined },
    { ten: 'Gia hạn hoặc báo trả phòng', trangThai: thanhLy ? 'xong' : giaHan ? 'nay' : 'cho', moTa: `trước ${dinhDangNgayIso(hd.ngayKetThuc)}` },
    { ten: 'Thanh lý, hoàn cọc', trangThai: thanhLy ? 'xong' : 'cho' },
  ]
  // Nút chính theo trạng thái; Thanh lý không bao giờ là nút chính.
  const nutChinh = giaHan ? <Button onClick={moNgan('Gia hạn hợp đồng', GiaHanHopDong)}>Gia hạn hợp đồng</Button> : choKy ? <Button onClick={moNgan('Ký hợp đồng', KyHopDong)}>Ghi nhận đã ký</Button> : null

  return (
    <div style={{ display: 'grid', gap: 16, minWidth: 0 }} data-testid="ho-so-hop-dong">
      <style>{CSS_BANG_QUAN_TRI}</style>
      <DauTrang
        vet={[{ nhan: 'Hợp đồng', href: '/hop-dong' }, { nhan: `Phòng ${hd.soPhong}`, href: `/hop-dong/${hd.id}` }]}
        tieuDe={`Hợp đồng phòng ${hd.soPhong}`}
        phu={`${hd.hoTenNguoiThue} · ${toa.ten}`}
        hanhDong={<>
          <Button variant="secondary" onClick={() => void tai()}>Tải PDF</Button>
          {mobile ? null : nutChinh}
          <MenuThaoTac nhan="Thao tác khác: phụ lục, khoản phát sinh, người ở cùng, giao dịch cọc">
            {(dong) => ([
              ['Phụ lục', 'edit', PhuLucHopDong], ['Khoản phát sinh', 'send', '/hoa-don'], ['Người ở cùng', 'eye', NguoiOCungHopDong], ['Giao dịch cọc', 'key', '/thu-tien'],
            ] as const).map(([nhan, icon, dich]) => ( // chưa có thao tác riêng cho phát sinh/cọc trong hồ sơ: đi tới màn hoá đơn/thu tiền
              <MucMenu key={nhan} icon={icon} onClick={() => { dong(); if (typeof dich === 'string') dieuHuong(dich); else moNgan(nhan, dich)() }}>{nhan}</MucMenu>
            ))}
          </MenuThaoTac>
        </>}
      />
      {thongBaoPdf ? <div role="alert" className="alert alert-danger"><Icon name="alert" />{thongBaoPdf}</div> : null}
      {giaHan ? <p className="banner banner-warning" role="status">Hết hạn ngày <b>{dinhDangNgayIso(hd.ngayKetThuc)}</b>, còn {hd.soNgayConLai} ngày.{hanBaoDaQua ? ` Người thuê phải báo trước ${hd.soNgayBaoTruoc} ngày nếu trả phòng, hạn báo đã qua.` : ''}</p> : null}

      <div className="cols">
        <div className="side" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
          <Card title="Điều khoản chính">
            <dl className="kv">
              <dt>Giá thuê</dt><dd>{dinhDangTien(hd.giaThue)} ₫ / tháng</dd>
              <dt>Tiền cọc</dt><dd>{dinhDangTien(hd.tienCoc)} ₫</dd>
              <dt>Thời hạn</dt><dd>{dinhDangNgayIso(hd.ngayBatDau)} – {dinhDangNgayIso(hd.ngayKetThuc)}</dd>
              <dt>Báo trước khi trả phòng</dt><dd>{hd.soNgayBaoTruoc} ngày</dd>
              <dt>Trạng thái</dt><dd><StatusTag tone={hieuLuc ? 'done' : choKy ? 'waiting' : 'neutral'}>{hd.tenTrangThai}</StatusTag></dd>
              {hd.dichVuApDung.map((d) => <Fragment key={d.dichVuId}><dt>{d.tenDichVu}</dt><dd>{Number(d.donGiaApDung) > 0 ? `${dinhDangTien(d.donGiaApDung)} ₫` : 'Miễn phí'}</dd></Fragment>)}
            </dl>
          </Card>
          <Card title="Hoá đơn theo hợp đồng" action={<span className="t-meta">{no === null ? 'chưa tải được' : no.length ? `${no.length} tháng còn nợ` : 'không còn nợ'}</span>}>
            {no === null ? <p className="t-sm">Chưa tải được công nợ của hợp đồng này. Dữ liệu chưa bị thay đổi.</p>
              : no.length === 0 ? <p className="t-sm">Không còn khoản nợ nào.</p>
                : <div className="table-wrap table-wrap-cards"><table className="table table-cards"><thead><tr><th scope="col">Hoá đơn</th><th scope="col">Hạn</th><th scope="col" className="num">Còn nợ</th></tr></thead>
                  <tbody>{no.map((k) => <tr key={k.id}><td className="td-main" data-label="Hoá đơn" data-the="tieu-de">{k.ma}</td><td data-label="Hạn">{dinhDangNgayIso(k.han)}</td><td className="num t-money t-danger" data-label="Còn nợ">{dinhDangTien(k.conLai)} ₫</td></tr>)}</tbody></table></div>}
          </Card>
          <Card title="Liên kết">
            <div style={{ margin: '4px -24px -8px' }}>
              <a className="irow" href={`/nguoi-thue/${hd.nguoiThueId}`}><span className={`avatar sm h${(hd.nguoiThueId % 5) + 1}`} aria-hidden="true">{chuCaiDau(hd.hoTenNguoiThue)}</span><div className="body"><div className="t">{hd.hoTenNguoiThue}</div><div className="s">Người thuê chính</div></div><Icon name="chevron-right" size="sm" /></a>
              <a className="irow" href={`/phong/${hd.phongId}?toaNhaId=${toa.id}`}><span className="tile" aria-hidden="true"><Icon name="door" /></span><div className="body"><div className="t">Phòng {hd.soPhong}</div><div className="s">{toa.ten}</div></div><Icon name="chevron-right" size="sm" /></a>
            </div>
          </Card>
        </div>
        <div className="side" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
          <Card title="Vòng đời hợp đồng"><ThanhBuoc doc nhan="Vòng đời hợp đồng" buoc={buoc} /></Card>
          {hieuLuc ? (
            <Card title="Nếu thanh lý hôm nay">
              <div className="sumrow"><span>Cọc đang giữ</span><b>{tien(coc)}</b></div>
              <div className="sumrow"><span>Trừ nợ hoá đơn</span><b>{no === null ? '—' : `− ${tien(tongNo)}`}</b></div>
              <div className="sumrow hs-hoan"><span>Hoàn lại người thuê</span><b>{no === null ? '—' : tien(hoanLai)}</b></div>
              {no !== null && tongNo > coc ? <p className="t-sm t-danger" style={{ marginTop: 8 }}>Nợ lớn hơn cọc {tien(tongNo - coc)}. Cần thu thêm trước khi thanh lý.</p> : null}
              <div style={{ marginTop: 12 }}><Button variant="danger" onClick={moNgan('Thanh lý hợp đồng', ThanhLyHopDong)}>Thanh lý hợp đồng…</Button></div>
            </Card>
          ) : null}
        </div>
      </div>
      {mobile && nutChinh ? <ChanDinh>{nutChinh}</ChanDinh> : null}

      {ngan && thaoTac ? (
        <Ngan tieuDe={`${ngan} · hợp đồng #${hd.id}`} onDong={dongNgan}>
          {createElement(thaoTac, { token, buildingId: toa.id, hopDong: hd, onXong: dongNgan })}
        </Ngan>
      ) : null}
    </div>
  )
}
