# Vertical Slice 5 — Thanh toán và công nợ

**Nguồn:** `Doc/PRJ1_Ke-hoach-trien-khai.md`, mục 6, Vertical Slice 5.
**Quyết định nền:** `.scratch/quyet-dinh-truoc-slice-05/quyet-dinh-can-chot.md` — sáu ruling đã chốt ngày 01/09/2026. **Đọc tệp đó trước tệp này.**

**Trạng thái spec:** ✅ **Đã duyệt 01/09/2026.** Ticket đã chẻ ở `issues/`, 9 ticket. Theo `AGENTS.md` mục 2, bộ ticket này **là kế hoạch thực thi** — không dựng thêm bản kế hoạch cạnh tranh nào.

## Problem Statement

Đã có hoá đơn. Chưa có cách ghi nhận rằng nó **đã được trả**.

Hôm nay hệ thống dừng ở chỗ phát hành hoá đơn rồi im lặng. Không biết ai đã trả, trả bao nhiêu, còn nợ bao nhiêu, ai quá hạn. Toàn bộ nửa sau của việc quản lý — thứ mà chủ nhà thực sự quan tâm — chưa tồn tại.

Ba đặc điểm khiến slice này khác Slice 04:

- **Slice 04 tính ra một con số; slice này ghi nhận tiền thật đã đổi tay.** Sai ở đây không chỉ là con số sai, mà là tranh cãi với người thuê về việc đã trả hay chưa.
- **Dữ liệu ở đây không được sửa và không được xoá** (`BR-18`). Ghi sai thì chỉ lập bút toán đối ứng, và bản ghi sai vẫn nằm đó vĩnh viễn.
- **Nó chạm vào ba thứ Slice 04 cố ý để dở**: `soDuKhaDungChuaCoNguonLuuTru()` trả `ZERO`, máy trạng thái thiếu cạnh, và `HOA_DON.da_thu` chưa có nguồn sự thật.

## Solution

Dựng ba bảng còn thiếu (`THANH_TOAN`, `SO_DU_KHA_DUNG`, `GIAO_DICH_COC`), nối chúng vào máy trạng thái hoá đơn đã có ở `billing/calc`, và **sửa xong máy trạng thái trước khi viết bất kỳ migration nào**.

## Đóng những yêu cầu nào

FR-INV-08 [M] *(một phần — xem ranh giới)*, FR-INV-09 [S], FR-INV-10 [S], FR-INV-11 [M], FR-INV-12 [M], FR-INV-13 [S], FR-INV-14 [M], FR-INV-16 [S], FR-TNT-08 [M], FR-TNT-09 [M]

**Áp phiếu thay đổi:** CR-006 (số dư khả dụng) · CR-009 (giao dịch cọc) · CR-010 (bút toán đối ứng)

**Quy tắc nghiệp vụ:** BR-07, BR-08, BR-12, BR-13, BR-17, BR-18

> **BR-07 được bổ sung vào danh sách của kế hoạch.** Kế hoạch mục 6 không liệt kê BR-07 ở slice này, nhưng FR-TNT-09 viết nguyên văn *"tính và hiển thị số tiền cọc hoàn lại **theo BR-07**"*. Không có BR-07 thì FR-TNT-09 không có công thức. Đây là thiếu sót của kế hoạch, không phải mở rộng phạm vi.

> **BR-17 ở slice này không nói về ảnh giấy tờ.** Ở Slice 02 nó là ảnh căn cước; ở đây nó là `GIAO_DICH_COC.nguoi_thu_id` và `ma_bien_lai` — biên lai là dữ liệu cá nhân gắn với tiền. Đừng đọc BR-17 rồi đi tìm ảnh.

## Sáu ruling đã chốt — không được diễn giải lại

