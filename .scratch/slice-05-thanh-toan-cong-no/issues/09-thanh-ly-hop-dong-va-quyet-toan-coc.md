# 09: Thanh lý hợp đồng và quyết toán cọc · FR-TNT-08 · FR-TNT-09 · BR-07 · ruling 5

**What to build:** Quy trình thanh lý hợp đồng: chốt chỉ số cuối → tính hoá đơn kỳ cuối → quyết toán tiền cọc. Ca quyết toán ra **số âm** sinh một hoá đơn quyết toán riêng.

**Blocked by:** 02, 08

**Status:** ready-for-agent

## Công thức — BR-07

```
Số tiền hoàn lại = Tiền cọc đã thu − Công nợ còn lại − Khấu trừ hư hỏng
```

> *"Nếu kết quả âm, hệ thống tạo một **khoản phải thu bổ sung** thay vì hoàn tiền."*

Ba số hạng, ba nguồn khác nhau:

| Số hạng | Lấy ở đâu |
|---|---|
| Tiền cọc đã thu | Tổng `GIAO_DICH_COC` loại `THU_COC` — ticket 08. **Không** lấy `HOP_DONG.tien_coc`, đó chỉ là thoả thuận |
| Công nợ còn lại | Tổng `tong_tien − da_thu` của mọi hoá đơn chưa thanh toán đủ, **gồm cả hoá đơn kỳ cuối** |
| Khấu trừ hư hỏng | Người dùng nhập, ghi thành `GIAO_DICH_COC` loại `KHAU_TRU_COC`, **bắt buộc có lý do** |

## Cái bẫy vòng lặp — đọc kỹ chỗ này

`FR-TNT-08` quy định thứ tự: chốt chỉ số cuối → **tính hoá đơn kỳ cuối** → quyết toán cọc.

Nghĩa là *"công nợ còn lại"* **đã bao gồm hoá đơn kỳ cuối**. Nên khoản phải thu bổ sung (khi quyết toán ra âm) phát sinh **sau** khi hoá đơn kỳ cuối đã phát hành — **không nhét ngược vào đó được**, sẽ thành vòng lặp: thêm khoản vào hoá đơn kỳ cuối làm công nợ tăng, làm quyết toán âm hơn, làm khoản bổ sung lớn hơn.

Đây chính là lý do ruling 5 **không** chọn `KHOAN_PHAT_SINH` dù bảng đó đã có sẵn: hợp đồng đang thanh lý thì **không còn kỳ sau** nào để hoá đơn cuốn khoản `CHO_TINH` vào, và nó sẽ nằm đó mãi, không ai đòi được.

## Ruling 5: hoá đơn quyết toán riêng

Khoản phải thu bổ sung là **một hoá đơn riêng**. Lý do: nó *là* một khoản phải thu thật, cần đòi được và theo dõi được — và làm thành hoá đơn thì được dùng lại **miễn phí** toàn bộ máy móc đã dựng: mã hoá đơn, hạn thanh toán, trạng thái BR-08, ghi nhận thanh toán ticket 02, báo cáo công nợ.

**Cái giá: một migration nới ràng buộc.** `HOA_DON` hiện có:

```sql
ky_id BIGINT NOT NULL REFERENCES KY_THANH_TOAN(id),
CONSTRAINT uq_hoa_don_hop_dong_ky UNIQUE (hop_dong_id, ky_id)
```

Hoá đơn quyết toán không thuộc kỳ nào theo nghĩa thường, và hợp đồng đó đã có hoá đơn ở kỳ cuối rồi. Hai ràng buộc này đều cản.

**Đừng sửa `V22`.** Flyway lưu mã băm và sẽ từ chối khởi động (`BAN-GIAO.md` mục 5.2). Nới bằng một migration mới.

Cách nới là quyết định kỹ thuật của người cài đặt — `ky_id` nullable, hay thêm cột phân loại hoá đơn, hay cách khác. Nhưng **phải giữ được** tính chất mà `uq_hoa_don_hop_dong_ky` đang bảo vệ: một hợp đồng không có hai hoá đơn thường cho cùng một kỳ. Ghi lựa chọn và lý do vào `## Comments`.

## Trạng thái hợp đồng

`HOP_DONG.trang_thai` đã có `DA_THANH_LY` từ `V12`. Không cần migration cho phần này.

Chốt trong ticket: hợp đồng chuyển `DA_THANH_LY` **sau khi** quyết toán xong, không phải lúc bắt đầu quy trình. Lý do: nếu chuyển sớm thì `BR-11` suy trạng thái phòng thành *Trống* trong khi việc tiền nong chưa xong.

## Hoàn thành khi

- [ ] Quy trình thanh lý theo đúng thứ tự `FR-TNT-08`: chốt chỉ số cuối → hoá đơn kỳ cuối → quyết toán
- [ ] Tiền cọc lấy từ **tổng `GIAO_DICH_COC`**, không lấy `HOP_DONG.tien_coc`
- [ ] Công nợ còn lại tính đủ mọi hoá đơn chưa thu đủ, **gồm hoá đơn kỳ cuối**
- [ ] Khấu trừ hư hỏng ghi thành `KHAU_TRU_COC`, **lý do bắt buộc**, không cho rỗng
- [ ] **Ca dương:** hoàn lại đúng số, ghi `GIAO_DICH_COC` loại `HOAN_COC`
- [ ] **Ca âm:** sinh **hoá đơn quyết toán** đúng số tiền, có mã, có hạn thanh toán, thu được qua đường ticket 02
- [ ] **Ca bằng 0:** không sinh giao dịch thừa nào
- [ ] Migration nới ràng buộc `HOA_DON` **không sửa `V22`**, và **vẫn chặn** hai hoá đơn thường cùng một `(hop_dong_id, ky_id)`
- [ ] Hợp đồng chuyển `DA_THANH_LY` **sau** khi quyết toán xong
- [ ] Thanh lý lần hai trên cùng hợp đồng **bị chặn**
- [ ] Ghi `NHAT_KY_THAO_TAC` cho toàn bộ quy trình
- [ ] Test 403 cho QTHT và Quản lý sai toà
- [ ] Tên test mang mã `FR-TNT-08`, `FR-TNT-09`, `BR-07`

## Comments
