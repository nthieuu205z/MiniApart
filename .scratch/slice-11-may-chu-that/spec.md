# Vertical Slice 11 — Đưa lên máy chủ thật

**Nguồn:** `Doc/PRJ1_Ke-hoach-trien-khai.md`, mục 6, Vertical Slice 11.
**Dải migration:** không cấp — slice hạ tầng, không đụng lược đồ.

**Trạng thái spec:** chưa duyệt. Chưa chẻ ticket.

## Vì sao slice này chạy song song được với mọi slice khác

Không phụ thuộc bảng nào, mã nghiệp vụ nào, hay slice nào. Rủi ro duy nhất là **tranh chấp thời gian của người làm**, không phải tranh chấp mã.

## Quyết định đã chốt, không mở lại

| Việc | Chốt | Ghi chú |
|---|---|---|
| Nhà cung cấp | **Google Cloud, VM Instance** | Đã bỏ phương án tự mua Mac Mini |
| Cấu hình | **`e2-standard-2`** (2 vCPU, 8 GB) | Có kinh phí, không dùng gói miễn phí. Nâng `e2-standard-4` nếu chật |
| Vùng | **`asia-southeast1`** (Singapore) | Khớp kế hoạch mục 6 |
| Chạy | **Docker Compose** | Cùng cách đang chạy tại máy |

## Bảy việc bắt buộc

Sáu việc của kế hoạch, cộng một việc phát sinh từ nợ kỹ thuật đã ghi ở `BAN-GIAO.md` mục 6.

| # | Việc | Cách kiểm là xong |
|---|---|---|
| 1 | Dựng máy chủ, vùng Singapore | Đăng nhập được bằng khoá |
| 2 | Tường lửa chỉ mở **22, 80, 443**; đăng nhập bằng khoá, **tắt mật khẩu** | Thử đăng nhập bằng mật khẩu → bị từ chối |
| 3 | Tên miền + chứng chỉ Let's Encrypt, **bật tự gia hạn** | Trình duyệt không cảnh báo; thử lệnh gia hạn khan |
| 4 | Cơ sở dữ liệu **chỉ nghe trên mạng nội bộ Docker** | **Quét cổng từ máy khác** — quy ước 6 |
| 5 | `pg_dump` hằng ngày, đẩy ra ngoài máy chủ | Có tệp sao lưu ở nơi khác máy chủ |
| 6 | **Thử phục hồi ít nhất một lần** | Phục hồi vào cơ sở dữ liệu **trống**, đếm bản ghi khớp |
| 7 | **`JWT_SECRET` truyền qua biến môi trường thật** | `grep` cấu hình đang chạy không thấy chuỗi mặc định |

### Về việc 6 — kế hoạch nói thẳng

> *"Bản sao lưu chưa từng thử phục hồi **nó chưa phải bản sao lưu**, chỉ là một tệp mà ta hy vọng dùng được. Phải thử phục hồi một lần vào cơ sở dữ liệu trống rồi mới tính là xong việc."*

Đây là tiêu chí nghiệm thu, không phải lời khuyên.

### Về việc 7 — nợ kỹ thuật đã ghi sẵn

`backend/src/main/resources/application.yml:15`:

```yaml
jwt-secret: ${JWT_SECRET:dev-only-slice-00-signing-secret-not-for-production}
```

`BAN-GIAO.md` mục 6 đã cảnh báo: *"để nguyên chuỗi đó trên Internet nghĩa là **ai đọc được repo cũng tự ký được token quản trị**."* Repo `nthieuu205z/MiniApart` là repo công khai cho thầy đọc — nên chuỗi đó **đã** công khai. Đưa lên máy chủ mà không thay là mở toang.

Cấu trúc `${JWT_SECRET:...}` đã đúng; chỉ cần **cấp giá trị thật qua biến môi trường** và kiểm rằng nó thắng giá trị mặc định.