| # | Ruling | Hệ quả kỹ thuật |
|---|---|---|
| 1 | Bút toán đối ứng **được** kéo lùi `DA_THANH_TOAN` → `DA_THU_MOT_PHAN`/`QUA_HAN` | Thêm cạnh lùi vào máy trạng thái, **chỉ** cho bút toán đối ứng. Phải lập CR sửa BR-08 |
| 2 | `HOA_DON.han_thanh_toan` là nguồn sự thật duy nhất | Sửa `TinhHoaDonRepository.java:281` đọc cột thay vì tính `kt.ngay_ket_thuc + tn.so_ngay_han_tt` |
| 3 | Slice 05 **không** làm thông báo | FR-INV-08 đóng nửa ở đây, nửa ở Slice 08. Ma trận truy vết phải ghi rõ |
| 4 | Quản lý lập được bút toán đối ứng trong **N giờ**; quá thì phải Chủ sở hữu | N = **24 giờ**, hằng số trong mã. Đếm từ **thời điểm ghi bản ghi**, không phải `ngay_thu` → cần thêm cột thời điểm tạo trên `THANH_TOAN` |
| 5 | Khoản phải thu sau quyết toán cọc là **hoá đơn quyết toán riêng** | Migration nới `HOA_DON.ky_id` và `uq_hoa_don_hop_dong_ky` |
| 6 | **Được** huỷ hoá đơn đang `QUA_HAN` | Thêm cạnh `QUA_HAN → DA_HUY`, cùng điều kiện Chủ sở hữu + lý do + nhật ký |

Gặp chỗ ruling không phủ hết: đó là **product ambiguity** theo `AGENTS.md` mục 5 — quay về tầng lập kế hoạch, **không tự quyết**.

## Thứ tự bắt buộc — đảo là hỏng

Slice 04 có luật "kiểm thử trước". Slice này có luật khác, và lý do cũng khác:

1. **Sửa máy trạng thái `QuyTacTrangThaiHoaDon` cho xong** — ruling 1 và 6, cộng cạnh `DA_PHAT_HANH → DA_THANH_TOAN` còn thiếu
2. **Rồi mới viết migration**
3. **Rồi mới nối dịch vụ**

**Vì sao không được đảo.** Cả `THANH_TOAN` lẫn `SO_DU_KHA_DUNG` đều ghi trạng thái hoá đơn khi kết thúc giao dịch. Viết migration trước thì lược đồ đã chạy rồi mới phát hiện trạng thái sai — mà Flyway **không cho sửa tệp đã chạy** (`BAN-GIAO.md` mục 5.2), phải đẻ thêm `V<n+1>` để vá, trên bảng có thể đã có dữ liệu.

## Lỗi đã biết phải sửa ở bước 1

Ba đường đi dưới đây **đã được xác minh bằng chạy thật** trên bytecode hiện tại, không phải suy luận:

| Ca | Hiện tại | Phải thành |
|---|---|---|
| Trả **đủ một lần** từ `DA_PHAT_HANH`, còn hạn | **Ném `IllegalArgumentException`** | `DA_THANH_TOAN` |
| Huỷ hoá đơn `QUA_HAN` (Chủ sở hữu, có lý do) | **Ném lỗi** | `DA_HUY` — ruling 6 |
| Bút toán đối ứng kéo đã-thu tụt từ `DA_THANH_TOAN` | **Ném lỗi** | `DA_THU_MOT_PHAN`/`QUA_HAN` — ruling 1 |

Ca thứ nhất **không cần ruling**: sơ đồ tuần tự `Doc/diagrams-v2/14-seq-uc12-ghi-thanhtoan.mmd` đã ghi rõ `daThu == tongTien → Trang thai DA_TT`. Đây là defect so với Chương 3, không phải thiết kế có chủ ý.

Lọt được vì `HoaDonLifecycleRulesTest` chỉ có **một** test cho `ghiNhanThanhToan`, và nó test đúng ca `QUA_HAN`. Đường phổ biến nhất — trả đủ một lần — chưa từng được test.

## `da_thu` là giá trị đệm, phải có test đối chiếu

Sơ đồ tuần tự viết: *"Tinh lai da thu = tong dai so cac but toan"*. Nghĩa là `HOA_DON.da_thu` **dẫn xuất** từ `THANH_TOAN`, không phải nguồn sự thật.

Đây đúng mẫu hình mà **CR-012 đã bắt buộc** phải có kiểm thử đối chiếu cho `PHONG.trang_thai`:

> *"Cần có kiểm thử đối chiếu giá trị đệm với giá trị tính lại từ dữ liệu gốc."*

