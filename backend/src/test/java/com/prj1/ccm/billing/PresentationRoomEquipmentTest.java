package com.prj1.ccm.billing;

import org.junit.jupiter.api.Test;
import java.util.ArrayList;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

class PresentationRoomEquipmentTest {
    @Test void datasetHasBothBasicAndFullyEquippedRooms() {
        List<String> amenities=new ArrayList<>();
        int assets=0;
        for(int b=0;b<6;b++) for(int r=1;r<=12;r++) {
            amenities.addAll(PresentationRoomEquipment.amenities(b,r));
            assets+=PresentationRoomEquipment.inventory(b,r).size();
        }
        assertThat(amenities.stream().filter("Tủ lạnh"::equals).count()).isEqualTo(39);
        assertThat(amenities.stream().filter("Giường nệm"::equals).count()).isEqualTo(45);
        assertThat(amenities.stream().filter("Máy giặt"::equals).count()).isEqualTo(20);
        assertThat(amenities.stream().filter("Bếp riêng"::equals).count()).isEqualTo(39);
        assertThat(assets).isEqualTo(359);
        assertThat(PresentationRoomEquipment.inventory(0,3)).hasSize(3);
        assertThat(PresentationRoomEquipment.inventory(0,4)).hasSize(7);
    }

    @Test void VacantRoomsAlsoOfferFurnishedAndUnfurnishedChoices() {
        assertThat(PresentationRoomEquipment.amenities(0,11)).contains("Tủ lạnh","Giường nệm","Máy giặt","Bếp riêng");
        assertThat(PresentationRoomEquipment.inventory(1,11)).hasSize(3);
        assertThat(PresentationRoomEquipment.amenities(4,11)).contains("Tủ lạnh","Giường nệm","Bếp riêng").doesNotContain("Máy giặt");
    }
}
