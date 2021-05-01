package work.naveru.restservice;

import org.springframework.util.Base64Utils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import work.naveru.MakeImage;

import java.util.List;

@RestController
public class PdfImageController {
    @lombok.Getter
    @lombok.Setter
    public static class PdfImageBody {
        private String pdf64;
        private int dpi;
        private String type;
    }

    @PostMapping("/pdf/image")
    public PdfImage getImage(@RequestBody PdfImageBody body) throws Exception {
        byte[] pdf = Base64Utils.decodeFromString(body.getPdf64());

        int dpi = 100;
        if (body.getDpi() > 1) {
            dpi = body.getDpi();
        }
        String type = MakeImage.TYPE;
        if (body.getType() != null) {
            type = body.getType();
        }
        List<byte[]> images = MakeImage.getPdfImage(pdf, dpi, type);

        PdfImage result = new PdfImage();
        for (int i = 0; i < images.size(); i++) {
            String image64 = Base64Utils.encodeToString(images.get(i));
            result.add(image64);
        }
        return result;
    }
}
