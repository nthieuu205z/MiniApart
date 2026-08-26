package com.prj1.ccm.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class JwtTokenService {
    private static final Base64.Encoder BASE64_URL_ENCODER = Base64.getUrlEncoder().withoutPadding();
    private static final Base64.Decoder BASE64_URL_DECODER = Base64.getUrlDecoder();

    private final ObjectMapper objectMapper;
    private final Clock clock;
    private final byte[] signingKey;
    private final long tokenTtlSeconds;

    public JwtTokenService(
            ObjectMapper objectMapper,
            @Value("${app.auth.jwt-secret}") String jwtSecret,
            @Value("${app.auth.token-ttl-seconds:1800}") long tokenTtlSeconds
    ) {
        this.objectMapper = objectMapper;
        this.clock = Clock.systemUTC();
        this.signingKey = jwtSecret.getBytes(StandardCharsets.UTF_8);
        this.tokenTtlSeconds = tokenTtlSeconds;
    }

    public String createToken(ThongTinNguoiDung nguoiDung, int phienBanToken) {
        Instant now = clock.instant();
        Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", String.valueOf(nguoiDung.id()));
        payload.put("ver", phienBanToken);
        payload.put("iat", now.getEpochSecond());
        payload.put("exp", now.plusSeconds(tokenTtlSeconds).getEpochSecond());

        try {
            String encodedHeader = encode(objectMapper.writeValueAsBytes(header));
            String encodedPayload = encode(objectMapper.writeValueAsBytes(payload));
            String signature = encode(sign((encodedHeader + "." + encodedPayload).getBytes(StandardCharsets.UTF_8)));
            return encodedHeader + "." + encodedPayload + "." + signature;
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot create JWT token", exception);
        }
    }

    public Optional<TokenClaims> parse(String token) {
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return Optional.empty();
            }

            byte[] expectedSignature = sign((parts[0] + "." + parts[1]).getBytes(StandardCharsets.UTF_8));
            byte[] actualSignature = BASE64_URL_DECODER.decode(parts[2]);
            if (!MessageDigest.isEqual(expectedSignature, actualSignature)) {
                return Optional.empty();
            }

            JsonNode header = objectMapper.readTree(BASE64_URL_DECODER.decode(parts[0]));
            if (!"HS256".equals(header.path("alg").asText())) {
                return Optional.empty();
            }

            JsonNode payload = objectMapper.readTree(BASE64_URL_DECODER.decode(parts[1]));
            long exp = payload.path("exp").asLong(0);
            if (clock.instant().getEpochSecond() >= exp) {
                return Optional.empty();
            }

            Long nguoiDungId = Long.valueOf(payload.path("sub").asText());
            int phienBanToken = payload.path("ver").asInt(Integer.MIN_VALUE);
            if (phienBanToken < 0) {
                return Optional.empty();
            }

            return Optional.of(new TokenClaims(nguoiDungId, phienBanToken));
        } catch (Exception exception) {
            return Optional.empty();
        }
    }

    public long tokenTtlSeconds() {
        return tokenTtlSeconds;
    }

    private String encode(byte[] value) {
        return BASE64_URL_ENCODER.encodeToString(value);
    }

    private byte[] sign(byte[] content) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(signingKey, "HmacSHA256"));
            return mac.doFinal(content);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Cannot sign JWT token", exception);
        }
    }

    public record TokenClaims(Long nguoiDungId, int phienBanToken) {
    }
}
