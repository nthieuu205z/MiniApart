# 01: Máy trạng thái yêu cầu sửa chữa · BR-16 · FR-MNT-03

**What to build:** Máy trạng thái cho vòng đời yêu cầu sửa chữa. **Thuần, không chạm cơ sở dữ liệu, không chạm Spring.**

**Blocked by:** None

**Status:** ready-for-agent

## Vì sao đi trước mọi ticket có migration

Cùng lý do Slice 05: bảng `YEU_CAU_SUA_CHUA` ghi trạng thái ở mọi thao tác. Viết migration trước rồi mới phát hiện trạng thái sai thì Flyway **không cho sửa tệp đã chạy** — phải đẻ `V<n+1>` để vá trên bảng đã có dữ liệu.

Ticket này không demo được gì. Chủ ý, giống `slice-04 · 02` và `slice-05 · 01`.

## BR-16

```
Mới tiếp nhận → Đã tiếp nhận → Đã phân công → Đang xử lý → Chờ xác nhận → Đã đóng
      |                                                          |
      +--- Đã huỷ (từ bất kỳ trạng thái nào trước Đã đóng, kèm lý do) ---+
```

## Bài học bắt buộc đọc từ Slice 05

Máy trạng thái `BR-08` **lọt ba đường đi hỏng** — trả đủ một lần, huỷ hoá đơn quá hạn, bút toán đối ứng — và chỉ bị phát hiện khi review, sau khi slice đã đóng.

Nguyên nhân: `HoaDonLifecycleRulesTest` chỉ có **một** test cho đường thanh toán, và bảng chuyển thiếu cạnh mà không ai đối chiếu lại với sơ đồ.

**Đừng lặp lại.** Ticket này phải test **mọi cạnh hợp lệ và một mẫu cạnh không hợp lệ**, không phải vài cạnh tiêu biểu.

## Chỗ dễ sót nhất: cạnh huỷ

BR-16 viết *"từ **bất kỳ** trạng thái nào trước Đã đóng"* — nghĩa là **năm** trạng thái nguồn, không phải một:

`Mới tiếp nhận`, `Đã tiếp nhận`, `Đã phân công`, `Đang xử lý`, `Chờ xác nhận` → `Đã huỷ`

Sơ đồ vẽ mũi tên huỷ ở một chỗ, nhưng chữ nói năm chỗ. **Chữ thắng.** Đây đúng loại chênh lệch đã sinh ra ruling 6 của Slice 05.

## Ranh giới

Đặt ở đâu là quyết định kỹ thuật, nhưng **không được** đặt trong `billing.calc` — gói đó cài `BR-01`–`BR-19` phần **tính tiền**, và ArchUnit canh nó không phụ thuộc Spring/JPA. BR-16 là vòng đời sửa chữa, không phải phép tính tiền.

Dùng lại **khuôn** của `QuyTacTrangThaiHoaDon` — bảng chuyển hợp lệ, ném lỗi khi chuyển sai, một hàm cho mỗi hành động nghiệp vụ. Đừng phát minh cách mới.

> **Ghi chú lịch sử:** kế hoạch triển khai từng ghi nhầm BR-16 vào Slice 04. Đã xác nhận là lỗi gõ ngày 24/08/2026 — BR-16 thuộc slice này. Xem `.scratch/slice-04-tinh-hoa-don/spec.md`.

## Hoàn thành khi

- [ ] Sáu trạng thái của BR-16, tên tiếng Việt không dấu theo quy ước đặt tên
- [ ] Mọi cạnh của sơ đồ hợp lệ; cạnh ngoài sơ đồ ném lỗi
- [ ] **Cả năm cạnh huỷ** hợp lệ, mỗi cạnh một test
- [ ] Huỷ **bắt buộc có lý do**, chuỗi rỗng hoặc toàn khoảng trắng bị từ chối
- [ ] `Đã đóng` là trạng thái cuối — không cạnh nào đi ra
- [ ] Một test tham số hoá phủ **toàn bộ** cặp (nguồn, đích) và khẳng định đúng tập hợp lệ, không chỉ vài cặp mẫu
- [ ] Không phụ thuộc Spring, JPA, hay cơ sở dữ liệu — chạy trong mili giây
- [ ] Không đặt trong `billing.calc`
- [ ] Toàn bộ test hiện có vẫn xanh

## Comments
