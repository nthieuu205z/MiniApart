# 02: Luật kiến trúc gãy build

**What to build:** Hai quy ước quan trọng nhất của đồ án được máy canh thay vì trông vào trí nhớ. Sau ticket này, người viết mã vi phạm sẽ biết ngay ở lần chạy kiểm thử kế tiếp, chứ không phải sau khi đã phát hoá đơn sai cho người thuê.

Hai luật:
1. Không lớp nào trong gói `billing` được khai báo trường kiểu `double` hoặc `float` — quy ước số 1, mục 4.4.1 của báo cáo.
2. Không lớp nào trong `billing.calc` được phụ thuộc vào Spring hay JPA — mục 4.4.2.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] ArchUnit chạy như một phần của bộ kiểm thử thường, không phải bước riêng ai đó phải nhớ gọi
- [ ] Gói `com.prj1.ccm.billing.calc` tồn tại, dù còn rỗng, để luật có chỗ mà soi
- [ ] **Chứng minh luật cắn được:** tạm thêm một trường `double` vào gói `billing`, chạy build, thấy đỏ, rồi gỡ ra. Ghi lại thông báo lỗi vào phần Comments của ticket này — đó là bằng chứng đem ra bảo vệ
- [ ] Làm tương tự với luật thứ hai: tạm import một lớp Spring vào `billing.calc`, thấy build đỏ, rồi gỡ
- [ ] Thông báo khi luật gãy phải nói rõ **vi phạm ở đâu và vì sao cấm**, không chỉ nói "rule violated"
