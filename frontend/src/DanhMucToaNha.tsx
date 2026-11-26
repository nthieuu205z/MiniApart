import { FormEvent, useEffect, useState } from "react";
import {
  ApiError,
  capNhatToaNha,
  fetchCongNoBaoCao,
  fetchPhong,
  fetchToaNha,
  type ThongTinPhong,
  taoToaNha,
  type ThongTinToaNha,
  type YeuCauToaNha,
} from "./api";
import { Button } from "./design/core/Button";
import { EmptyState } from "./design/feedback/EmptyState";
import { Icon } from "./design/core/Icon";
import { Field } from "./design/forms/Field";
import { Card } from "./design/layout/Card";
import { DauTrang } from "./design/layout/DauTrang";
import { dinhDangTien } from "./design/core/format";
import { Ngan } from "./HoSoHopDong360";
type Props = { token: string; vaiTro: string; mobile?: boolean };
type Form = {
  id: number | null;
  maToa: string;
  ten: string;
  diaChi: string;
  soTang: string;
  ngayChotSo: string;
  soNgayHanTt: string;
  maNganHang: string;
  tkNganHang: string;
  nguongThatThoat: string;
  batBuocAnhCongTo: boolean;
};

const formTu = (x: ThongTinToaNha | null): Form =>
  x
    ? {
        id: x.id,
        maToa: x.maToa,
        ten: x.ten,
        diaChi: x.diaChi,
        soTang: String(x.soTang),
        ngayChotSo: String(x.ngayChotSo),
        soNgayHanTt: String(x.soNgayHanTt),
        maNganHang: x.maNganHang,
        tkNganHang: x.tkNganHang,
        nguongThatThoat: x.nguongThatThoat,
        batBuocAnhCongTo: x.batBuocAnhCongTo,
      }
    : {
        id: null,
        maToa: "",
        ten: "",
        diaChi: "",
        soTang: "1",
        ngayChotSo: "28",
        soNgayHanTt: "7",
        maNganHang: "",
        tkNganHang: "",
        nguongThatThoat: "0.00",
        batBuocAnhCongTo: false,
      };

