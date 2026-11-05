package com.prj1.ccm.billing;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.env.MockEnvironment;
import tools.jackson.databind.ObjectMapper;
import java.time.Clock;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

class PresentationDemoSafetyTest {
    PresentationDemoSeeder fixture(JdbcTemplate jdbc, MockEnvironment env, String expected, String password) {
        return new PresentationDemoSeeder(jdbc,env,null,null,null,null,null,null,null,null,null,null,null,null,null,null,
                Clock.systemUTC(),new ObjectMapper(),expected,"",password);
    }
    @Test void productionProfileIsRejectedEvenForDemoNamedDatabase() {
        var jdbc=mock(JdbcTemplate.class); when(jdbc.queryForObject("SELECT current_database()",String.class)).thenReturn("miniapart_demo_private");
        var env=new MockEnvironment(); env.setActiveProfiles("presentation-demo","production");
        assertThatThrownBy(()->fixture(jdbc,env,"miniapart_demo_private","LongDemoPassword").run()).hasMessageContaining("production profiles");
        verify(jdbc,never()).update(anyString(),any(Object[].class));
    }
    @Test void applicationDatabaseAndWrongExplicitConfirmationAreRejected() {
        var jdbc=mock(JdbcTemplate.class); var env=new MockEnvironment();
        when(jdbc.queryForObject("SELECT current_database()",String.class)).thenReturn("miniapart");
        assertThatThrownBy(()->fixture(jdbc,env,"miniapart","LongDemoPassword").run()).hasMessageContaining("explicitly confirmed");
        when(jdbc.queryForObject("SELECT current_database()",String.class)).thenReturn("miniapart_demo_one");
        assertThatThrownBy(()->fixture(jdbc,env,"miniapart_demo_other","LongDemoPassword").run()).hasMessageContaining("explicitly confirmed");
    }
    @Test void legacySeederCannotRunAlongsidePresentationSeed() {
        var jdbc=mock(JdbcTemplate.class); when(jdbc.queryForObject("SELECT current_database()",String.class)).thenReturn("miniapart_demo_private");
        var env=new MockEnvironment().withProperty("app.seed-demo","true");
        assertThatThrownBy(()->fixture(jdbc,env,"miniapart_demo_private","LongDemoPassword").run()).hasMessageContaining("older app.seed-demo");
    }
    @Test void noDefaultPasswordIsAccepted() {
        var jdbc=mock(JdbcTemplate.class); when(jdbc.queryForObject("SELECT current_database()",String.class)).thenReturn("miniapart_demo_private");
        assertThatThrownBy(()->fixture(jdbc,new MockEnvironment(),"miniapart_demo_private","").run()).hasMessageContaining("password");
    }
    @Test void unknownExistingBusinessDataIsNeverAdopted() {
        var jdbc=mock(JdbcTemplate.class); when(jdbc.queryForObject("SELECT current_database()",String.class)).thenReturn("miniapart_demo_private");
        when(jdbc.queryForObject("SELECT count(*) FROM PHONG",Long.class)).thenReturn(1L);
        assertThatThrownBy(()->fixture(jdbc,new MockEnvironment(),"miniapart_demo_private","LongDemoPassword").run()).hasMessageContaining("non-empty database: PHONG");
    }
    @Test void runnerRequiresBothExplicitProfileAndFlag() {
        var runner=new org.springframework.boot.test.context.runner.ApplicationContextRunner()
                .withUserConfiguration(PresentationDemoSeeder.class);
        runner.withPropertyValues("app.presentation-demo.enabled=true").run(c->assertThat(c).doesNotHaveBean(PresentationDemoSeeder.class));
        runner.withPropertyValues("spring.profiles.active=presentation-demo","app.presentation-demo.enabled=false")
                .run(c->assertThat(c).doesNotHaveBean(PresentationDemoSeeder.class));
        runner.withPropertyValues("spring.profiles.active=presentation-demo")
                .run(c->assertThat(c).doesNotHaveBean(PresentationDemoSeeder.class));
    }
}
