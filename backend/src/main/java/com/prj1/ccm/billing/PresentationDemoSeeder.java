package com.prj1.ccm.billing;

import com.prj1.ccm.auth.PasswordHasher;
import com.prj1.ccm.antoan.PcccService;
import com.prj1.ccm.hopdong.*;
import com.prj1.ccm.nguoidung.*;
import com.prj1.ccm.publicportal.*;
import com.prj1.ccm.suachua.PresentationDemoRepairs;
import com.prj1.ccm.taisan.*;
import com.prj1.ccm.toanha.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.*;
import java.util.*;

/** Opt-in, fresh-database-only presentation fixture. Never part of Flyway history. */
@Component
@Profile("presentation-demo")
@ConditionalOnProperty(name = "app.presentation-demo.enabled", havingValue = "true")
public class PresentationDemoSeeder implements CommandLineRunner {
    static final String MARKER = "PRESENTATION_DEMO_V1";
    private final JdbcTemplate jdbc;
    private final Environment env;
    private final PasswordHasher hasher;
    private final HopDongService contracts;
    private final TaiSanService assets;
    private final NguoiOCungService occupants;
    private final GiaoDichCocService deposits;
    private final KyThanhToanService periods;
    private final ChiSoDichVuService meters;
    private final TinhHoaDonRepository invoices;
    private final TinhHoaDonService calculator;
    private final PhatHanhHoaDonService publication;
    private final ThanhToanService payments;
    private final PresentationDemoRepairs repairs;
    private final PcccService fireSafety;
    private final PublicPortalService portal;
    private final Clock clock;
    private final ObjectMapper mapper;
    private final String expectedDatabase;
    private final String referenceDate;
    private final String password;