/** Form khai báo (toa = null) hoặc sửa toà; dùng trong ngăn ở danh sách toà và hồ sơ toà. Giữ nguyên trường và payload. */
export function FormToaNha({ token, toa, mobile = false, onXong, onHuy }: { token: string; toa: ThongTinToaNha | null; mobile?: boolean; onXong: (toa: ThongTinToaNha, laMoi: boolean) => void; onHuy: () => void }) {
  const [form, setForm] = useState<Form>(() => formTu(toa)),
    [saving, setSaving] = useState(false),
    [error, setError] = useState<string | null>(null);
  const update = (k: keyof Form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const p = payload(form),
        x = form.id === null ? await taoToaNha(token, p) : await capNhatToaNha(token, form.id, p);
      onXong(x, form.id === null);
    } catch (e) {
      setError(msg(e, "Không thể lưu thông tin toà nhà."));
    } finally {
      setSaving(false);
    }
  }
  return (
    <>
      {error && <div role="alert" className="alert alert-danger"><Icon name="alert" />{error}</div>}
    <form data-testid="building-form" onSubmit={save} style={{ display: "grid", gap: 12 }}>
            <p className="t-sm" style={{ margin: 0 }}>Ngày chốt số chỉ nhận từ 1 đến 28 để tháng hai vẫn luôn có ngày chốt.</p>
      <Field label="Mã toà">
        <input className="input" required name="maToa" value={form.maToa} onChange={(e) => update("maToa", e.target.value)} />
      </Field>
      <Field label="Tên toà">
        <input className="input" required name="ten" value={form.ten} onChange={(e) => update("ten", e.target.value)} />
      </Field>
      <Field label="Địa chỉ">
        <textarea className="input" style={{ height: "auto", minHeight: 72, paddingTop: 10 }} required name="diaChi" value={form.diaChi} onChange={(e) => update("diaChi", e.target.value)} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: mobile ? "minmax(0,1fr)" : "repeat(2,minmax(0,1fr))", gap: 12 }}>
        <Field label="Số tầng">
          <input className="input" required type="number" min="1" name="soTang" value={form.soTang} onChange={(e) => update("soTang", e.target.value)} />
        </Field>
        <Field label="Ngày chốt số (từ 1 đến 28)">
          <input className="input" required type="number" min="1" max="28" name="ngayChotSo" value={form.ngayChotSo} onChange={(e) => update("ngayChotSo", e.target.value)} />
        </Field>
        <Field label="Hạn thanh toán">
          <input className="input" required type="number" min="1" name="soNgayHanTt" value={form.soNgayHanTt} onChange={(e) => update("soNgayHanTt", e.target.value)} />
        </Field>
        <Field label="Ngưỡng thất thoát">
          <input className="input" required type="number" min="0" step="0.01" name="nguongThatThoat" value={form.nguongThatThoat} onChange={(e) => update("nguongThatThoat", e.target.value)} />
        </Field>
      </div>
      <Field label="BIN ngân hàng">
        <input
          className="input"
          required
          name="maNganHang"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          title="BIN ngân hàng phải gồm đúng 6 chữ số"
          value={form.maNganHang}
          onChange={(e) => update("maNganHang", e.target.value)}
        />
      </Field>
      <Field label="Tài khoản ngân hàng nhận tiền">
        <input
          className="input"
          required
          name="tkNganHang"
          inputMode="numeric"
          pattern="[0-9]{1,19}"
          maxLength={19}
          title="Số tài khoản phải gồm từ 1 đến 19 chữ số"
          value={form.tkNganHang}
          onChange={(e) => update("tkNganHang", e.target.value)}
        />
      </Field>
      <label style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 44 }}>
        <input name="batBuocAnhCongTo" type="checkbox" checked={form.batBuocAnhCongTo} onChange={(e) => update("batBuocAnhCongTo", e.target.checked)} />
        Bắt buộc ảnh công tơ khi ghi chỉ số
      </label>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexDirection: mobile ? "column-reverse" : undefined }}>
        <Button variant="secondary" onClick={onHuy}>Huỷ</Button>
        <Button type="submit" blocked={saving}>
          {saving ? "Đang lưu…" : form.id === null ? "Lưu toà nhà" : "Lưu thay đổi"}
        </Button>
      </div>
    </form>
    </>
  );
}

const CSS_TOA = `.tn-the { display: flex; align-items: center; gap: 24px; padding: 16px 20px; min-height: var(--ma-row-h); color: inherit; text-decoration: none; }
.tn-the:hover { background: var(--ma-bg-row-selected); }
.tn-ten { flex: 1; min-width: 0; display: grid; gap: 2px; }
.tn-ten b { font: var(--ma-text-block-title); color: var(--ma-text-primary); }
.tn-ten span, .tn-so span { color: var(--ma-text-secondary); font: var(--ma-text-caption); }
.tn-so { display: grid; gap: 2px; text-align: right; min-width: 110px; font-weight: 600; font-variant-numeric: tabular-nums; }
.tn-so.no b { color: var(--ma-urgent); }
.tn-so-d { font-weight: 500; }
.tn-sodo { display: grid; gap: 3px; }
.tn-tang { display: flex; gap: 3px; flex-wrap: wrap; max-width: 140px; }
.tn-cham { width: 14px; height: 14px; border-radius: 3px; background: var(--ma-text-primary); }
.tn-cham.no { background: var(--ma-urgent); }
.tn-cham.trong { background: none; border: 1px dashed var(--ma-text-muted); }
.tn-cham.khac { background: var(--ma-line-200); }
.tn-mt { color: var(--ma-text-muted); flex: none; }
@media (max-width: 767px) { .tn-the { gap: 12px; padding: 12px 16px; flex-wrap: wrap; } .tn-dt { display: none; } .tn-ten { flex-basis: 60%; } }`

