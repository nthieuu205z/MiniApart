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
    <section className="account-management" data-testid="account-management" aria-labelledby="account-management-title">
      <div className="account-management__heading">
        <div>
          <p className="eyebrow">FR-AUT-06</p>
          <h3 id="account-management-title">Quản lý tài khoản</h3>
        </div>
        <button type="button" className="primary-button" onClick={batDauTao}>
          Tạo tài khoản
        </button>
      </div>

      <p className="status-message">
        Tạo tài khoản sẽ gửi mã kích hoạt để người dùng tự chọn mật khẩu. Tài khoản đã phát sinh dữ liệu chỉ được khoá, không xoá.
      </p>

      {loi ? <p className="status-message status-message--error" role="alert">{loi}</p> : null}
      {thongBao ? <p className="status-message status-message--success" role="status">{thongBao}</p> : null}

      {dangTai ? (
        <p className="status-message" aria-live="polite">Đang tải danh sách tài khoản…</p>
      ) : (
        <div className="account-table-wrapper">
          <table className="account-table">
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
                  <td>
                    <span className={`account-status account-status--${nguoiDung.trangThai.toLowerCase()}`}>
                      {nguoiDung.tenTrangThai}
                    </span>
                  </td>
                  <td className="account-table__actions">
                    <button type="button" className="ghost-button" onClick={() => batDauSua(nguoiDung)}>
                      Sửa {nguoiDung.hoTen}
                    </button>
                    {nguoiDung.trangThai === 'HOAT_DONG' ? (
                      <button
                        type="button"
                        className="danger-button"
                        disabled={idDangKhoa === nguoiDung.id}
                        onClick={() => khoaTaiKhoan(nguoiDung)}
                      >
                        {idDangKhoa === nguoiDung.id ? 'Đang khoá…' : `Khoá ${nguoiDung.hoTen}`}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {danhSach.length === 0 ? <p className="status-message">Chưa có tài khoản nào.</p> : null}
        </div>
      )}

      {bieuMau ? (
        <form className="account-form" data-testid="account-form" onSubmit={luuTaiKhoan}>
          <div>
            <p className="eyebrow">FR-AUT-06</p>
            <h4>{bieuMau.id === null ? 'Tạo tài khoản' : 'Sửa tài khoản'}</h4>
          </div>

          <label className="field">
            <span>Họ tên</span>
            <input
              name="hoTen"
              value={bieuMau.hoTen}
              onChange={(event) => setBieuMau((current) => current ? { ...current, hoTen: event.target.value } : current)}
              required
            />
          </label>

          <label className="field">
            <span>Số điện thoại</span>
            <input
              name="soDienThoai"
              value={bieuMau.soDienThoai}
              onChange={(event) => setBieuMau((current) => current ? { ...current, soDienThoai: event.target.value } : current)}
              inputMode="tel"
              required
            />
          </label>

          <label className="field">
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

          <fieldset className="building-picker">
            <legend>Toà nhà được giao</legend>
            {toaNha.length === 0 ? (
              <p className="status-message">Chưa có toà nhà để gán.</p>
            ) : (
              toaNha.map((item) => (
                <label key={item.id} className="checkbox-field">
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

          <p className="status-message">Không nhập mật khẩu hộ người dùng. Mã kích hoạt sẽ được gửi riêng để họ tự đặt mật khẩu.</p>
          <div className="account-form__actions">
            <button type="submit" className="primary-button" disabled={dangLuu}>
              {dangLuu ? 'Đang lưu…' : bieuMau.id === null ? 'Tạo tài khoản' : 'Lưu thay đổi'}
            </button>
            <button type="button" className="ghost-button" onClick={huyBieuMau} disabled={dangLuu}>
              Huỷ
            </button>
          </div>
        </form>
      ) : null}
    </section>
  )
}

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