## `slice-00 · 08` — làm trước, không phải làm cùng

Ticket `.scratch/slice-00-nen-mong/issues/08-github-actions.md` vẫn `ready-for-agent`. Nó bị hoãn vì *"tiêu chí hoàn thành đòi phải thấy CI đỏ khi đẩy mã sai"* mà lúc đó chưa có repo GitHub thật.

**Vật cản đó đã hết** — repo tồn tại, đã có `c5377e3` trên `main`.

Và nên làm **ngay bây giờ**, trước cả Slice 05, vì hai lý do:

1. Slice 05 sắp đổ **9 ticket** vào repo, phần lớn động tới tiền. CI xanh trước khi chúng bắt đầu bắt lỗi sớm hơn nhiều so với phát hiện lúc gộp.
2. Nó là điều kiện của việc *"GitHub Actions đẩy lên máy chủ sau khi kiểm thử xanh"* trong bảng kế hoạch. Không có CI thì không có tự động triển khai.

## Việc chưa có lời đáp — cần ruling trước khi chẻ ticket

**CI đẩy ảnh lên máy chủ GCP bằng đường nào?** Ba hướng, đánh đổi thật khác nhau:

| | Cách | Được | Mất |
|---|---|---|---|
| A | SSH từ Actions vào máy chủ, `docker compose pull && up` | Đơn giản nhất, không thêm dịch vụ | Phải cất khoá SSH riêng trong GitHub Secrets — một khoá vào thẳng máy chủ nằm ở dịch vụ ngoài |
| B | Đẩy ảnh lên **Artifact Registry** của GCP, máy chủ tự kéo | Không có khoá SSH ở ngoài; dùng Workload Identity thì không cần khoá dài hạn nào | Thêm một dịch vụ GCP phải cấu hình, và tốn dung lượng lưu ảnh |
| C | Thủ công: bảo vệ xong mới đẩy tay | Không tốn công tự động hoá | Mất luôn giá trị trình bày của CI/CD, mà đó là thứ đáng nói khi bảo vệ |

Chưa chốt.

**Câu thứ hai:** dữ liệu mẫu trên máy chủ thật lấy đâu ra? Rủi ro **R-13** cấm tuyệt đối *"đưa dữ liệu thật của người thật lên máy chủ"*. Cần một bộ dữ liệu mẫu **bịa hoàn toàn** đủ dày để demo — và chưa ticket nào sở hữu việc này.

## Dự phòng khi bảo vệ

Kế hoạch có sẵn: **Docker Compose chạy tại máy, dữ liệu mẫu sẵn sàng.**

Đây không phải thừa. Mất mạng hội trường, hết hạn chứng chỉ, GCP trục trặc — đều là thứ xảy ra đúng hôm bảo vệ. Bản chạy tại máy phải được **thử trước ít nhất một lần trên máy sẽ mang đi**, không phải chỉ trên máy đang phát triển.

## Hoàn thành khi

1. Bảy việc ở bảng trên đều kiểm được bằng cách đã ghi
2. **Quét cổng từ máy khác không thấy 5432**
3. **Đã phục hồi thành công một lần** vào cơ sở dữ liệu trống
4. Đẩy mã sai lên → **CI đỏ**, không triển khai
5. Đẩy mã đúng lên → CI xanh → máy chủ chạy bản mới
6. `JWT_SECRET` trên máy chủ **khác** chuỗi mặc định trong repo
7. Không có dữ liệu cá nhân thật nào trên máy chủ (**R-13**)
8. Bản dự phòng chạy tại máy đã thử trên máy sẽ mang đi bảo vệ

## Không thuộc phạm vi

- Cân bằng tải, nhiều máy chủ, tự co giãn — một chủ sở hữu, một toà chung cư mini (giả định A-05)
- Giám sát và cảnh báo — không có yêu cầu nào đòi
- Sao lưu nhiều vùng