Slice này tạo cái đệm thứ hai cùng loại, lần này là **tiền**. Ràng buộc bắt buộc: `da_thu == SUM(THANH_TOAN.so_tien)` với tổng **đại số** — bút toán đối ứng mang số âm nên `so_tien` **không** được đặt ràng buộc phải dương (CR-010).

## Hai tính chất tầng 2 còn nợ từ kế hoạch mục 5

Kế hoạch liệt kê năm tính chất kiểm thử theo tính chất. Slice 04 đã cài ba. **Hai cái còn lại thuộc slice này** và phải có:

- *"Với mọi dãy thanh toán, **đã thu** luôn bằng tổng đại số các bút toán"* — chính là ràng buộc chống lỗi đệm ở trên
- *"Số dư khả dụng **không bao giờ** âm"*

Dùng jqwik, đã có sẵn trong `build.gradle` (`net.jqwik:jqwik:1.9.3`).

## Nối vào chỗ Slice 04 để dở

**Đừng viết lại phép trừ số dư.** `MayTinhHoaDon.java:50` **đã cài** vế tiêu của BR-13 — trừ số dư khả dụng vào hoá đơn, sinh dòng `LoaiKhoan.SO_DU` mang số âm. Cái thiếu là **vế sinh** và **nguồn dữ liệu**.

Seam đã đặt sẵn và đặt tên rõ: `TinhHoaDonRepository.java:121`

```java
private TienTe soDuKhaDungChuaCoNguonLuuTru() {
    return new TienTe(BigDecimal.ZERO);
}
```

Việc của slice này là **thay thân hàm đó bằng truy vấn thật**, không phải cài lại logic trừ.

## Hai thư viện chưa có trong `build.gradle`

FR-INV-09 cần thư viện **PDF**, FR-INV-10 cần thư viện **QR**. Hiện `build.gradle` không có cả hai. Đây đúng hình dạng lỗ hổng jqwik trước Slice 04: ticket gọi tên công cụ, công cụ không có trong build, agent khởi động rồi tắc.

Ticket đầu tiên chạm tới hai FR này phải thêm phụ thuộc **trước**.

Kế hoạch khuyến nghị làm mã QR sớm: *"gây ấn tượng tốt khi demo mà công sức bỏ ra ít — sinh được hoàn toàn ở phía máy chủ, không cần tích hợp với ngân hàng nào."* `TOA_NHA.tk_ngan_hang` đã có sẵn.

## Phân quyền

Mặc định từ chối (quy ước 3). Sau CR-016, **QTHT không có quyền gì ở slice này** — mọi endpoint trả 403 cho QTHT.

| Thao tác | Ai được làm |
|---|---|
| Ghi nhận thanh toán | Chủ sở hữu, Quản lý toà được phân công |
| **Lập bút toán đối ứng** | Quản lý trong **24 giờ** kể từ lúc ghi bản ghi gốc; quá 24 giờ **chỉ Chủ sở hữu** — ruling 4 |
| Huỷ hoá đơn đã phát hành hoặc quá hạn | **Chỉ Chủ sở hữu**, bắt buộc lý do — BR-08, ruling 6 |
| Thu, hoàn, khấu trừ cọc | Chủ sở hữu, Quản lý toà được phân công |
| Xem hoá đơn và công nợ phòng mình | Người thuê |

Dùng `phanQuyenToaService.layToaNhaNeuNhanVienDuocXem` như 20 điểm gọi hiện có, không viết cơ chế mới.

**Ruling 1 và 4 giao nhau ở chỗ rủi ro nhất** — bút toán đối ứng kéo lùi được hoá đơn đã thanh toán đủ, và Quản lý làm được trong 24 giờ. Ba ràng buộc bù, phải có test cho từng cái:

1. Bút toán đối ứng **luôn** ghi `NHAT_KY_THAO_TAC` kèm người thực hiện, dù ai lập
2. Lý do **bắt buộc**, không cho chuỗi rỗng — `BR-18` đòi đúng thứ này
3. Hết 24 giờ, Quản lý nhận **403** với câu nói rõ phải nhờ Chủ sở hữu — không phải mã lỗi kỹ thuật (`NFR-USA-04`)

## Ba việc tài liệu phát sinh

