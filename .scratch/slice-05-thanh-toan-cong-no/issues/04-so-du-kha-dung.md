# 04: Số dư khả dụng · FR-INV-16 · CR-006 · BR-13

**What to build:** Bảng `SO_DU_KHA_DUNG`, sinh số dư khi người thuê trả thừa, và **nối nguồn** vào chỗ Slice 04 đã để dở.

**Blocked by:** 02

**Status:** done

## Đừng viết lại phép trừ — nó đã có rồi

Đây là điều quan trọng nhất của ticket. `MayTinhHoaDon.java:50` **đã cài xong vế tiêu** của BR-13: trừ số dư khả dụng vào hoá đơn, sinh dòng `LoaiKhoan.SO_DU` mang số âm, có kẹp trần để không trừ quá tổng tiền.

Cái thiếu là **vế sinh** và **nguồn dữ liệu**. Slice 04 để lại seam đặt tên rất rõ ở `TinhHoaDonRepository.java:121`:

```java
private TienTe soDuKhaDungChuaCoNguonLuuTru() {
    return new TienTe(BigDecimal.ZERO);
}
```

**Việc của ticket này là thay thân hàm đó bằng truy vấn thật.** Nếu thấy mình đang viết logic trừ số dư trong `billing/calc` thì đã đi sai đường.

## Vì sao là bảng nhiều dòng, không phải một cột số dư

CR-006 giải thích, và lý do này phải giữ khi cài đặt:

> *"Chọn dạng bảng nhiều dòng thay vì một trường số dư trên hợp đồng, để mỗi khoản dư truy được về hoá đơn đã sinh ra nó và hoá đơn đã tiêu nó. Một trường số dư đơn thuần sẽ cho ra con số đúng nhưng **không giải thích được vì sao**, và khi người thuê thắc mắc thì không tra ra lịch sử."*

Nên `nguon_hoa_don_id` và `hoa_don_su_dung_id` **không phải cột trang trí** — chúng là lý do bảng này tồn tại ở dạng này.

## Lược đồ

`Doc/diagrams-v2/07-erd-v2.mmd` dòng 225: `hop_dong_id`, `so_tien`, `nguon_hoa_don_id`, `ngay_phat_sinh`, `hoa_don_su_dung_id` (nullable), `ngay_su_dung` (nullable).

Hai cột nullable cuối là dấu hiệu **đã tiêu hay chưa**. Đây là cùng mẫu hình `KHOAN_PHAT_SINH.trang_thai` (`CHO_TINH`/`DA_TINH`) mà CR-008 đã dựng và Slice 04 đã test — chống tính lặp.

## Cái bẫy: tiêu lặp

`CR-008` cảnh báo về đúng loại lỗi này ở khoản phát sinh: quét lại mỗi kỳ và **tính lặp cùng một khoản**. Số dư khả dụng có cấu trúc y hệt, nên bẫy y hệt.

Ca kiểm thử bắt buộc: sinh một khoản dư, chạy tạo hoá đơn **hai kỳ liên tiếp**, khẳng định khoản đó bị trừ **đúng một lần**.

## Hoàn thành khi

- [ ] Migration tạo `SO_DU_KHA_DUNG` đúng ERD, `so_tien` là `NUMERIC(15,2)`
- [ ] Trả thừa trên một hoá đơn sinh một dòng số dư, `nguon_hoa_don_id` trỏ đúng hoá đơn sinh ra nó
- [ ] `soDuKhaDungChuaCoNguonLuuTru()` được thay bằng truy vấn thật; **không sửa logic trừ ở `MayTinhHoaDon`**
- [ ] Kỳ sau tự trừ, dòng `LoaiKhoan.SO_DU` hiện trên hoá đơn với số âm
- [ ] Khi tiêu: `hoa_don_su_dung_id` và `ngay_su_dung` được ghi
- [ ] **Chạy tạo hoá đơn hai kỳ liên tiếp → khoản dư bị trừ đúng một lần**
- [ ] Số dư lớn hơn tổng hoá đơn thì chỉ trừ tới 0, phần còn lại **vẫn khả dụng** cho kỳ sau
- [ ] **Tính chất tầng 2 (jqwik):** *"số dư khả dụng không bao giờ âm"* — kế hoạch mục 5
- [ ] Hoá đơn bị huỷ thì số dư nó đã tiêu **được trả lại** — hoặc chốt là không, và ghi lý do vào `## Comments`
- [ ] Test 403 cho QTHT và Quản lý sai toà

## Comments

- Cancellation ruling implemented: when an issued or overdue invoice is cancelled, its consumed `SO_DU_KHA_DUNG` rows are restored atomically by clearing `hoa_don_su_dung_id` and `ngay_su_dung`. The original owner, reason, and audit requirements remain unchanged.
