# Sơ đồ phiên bản 2

Thư mục này chứa các sơ đồ đã cập nhật theo **Lô phiếu thay đổi số 01**, cùng các sơ đồ mới bổ sung cho phần thiết kế.

Mỗi sơ đồ lưu ở hai dạng: mã nguồn `.mmd` và ảnh `.png`, đúng quy ước mục 8.2 của tài liệu phân tích — sửa được về sau mà không phải vẽ lại.

## Cách render lại

Sơ đồ Mermaid (`.mmd`):

```bash
npm install -g @mermaid-js/mermaid-cli
./render.sh
```

Sơ đồ Excalidraw (`.excalidraw`):

```bash
cd ~/.claude/skills/excalidraw-diagram/references && uv run python render_excalidraw.py <đường-dẫn>.excalidraw
```

> **Lưu ý.** Script render của skill `excalidraw-diagram` bản gốc **bị hỏng**: template nạp Excalidraw từ CDN không ghim phiên bản, mà `esm.sh` đang trả 404 cho phụ thuộc `@braintree/sanitize-url@6.0.2`. Đã sửa bằng cách ghim `@excalidraw/excalidraw@0.18.0` và nâng timeout từ 30 giây lên 180 giây. Bản gốc lưu tại `render_template.html.bak` và `render_excalidraw.py.bak`.

## Danh mục

| Tệp | Nội dung | Vào chương | Ghi chú |
|---|---|---|---|
| `07-erd-v2.mmd` | Sơ đồ thực thể quan hệ, đã áp dụng 14 phiếu CR | 3 | Thay cho `07-erd` bản cũ |
| `10-class-domain.mmd` | Sơ đồ lớp — mô hình miền tổng thể | 3 | **Mới** — bù thiếu sót C1 |
| `11-class-billing-calc.mmd` | Sơ đồ lớp — gói tính tiền | 3 | **Mới** — sơ đồ đáng trình bày nhất |
| `12-seq-uc10-tao-hoadon.mmd` | Sơ đồ tuần tự — UC-10 Tạo hoá đơn kỳ | 3 | **Mới** — quy trình lõi |
| `13-seq-uc09-ghi-chiso.mmd` | Sơ đồ tuần tự — UC-09 Ghi chỉ số | 3 | **Mới** |
| `14-seq-uc12-ghi-thanhtoan.mmd` | Sơ đồ tuần tự — UC-12 Ghi nhận thanh toán | 3 | **Mới** |
| `15-seq-uc19-cong-nguoithue.mmd` | Sơ đồ tuần tự — UC-19, UC-20 Cổng người thuê | 3 | **Mới** — minh hoạ chặn truy cập chéo |
| `16-kien-truc-trien-khai.excalidraw` | Kiến trúc triển khai — VPS, Docker, Nginx | 4 | **Mới** — thay ASCII art trong file kế hoạch |
| `17-phan-ra-module.excalidraw` | Phân rã module backend | 3 | **Mới** — thay ASCII art trong file kế hoạch |
| `18-lat-cat-doc.excalidraw` | Mười ba vertical slice và ranh giới cắt được | 1 | **Mới** |

Các sơ đồ ở thư mục `diagrams/` (use case, hoạt động, luồng dữ liệu, trạng thái) **giữ nguyên**, không bị lô CR-01 ảnh hưởng.

## Vì sao hai công cụ, không phải một

Chia theo tiêu chí **có ký pháp chuẩn hay không**:

- **Mermaid** cho sơ đồ có ký pháp chuẩn — ERD, sơ đồ lớp, sơ đồ tuần tự. Kim cương đặc phân biệt với kim cương rỗng, mũi tên nét đứt cho quan hệ hiện thực hoá, khối `alt` và `loop`, thanh activation trên lifeline. Mermaid dựng đúng những thứ này tự động; vẽ tay chắc chắn sẽ sai hoặc thiếu nhất quán ở đâu đó. Riêng sơ đồ UC-10 có 36 bước với khối `alt` lồng nhau — vẽ tay là không khả thi.
- **Excalidraw** cho sơ đồ khái niệm — kiến trúc, phân rã, kế hoạch. Không ký pháp nào ràng buộc, mà lại cần những thứ Mermaid không có: hộp lồng nhau biểu diễn ranh giới bảo mật, khối mã nguồn làm bằng chứng, màu mang nghĩa ngữ nghĩa.

**Ba sơ đồ Excalidraw thay cho ASCII art** trong `PRJ1_Ke-hoach-trien-khai.md`. Bản ASCII art **vẫn giữ nguyên trong file kế hoạch**, chưa xoá — để đối chiếu rồi chọn bản nào đưa vào báo cáo.

## Ba sơ đồ nên trình bày kỹ khi bảo vệ

**`11-class-billing-calc`** — cho thấy phần tính tiền được tách thành các lớp thuần, không phụ thuộc Spring hay cơ sở dữ liệu. Đây là điều khiến việc kiểm thử tiền bạc trở nên khả thi ở quy mô hàng trăm ca. Hai mẫu thiết kế dùng ở đây đều có lý do nghiệp vụ rõ ràng, không phải dùng cho có: một chiến lược cho **cách tính** ứng với bốn giá trị của `cachTinh`, một chiến lược cho **chế độ giá** ứng với đơn giá cố định và bậc thang.

**`12-seq-uc10-tao-hoadon`** — cho thấy toàn bộ 7 bước và 4 luồng ngoại lệ của UC-10 được cài đặt đúng như đặc tả, kèm mã quy tắc nghiệp vụ trên từng bước. Hai chú thích quan trọng nhất trên sơ đồ: chốt nhân khẩu một lần cho cả kỳ (CR-002), và đánh dấu khoản phát sinh đã tính để không thu tiền lặp ở kỳ sau (CR-008).

**`15-seq-uc19-cong-nguoithue`** — có riêng một khối minh hoạ **thử truy cập trái phép**: người thuê phòng 101 gọi thẳng API hoá đơn phòng 102 và nhận 403. Khối này chứng minh phân quyền được chặn ở tầng máy chủ chứ không phải bằng cách ẩn nút trên giao diện — đây là điểm phân biệt rõ giữa hiểu đúng và hiểu sai về bảo mật ứng dụng web.