type SoDo = { thue: number; tong: number; tang: { khoa: string; cham: string[] }[] }
const soDoToa = (phong: ThongTinPhong[], no: Set<string>): SoDo => {
  const theoTang = new Map<number, string[]>()
  let thue = 0
  for (const p of phong.filter((p) => typeof p.soPhong === 'string').sort((a, b) => a.soPhong.localeCompare(b.soPhong, 'vi', { numeric: true }))) {
    const dangThue = p.trangThai === 'DANG_THUE'
    if (dangThue) thue += 1
    const loai = dangThue ? (no.has(`${p.toaNhaId}|${p.soPhong}`) ? 'no' : '') : p.trangThai === 'TRONG' ? 'trong' : 'khac'
    theoTang.set(p.tang, [...(theoTang.get(p.tang) ?? []), loai])
  }
  return { thue, tong: phong.length, tang: [...theoTang].sort((a, b) => a[0] - b[0]).map(([khoa, cham]) => ({ khoa: String(khoa), cham })) }
}

export default function DanhMucToaNha({ token, vaiTro, mobile = false }: Props) {
  const [ds, setDs] = useState<ThongTinToaNha[]>([]),
    [loading, setLoading] = useState(true),
    [ngan, setNgan] = useState(false),
    [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState<string | null>(null),
    [thu, setThu] = useState(0),
    [phongToa, setPhongToa] = useState<Record<number, ThongTinPhong[]>>({}),
    [noToa, setNoToa] = useState<Map<number, { tien: number; phong: Set<string> }> | null>(null);
  const canCreate = ["CHU", "QTHT"].includes(vaiTro);
  const laChu = vaiTro === "CHU"; // QL/QTHT: nợ không gom được theo toà ở đây → ẩn cột Còn nợ
  useEffect(() => {
    let ok = true;
    setLoading(true);
    setError(null);
    fetchToaNha(token)
      .then((x) => ok && setDs(x))
      .catch((e) => ok && setError(msg(e, "Không thể tải danh sách toà nhà.")))
      .finally(() => ok && setLoading(false));
    return () => {
      ok = false;
    };
  }, [token, thu]);
  // Sơ đồ chấm và nợ là phần phụ: lỗi thì thẻ vẫn hiện, chỉ thiếu phần đó.
  useEffect(() => {
    let ok = true;
    ds.forEach((t) => fetchPhong(token, t.id).then((p) => ok && Array.isArray(p) && setPhongToa((m) => ({ ...m, [t.id]: p }))).catch(() => undefined));
    return () => { ok = false; };
  }, [token, ds]);
  useEffect(() => {
    if (!laChu) return undefined;
    let ok = true;
    fetchCongNoBaoCao(token, null)
      .then((r) => {
        if (!ok) return;
        const m = new Map<number, { tien: number; phong: Set<string> }>();
        for (const k of Array.isArray(r?.congNo) ? r.congNo : []) {
          const con = Number(k.conLai);
          if (!(con > 0)) continue;
          const x = m.get(k.toaNhaId) ?? { tien: 0, phong: new Set<string>() };
          x.tien += con;
          x.phong.add(`${k.toaNhaId}|${k.soPhong}`);
          m.set(k.toaNhaId, x);
        }
        setNoToa(m);
      })
      .catch(() => ok && setNoToa(null));
    return () => { ok = false; };
  }, [token, laChu, thu]);
  const tongPhong = ds.reduce((n, t) => n + (phongToa[t.id]?.length ?? 0), 0);
  const tieuDe = vaiTro === "QTHT" ? "Toà nhà" : "Toà & phòng";
  return (
    <section
      className={`building-catalog building-catalog--${mobile ? "mobile" : "desktop"}`}
      data-testid="building-catalog"
      data-layout-variant={mobile ? "mobile" : "desktop"}
      aria-labelledby="building-management-title"
      style={{ display: "grid", gap: 16, minWidth: 0 }}
    >
      <style>{CSS_TOA}</style>
      <DauTrang
        tieuDe={<span id="building-management-title">{tieuDe}</span>}
        phu={loading ? "Đang tải…" : `${ds.length} toà${tongPhong ? ` · ${tongPhong} phòng` : ""}`}
        hanhDong={canCreate ? <Button onClick={() => { setNotice(null); setNgan(true); }}><Icon name="plus" />Khai báo toà mới</Button> : undefined}
      />
      {error && !loading && <EmptyState kind="error" title="Không tải được danh sách toà nhà" body={`${error} Dữ liệu chưa bị thay đổi.`} actionLabel="Thử lại" onAction={() => setThu((n) => n + 1)} />}
      {notice && <div role="status" className="alert alert-success"><Icon name="check-circle" />{notice}</div>}
      {loading ? (
        <EmptyState kind="loading" title="Đang tải danh sách toà nhà…" />
      ) : error ? null : ds.length === 0 ? (
        <EmptyState
          title="Chưa có toà nhà nào."
          body="Khai báo toà đầu tiên để bắt đầu quản lý phòng."
          actionLabel={canCreate ? "Khai báo toà mới" : undefined}
          onAction={() => setNgan(true)}
        />
      ) : (
        <div style={{ display: "grid", gap: 12 }} data-mobile-building-list={mobile ? "true" : undefined}>
          {ds.map((x) => {
            const p = phongToa[x.id], no = noToa?.get(x.id), sd = p ? soDoToa(p, no?.phong ?? new Set()) : null;
            return (
              <Card key={x.id} className="bq-gon" style={{ padding: 0 }}>
                <a className="tn-the" href={`/toa-nha/${x.id}`} data-building-row={String(x.id)} title={x.ten}>
                  <span className="tn-ten"><b>{x.ten}</b><span>{x.diaChi} · {x.soTang} tầng</span></span>
                  {sd && <span className="tn-sodo tn-dt" aria-hidden="true">{sd.tang.map((t) => <span key={t.khoa} className="tn-tang">{t.cham.map((c, i) => <span key={i} className={`tn-cham ${c}`} />)}</span>)}</span>}
                  {sd && <span className="tn-so tn-dt"><span>Đang thuê</span><b className="tn-so-d">{sd.thue}/{sd.tong} phòng</b></span>}
                  {laChu && noToa && <span className={`tn-so${no ? " no" : ""}`}><span>Còn nợ</span><b>{dinhDangTien(no?.tien ?? 0)} ₫</b></span>}
                  <span className="tn-mt" aria-hidden="true"><Icon name="chevron-right" /></span>
                </a>
              </Card>
            );
          })}
        </div>
      )}
      {ngan && (
        <Ngan tieuDe="Khai báo toà nhà" onDong={() => setNgan(false)}>
          <FormToaNha token={token} toa={null} mobile={mobile} onHuy={() => setNgan(false)} onXong={(x) => { setDs((a) => [...a, x]); setNgan(false); setNotice("Đã khai báo toà nhà mới."); }} />
        </Ngan>
      )}
    </section>
  );
}
function payload(f: Form): YeuCauToaNha {
  return {
    maToa: f.maToa,
    ten: f.ten,
    diaChi: f.diaChi,
    soTang: Number(f.soTang),
    ngayChotSo: Number(f.ngayChotSo),
    soNgayHanTt: Number(f.soNgayHanTt),
    maNganHang: f.maNganHang,
    tkNganHang: f.tkNganHang,
    nguongThatThoat: f.nguongThatThoat,
    batBuocAnhCongTo: f.batBuocAnhCongTo,
  };
}
function msg(e: unknown, f: string) {
  return e instanceof ApiError || e instanceof Error ? e.message : f;
}
