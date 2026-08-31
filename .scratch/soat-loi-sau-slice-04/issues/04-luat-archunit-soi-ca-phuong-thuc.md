# 04: Luật ArchUnit về tiền phải soi cả phương thức · quy ước 1 · FR-INV-02

**What to build:** Mở rộng luật ArchUnit cấm `double`/`float` trong `billing` để nó soi **kiểu trả về và tham số của phương thức**, không chỉ soi trường.

**Status:** done

**Blocked by:** None. Nên làm **trước** khi Slice 05 bắt đầu.

## Lỗ hổng

`backend/src/test/java/com/prj1/ccm/architecture/ArchitectureRules.java:21`:

```java
static ArchRule noFloatingPointFieldsInBilling() {
    return noFields()
            .that().haveRawType(double.class)
            .or().haveRawType(float.class)
            ...
}
```

`noFields()`. Chỉ trường. Nghĩa là:

```java
private double soTien;                    // ← bị chặn
double tinhTienDien(int chiSo) { ... }    // ← LỌT
void apDung(double heSo) { ... }          // ← LỌT
```

Slice 04 vừa sinh ra 26 lớp trong `billing/calc` cộng ~28 lớp ở `billing`, phần lớn là phương thức trả về tiền. **Hiện tại không lớp nào vi phạm** — kiểm bằng `grep -rn "double \|float " backend/src/main/java/com/prj1/ccm/billing/` trả về rỗng. Nhưng đó là **kỷ luật con người, không phải ràng buộc máy**, và ticket `slice-04/01-kieu-tien-te.md` tự ghi nhận nhầm rằng máy đã canh:

> *"Không có phương thức nào nhận hay trả `double`/`float` — ArchUnit đã canh, nhưng đừng để nó phải cắn"*

ArchUnit **chưa** canh phương thức. Câu đó đúng về ý định, sai về sự thật.

## Vì sao là bây giờ chứ không phải sau

Quy ước 1 của kế hoạch (`Doc/PRJ1_Ke-hoach-trien-khai.md` mục 4) gọi đây là *"quy ước quan trọng nhất và cũng là thứ dễ vi phạm nhất mà không ai nhận ra"*, vì `203000.00000000003` không làm chương trình báo lỗi và không nhìn thấy trên hoá đơn.

Slice 05 thêm thanh toán, số dư, bút toán đối ứng — tức thêm tiền ở một chỗ mới, do một agent khác viết, có thể không đọc kỹ quy ước. Đúng lúc lỗ hổng có giá.

Sửa bây giờ: đổi một luật, 54 lớp đã sạch nên xanh ngay. Sửa sau Slice 05: cũng đổi một luật, nhưng có thể phải đi sửa mã đã viết.

## Cẩn thận với cái bẫy đã biết

`allowEmptyShould(true)` đang có trên cả hai luật. Kết hợp với bẫy ArchUnit đã ghi ở `.scratch/BAN-GIAO.md` mục 3 — ASM bỏ qua class file mới hơn Java 25 **trong im lặng**, dẫn tới 0 lớp được nạp và mọi luật xanh rỗng.

Test canh hiện có, `ArchitectureRulesTest.frInv02RulesActuallySeeTheProductionCode`, chỉ khẳng định `productionClasses.size() > 0`. Nó bắt được trường hợp **toàn bộ** class bị bỏ qua, nhưng **không** bắt được trường hợp gói `billing` bị đổi tên hay dời đi — lúc đó tổng số lớp vẫn lớn hơn 0, còn hai luật về tiền thì xanh rỗng.

Ticket này siết luôn chỗ đó.

## Hoàn thành khi

- [x] Luật cấm `double`/`float` áp cho **trường, kiểu trả về, và tham số** của mọi lớp trong `..billing..`
- [x] Đặt tên luật lại cho đúng phạm vi mới — `noFloatingPointFieldsInBilling` không còn mô tả đúng việc nó làm
- [x] Giữ nguyên `MONEY_RULE_REASON`; câu giải thích đó là phần đáng giá nhất của luật, đọc được khi luật cắn
- [x] Test canh khẳng định **cụ thể** rằng có lớp trong `com.prj1.ccm.billing.calc` được nạp, không chỉ khẳng định tổng số lớp lớn hơn 0
- [x] **Ca kiểm thử vi phạm:** thêm fixture có phương thức trả `double` và fixture có tham số `double`, khẳng định luật cắn từng cái. Khuôn đã có ở `backend/src/test/java/com/prj1/ccm/architecture/fixture/billing/calc/` và `ArchitectureRulesViolationTest` — nối vào đó, đừng dựng cơ chế mới. Lưu ý fixture hiện tại `HoaDonDungDouble` **chỉ có một trường**, không có phương thức, nên nó không chứng minh được luật mới
- [x] Toàn bộ 46 lớp test hiện có vẫn xanh — luật mới **không được** làm đỏ mã đã viết

## Comments

- Đổi luật thành `noFloatingPointInBilling`, dùng `noMembers()` và predicate chung để soi field, return type, parameter; đồng thời chặn cả wrapper `Double`/`Float` theo quy ước máy của repo.
- Bổ sung fixture trả `double`, fixture nhận `double`, và assertion rằng `com.prj1.ccm.billing.calc.TienTe` thực sự được ArchUnit nạp.
- Architecture tests và full backend suite đều xanh.