Thuộc tầng lập kế hoạch, làm cùng lúc với spec, **không phải việc của agent thực thi**:

| Việc | Từ ruling |
|---|---|
| CR sửa BR-08: cho lùi trạng thái khi nguyên nhân là bút toán đối ứng | 1 |
| Ghi chú diễn giải sơ đồ BR-08: *Quá hạn* là nhánh của *Đã phát hành* nên huỷ được | 6 |
| Ma trận truy vết ghi FR-INV-08 đóng ở hai slice | 3 |

## Hoàn thành khi

Tiêu chí của kế hoạch, cộng bốn tiêu chí sinh ra từ review:

1. Thu tiền **nhiều lần** trên một hoá đơn, trạng thái tự đổi đúng theo BR-08
2. **Trả đủ trong một lần** từ `DA_PHAT_HANH` cho ra `DA_THANH_TOAN` — ca hiện đang ném lỗi
3. Trả thừa thì sinh số dư, **kỳ sau tự trừ** — chứng minh bằng cách chạy tính hoá đơn hai kỳ liên tiếp
4. Thử **xoá** bản ghi thanh toán thì bị cấm; chỉ lập được bút toán đối ứng có lý do
5. Bút toán đối ứng do Quản lý lập **sau 24 giờ** bị 403; Chủ sở hữu lập được
6. Thanh lý hợp đồng tính đúng tiền cọc hoàn lại sau khi trừ công nợ; **ca âm sinh hoá đơn quyết toán**
7. **Kiểm thử đối chiếu `da_thu` với tổng đại số `THANH_TOAN` xanh**
8. **Hai tính chất tầng 2 còn nợ xanh**

## Bảng ticket

| # | Ticket | Blocked by | Migration |
|---|---|---|---|
| 01 | Sửa máy trạng thái hoá đơn | — | |
| 02 | Bảng `THANH_TOAN` và ghi nhận thu tiền | 01 | ✅ |
| 03 | Bút toán đối ứng | 02 | |
| 04 | Số dư khả dụng | 02 | ✅ |
| 05 | Phát hành hàng loạt và huỷ hoá đơn quá hạn | 01 | |
| 06 | Mã QR chuyển khoản | 02 | |
| 07 | Xuất hoá đơn và biên lai PDF | 02 | |
| 08 | Bảng `GIAO_DICH_COC` và thu tiền cọc | — | ✅ |
| 09 | Thanh lý hợp đồng và quyết toán cọc | 02, 08 | ✅ |

Độ phủ đã soát: **19/19** mã FR/CR/BR trong phạm vi đều có ít nhất một ticket.

**01 và 08 không chặn nhau** — làm song song được ngay từ đầu. 08 độc lập vì tiền cọc không đi qua hoá đơn (`BR-07`).

### Cảnh báo: bốn ticket cùng thêm migration

Ticket **02, 04, 08, 09** đều đẻ tệp Flyway mới. Migration hiện dừng ở `V25`.

Chạy song song hai ticket trong hai worktree khác nhau thì **cả hai cùng đặt tên `V26__`**, và tệp gộp về sau sẽ có hai `V26` — Flyway từ chối khởi động, mà lúc đó cả hai đã viết xong.

**Quy tắc:** trước khi đặt tên tệp migration, `ls backend/src/main/resources/db/migration/` để lấy số cao nhất **đang có trên nhánh chính**, không phải trên nhánh của mình. Nếu hai ticket chạy song song thì ticket về sau đổi số hiệu **trước khi gộp**, không phải sau khi Flyway gãy.

Cách rẻ hơn: làm bốn ticket có migration **tuần tự**, để các ticket không migration chạy song song.

## Không thuộc phạm vi

- **FR-INV-15** (đối soát sao kê ngân hàng). Kế hoạch loại rõ: *"phụ thuộc định dạng file của từng ngân hàng, rủi ro cao mà giá trị trình bày thấp."*
- **Thông báo tới người thuê** — ruling 3, thuộc Slice 08.
- **Cổng người thuê xem công nợ** — Slice 06. Slice này chỉ mở API và màn cho phía quản lý.
- **Nhắc nợ tự động** — `FR-NTF`, Slice 08.
