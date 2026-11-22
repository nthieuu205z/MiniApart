import { useEffect, useState } from 'react'
import './HoSoHopDongToa.css'
import { ApiError, fetchCongNoBaoCao, fetchHoaDonQuanLy, fetchHopDongQuanLy, fetchPhong, fetchToaNha, type ThongTinHopDong, type ThongTinPhong, type ThongTinToaNha, type ThongTinYeuCauSuaChua } from './api'
import { chuCaiDau, CSS_BANG_QUAN_TRI } from './bangQuanTriChung'
import { FormToaNha } from './DanhMucToaNha'
import { Button } from './design/core/Button'
import { dinhDangTien } from './design/core/format'
import { Icon } from './design/core/Icon'
import { StatusTag } from './design/core/StatusTag'
import { EmptyState } from './design/feedback/EmptyState'
import { Card } from './design/layout/Card'
import { Breadcrumb } from './design/shell/Breadcrumb'
import type { TrangProps } from './dinhTuyen'
import { Ngan } from './HoSoHopDong360'
import { managementRequest } from './managementApi'

type KhoanNo = { hopDongId: number; conLai: number; han: string }
type DuLieu = {
  toa: ThongTinToaNha
  phong: ThongTinPhong[]
  // null = phần phụ không tải được (hiện ghi chú, không chặn cả hồ sơ)
  hopDong: ThongTinHopDong[] | null
  no: KhoanNo[] | null
  suCo: ThongTinYeuCauSuaChua[] | null
}

const thongBaoLoi = (e: unknown, mau: string) => (e instanceof ApiError || e instanceof Error ? e.message : mau)
const hoacNull = async <T,>(viec: Promise<T>): Promise<T | null> => { try { return await viec } catch { return null } }
const soNgayTre = (han: string) => Math.max(0, Math.round((new Date().setHours(0, 0, 0, 0) - new Date(`${han}T00:00:00`).getTime()) / 86_400_000))
const CLASS_PHONG: Record<string, string> = { TRONG: 'room trong', DANG_SUA: 'room sua' }

async function taiHoSo(token: string, vaiTro: string, id: number): Promise<DuLieu | null> {
  const toa = (await fetchToaNha(token)).find((t) => t.id === id)
  if (!toa) return null
  // Quản trị hệ thống không có quyền đọc phòng/hợp đồng/công nợ: chỉ hiện thông tin toà.
  if (vaiTro === 'QTHT') return { toa, phong: [], hopDong: null, no: null, suCo: null }
  const [phong, hopDong, no, suCo] = await Promise.all([
    fetchPhong(token, id),
    hoacNull(fetchHopDongQuanLy(token, id)),
    // Chủ đọc báo cáo công nợ; Quản lý chỉ có danh sách hoá đơn nợ của toà.
    hoacNull(vaiTro === 'CHU'
      ? fetchCongNoBaoCao(token, id).then((r) => r.congNo.map((k) => ({ hopDongId: k.hopDongId, conLai: Number(k.conLai), han: k.hanThanhToan })))
      : fetchHoaDonQuanLy(token, id).then((r) => r.map((k) => ({ hopDongId: k.hopDongId, conLai: Number(k.conLai), han: k.hanThanhToan })))),
    hoacNull(managementRequest<ThongTinYeuCauSuaChua[]>(token, `/api/yeu-cau-sua-chua?toaNhaId=${id}`)),
  ])
  return { toa, phong, hopDong, no, suCo }
}

