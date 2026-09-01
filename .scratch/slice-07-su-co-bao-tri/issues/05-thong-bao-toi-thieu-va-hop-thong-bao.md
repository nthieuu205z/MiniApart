# 05: Thông báo tối thiểu và hộp thông báo `#44` · FR-MNT-02 · FR-MNT-04 · FR-INV-08 · ruling 1B

**What to build:** Bảng `THONG_BAO`, sinh thông báo khi có yêu cầu mới và khi phân công thợ, màn `#44` để đọc. Cộng phần nối để `FR-INV-08` của Slice 05 đóng trọn.

**Blocked by:** 03

**Status:** ready-for-agent

**Migration:** `V37` — xem `.scratch/dai-so-hieu-migration.md`.

## Vì sao ticket này tồn tại — và vì sao nó không nằm ở Slice 08

Ruling 3 của Slice 05 đã đẩy vế thông báo của `FR-INV-08` sang Slice 08. **Ruling 1B không áp lại cách đó**, vì khi có tới ba FR cùng bị đóng nửa vời thì một rủi ro lộ ra:

`FR-INV-08`, `FR-MNT-02`, `FR-MNT-04` — **cả ba đều Must have**. Slice 08 thì **toàn Should have**, và kế hoạch mục 9 (rủi ro **R-11**) chỉ định thẳng Slice 8–10 là chỗ cắt an toàn:

> *"Vertical Slice 8–10 cắt được mà không ảnh hưởng luồng chính"*

Cắt Slice 08 thì ba Must have hở vĩnh viễn. Ticket này gỡ đúng chỗ đó.

## Tối thiểu nghĩa là tối thiểu

**Làm:** sinh thông báo · đọc danh sách · đánh dấu đã đọc · đếm chưa đọc.

**Không làm** — ba thứ này vẫn thuộc Slice 08:

| Không làm | Mã |
|---|---|
| Soạn và gửi thông báo chung theo phạm vi toà/tầng/phòng | `FR-NTF-02` |
| Nhắc thanh toán theo lịch ba mốc | `FR-NTF-04` |
| Bật/tắt và cấu hình mốc nhắc theo toà | `FR-NTF-06` |

Ba thứ đó cần tác vụ nền hoặc màn soạn thảo — ngoài phạm vi "tối thiểu", và `FR-NTF-04` còn phụ thuộc Slice 05.

## `#44` là màn dùng chung, không phải màn của Slice 07

`Doc/UX/00-nen-tang-ux.md` mục 4.4 đặc tả `#44` **dùng chung cả năm vai trò**. Dựng ở đây không phí — Slice 08 và các slice sau đều dùng lại, chỉ thêm loại thông báo.

Hệ quả về thiết kế: **`THONG_BAO` không được gắn cứng vào yêu cầu sửa chữa.** Cần cặp `doi_tuong_loai` + `doi_tuong_id` đa hình, cùng mẫu hình `ANH_DINH_KEM` (`V10`) và `KHOAN_PHAT_SINH` (`V23`) đã dùng.

Và cùng đánh đổi CR-008 đã ghi:

> *"ràng buộc khoá ngoại không kiểm được ở tầng cơ sở dữ liệu, nên **phải kiểm ở tầng ứng dụng và phải có kiểm thử riêng cho việc này**."*

## Ba sự kiện sinh thông báo

| Sự kiện | Gửi cho | Mã |
|---|---|---|
| Người thuê gửi yêu cầu sửa chữa mới | **Quản lý toà** chứa phòng đó | `FR-MNT-02` |
| Quản lý phân công việc cho thợ | **Thợ được phân công** | `FR-MNT-04` |
| Phát hành hoá đơn hàng loạt | **Người thuê** của từng hoá đơn | `FR-INV-08` |

## Phần nối cho `FR-INV-08` — đọc kỹ ranh giới

Ticket `slice-05 · 05` đã làm **phát hành hàng loạt**, và ghi rõ vế thông báo ngoài phạm vi ở đó. **Không mở lại ticket Slice 05.**

Việc ở đây là **nối vào**: sau khi `THONG_BAO` tồn tại, phát hành hàng loạt sinh thông báo cho người thuê. `FR-INV-08` đóng trọn, **không phụ thuộc Slice 08**.

Ma trận truy vết: `FR-INV-08` vẫn ghi đóng ở hai slice, nhưng slice thứ hai là **07**, không phải 08.

> Nếu tới lúc làm mà ticket `slice-05 · 05` **chưa xong**, ghi rõ vào `## Comments` và để phần nối lại — đừng chặn ba việc còn lại của ticket này.

## Nội dung một thông báo

Trả lời đủ **ai · việc gì · về cái gì · lúc nào**, cùng tiêu chí `Doc/UX/05-quan-tri-he-thong.md` mục 5.1 đặt ra cho nhật ký.

`NFR-USA-04` cấm hiện mã kỹ thuật. Không được ra dòng kiểu `YEU_CAU_SUA_CHUA id=42 status=NEW`.

Ví dụ đúng: *"Phòng 302 báo hỏng: vòi nước bồn rửa bị rỉ — Gấp"*

## Hoàn thành khi

- [ ] `V37` tạo `THONG_BAO` với `doi_tuong_loai` + `doi_tuong_id` **đa hình**, không gắn cứng vào sửa chữa
- [ ] Ba sự kiện ở bảng trên sinh thông báo đúng người nhận
- [ ] Thông báo về yêu cầu sửa chữa tới **đúng quản lý của toà chứa phòng đó**, không phải mọi quản lý
- [ ] Thông báo phân công tới **đúng thợ được phân công**
- [ ] Màn `#44` đọc được, đánh dấu đã đọc, đếm chưa đọc
- [ ] **Mỗi người chỉ thấy thông báo của mình** — gọi API thông báo của người khác nhận **403**
- [ ] Nội dung **không có mã kỹ thuật** (`NFR-USA-04`)
- [ ] Kiểm cặp `doi_tuong_loai`/`doi_tuong_id` ở tầng ứng dụng, **có test riêng** — đánh đổi CR-008
- [ ] **Không** làm `FR-NTF-02`, `FR-NTF-04`, `FR-NTF-06`
- [ ] QTHT → 403
- [ ] Tên test mang mã `FR-MNT-02`, `FR-MNT-04`, `FR-INV-08`

## Comments
