# 02: Luật kiến trúc gãy build

**What to build:** Hai quy ước quan trọng nhất của đồ án được máy canh thay vì trông vào trí nhớ. Sau ticket này, người viết mã vi phạm sẽ biết ngay ở lần chạy kiểm thử kế tiếp, chứ không phải sau khi đã phát hoá đơn sai cho người thuê.

Hai luật:
1. Không lớp nào trong gói `billing` được khai báo trường kiểu `double` hoặc `float` — quy ước số 1, mục 4.4.1 của báo cáo.
2. Không lớp nào trong `billing.calc` được phụ thuộc vào Spring hay JPA — mục 4.4.2.

**Blocked by:** 01

**Status:** ready-for-agent
> **Mã nguồn đã bị xoá ngày 2026-08-25 để bắt đầu lại sạch.** Ticket này quay về `ready-for-agent`. Các bài học ở mục `## Comments` bên dưới vẫn đúng — đọc trước khi làm lại để khỏi vấp lại cùng chỗ.


- [x] ArchUnit chạy như một phần của bộ kiểm thử thường, không phải bước riêng ai đó phải nhớ gọi
- [x] Gói `com.prj1.ccm.billing.calc` tồn tại, dù còn rỗng, để luật có chỗ mà soi
- [x] **Chứng minh luật cắn được:** tạm thêm một trường `double` vào gói `billing`, chạy build, thấy đỏ, rồi gỡ ra. Ghi lại thông báo lỗi vào phần Comments của ticket này — đó là bằng chứng đem ra bảo vệ
- [x] Làm tương tự với luật thứ hai: tạm import một lớp Spring vào `billing.calc`, thấy build đỏ, rồi gỡ
- [x] Thông báo khi luật gãy phải nói rõ **vi phạm ở đâu và vì sao cấm**, không chỉ nói "rule violated"

## Comments

### Cách chứng minh luật cắn được — làm khác ticket, và làm tốt hơn

Ticket ban đầu yêu cầu: tạm thêm một trường `double`, chạy build, thấy đỏ, rồi gỡ ra. Cách đó chỉ chứng minh **một lần**, tại thời điểm ai đó ngồi làm. Sáu tháng sau, nếu có người sửa hỏng mẫu tên gói thì luật im lặng ngừng hoạt động và không ai biết.

Thay vào đó có hai lớp **chuyên để vi phạm**, nằm vĩnh viễn trong mã kiểm thử:

- `HoaDonDungDouble` — khai một trường `double tongTien`
- `TinhTienGoiSpring` — gắn `@Component` của Spring vào một lớp trong `billing.calc`

Chúng đặt ở gói `com.prj1.ccm.architecture.fixture.billing.calc`. Mẫu `..billing..` khớp được, nhưng phép kiểm mã nguồn thật loại trừ toàn bộ mã kiểm thử, nên hai lớp này **không bao giờ làm đỏ build thật**. `ArchitectureRulesBiteTest` chạy luật lên chúng và **bắt buộc** phải thấy vi phạm. Bằng chứng giờ chạy lại ở mỗi lần build, không phải một lần rồi thôi.

### Nguyên văn thông báo khi luật gãy

```
Rule 'no fields that have raw type double or have raw type float ... should be declared
in classes that reside in a package '..billing..', because mot phep nhan don gia voi so
luong bang double co the ra 203000.00000000003; sai so nay khong lam chuong trinh bao loi
va khong nhin thay bang mat tren hoa don, chi lo ra khi doi chieu tong cuoi ky. Tien phai
dung BigDecimal (Java) va NUMERIC(15,2) (Postgres)' was violated (1 times):
Field <...HoaDonDungDouble.tongTien> is declared in classes that reside in a package '..billing..'
```

```
Rule 'no classes that reside in a package '..billing.calc..' should depend on classes that
reside in any package ['org.springframework..', 'jakarta.persistence..', ...], because
billing.calc cai dat BR-01..BR-19 va phai chay duoc ma khong can Spring, khong can co so
du lieu...' was violated (1 times):
Class <...TinhTienGoiSpring> is annotated with <org.springframework.stereotype.Component>
```

Thông báo nói rõ **vi phạm ở đâu** và **vì sao cấm** — người đọc không cần mở tài liệu mới hiểu.

### Phát hiện quan trọng: luật đã từng bảo xanh giả

Lúc đầu dự án chạy Java 26. Cả hai luật đều **xanh, và đều vô nghĩa**: ASM mà ArchUnit 1.4.1 đóng gói chỉ đọc được tệp lớp tới Java 25, gặp tệp lớp Java 26 thì **bỏ qua trong im lặng**. ArchUnit nhập vào **0 lớp**, nên không có gì để vi phạm.

Không có bite test thì cả đồ án sẽ chạy nhiều tháng với một hàng rào rỗng, và điều đó chỉ lộ ra khi có người thật sự viết `double` vào phần tính tiền mà build vẫn xanh.

Hai việc đã làm:

1. **Hạ xuống Java 21 LTS.** Là bản hỗ trợ dài hạn, ASM đọc được, Spring Boot 4.1.1 chạy tốt.
2. **Thêm một phép kiểm chống xanh giả.** `ArchitectureRulesTest` khẳng định số lớp ArchUnit nhập được phải lớn hơn không. Sai tên gói, nâng Java quá tay, hay bất cứ nguyên nhân nào khác làm ArchUnit không đọc được mã — đều gãy build ngay thay vì âm thầm bỏ qua.

Đây là chuyện đáng viết vào mục 4.7 của Chương 4: một hàng rào an toàn hỏng mà vẫn báo an toàn thì nguy hiểm hơn không có hàng rào nào.
