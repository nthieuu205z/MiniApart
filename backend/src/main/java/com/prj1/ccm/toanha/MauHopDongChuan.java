package com.prj1.ccm.toanha;

/**
 * Mẫu điều khoản hợp đồng chuẩn mực của hệ thống MiniApart.
 * Toàn bộ 12 điều khoản được xây dựng đối chiếu trực tiếp với:
 * - Dữ liệu thực tế: Bên A, Bên B, Bất động sản, Người ở cùng, Tiền cọc, Dịch vụ, Biên bản nhận/trả phòng.
 * - Chức năng vận hành: Ghi chỉ số & tính hoá đơn, Sổ quỹ cọc, Yêu cầu sửa chữa, Biên bản bàn giao, Phụ lục hợp đồng.
 * - Ranh giới trách nhiệm: Làm rõ các nội dung hệ thống lưu trữ/hỗ trợ đối soát (như nhân khẩu tạm trú)
 *   thay vì hứa hẹn tự động nộp hồ sơ online khi hệ thống chưa tích hợp.
 */
public final class MauHopDongChuan {

    private MauHopDongChuan() {
    }

    public static final String TIEU_DE_CHUAN = "HỢP ĐỒNG THUÊ PHÒNG";

    public static final String TEN_MAU_CHUAN = "Mẫu hợp đồng chuẩn mực MiniApart (12 điều khoản vận hành)";

