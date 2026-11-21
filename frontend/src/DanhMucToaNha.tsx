import { FormEvent, useEffect, useState } from "react";
import {
  ApiError,
  capNhatToaNha,
  fetchToaNha,
  taoToaNha,
  type ThongTinToaNha,
  type YeuCauToaNha,
} from "./api";
import { Button } from "./design/core/Button";
import { EmptyState } from "./design/feedback/EmptyState";
import { Icon } from "./design/core/Icon";
import { Field } from "./design/forms/Field";
import { Card } from "./design/layout/Card";
import { DataTable, type DataTableColumn } from "./design/table/DataTable";
import { CSS_BANG_QUAN_TRI } from "./bangQuanTriChung";
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
export default function DanhMucToaNha({ token, vaiTro, mobile = false }: Props) {
  const [ds, setDs] = useState<ThongTinToaNha[]>([]),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [chosen, setChosen] = useState<number | null>(null),
    [form, setForm] = useState<Form | null>(null),
    [error, setError] = useState<string | null>(null),
    [notice, setNotice] = useState<string | null>(null);
  const canCreate = ["CHU", "QTHT"].includes(vaiTro),
    toa = ds.find((x) => x.id === chosen) ?? ds[0] ?? null;
  useEffect(() => {
    let ok = true;
    setLoading(true);
    setError(null);
    fetchToaNha(token)
      .then((x) => {
        if (ok) {
          setDs(x);
          setChosen((i) => i ?? x[0]?.id ?? null);
        }
      })
      .catch((e) => ok && setError(msg(e, "Không thể tải danh sách toà nhà.")))
      .finally(() => ok && setLoading(false));
    return () => {
      ok = false;
    };
  }, [token]);
  const open = (x?: ThongTinToaNha) => {
    if (!x && !canCreate) return;
    setError(null);
    setNotice(null);
    setForm(
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
          },
    );
  };
  const update = (k: keyof Form, v: string | boolean) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const p = payload(form),
        x =
          form.id === null
            ? await taoToaNha(token, p)
            : await capNhatToaNha(token, form.id, p);
      setDs((a) =>
        form.id === null ? [...a, x] : a.map((i) => (i.id === x.id ? x : i)),
      );
      setChosen(x.id);
      setForm(null);
      setNotice(
        form.id === null
          ? "Đã khai báo toà nhà mới."
          : "Đã cập nhật thông tin toà nhà.",
      );
    } catch (e) {
      setError(msg(e, "Không thể lưu thông tin toà nhà."));
    } finally {
      setSaving(false);
    }
  }
  const cot: DataTableColumn<ThongTinToaNha>[] = [
    { key: 'toa', label: 'Toà nhà', sortable: true, sortValue: (x) => x.ten, render: (x) => <div><div className="td-main bq-cat" title={x.ten}>{x.ten}</div><div className="td-sub">{x.maToa}</div></div> },
    { key: 'diaChi', label: 'Địa chỉ', render: (x) => <span className="bq-toa" title={x.diaChi}>{x.diaChi}</span> },
    { key: 'soTang', label: 'Số tầng', align: 'num', sortable: true, sortValue: (x) => x.soTang, render: (x) => x.soTang },
    { key: 'chotSo', label: 'Chốt số', align: 'num', sortable: true, sortValue: (x) => x.ngayChotSo, render: (x) => `ngày ${x.ngayChotSo}` },
    { key: 'nguong', label: 'Ngưỡng thất thoát', align: 'num', sortable: true, sortValue: (x) => Number(x.nguongThatThoat), render: (x) => x.nguongThatThoat },
    { key: 'thaoTac', label: 'Thao tác', align: 'num', the: 'hanh-dong', render: (x) => <div className="td-acts"><button type="button" className="btn btn-ghost btn-sm" aria-pressed={toa?.id === x.id} onClick={() => setChosen(x.id)}>Xem<span className="sr-only"> {x.ten}</span></button></div> },
  ];
  const tongTang = ds.reduce((n, x) => n + x.soTang, 0);
  return (
    <section
      className={`building-catalog building-catalog--${mobile ? "mobile" : "desktop"}`}
      data-testid="building-catalog"
      data-layout-variant={mobile ? "mobile" : "desktop"}
      aria-labelledby="building-management-title"
      style={{ display: "grid", gap: 16, minWidth: 0 }}
    >
      <style>{CSS_BANG_QUAN_TRI + CSS_TOA_NHA}</style>
      <header className="topbar">
        <div className="title-block">
          <h1 className="h1" id="building-management-title">Toà nhà</h1>
          <p className="sub">{loading ? "Đang tải…" : `${ds.length} toà được xem · tổng ${tongTang} tầng`}</p>
        </div>
        {canCreate && <div className="topbar-actions"><Button onClick={() => open()}><Icon name="plus" />Khai báo toà mới</Button></div>}
      </header>
      {error && <div role="alert" className="alert alert-danger"><Icon name="alert" />{error}</div>}
      {notice && <div role="status" className="alert alert-success"><Icon name="check-circle" />{notice}</div>}
      {loading ? (
        <EmptyState kind="loading" title="Đang tải danh sách toà nhà…" />
      ) : ds.length === 0 ? (
        <EmptyState
          title="Chưa có toà nhà nào."
          body="Khai báo toà đầu tiên để bắt đầu quản lý phòng."
          actionLabel={canCreate ? "Khai báo toà mới" : undefined}
          onAction={() => open()}
        />
      ) : (
        <Card className="bq-gon" data-mobile-building-list={mobile ? "true" : undefined}>
          <DataTable
            rows={ds}
            columns={cot}
            getRowId={(x) => x.id}
            timTheo={(x) => `${x.ten} ${x.maToa} ${x.diaChi}`}
            searchLabel="Tìm toà, mã, địa chỉ"
            noun="toà nhà"
            pageSize={10}
            rowProps={(x) => ({ "data-building-row": String(x.id), className: toa?.id === x.id ? "bq-chon" : "" })}
          />
        </Card>
      )}
      {toa && (
        <Card title={toa.ten} action={
          <Button
            variant="secondary"
            onClick={() => open(toa)}
            style={{ maxWidth: "100%", minWidth: 0, whiteSpace: "normal", overflowWrap: "anywhere", textAlign: "center" }}
          >
            Sửa {toa.ten}
          </Button>
        }>
          <dl className="bq-dl">
            <div><dt>Mã toà</dt><dd>{toa.maToa}</dd></div>
            <div><dt>Địa chỉ</dt><dd>{toa.diaChi}</dd></div>
            <div><dt>Số tầng</dt><dd>{toa.soTang}</dd></div>
            <div><dt>Ngày chốt số</dt><dd>ngày {toa.ngayChotSo} hằng tháng</dd></div>
            <div><dt>Hạn thanh toán</dt><dd>{toa.soNgayHanTt} ngày</dd></div>
            <div><dt>Ngưỡng thất thoát</dt><dd>{toa.nguongThatThoat}</dd></div>
            <div><dt>BIN ngân hàng</dt><dd>{toa.maNganHang}</dd></div>
            <div><dt>Tài khoản nhận tiền</dt><dd>{toa.tkNganHang}</dd></div>
            <div><dt>Ảnh công tơ</dt><dd>{toa.batBuocAnhCongTo ? "Bắt buộc khi ghi chỉ số" : "Không bắt buộc"}</dd></div>
          </dl>
          <p className="t-sm">Ngày chốt số chỉ nhận từ 1 đến 28 để tháng hai vẫn luôn có ngày chốt. Máy chủ tự giới hạn danh sách theo quyền được xem.</p>
        </Card>
      )}
      {form && (
        <form data-testid="building-form" onSubmit={save} className="card" style={{ display: "grid", gap: 12 }}>
          <h2 className="h2">{form.id === null ? "Khai báo toà nhà" : "Sửa toà nhà"}</h2>
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
            <Button variant="secondary" onClick={() => { setForm(null); setError(null); }}>Huỷ</Button>
            <Button type="submit" blocked={saving}>
              {saving ? "Đang lưu…" : form.id === null ? "Lưu toà nhà" : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
const CSS_TOA_NHA = `.bq-dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: 16px 24px; margin: 0; }
.bq-dl dt { font: var(--ma-text-caption); color: var(--ma-text-muted); }
.bq-dl dd { margin: 2px 0 0; font: var(--ma-text-body); color: var(--ma-text-primary); overflow-wrap: anywhere; }`;
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