    public PresentationDemoSeeder(JdbcTemplate jdbc, Environment env, PasswordHasher hasher,
            HopDongService contracts, TaiSanService assets, NguoiOCungService occupants,
            GiaoDichCocService deposits, KyThanhToanService periods, ChiSoDichVuService meters,
            TinhHoaDonRepository invoices, TinhHoaDonService calculator,
            PhatHanhHoaDonService publication, ThanhToanService payments,
            PresentationDemoRepairs repairs, PcccService fireSafety, PublicPortalService portal,
            Clock clock, ObjectMapper mapper,
            @Value("${app.presentation-demo.expected-database:}") String expectedDatabase,
            @Value("${app.presentation-demo.reference-date:}") String referenceDate,
            @Value("${app.presentation-demo.password:}") String password) {
        this.jdbc=jdbc; this.env=env; this.hasher=hasher; this.contracts=contracts; this.assets=assets;
        this.occupants=occupants; this.deposits=deposits; this.periods=periods; this.meters=meters;
        this.invoices=invoices; this.calculator=calculator; this.publication=publication; this.payments=payments;
        this.repairs=repairs; this.fireSafety=fireSafety; this.portal=portal; this.clock=clock; this.mapper=mapper;
        this.expectedDatabase=expectedDatabase; this.referenceDate=referenceDate; this.password=password;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void run(String... args) {
        String database = jdbc.queryForObject("SELECT current_database()", String.class);
        if (Arrays.stream(env.getActiveProfiles()).anyMatch(p -> p.equalsIgnoreCase("prod") || p.equalsIgnoreCase("production")))
            throw new IllegalStateException("Presentation seed is forbidden with production profiles.");
        if (database == null || !database.matches("miniapart_demo_[a-z0-9_]+") || !database.equals(expectedDatabase))
            throw new IllegalStateException("Seed requires an explicitly confirmed miniapart_demo_* database.");
        if (env.getProperty("app.seed-demo", Boolean.class, false))
            throw new IllegalStateException("Disable the older app.seed-demo runner before presentation seed.");
        LocalDate ref = referenceDate.isBlank() ? LocalDate.now(clock) : LocalDate.parse(referenceDate);
        if (ref.isAfter(LocalDate.now(clock))) throw new IllegalStateException("Reference date cannot be in the future.");
        if (password.length() < 12 || password.length() > 128) throw new IllegalStateException("Supply a demo password of 12–128 characters.");
        // Serializes competing seed attempts without schema changes or durable lock rows.
        jdbc.queryForObject("SELECT pg_advisory_xact_lock(72620261105)", Object.class);
        var prior = jdbc.queryForList("SELECT gia_tri_sau FROM NHAT_KY_THAO_TAC WHERE hanh_dong='DEMO_DATASET_READY' AND doi_tuong=?", String.class, MARKER);
        if (!prior.isEmpty()) {
            if (prior.size()!=1 || !prior.getFirst().equals(ref.toString())) throw new IllegalStateException("Dataset already exists with another reference date/version.");
            verify();
            return; // Never rewrite user changes or old receipts on a repeat invocation.
        }
        requireFreshDatabase();
        String hash = hasher.hash(password);
        NguoiDung admin = account("Phạm Minh Quân", "0999000001", VaiTro.QTHT, null, hash);
        NguoiDung[] owners = {
                account("Nguyễn Hoàng Phúc", "0999000011", VaiTro.CHU, null, hash),
                account("Trần Ngọc Mai", "0999000012", VaiTro.CHU, null, hash)};
        NguoiDung[] workers = {
                account("Lê Quốc Huy", "0999000031", VaiTro.THO, null, hash),
                account("Đặng Văn Thành", "0999000032", VaiTro.THO, null, hash)};
        String[] names = {"An Nhiên Residence", "Nhà Xanh Cầu Giấy", "Mộc Lan Home", "Phố Nhỏ Studio", "Bình Minh Riverside", "Vườn Nắng Apartment"};
        String[] addresses = {"Khu nhà mẫu phố Duy Tân, Hà Nội", "Khu nhà mẫu phố Trần Thái Tông, Hà Nội",
                "Khu nhà mẫu phố Nguyễn Văn Cừ, Hà Nội", "Khu nhà mẫu phố Lê Văn Sỹ, TP. Hồ Chí Minh",
                "Khu nhà mẫu đường Nguyễn Hữu Thọ, TP. Hồ Chí Minh", "Khu nhà mẫu đường Nguyễn Văn Linh, Đà Nẵng"};
        String[] managers = {"Vũ Thu Hà", "Phạm Đức Anh", "Đỗ Thanh Tâm", "Ngô Hải Yến", "Bùi Tuấn Kiệt", "Hoàng Khánh Linh"};
        for (int b=0; b<6; b++) {
            NguoiDung manager = account(managers[b], "099900002"+b, VaiTro.QUAN_LY, null, hash);
            Long building = id("INSERT INTO TOA_NHA(ma_toa,ten,dia_chi,so_tang,ngay_chot_so,so_ngay_han_tt,tk_ngan_hang,nguong_that_thoat,ma_ngan_hang) VALUES (?,?,?,?,25,7,?,150000,'970422') RETURNING id",
                    "DEMO-P"+(b+1),names[b],addresses[b],4+b%3,"036881220"+b); // số minh hoạ MB (BIN 970422), không phải tài khoản thật
            grant(manager,building); grant(owners[b%2],building); grant(workers[b%2],building);
            jdbc.update("INSERT INTO CAU_HINH_BEN_A_TOA_NHA(toa_nha_id,ten_chu_the,ma_so_dinh_danh,dia_chi_lien_he,so_dien_thoai,ho_ten_nguoi_ky,so_tai_khoan,ten_ngan_hang,chu_tai_khoan) VALUES (?,?,?,?,?,?,?,?,?)",
                    building,owners[b%2].hoTen(),"DEMO-OWNER-"+b,addresses[b],owners[b%2].soDienThoai(),owners[b%2].hoTen(),
                    "036881220"+b,"MB Bank (Ngân hàng TMCP Quân Đội)",new String[]{"NGUYEN HOANG PHUC","TRAN NGOC MAI"}[b%2]);
            jdbc.update("INSERT INTO MAU_HOP_DONG(toa_nha_id,ten_mau,phien_ban,trang_thai,noi_dung_dieu_khoan,nguoi_tao_id) VALUES (?, ?,1,'PUBLISHED',?,?)",
                    building,"Mẫu thuê phòng — "+names[b],MauHopDongChuan.NOI_DUNG_DIEU_KHOAN_CHUAN,manager.id());
            List<ServicePrice> services = services(building,b,ref);
            List<RoomContract> rooms = new ArrayList<>();
            for (int r=1; r<=12; r++) {
                String number = "%d%02d".formatted((r-1)/3+1,(r-1)%3+1);
                BigDecimal rent = money(2800000 + b*250000L + (r%4)*400000L);
                String anhDaiDien = layAnhDaiDienChoPhong(b, r);
                Long room = id("INSERT INTO PHONG(toa_nha_id,so_phong,tang,dien_tich,suc_chua,gia_thue_mac_dinh,loai_phong,trang_thai,mo_ta,tien_ich,ngung_cho_thue,anh_dai_dien) VALUES (?,?,?,?,?,?,?,'TRONG',?,?,?,?) RETURNING id",
                        building,number,(r-1)/3+1,20+r%4*5,3,rent,
                        new String[]{"Studio ban công","Phòng có gác","Studio nội thất","Phòng cơ bản"}[r%4],
                        "Không gian "+(20+r%4*5)+" m², "+(r%2==0?"cửa sổ thoáng và khu bếp riêng":"ánh sáng tự nhiên, yên tĩnh")+". Dữ liệu mô phỏng phục vụ báo cáo.",
                        String.join(", ",PresentationRoomEquipment.amenities(b,r)),r==12,
                        anhDaiDien);
                for (var equipment:PresentationRoomEquipment.inventory(b,r)) assets.themTaiSan(room,new YeuCauKhaiBaoTaiSan(
                        equipment.name(),equipment.category(),1,"HOAT_DONG_TOT",equipment.value(),"Đã kiểm tra khi bố trí phòng"),manager);
                if (r==12) { rooms.add(new RoomContract(room,null,null,rent,null)); continue; }
                int person = b*11+r;
                Long tenant = tenant(person,ref);
                boolean draft=r==10, settlement=r==11;
                LocalDate start = draft ? ref.plusDays(7) : ref.minusMonths(6).withDayOfMonth(1);
                LocalDate end = r==9 ? ref.plusDays(12) : ref.plusMonths(6);
                List<YeuCauHopDongDichVu> selected = services.stream().filter(s -> s.applied()).map(s -> new YeuCauHopDongDichVu(s.id(),s.price())).toList();
                Long contract = contracts.tao(new YeuCauHopDong(room,tenant,start,end,rent,rent.multiply(BigDecimal.valueOf(2)),30,selected),manager).id();
                if (!draft) {
                    if (r<=5) {
                        Long co = tenant(66+b*5+r,ref);
                        occupants.tao(contract,new YeuCauNguoiOCung(co,null,start,null,"NGUOI_O"),manager);
                    }
                    Long handover = r<=6 || settlement ? handover(contract,room,"NHAN_PHONG",start,manager,false) : null;
                    Map<String,Object> fields = new LinkedHashMap<>();
                    fields.put("ngayLap",start.toString()); fields.put("ngayNhanPhong",start.toString());
                    fields.put("soNguoiToiDa",3); fields.put("hanThanhToanNgay",5);
                    fields.put("benATenChuThe",owners[b%2].hoTen()); fields.put("benADinhDanh","DEMO-OWNER-"+b);
                    fields.put("benADiaChi",addresses[b]); fields.put("benADienThoai",owners[b%2].soDienThoai());
                    fields.put("benANguoiKy",owners[b%2].hoTen()); fields.put("benATuCachKy","CHU_SO_HUU");
                    fields.put("benBHoTen",personName(person)); fields.put("benBSoGiayTo","DEMO-PERSON-"+person);
                    fields.put("benBDienThoai",phone(person)); fields.put("benBThuongTru","Địa chỉ thường trú giả lập số "+person);
                    fields.put("dieuKhoanTuyBien",MauHopDongChuan.NOI_DUNG_DIEU_KHOAN_CHUAN);
                    if (handover!=null) fields.put("bienBanBanGiaoId",handover);
                    var dossier = contracts.luuDraftHoSo(contract,mapper.convertValue(fields,YeuCauLuuDraftHoSo.class),manager);
                    dossier = contracts.chotHoSo(contract,new YeuCauChotHoSo(dossier.revision(),null,null),manager);
                    contracts.ghiNhanKy(contract,new YeuCauGhiNhanKy(start,"Kịch bản mô phỏng, không phải hợp đồng thực tế",null,dossier.revision()),manager);
                    // Existing resident-count module counts temporal residency rows, not HOP_DONG.nguoi_thue_id.
                    // Reuse the SAME person as a primary residency row; do not create a second tenant profile.
                    // PDF already includes the primary signatory separately in its frozen dossier.
                    occupants.tao(contract,new YeuCauNguoiOCung(tenant,null,start,null,"NGUOI_DUNG_TEN"),manager);
                    deposits.thuCoc(contract,new YeuCauThuCoc(rent.multiply(BigDecimal.valueOf(2)),start,"Thu cọc mô phỏng"),manager);
                    contracts.nhanCoc(contract,manager); contracts.kichHoat(contract,manager);
                    if (!settlement) account(personName(person),phone(person),VaiTro.NGUOI_THUE,tenant,hash);
                } else contracts.luuDraftHoSo(contract,mapper.convertValue(Map.of("ngayLap",ref.toString()),YeuCauLuuDraftHoSo.class),manager);
                rooms.add(new RoomContract(room,contract,tenant,rent,start));
            }
            seedBilling(building,b,rooms,services,ref,manager);
            RoomContract returning=rooms.get(10);
            Long checkOut=handover(returning.contract(),returning.room(),"TRA_PHONG",ref,manager,true);
            contracts.thanhLy(returning.contract(),new YeuCauThanhLy(money(200000),"Hai bên xác nhận chi phí sửa bản lề tủ, không tính hao mòn tự nhiên",List.of(),checkOut),manager);
            // The released room is available to public search and viewing appointments.
            jdbc.update("UPDATE PHONG SET trang_thai='TRONG' WHERE id=?",returning.room());
            for (int q=0; q<5; q++) repairs.create(q==0?rooms.get(11).room():rooms.get(q).room(),q,manager,workers[b%2],q==0);
            for (int q=0; q<5; q++) {
                Long appointment=portal.datLichHen(new YeuCauDatLichHen(personName(150+b*5+q),phone(150+b*5+q),
                        "khach"+(b*5+q)+"@example.invalid",returning.room(),building,ref.plusDays(1+q).atTime(9+q,0),"Lịch xem mô phỏng; khách quan tâm phòng có cửa sổ"));
                if(q==1) portal.capNhatTrangThaiLichHen(appointment,"DA_XAC_NHAN",manager);
                if(q==2) portal.capNhatTrangThaiLichHen(appointment,"HUY",manager);
            }
            for (int q=0;q<4;q++) fireSafety.luuThietBi(building,null,new PcccService.YeuCauThietBi(
                    q%2==0?"Bình chữa cháy bột 4 kg":"Đèn chỉ dẫn thoát hiểm","Chiếu nghỉ tầng "+(q+1),ref.plusDays(q==0?-5:60+q*30)),owners[b%2]);
            fireSafety.ghiKiemTra(building,new PcccService.YeuCauKiemTra(ref.minusDays(14),List.of(
                    new PcccService.HangMuc("Lối thoát hiểm thông thoáng",true,"Không để xe, đồ đạc trên lối thoát"),
                    new PcccService.HangMuc("Bình chữa cháy còn hạn",false,"Có thiết bị đến hạn, cần kiểm định lại"))),owners[b%2]);
            fireSafety.luuLich(building,new PcccService.LichKiemTra(6,ref.plusDays(b-2)),owners[b%2]);
        }
        verify();
        jdbc.update("INSERT INTO NHAT_KY_THAO_TAC(nguoi_dung_id,hanh_dong,doi_tuong,gia_tri_sau) VALUES (?,'DEMO_DATASET_READY',?,?)",admin.id(),MARKER,ref.toString());
    }

    private List<ServicePrice> services(Long building,int b,LocalDate ref) {
        String[] names={"Điện sinh hoạt","Nước sạch","Internet cáp quang","Vệ sinh khu vực chung","Gửi xe máy","Gửi xe đạp","Thu gom rác","Giặt sấy","Thẻ ra vào bổ sung","Vệ sinh phòng theo yêu cầu"};
        String[] ways={"THEO_CHI_SO","THEO_CHI_SO","CO_DINH","THEO_NGUOI","THEO_SO_LUONG","THEO_SO_LUONG","CO_DINH","THEO_SO_LUONG","THEO_SO_LUONG","THEO_SO_LUONG"};
        String[] units={"kWh","m³","phòng","người","xe","xe","phòng","kg","thẻ","lần"};
        long[] prices={3800,25000,0,50000,120000,30000,30000,20000,50000,150000};
        List<ServicePrice> result=new ArrayList<>();
        for(int s=0;s<names.length;s++) {
            boolean tier=b==5 && s==0;
            Long id=id("INSERT INTO DICH_VU(toa_nha_id,ten,cach_tinh,che_do_gia,don_vi,la_dien) VALUES (?,?,?,?,?,?) RETURNING id",building,names[s],ways[s],tier?"BAC_THANG":"CO_DINH",units[s],s==0);
            if(tier) {
                for(int t=0;t<3;t++) jdbc.update("INSERT INTO BANG_GIA_BAC_THANG(dich_vu_id,bac,tu_so_luong,den_so_luong,ty_le,don_gia,ngay_hieu_luc) VALUES (?,?,?,?,?,?,?)",
                        id,t+1,t*50,t==2?null:(t+1)*50,100+t*10,1800+t*400,ref.minusYears(1));
            } else jdbc.update("INSERT INTO BANG_GIA(dich_vu_id,don_gia,ngay_hieu_luc) VALUES (?,?,?)",id,prices[s],ref.minusYears(1));
            result.add(new ServicePrice(id,money(tier?0:prices[s]),s<4,s<2));
        }
        return result;
    }

    private void seedBilling(Long building,int b,List<RoomContract> rooms,List<ServicePrice> services,LocalDate ref,NguoiDung manager) {
        YearMonth oldest=YearMonth.from(ref).minusMonths(4);
        Long period=periods.moKyThanhToan(building,new YeuCauMoKyThanhToan(oldest.getYear(),oldest.getMonthValue()),manager).id();
        for(int month=0;month<5;month++) {
            for(RoomContract room:rooms) if(room.contract()!=null && room.start().isBefore(ref)) {
                for(int s=0;s<2;s++) meters.ghiChiSo(building,period,new YeuCauGhiChiSo(room.room(),services.get(s).id(),
                        money((month+1L)*(s==0?95+room.room()%50:4+room.room()%5)),false,null,null,true),manager);
                if(month==4) continue; // Keep the current period open for the live meter-entry demo.
                DuLieuTinhHoaDon data=invoices.layDuLieuTinhHoaDonDeTaoHoaDon(building,period,room.contract());
                if(!data.coTheTinh()) throw new IllegalStateException("Missing billing inputs: "+data.lyDoKhongTheTinh());
                var calculated=calculator.tinh(building,data.boiCanh());
                if(!calculated.thanhCong()) throw new IllegalStateException("Invoice calculation failed: "+calculated.lyDoBoQua());
                LocalDate end=oldest.plusMonths(month).atDay(25);
                var ky=new KyThanhToan(period,building,end.getYear(),end.getMonthValue(),end.minusMonths(1).plusDays(1),end,TrangThaiKy.DANG_MO);
                Long invoice=invoices.taoHoaDon(new TinhHoaDonRepository.HoaDonMoi("DEMO-P"+(b+1)+"-"+room.room()+"-"+oldest.plusMonths(month),period,room.contract(),end,
                        invoices.tinhHanThanhToan(room.contract(),ky,7),calculated.tongTien().giaTri(),calculated.soNguoiOTrongKy(),calculated.soHoQuyDoi(),null),calculated);
                publication.phatHanh(building,period,invoice,manager);
                int pattern=(int)(room.room()%4);
                BigDecimal total=calculated.tongTien().giaTri();
                if(pattern!=0) {
                    BigDecimal paid=pattern==1 || pattern==3?total.divide(money(2),2,RoundingMode.HALF_UP):total;
                    payments.ghiNhan(building,period,invoice,new YeuCauThanhToan(paid,HinhThucThanhToan.CHUYEN_KHOAN,end.plusDays(2),false),manager);
                    if(pattern==3) payments.ghiNhan(building,period,invoice,new YeuCauThanhToan(total.subtract(paid),HinhThucThanhToan.TIEN_MAT,end.plusDays(3),false),manager);
                }
            }
            if(month<4) {
                var result=periods.chotKyThanhToan(building,period,manager);
                // Closing a period snapshots residents and creates exactly one next open period.
                period=jdbc.queryForObject("SELECT id FROM KY_THANH_TOAN WHERE toa_nha_id=? AND trang_thai='DANG_MO'",Long.class,building);
            }
        }
    }

    private Long handover(Long contract,Long room,String type,LocalDate day,NguoiDung manager,boolean damaged) {
        List<TaiSanPhongDto> inventory=assets.layDanhSachTaiSan(room,manager);
        List<YeuCauChiTietBienBan> lines=new ArrayList<>();
        for(int i=0;i<inventory.size();i++) {
            var a=inventory.get(i); boolean defect=damaged && i==1;
            lines.add(new YeuCauChiTietBienBan(a.id(),a.tenTaiSan(),a.soLuong(),"Hoạt động tốt",
                    type.equals("TRA_PHONG")?(defect?"Bản lề tủ bị cong, cần thay":"Hoạt động tốt, hao mòn thông thường"):null,
                    money(defect?200000:0),defect?"Chi phí thay bản lề đã được hai bên đối chiếu":null,null));
        }
        return assets.lapBienBan(contract,new YeuCauLapBienBan(type,day,"Biên bản mô phỏng phục vụ trình diễn",lines),manager);
    }

    private Long tenant(int n,LocalDate ref) {
        return id("INSERT INTO NGUOI_THUE(ho_ten,ngay_sinh,so_dien_thoai,so_giay_to,que_quan,dia_chi_thuong_tru,dia_chi_lien_he,email) VALUES (?,?,?,?,?,?,?,?) RETURNING id",
                personName(n),ref.minusYears(22+n%18).withDayOfMonth(10),phone(n),"DEMO-PERSON-"+n,
                new String[]{"Hà Nam","Nam Định","Thanh Hóa","Nghệ An","Đà Nẵng","Đồng Nai"}[n%6],
                "Địa chỉ thường trú giả lập số "+n,"Địa chỉ liên hệ giả lập số "+n,"cu-dan"+n+"@example.invalid");
    }
    private NguoiDung account(String name,String phone,VaiTro role,Long tenant,String hash) {
        Long id=id("INSERT INTO NGUOI_DUNG(ho_ten,so_dien_thoai,mat_khau_hash,vai_tro,trang_thai,nguoi_thue_id) VALUES (?,?,?,?,'HOAT_DONG',?) RETURNING id",name,phone,hash,role.name(),tenant);
        return new NguoiDung(id,name,phone,hash,role,TrangThaiNguoiDung.HOAT_DONG,0,tenant);
    }
    private void grant(NguoiDung user,Long building) { jdbc.update("INSERT INTO PHAN_QUYEN_TOA(nguoi_dung_id,toa_nha_id) VALUES (?,?)",user.id(),building); }
    private Long id(String sql,Object... args) { return jdbc.queryForObject(sql,Long.class,args); }
    private static BigDecimal money(long value) { return BigDecimal.valueOf(value).setScale(2); }
    private static String phone(int n) { return "09991%05d".formatted(n); }
    private static String personName(int n) {
        String[] family={"Nguyễn","Trần","Lê","Phạm","Hoàng","Vũ","Đặng","Bùi","Đỗ","Ngô","Dương","Đinh"};
        String[] given={"Minh Anh","Quang Huy","Thu Trang","Đức Minh","Ngọc Hà","Tuấn Anh","Khánh Linh","Gia Bảo","Thanh Hương","Hải Nam","Thảo Nguyên","Nhật Quang","Bảo Ngọc","Trung Kiên","Mai Phương","Hoài An","Đình Phúc"};
        return family[n%family.length]+" "+given[(n/family.length+n)%given.length];
    }
    private void requireFreshDatabase() {
        for(String table:List.of("PHONG","DICH_VU","NGUOI_THUE","HOP_DONG","HOA_DON","THANH_TOAN","GIAO_DICH_COC","YEU_CAU_SUA_CHUA","LICH_HEN_XEM_PHONG","PCCC_THIET_BI","PCCC_KIEM_TRA","MAU_HOP_DONG","NHAT_KY_THAO_TAC"))
            if(jdbc.queryForObject("SELECT count(*) FROM "+table,Long.class)!=0)
                throw new IllegalStateException("Refusing to seed a non-empty database: "+table);
        if(jdbc.queryForObject("SELECT count(*) FROM TOA_NHA WHERE id NOT IN (1,2) OR ma_toa NOT IN ('TN-A','TN-B')",Long.class)!=0
                || jdbc.queryForObject("SELECT count(*) FROM NGUOI_DUNG WHERE id>5",Long.class)!=0)
            throw new IllegalStateException("Database is not a fresh migrated demo database.");
    }
    public void verify() {
        if(jdbc.queryForObject("SELECT count(*) FROM TOA_NHA WHERE ma_toa LIKE 'DEMO-P%'",Integer.class)!=6)
            throw new IllegalStateException("Demo building manifest mismatch.");
        if(jdbc.queryForObject("SELECT count(*) FROM HOA_DON i WHERE i.ma_hoa_don LIKE 'DEMO-P%' AND i.da_thu <> COALESCE((SELECT sum(t.so_tien) FROM THANH_TOAN t WHERE t.hoa_don_id=i.id),0)",Integer.class)!=0)
            throw new IllegalStateException("Payment ledger does not reconcile.");
    }
    private record ServicePrice(Long id,BigDecimal price,boolean applied,boolean metered) {}
    private record RoomContract(Long room,Long contract,Long tenant,BigDecimal rent,LocalDate start) {}
    private static String layAnhDaiDienChoPhong(int b, int r) {
        int kieu = r % 4;
        return switch (b) {
            case 0 -> switch (kieu) {
                case 1 -> "/rooms/annhien_gac_xep.webp";
                case 2 -> "/rooms/annhien_studio_noi_that.webp";
                case 3 -> "/rooms/annhien_co_ban.webp";
                default -> "/rooms/annhien_studio_ban_cong.webp";
            };
            case 1 -> switch (kieu) {
                case 1 -> "/rooms/nhaxanh_phong_gac.webp";
                case 2 -> "/rooms/nhaxanh_studio_gon.webp";
                case 3 -> "/rooms/nhaxanh_co_ban.webp";
                default -> "/rooms/annhien_studio_ban_cong.webp";
            };
            case 2 -> switch (kieu) {
                case 1 -> "/rooms/moclan_gac_xep.webp";
                case 2 -> "/rooms/moclan_studio_go.webp";
                case 3 -> "/rooms/moclan_co_ban.webp";
                default -> "/rooms/moclan_ban_cong.webp";
            };
            case 3 -> switch (kieu) {
                case 1 -> "/rooms/nhaxanh_phong_gac.webp";
                case 2 -> (r == 10) ? "/rooms/phonho_studio_gon.webp" : "/rooms/phonho_studio_bep.webp";
                case 3 -> "/rooms/phonho_co_ban.webp";
                default -> "/rooms/moclan_ban_cong.webp";
            };
            case 4 -> switch (kieu) {
                case 1 -> "/rooms/annhien_gac_xep.webp";
                case 2 -> (r == 10) ? "/rooms/binhminh_cua_so_lon.webp" : "/rooms/binhminh_studio_thoang.webp";
                case 3 -> "/rooms/binhminh_co_ban.webp";
                default -> "/rooms/binhminh_ban_cong.webp";
            };
            case 5 -> switch (kieu) {
                case 1 -> "/rooms/annhien_gac_xep.webp";
                case 2 -> (r == 10) ? "/rooms/vuonnang_cay_xanh.webp" : "/rooms/vuonnang_studio_nang.webp";
                case 3 -> "/rooms/annhien_co_ban.webp";
                default -> "/rooms/vuonnang_ban_cong.webp";
            };
            default -> "/rooms/annhien_co_ban.webp";
        };
    }
}
