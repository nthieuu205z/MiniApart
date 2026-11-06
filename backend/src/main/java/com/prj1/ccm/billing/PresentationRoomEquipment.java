package com.prj1.ccm.billing;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/** Deterministic variety by room type, shared by newly created presentation datasets. */
final class PresentationRoomEquipment {
    private PresentationRoomEquipment() { }
    record Item(String name, String category, BigDecimal value) { }
    static List<String> amenities(int building, int room) {
        List<String> values=new ArrayList<>(List.of("Điều hòa","Bình nóng lạnh","Tủ quần áo","Chỗ để xe"));
        if(room%4==0) values.add("Ban công");
        if(hasFridge(building,room)) values.add("Tủ lạnh");
        if(hasBed(building,room)) values.add("Giường nệm");
        if(hasWasher(building,room)) values.add("Máy giặt");
        if(hasKitchen(building,room)) values.add("Bếp riêng");
        return List.copyOf(values);
    }
    static List<Item> inventory(int building, int room) {
        List<Item> values=new ArrayList<>(List.of(
                item("Điều hòa inverter 9000 BTU","DIEN_LANH",6500000),
                item("Tủ quần áo hai cánh","NOI_THAT",1800000),
                item("Bình nóng lạnh 20 lít","DIEN_TU",2200000)));
        if(hasFridge(building,room)) values.add(item("Tủ lạnh hai cửa 180 lít","DIEN_LANH",3200000));
        if(hasBed(building,room)) values.add(item("Giường gỗ kèm nệm 1,6 m","NOI_THAT",2800000));
        if(hasWasher(building,room)) values.add(item("Máy giặt cửa trên 8 kg","DIEN_TU",4500000));
        if(hasKitchen(building,room)) values.add(item("Bếp điện từ đơn","DIEN_TU",900000));
        return List.copyOf(values);
    }
    private static Item item(String name,String category,long value) { return new Item(name,category,BigDecimal.valueOf(value).setScale(2)); }
    // Alternate vacant rooms (ordinal 11 / room 402) are furnished too, so vacancy filters remain useful.
    private static boolean furnishedVacancy(int building,int room) { return room==11 && building%2==0; }
    private static boolean hasFridge(int building,int room) { return room%4==0 || room%4==2 || furnishedVacancy(building,room); }
    private static boolean hasBed(int building,int room) { return (room%4!=3 && room!=5 && room!=9) || furnishedVacancy(building,room); }
    private static boolean hasWasher(int building,int room) { return room%4==0 || (furnishedVacancy(building,room) && building<4); }
    private static boolean hasKitchen(int building,int room) { return room%2==0 || furnishedVacancy(building,room); }
}
