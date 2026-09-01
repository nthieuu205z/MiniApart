import { FormEvent, useEffect, useState } from 'react'
import {
  ApiError,
  capNhatNguoiDungQuanLy,
  fetchNguoiDungQuanLy,
  fetchToaNha,
  fetchVaiTro,
  khoaNguoiDungQuanLy,
  taoNguoiDungQuanLy,
  type ThongTinQuanLyNguoiDung,
  type ThongTinToaNha,
  type ThongTinVaiTro,
  type YeuCauQuanLyNguoiDung,
} from './api'
import { Button } from './design/core/Button'
import { StatusTag } from './design/core/StatusTag'
import { SysLabel } from './design/core/SysLabel'
import { ConfirmDialog } from './design/feedback/ConfirmDialog'
import { EmptyState } from './design/feedback/EmptyState'
import { Toast } from './design/feedback/Toast'

type Props = {
  token: string
}

type BieuMauTaiKhoan = YeuCauQuanLyNguoiDung & {
  id: number | null
}

export default function QuanLyTaiKhoan({ token }: Props) {
  const [danhSach, setDanhSach] = useState<ThongTinQuanLyNguoiDung[]>([])
  const [toaNha, setToaNha] = useState<ThongTinToaNha[]>([])
  const [vaiTro, setVaiTro] = useState<ThongTinVaiTro[]>([])
  const [bieuMau, setBieuMau] = useState<BieuMauTaiKhoan | null>(null)
  const [dangTai, setDangTai] = useState(true)
  const [dangLuu, setDangLuu] = useState(false)
  const [idDangKhoa, setIdDangKhoa] = useState<number | null>(null)
  const [nguoiDungChoKhoa, setNguoiDungChoKhoa] = useState<ThongTinQuanLyNguoiDung | null>(null)
  const [loi, setLoi] = useState<string | null>(null)
  const [thongBao, setThongBao] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    setDangTai(true)
    setLoi(null)

    Promise.all([fetchNguoiDungQuanLy(token), fetchToaNha(token), fetchVaiTro(token)])
      .then(([accounts, buildings, roles]) => {
        if (!mounted) return
        setDanhSach(accounts)
        setToaNha(buildings)
        setVaiTro(roles)
      })
      .catch((reason: unknown) => {
        if (!mounted) return
        setLoi(thongBaoLoi(reason, 'Không thể tải dữ liệu quản lý tài khoản.'))
      })
      .finally(() => {
        if (mounted) setDangTai(false)
      })

    return () => {
      mounted = false
    }
  }, [token])

  function batDauTao() {
    setThongBao(null)
    setLoi(null)
    setBieuMau({
      id: null,
      hoTen: '',
      soDienThoai: '',
      vaiTro: vaiTro[0]?.vaiTro ?? '',
      toaNhaIds: [],
    })
  }

  function batDauSua(nguoiDung: ThongTinQuanLyNguoiDung) {
    setThongBao(null)
    setLoi(null)
    setBieuMau({
      id: nguoiDung.id,
      hoTen: nguoiDung.hoTen,
      soDienThoai: nguoiDung.soDienThoai,
      vaiTro: nguoiDung.vaiTro,
      toaNhaIds: nguoiDung.toaNhaIds,
    })
  }

  function huyBieuMau() {
    setBieuMau(null)
    setLoi(null)
  }

  async function luuTaiKhoan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!bieuMau) return

    setDangLuu(true)
    setLoi(null)
    setThongBao(null)
    const { id, ...payload } = bieuMau

    try {
      const taiKhoan = id === null
        ? await taoNguoiDungQuanLy(token, payload)
        : await capNhatNguoiDungQuanLy(token, id, payload)

      setDanhSach((current) => id === null
        ? [...current, taiKhoan]
        : current.map((item) => item.id === taiKhoan.id ? taiKhoan : item))
      setBieuMau(null)
      setThongBao(id === null ? 'Đã tạo tài khoản và gửi mã kích hoạt.' : 'Đã cập nhật tài khoản.')
    } catch (reason: unknown) {
      setLoi(thongBaoLoi(reason, 'Không thể lưu tài khoản.'))
    } finally {
      setDangLuu(false)
    }
  }

  async function khoaTaiKhoan(nguoiDung: ThongTinQuanLyNguoiDung) {
    setIdDangKhoa(nguoiDung.id)
    setLoi(null)
    setThongBao(null)

    try {
      const taiKhoan = await khoaNguoiDungQuanLy(token, nguoiDung.id)
      setDanhSach((current) => current.map((item) => item.id === taiKhoan.id ? taiKhoan : item))
      setThongBao(`Đã khoá tài khoản ${taiKhoan.hoTen}.`)
    } catch (reason: unknown) {
      setLoi(thongBaoLoi(reason, 'Không thể khoá tài khoản.'))
    } finally {
      setIdDangKhoa(null)
    }
  }

  return (
    <section data-testid="account-management" aria-labelledby="account-management-title" style={{ display: 'grid', gap: 16, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <SysLabel>FR-AUT-06</SysLabel>
          <h3 id="account-management-title">Quản lý tài khoản</h3>
        </div>
        <Button onClick={batDauTao}>Tạo tài khoản</Button>
      </div>

      <p style={{ margin: 0, color: 'var(--ma-text-secondary)', lineHeight: 1.6 }}>
        Tạo tài khoản sẽ gửi mã kích hoạt để người dùng tự chọn mật khẩu. Tài khoản đã phát sinh dữ liệu chỉ được khoá, không xoá.
      </p>

      {loi ? <p style={{ margin: 0, color: 'var(--ma-urgent)' }} role="alert">{loi}</p> : null}
      {thongBao ? <Toast>{thongBao}</Toast> : null}

      {dangTai ? (
        <p style={{ margin: 0, color: 'var(--ma-text-secondary)' }} aria-live="polite">Đang tải danh sách tài khoản…</p>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--ma-border-default)' }}>
          <table style={{ width: '100%', minWidth: 700, borderCollapse: 'collapse', textAlign: 'left' }}>
            <caption>Danh sách tài khoản</caption>
            <thead>
              <tr>
                <th scope="col">Họ tên</th>
                <th scope="col">Số điện thoại</th>
                <th scope="col">Vai trò</th>
                <th scope="col">Toà được giao</th>
                <th scope="col">Trạng thái</th>
                <th scope="col"><span className="sr-only">Thao tác</span></th>
              </tr>
            </thead>
            <tbody>
              {danhSach.map((nguoiDung) => (
                <tr key={nguoiDung.id} data-account-id={nguoiDung.id}>
                  <th scope="row">{nguoiDung.hoTen}</th>
                  <td>{nguoiDung.soDienThoai}</td>
                  <td>{nguoiDung.tenVaiTro}</td>
                  <td>{danhSachToaNha(nguoiDung.toaNhaIds, toaNha)}</td>
                  <td><StatusTag tone={nguoiDung.trangThai === 'BI_KHOA' ? 'closed' : 'done'}>{nguoiDung.tenTrangThai}</StatusTag></td>
                  <td style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <Button variant="secondary" onClick={() => batDauSua(nguoiDung)} style={{ minHeight: 44 }}>Sửa {nguoiDung.hoTen}</Button>
                    {nguoiDung.trangThai === 'HOAT_DONG' ? (
                      <Button
                        variant="secondary"
                        style={{ minHeight: 44 }}
                        type="button"
                        blocked={idDangKhoa === nguoiDung.id}
                        blockedReason={idDangKhoa === nguoiDung.id ? 'Đang cập nhật trạng thái tài khoản.' : undefined}
                        onClick={() => setNguoiDungChoKhoa(nguoiDung)}
                      >
                        {idDangKhoa === nguoiDung.id ? 'Đang khoá…' : `Khoá ${nguoiDung.hoTen}`}
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {danhSach.length === 0 ? <EmptyState title="Chưa có tài khoản nào." /> : null}
        </div>
      )}

      {bieuMau ? (
        <form data-testid="account-form" onSubmit={luuTaiKhoan} style={{ display: 'grid', gap: 16, padding: 16, border: '1px solid var(--ma-border-default)', minWidth: 0 }}>
          <div>
            <SysLabel>FR-AUT-06</SysLabel>
            <h4>{bieuMau.id === null ? 'Tạo tài khoản' : 'Sửa tài khoản'}</h4>
          </div>

          <label style={FIELD_STYLE}>
            <span>Họ tên</span>
            <input
              name="hoTen"
              value={bieuMau.hoTen}
              onChange={(event) => setBieuMau((current) => current ? { ...current, hoTen: event.target.value } : current)}
              required
            />
          </label>

          <label style={FIELD_STYLE}>
            <span>Số điện thoại</span>
            <input
              name="soDienThoai"
              value={bieuMau.soDienThoai}
              onChange={(event) => setBieuMau((current) => current ? { ...current, soDienThoai: event.target.value } : current)}
              inputMode="tel"
              required
            />
          </label>

          <label style={FIELD_STYLE}>
            <span>Vai trò</span>
            <select
              name="vaiTro"
              value={bieuMau.vaiTro}
              required
              onChange={(event) => setBieuMau((current) => current ? { ...current, vaiTro: event.target.value } : current)}
            >
              {vaiTro.map((role) => <option key={role.vaiTro} value={role.vaiTro}>{role.tenVaiTro}</option>)}
            </select>
          </label>

          <fieldset style={{ display: 'grid', gap: 10, margin: 0, padding: 0, border: 0 }}>
            <legend>Toà nhà được giao</legend>
            {toaNha.length === 0 ? (
              <p style={{ margin: 0, color: 'var(--ma-text-secondary)' }}>Chưa có toà nhà để gán.</p>
            ) : (
              toaNha.map((item) => (
                <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, minHeight: 44 }}>
                  <input
                    type="checkbox"
                    name="toaNhaIds"
                    value={item.id}
                    checked={bieuMau.toaNhaIds.includes(item.id)}
                    onChange={(event) => setBieuMau((current) => {
                      if (!current) return current
                      const toaNhaIds = event.target.checked
                        ? [...current.toaNhaIds, item.id]
                        : current.toaNhaIds.filter((id) => id !== item.id)
                      return { ...current, toaNhaIds }
                    })}
                  />
                  <span>{item.maToa} · {item.ten}</span>
                </label>
              ))
            )}
          </fieldset>

          <p style={{ margin: 0, color: 'var(--ma-text-secondary)', lineHeight: 1.6 }}>Không nhập mật khẩu hộ người dùng. Mã kích hoạt sẽ được gửi riêng để họ tự đặt mật khẩu.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            <Button type="submit" blocked={dangLuu} blockedReason={dangLuu ? 'Đang lưu tài khoản.' : undefined}>
              {dangLuu ? 'Đang lưu…' : bieuMau.id === null ? 'Tạo tài khoản' : 'Lưu thay đổi'}
            </Button>
            <Button type="button" variant="secondary" onClick={huyBieuMau} blocked={dangLuu} style={{ minHeight: 44 }}>Huỷ</Button>
          </div>
        </form>
      ) : null}
      {nguoiDungChoKhoa ? <ConfirmDialog
        title={`Khoá tài khoản ${nguoiDungChoKhoa.hoTen}?`}
        consequence={<>Người dùng sẽ <strong>không đăng nhập được nữa</strong>; lịch sử thao tác và bản ghi đã tạo vẫn giữ nguyên. Có thể mở khoá lại được.</>}
        confirmLabel="Khoá tài khoản"
        cancelLabel="Để sau"
        onCancel={() => setNguoiDungChoKhoa(null)}
        onConfirm={() => { const account = nguoiDungChoKhoa; setNguoiDungChoKhoa(null); void khoaTaiKhoan(account) }}
        style={{ width: 'min(420px, 100%)', margin: '0 auto' }}
      /> : null}
    </section>
  )
}

const FIELD_STYLE: React.CSSProperties = { display: 'grid', gap: 6, minWidth: 0 }

function danhSachToaNha(ids: number[], toaNha: ThongTinToaNha[]) {
  if (ids.length === 0) return 'Chưa gán'
  return ids.map((id) => {
    const item = toaNha.find((building) => building.id === id)
    return item ? `${item.maToa} · ${item.ten}` : `Toà #${id}`
  }).join(', ')
}

function thongBaoLoi(reason: unknown, fallback: string) {
  return reason instanceof ApiError || reason instanceof Error ? reason.message : fallback
}