    public static final String NOI_DUNG_DIEU_KHOAN_CHUAN = """
            Điều 1. Đối tượng thuê, mục đích, phạm vi sử dụng và nhận bàn giao
            1. Bên A đồng ý cho Bên B thuê và Bên B đồng ý thuê diện tích phòng kèm theo các trang thiết bị gắn liền theo đúng thông tin phòng thuê, số tầng, diện tích và địa chỉ toà nhà được ghi nhận tại mục thông tin bất động sản của hợp đồng này.
            2. Mục đích thuê: Bên B cam kết sử dụng phòng thuê đúng mục đích để ở sinh hoạt hợp pháp của Bên B và những người ở cùng đã đăng ký trong hồ sơ hợp đồng. Bên B không được sử dụng phòng thuê vào mục đích kinh doanh, sản xuất, làm kho chứa hàng, hoặc tổ chức các hoạt động vi phạm pháp luật.
            3. Phạm vi sử dụng: Bên B được quyền sử dụng riêng không gian bên trong phòng thuê; đồng thời được quyền sử dụng chung các công trình, tiện ích công cộng của toà nhà (lối đi, thang máy, thang bộ, nhà để xe) theo đúng quy định và nội quy quản lý toà nhà.
            4. Thời điểm nhận phòng và bàn giao: Bên B nhận bàn giao phòng bắt đầu từ ngày nhận phòng được ghi nhận tại hợp đồng này. Việc bàn giao thực tế về hiện trạng phòng, chìa khóa, thẻ từ và trang thiết bị phải được xác lập bằng Biên bản bàn giao nhận phòng (loại NHẬN PHÒNG) được liên kết trên hệ thống và có chữ ký xác nhận của hai bên.

            Điều 2. Thời hạn thuê, giá thuê, kỳ hạn và phương thức thanh toán
            1. Thời hạn thuê: Hợp đồng có hiệu lực thuê từ ngày bắt đầu đến hết ngày kết thúc theo thời hạn được ghi nhận cụ thể tại hợp đồng này.
            2. Giá thuê phòng: Tiền thuê phòng mỗi tháng được áp dụng theo mức giá thuê cố định ghi nhận tại hợp đồng này. Giá thuê đã bao gồm quyền sử dụng diện tích phòng và các trang thiết bị bàn giao ban đầu, không bao gồm các chi phí dịch vụ sử dụng riêng. Giá thuê được giữ nguyên trong suốt thời hạn hợp đồng, trừ trường hợp hai bên có văn bản thỏa thuận hoặc phụ lục hợp đồng điều chỉnh giá.
            3. Kỳ hạn thanh toán: Tiền thuê phòng được thanh toán theo kỳ thanh toán thỏa thuận ghi nhận tại hợp đồng (số tháng/lần) và phải được hoàn tất thanh toán chậm nhất vào ngày đến hạn thanh toán định kỳ hàng tháng theo quy định tại hợp đồng.
            4. Phương thức thanh toán: Bên B thực hiện thanh toán bằng hình thức chuyển khoản vào tài khoản ngân hàng của Bên A được chỉ định tại hợp đồng hoặc nộp tiền mặt cho người đại diện có thẩm quyền của Bên A kèm phiếu thu hợp lệ. Giao dịch hợp lệ được hệ thống MiniApart ghi nhận và theo dõi trên sổ quỹ công nợ toà nhà.

            Điều 3. Tiền đặt cọc, điều kiện hoàn cọc và căn cứ khấu trừ
            1. Tiền đặt cọc thỏa thuận: Bên B giao cho Bên A số tiền đặt cọc theo đúng mức thỏa thuận ghi nhận tại hợp đồng này nhằm bảo đảm thực hiện hợp đồng và trách nhiệm bảo quản tài sản.
            2. Xác nhận tiền cọc thực thu: Trạng thái nộp tiền cọc được xác nhận căn cứ vào chứng từ giao dịch thực tế ghi nhận trên sổ quỹ hệ thống MiniApart. Hợp đồng ghi nhận riêng biệt mức cọc thỏa thuận và mức cọc thực thu; việc chưa nộp đủ tiền cọc thỏa thuận sẽ được hệ thống cảnh báo và là căn cứ xem xét trách nhiệm thực hiện hợp đồng.
            3. Điều kiện hoàn trả tiền cọc: Bên A có trách nhiệm hoàn trả lại tiền đặt cọc cho Bên B sau khi hai bên tiến hành thủ tục thanh lý hợp đồng, Bên B đã bàn giao lại phòng và trang thiết bị, đồng thời hoàn tất mọi nghĩa vụ thanh toán tiền thuê và dịch vụ còn tồn đọng.
            4. Căn cứ khấu trừ tiền cọc: Tiền đặt cọc được khấu trừ cho các nghĩa vụ sau: tiền thuê quá hạn chưa trả, tiền dịch vụ theo chỉ số cuối kỳ chưa thanh toán, và chi phí sửa chữa, bồi thường hư hỏng, mất mát tài sản căn cứ chính xác theo Biên bản bàn giao trả phòng (loại TRẢ PHÒNG) được hai bên ký xác nhận trên hệ thống. Mọi khoản khấu trừ khác phải có thỏa thuận bằng văn bản giải trình lý do chênh lệch.

            Điều 4. Chi phí dịch vụ, cơ chế tính phí và chốt chỉ số định kỳ
            1. Danh mục dịch vụ áp dụng: Các dịch vụ tính phí riêng được thực hiện theo đúng danh mục dịch vụ áp dụng và đơn giá được ghi nhận tại hợp đồng này. Trường hợp hợp đồng không đăng ký dịch vụ tính phí riêng thì Bên B không phải chi trả các khoản phí dịch vụ ngoài tiền thuê phòng.
            2. Dịch vụ tính theo chỉ số tiêu thụ (điện, nước): Tiền dịch vụ phát sinh hàng tháng được tính bằng sản lượng tiêu thụ thực tế căn cứ theo chỉ số công tơ đầu kỳ và cuối kỳ nhân với đơn giá cố định hoặc các mốc biểu giá bậc thang tương ứng đã được đóng băng trong snapshot hợp đồng.
            3. Dịch vụ có đơn giá cố định: Đối với dịch vụ thu cố định theo phòng hoặc theo người (như vệ sinh, internet, thang máy, gửi xe), mức thu được tính cố định hàng tháng theo mức giá thỏa thuận. Các dịch vụ ghi nhận đơn giá 0 đồng được hiểu là miễn phí theo hợp đồng.
            4. Quy trình chốt chỉ số và phát hành hoá đơn: Định kỳ hàng tháng, Bên A tiến hành chốt chỉ số công tơ, chụp ảnh lưu trữ trên hệ thống MiniApart và phát hành thông báo hoá đơn cho Bên B. Bên B có quyền đối chiếu hình ảnh và số đo công tơ trước khi thực hiện thanh toán.

            Điều 5. Quyền và nghĩa vụ của Bên cho thuê (Bên A)
            1. Bàn giao phòng thuê, chìa khóa, thẻ từ và toàn bộ trang thiết bị gắn liền cho Bên B đúng thời điểm và hiện trạng đã cam kết trong Biên bản bàn giao nhận phòng.
            2. Bảo đảm quyền sử dụng phòng thuê riêng tư, an toàn và ổn định cho Bên B trong suốt thời hạn hợp đồng; không tự ý vào phòng thuê khi chưa có sự đồng ý của Bên B, trừ trường hợp khẩn cấp đe dọa trực tiếp đến tính mạng hoặc an toàn toà nhà (cháy nổ, ngập nước, chập điện) và phải thông báo ngay sau đó.
            3. Cung cấp thông tin, tài liệu pháp lý thuộc thẩm quyền của chủ sở hữu toà nhà để Bên B thực hiện thủ tục đăng ký tạm trú theo quy định pháp luật.
            4. Duy trì hạ tầng kỹ thuật chung và bảo đảm cung cấp ổn định các nguồn dịch vụ thiết yếu (điện, nước, internet) phục vụ sinh hoạt toà nhà; thực hiện kiểm tra an toàn PCCC toà nhà theo quy định.
            5. Có quyền yêu cầu Bên B thanh toán đầy đủ, đúng hạn tiền thuê phòng và chi phí dịch vụ; có quyền từ chối cho vào ở đối với những người chưa đăng ký cư trú hợp lệ; có quyền kiểm tra định kỳ việc bảo quản tài sản và an toàn PCCC với thông báo trước hợp lý.

            Điều 6. Quyền và nghĩa vụ của Bên thuê (Bên B)
            1. Tiếp nhận phòng, kiểm tra kỹ hiện trạng kỹ thuật của từng tài sản và ký xác nhận Biên bản bàn giao nhận phòng trước khi bắt đầu sử dụng.
            2. Thanh toán đầy đủ, đúng hạn tiền thuê phòng và các chi phí dịch vụ phát sinh theo đúng kỳ hạn và phương thức đã thỏa thuận trong hợp đồng.
            3. Sử dụng phòng thuê đúng mục đích để ở, đúng số lượng người thuê và người ở cùng đã được đăng ký hợp lệ trong hồ sơ hợp đồng. Không được tự ý cho người lạ ở lại qua đêm mà không thông báo, không được tự ý chuyển nhượng hợp đồng hoặc cho bên thứ ba thuê lại một phần hay toàn bộ phòng khi chưa có văn bản đồng ý của Bên A.
            4. Giữ gìn vệ sinh môi trường, bảo vệ tài sản chung toà nhà; chấp hành nghiêm túc nội quy toà nhà, quy định giữ gìn an ninh trật tự và quy tắc nếp sống văn minh đô thị.
            5. Cung cấp đầy đủ, chính xác bản sao giấy tờ tùy thân hợp lệ (CCCD/Hộ chiếu) của bản thân và toàn bộ người ở cùng để phối hợp cùng Bên A thực hiện thủ tục khai báo tạm trú với cơ quan Công an có thẩm quyền theo quy định của Luật Cư trú.

            Điều 7. Quản lý tài sản, trang thiết bị và giá trị pháp lý của Biên bản bàn giao
            1. Danh mục, số lượng và tình trạng hoạt động thực tế của trang thiết bị bàn giao kèm theo phòng được ghi nhận cụ thể tại Phụ lục danh mục tài sản đính kèm hợp đồng này và Biên bản bàn giao nhận phòng trên hệ thống MiniApart.
            2. Biên bản bàn giao nhận phòng (loại NHẬN PHÒNG) và Biên bản bàn giao trả phòng (loại TRẢ PHÒNG) là văn bản thỏa thuận có giá trị pháp lý ràng buộc giữa hai bên, là căn cứ duy nhất để xác định trách nhiệm bảo quản tài sản và làm cơ sở đối chiếu, khấu trừ bồi hoàn khi kết thúc hợp đồng.
            3. Trong suốt quá trình thuê, Bên B có trách nhiệm sử dụng đúng công năng, đúng hướng dẫn kỹ thuật của nhà sản xuất đối với từng thiết bị; không tự ý tháo dỡ, hoán đổi linh kiện hoặc di chuyển tài sản ra khỏi phạm vi phòng thuê khi chưa có sự đồng ý của Bên A.

            Điều 8. Sửa chữa, bảo trì và phân định trách nhiệm hao mòn tài sản
            1. Trách nhiệm của Bên A: Bên A chịu trách nhiệm và chi trả toàn bộ chi phí sửa chữa, bảo trì đối với các sự cố hư hỏng liên quan đến kết cấu toà nhà, hệ thống kỹ thuật ngầm (hệ thống cấp thoát nước trục chính, đường điện tổng) và sự xuống cấp tự nhiên do thời gian sử dụng bình thường của trang thiết bị (hao mòn tự nhiên).
            2. Trách nhiệm của Bên B: Bên B chịu trách nhiệm chi trả chi phí sửa chữa, thay thế hoặc bồi hoàn giá trị tài sản đối với các hư hỏng, đổ vỡ, cháy chập phát sinh do lỗi sử dụng bất cẩn, quá tải, va đập mạnh hoặc do Bên B tự ý tháo dỡ, sửa chữa sai kỹ thuật.
            3. Quy trình gửi và tiếp nhận yêu cầu sửa chữa: Khi phát hiện hư hỏng hoặc sự cố kỹ thuật, Bên B gửi yêu cầu sửa chữa thông qua ứng dụng MiniApart hoặc thông báo trực tiếp cho ban quản lý toà nhà. Bên A có trách nhiệm cử nhân sự kiểm tra, xác định nguyên nhân và thông báo rõ bên chịu chi phí trước khi tiến hành sửa chữa.

            Điều 9. An toàn phòng cháy chữa cháy, an ninh trật tự và quy định cư trú
            1. Tuân thủ an toàn PCCC: Bên B và toàn bộ người ở cùng có nghĩa vụ chấp hành nghiêm ngặt nội quy PCCC của toà nhà và các quy định pháp luật hiện hành; tuyệt đối không tích trữ chất dễ cháy nổ, xăng dầu, hóa chất độc hại; không sử dụng bình gas mini kém an toàn; không câu móc thiết bị điện công suất lớn gây quá tải; không cản trở lối thoát hiểm và không tự ý can thiệp vào các phương tiện, thiết bị PCCC của toà nhà.
            2. An ninh trật tự và nếp sống văn minh: Giữ gìn an ninh, trật tự chung trong toà nhà; không gây ồn ào hoặc phát âm thanh lớn làm ảnh hưởng đến các phòng xung quanh, đặc biệt trong khung giờ từ 22h00 đêm đến 06h00 sáng hôm sau; nghiêm cấm mọi hành vi tệ nạn xã hội, cờ bạc, tàng trữ hoặc sử dụng chất cấm trong khuôn viên toà nhà.
            3. Trách nhiệm khai báo tạm trú: Bên B có nghĩa vụ cung cấp đầy đủ giấy tờ tùy thân của bản thân và người ở cùng được lưu trữ trên hệ thống MiniApart để phối hợp cùng Bên A thực hiện thủ tục đăng ký tạm trú với cơ quan Công an có thẩm quyền theo quy định của Luật Cư trú. Hệ thống MiniApart hỗ trợ quản lý, trích xuất dữ liệu cư trú phục vụ đối soát, không thay thế thủ tục hành chính trực tiếp với cơ quan nhà nước.

            Điều 10. Gia hạn hợp đồng, chấm dứt trước thời hạn và thủ tục trả phòng
            1. Gia hạn hợp đồng: Trước khi hết hạn hợp đồng ít nhất 30 ngày, nếu Bên B có nguyện vọng tiếp tục thuê và Bên A đồng ý, hai bên sẽ thỏa thuận ký kết gia hạn hợp đồng hoặc lập phụ lục gia hạn mới được lưu vết trên hệ thống.
            2. Chấm dứt trước thời hạn: Trường hợp một trong hai bên muốn chấm dứt hợp đồng trước thời hạn cam kết, bên có yêu cầu phải thông báo bằng văn bản hoặc thông báo trên hệ thống cho bên kia trước ít nhất số ngày báo trước đã thỏa thuận ghi nhận tại hợp đồng này. Hai bên cùng thương lượng giải quyết các nghĩa vụ tài chính và cấn trừ tiền cọc theo thỏa thuận thực tế.
            3. Bàn giao trả phòng: Khi hợp đồng chấm dứt, Bên B có nghĩa vụ di dời toàn bộ tài sản cá nhân ra khỏi phòng thuê, vệ sinh phòng sạch sẽ và bàn giao lại toàn bộ phòng, chìa khóa, thẻ từ và trang thiết bị cho Bên A theo đúng hiện trạng ghi nhận ban đầu (trừ hao mòn tự nhiên hợp lý).

            Điều 11. Đối chiếu công nợ, kiểm kê tài sản, quyết toán và thanh lý hợp đồng
            1. Kiểm kê tài sản trả phòng: Tại thời điểm bàn giao trả phòng, hai bên cùng trực tiếp kiểm tra tình trạng thực tế của phòng và trang thiết bị, đối chiếu với Biên bản nhận phòng ban đầu và lập Biên bản bàn giao trả phòng (loại TRẢ PHÒNG) trên hệ thống ghi nhận rõ tình trạng và mức khấu trừ bồi thường hư hỏng (nếu có).
            2. Quyết toán công nợ cuối cùng: Bên A tiến hành chốt chỉ số dịch vụ cuối kỳ, lập bảng tổng hợp quyết toán công nợ trên hệ thống MiniApart gồm: tiền thuê đến ngày trả phòng thực tế, tiền dịch vụ theo chỉ số chốt cuối cùng, và các khoản khấu trừ bồi thường tài sản căn cứ theo Biên bản trả phòng đối trừ với số tiền cọc thực tế đã thu.
            3. Hoàn trả tiền cọc và thanh lý: Sau khi hai bên thống nhất bảng đối soát quyết toán và ký Biên bản thanh lý hợp đồng, Bên A có trách nhiệm hoàn trả số tiền đặt cọc còn lại cho Bên B (hoặc Bên B thanh toán nốt số tiền còn thiếu cho Bên A nếu tiền cọc không đủ bù đắp nghĩa vụ) trong thời hạn thỏa thuận không quá 07 ngày làm việc kể từ ngày ký biên bản thanh lý.

            Điều 12. Điều khoản thi hành, sửa đổi phụ lục, giải quyết tranh chấp và ký kết
            1. Hiệu lực pháp lý: Hợp đồng này có hiệu lực kể từ thời điểm hai bên hoàn tất việc ký kết hợp đồng hoặc kể từ ngày bắt đầu thời hạn thuê được ghi nhận tại hợp đồng này.
            2. Sửa đổi bằng phụ lục: Mọi sửa đổi, bổ sung liên quan đến giá thuê, thời hạn thuê, danh mục dịch vụ, người ở cùng hoặc các điều khoản cam kết khác sau khi hồ sơ đã chốt đều phải được lập thành Phụ lục hợp đồng bằng văn bản thông qua tính năng quản lý phụ lục của hệ thống MiniApart và có chữ ký xác nhận của hai bên.
            3. Giải quyết tranh chấp: Trong quá trình thực hiện hợp đồng, nếu phát sinh tranh chấp hoặc bất đồng, hai bên cam kết ưu tiên giải quyết thông qua thương lượng hòa giải trên tinh thần thiện chí và bình đẳng. Trường hợp không thể thương lượng thống nhất được, một trong hai bên có quyền yêu cầu Tòa án nhân dân có thẩm quyền giải quyết theo quy định của pháp luật Việt Nam.
            4. Số bản phát hành: Hợp đồng này được lập thành 02 (hai) bản gốc bằng tiếng Việt có giá trị pháp lý như nhau, Bên A giữ 01 bản, Bên B giữ 01 bản để làm căn cứ thực hiện. Việc ký kết thực tế được ghi nhận ngày ký, chữ ký và lưu trữ bản scan đính kèm trên hệ thống MiniApart.
            """;

    /**
     * Kiểm tra xem văn bản điều khoản có chứa các ký hiệu đánh dấu nội dung chưa thỏa thuận / chỗ trống hay không.
     */
    public static boolean coNoiDungChuaThoaThuan(String dieuKhoan) {
        if (dieuKhoan == null || dieuKhoan.isBlank()) return false;
        String upper = dieuKhoan.toUpperCase();
        return upper.contains("[CHƯA THỎA THUẬN")
                || upper.contains("[CẦN BỔ SUNG")
                || upper.contains("[ĐANG CẬP NHẬT")
                || upper.contains("[TRỐNG]")
                || upper.contains("[TODO")
                || upper.contains("[CHƯA XÁC ĐỊNH");
    }
}