export default function HoSoToa360({ token, vaiTro, thamSo, dieuHuong }: TrangProps) {
  const id = Number(thamSo.id)
  const [du, setDu] = useState<DuLieu | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [loi, setLoi] = useState<string | null>(null)
  const [lan, setLan] = useState(0)
  const [nganSua, setNganSua] = useState(false)
  const [thongBao, setThongBao] = useState<string | null>(null)
  const coQuyenVanHanh = vaiTro === 'CHU' || vaiTro === 'QUAN_LY'

  useEffect(() => {
    let con = true
    setDangTai(true); setLoi(null)
    taiHoSo(token, vaiTro, id)
      .then((d) => { if (con) setDu(d) })
      .catch((e: unknown) => { if (con) setLoi(thongBaoLoi(e, 'Không thể tải hồ sơ toà nhà.')) })
      .finally(() => { if (con) setDangTai(false) })
    return () => { con = false }
  }, [token, vaiTro, id, lan])

  if (dangTai && !du) return <EmptyState kind="loading" title="Đang tải hồ sơ toà nhà…" />
  if (loi) return <EmptyState kind="error" title="Không tải được hồ sơ toà nhà" body={`${loi} Dữ liệu chưa bị thay đổi.`} actionLabel="Thử lại" onAction={() => setLan((n) => n + 1)} />
  if (!du) return <EmptyState title="Không tìm thấy toà nhà này" body="Toà nhà không tồn tại hoặc không thuộc phạm vi bạn được xem." actionLabel="Danh sách toà" onAction={() => dieuHuong('/toa-nha')} />

  const { toa, phong, hopDong, no, suCo } = du
  const hdTheoId = new Map((hopDong ?? []).map((h) => [h.id, h]))
  const hdHieuLuc = new Map((hopDong ?? []).filter((h) => h.trangThai === 'HIEU_LUC').map((h) => [h.phongId, h]))
  const dem = (tt: string) => phong.filter((p) => p.trangThai === tt).length
  const tang = [...new Set(phong.map((p) => p.tang))].sort((a, b) => a - b)
  const tongNo = (no ?? []).reduce((t, k) => t + k.conLai, 0)
  const suCoMo = (suCo ?? []).filter((s) => !['DA_DONG', 'DA_HUY'].includes(s.trangThai))
  const canXuLy = (hopDong ?? []).filter((h) => h.trangThai === 'CHO_KY' || (h.trangThai === 'HIEU_LUC' && h.sapHetHan))

  // Gộp nợ theo người thuê (qua hợp đồng), xếp giảm dần.
  const theoNguoi = new Map<number, { id: number; ten: string; phong: string; tong: number; ky: number; tre: number }>()
  for (const k of no ?? []) {
    const h = hdTheoId.get(k.hopDongId)
    if (!h) continue
    const cu = theoNguoi.get(h.nguoiThueId) ?? { id: h.nguoiThueId, ten: h.hoTenNguoiThue, phong: h.soPhong, tong: 0, ky: 0, tre: 0 }
    theoNguoi.set(h.nguoiThueId, { ...cu, tong: cu.tong + k.conLai, ky: cu.ky + 1, tre: Math.max(cu.tre, soNgayTre(k.han)) })
  }
  const nguoiNo = [...theoNguoi.values()].sort((a, b) => b.tong - a.tong)
  const q = `?toaNhaId=${toa.id}`

  return (
    <div className="hs-toa" style={{ display: 'grid', gap: 16, minWidth: 0 }} data-testid="ho-so-toa">
      <style>{CSS_BANG_QUAN_TRI}</style>
      <Breadcrumb items={[{ nhan: 'Toà & phòng', href: '/toa-nha' }, toa.ten]} />
      <div className="prof">
        <span className="avatar xl h5" aria-hidden="true"><Icon name="building" /></span>
        <div className="grow">
          <h1 className="h1">{toa.ten}</h1>
          <div className="meta">
            <span><Icon name="pin" size="sm" />{toa.diaChi}</span>
            <span>{toa.soTang} tầng{coQuyenVanHanh ? ` · ${phong.length} phòng` : ''}</span>
            <span>chốt sổ ngày {toa.ngayChotSo}</span>
          </div>
        </div>
        {coQuyenVanHanh ? (
          <div className="ph-acts">
            <Button variant="secondary" onClick={() => { setThongBao(null); setNganSua(true) }}><Icon name="edit" />Sửa thông tin toà</Button>
            {vaiTro === 'QUAN_LY' ? <a className="btn btn-primary" href={`/phong${q}&moi=1`}><Icon name="plus" />Khai báo phòng</a> : null}
          </div>
        ) : null}
      </div>
      {thongBao ? <div role="status" className="alert alert-success"><Icon name="check-circle" />{thongBao}</div> : null}

      {coQuyenVanHanh ? (
        <>
          <div className="strip">
            <a href={`/nguoi-thue${q}`}><div className="k">Đang thuê</div><div className="v">{dem('DANG_THUE')}/{phong.length}</div><div className="s">{dem('TRONG')} trống · {dem('DANG_SUA')} đang sửa</div></a>
            <a href={`/thu-tien${q}`}><div className="k">Còn phải thu</div><div className={`v${no && tongNo > 0 ? ' t-danger' : ''}`}>{no ? `${dinhDangTien(tongNo)} ₫` : '—'}</div><div className="s">{no ? `${nguoiNo.length} người` : 'chưa tải được'}</div></a>
            <a href={`/su-co${q}`}><div className="k">Sự cố đang mở</div><div className="v">{suCo ? suCoMo.length : '—'}</div><div className="s">{suCo ? `${suCoMo.filter((s) => s.mucDo !== 'THUONG').length} gấp/khẩn` : 'chưa tải được'}</div></a>
            <a href={`/hop-dong${q}&sapHetHan=true`}><div className="k">Hợp đồng cần xử lý</div><div className="v">{hopDong ? canXuLy.length : '—'}</div><div className="s">{hopDong ? `${canXuLy.filter((h) => h.sapHetHan).length} sắp hết · ${canXuLy.filter((h) => h.trangThai === 'CHO_KY').length} chờ ký` : 'chưa tải được'}</div></a>
          </div>

          <Card title="Sơ đồ phòng" action={<span className="t-meta">bấm vào phòng để mở hồ sơ phòng</span>}>
            {phong.length === 0 ? <p className="t-sm">Toà này chưa có phòng nào. Dùng nút “Khai báo phòng” ở đầu trang.</p> : tang.map((t) => (
              <div key={t} className="hs-hang-tang">
                <div className="hs-tang">Tầng {t}</div>
                <div className="rooms hs-so-do">
                  {phong.filter((p) => p.tang === t).map((p) => {
                    const nguoi = hdHieuLuc.get(p.id ?? -1)?.hoTenNguoiThue
                    const noi = <><b>{p.soPhong}</b><span>{p.trangThai === 'DANG_THUE' && nguoi ? nguoi.split(' ').slice(-2).join(' ') : p.tenTrangThai}</span></>
                    const nhan = `Phòng ${p.soPhong}, ${p.tenTrangThai}`
                    return p.id === null
                      ? <div key={p.soPhong} className={CLASS_PHONG[p.trangThai] ?? 'room'} aria-label={nhan} role="group">{noi}</div>
                      : <a key={p.id} className={CLASS_PHONG[p.trangThai] ?? 'room'} href={`/phong/${p.id}${q}`} aria-label={nhan}>{noi}</a>
                  })}
                </div>
              </div>
            ))}
          </Card>

          <Card title="Cần chú ý ở toà này" action={<span className="t-meta">{no ? `${nguoiNo.length} người còn nợ` : 'chưa tải được công nợ'} · {hopDong ? `${canXuLy.length} hợp đồng cần xử lý` : 'chưa tải được hợp đồng'}</span>}>
            <div style={{ margin: '4px -24px -8px' }}>
              {nguoiNo.slice(0, 3).map((n) => (
                <a key={n.id} className="irow" href={`/nguoi-thue/${n.id}`}>
                  <span className={`avatar sm h${(n.id % 5) + 1}`} aria-hidden="true">{chuCaiDau(n.ten)}</span>
                  <div className="body"><div className="t">{n.ten} · Phòng {n.phong}</div><div className="s">{n.ky} kỳ chưa trả đủ · trễ {n.tre} ngày</div></div>
                  <div className="money t-danger">{dinhDangTien(n.tong)} ₫</div><Icon name="chevron-right" size="sm" />
                </a>
              ))}
              {canXuLy.map((h) => (
                <a key={h.id} className="irow" href={`/hop-dong/${h.id}`}>
                  <span className="tile warm" aria-hidden="true"><Icon name="contract" /></span>
                  <div className="body"><div className="t">Hợp đồng #{h.id} · Phòng {h.soPhong} · {h.hoTenNguoiThue}</div><div className="s">{h.trangThai === 'CHO_KY' ? `chờ ký, bắt đầu ${h.ngayBatDau.split('-').reverse().join('/')}` : `hết hạn ${h.ngayKetThuc.split('-').reverse().join('/')}`}</div></div>
                  <StatusTag tone={h.trangThai === 'CHO_KY' ? 'draft' : 'waiting'}>{h.trangThai === 'CHO_KY' ? 'Chờ ký' : `Còn ${h.soNgayConLai} ngày`}</StatusTag><Icon name="chevron-right" size="sm" />
                </a>
              ))}
              {nguoiNo.length === 0 && canXuLy.length === 0 ? <p className="t-sm" style={{ padding: '0 24px 12px' }}>Chưa có gì cần chú ý ở toà này.</p> : null}
            </div>
          </Card>
        </>
      ) : (
        <Card title="Thông tin toà">
          <dl className="kv" style={{ marginTop: 8, gridTemplateColumns: '140px minmax(0, 1fr)' }}>
            <dt>Mã toà</dt><dd>{toa.maToa}</dd>
            <dt>Địa chỉ</dt><dd>{toa.diaChi}</dd>
            <dt>Số tầng</dt><dd>{toa.soTang}</dd>
            <dt>Chốt số</dt><dd>ngày {toa.ngayChotSo} hằng tháng</dd>
            <dt>Hạn thanh toán</dt><dd>{toa.soNgayHanTt} ngày</dd>
          </dl>
          <p className="t-sm" style={{ marginTop: 12 }}>Quản trị hệ thống chỉ xem thông tin toà; phòng, hợp đồng và công nợ do Chủ nhà và Quản lý theo dõi.</p>
        </Card>
      )}

      {nganSua ? (
        <Ngan tieuDe="Sửa thông tin toà" onDong={() => setNganSua(false)}>
          <FormToaNha token={token} toa={toa} onHuy={() => setNganSua(false)} onXong={(x) => { setDu({ ...du, toa: x }); setNganSua(false); setThongBao('Đã cập nhật thông tin toà nhà.') }} />
        </Ngan>
      ) : null}
    </div>
  )
}
