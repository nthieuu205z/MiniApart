package com.prj1.ccm.billing;

import com.google.zxing.*;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import org.junit.jupiter.api.Test;
import javax.imageio.ImageIO;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import static org.assertj.core.api.Assertions.assertThat;

/** Hash was obtained by decoding the user's original image, not inferred from bank text. */
class PersonalDemoQrAssetTest {
    @Test void publishedImageRetainsExactlyTheOriginalQrPayload() throws Exception {
        var img=ImageIO.read(Path.of("../frontend/public/payments/viettel-money-demo-qr.png").toFile());
        String payload=new MultiFormatReader().decode(new BinaryBitmap(new HybridBinarizer(new BufferedImageLuminanceSource(img))),
                Map.of(DecodeHintType.TRY_HARDER,true)).getText();
        String hash=HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(payload.getBytes(StandardCharsets.UTF_8)));
        assertThat(hash).isEqualTo("2f966dd594bdff594a71c332ec5034c45feaad369e037c1e86fea8ce9ce7516d");
    }
}
