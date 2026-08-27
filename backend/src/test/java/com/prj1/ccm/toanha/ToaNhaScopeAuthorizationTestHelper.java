package com.prj1.ccm.toanha;

import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.function.LongFunction;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

final class ToaNhaScopeAuthorizationTestHelper {
    private ToaNhaScopeAuthorizationTestHelper() {
    }

    static void assertChiTietEndpointScope(
            MockMvc mockMvc,
            String token,
            Long toaNhaDuocGanId,
            Long toaNhaNgoaiPhamViId,
            Long toaNhaKhongTonTaiId,
            LongFunction<MockHttpServletRequestBuilder> requestBuilderFactory
    ) throws Exception {
        mockMvc.perform(requestBuilderFactory.apply(toaNhaDuocGanId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(requestBuilderFactory.apply(toaNhaNgoaiPhamViId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());

        mockMvc.perform(requestBuilderFactory.apply(toaNhaKhongTonTaiId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }
}
