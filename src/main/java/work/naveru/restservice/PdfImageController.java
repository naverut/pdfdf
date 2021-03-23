package work.naveru.restservice;

import org.springframework.util.Base64Utils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import work.naveru.MakeImage;

import java.util.List;

@RestController
public class PdfImageController {
    @PostMapping("/pdf/image")
    public PdfImage getImage(@RequestParam(value = "pdf64") String pdf64) throws Exception {
        byte[] pdf = Base64Utils.decodeFromString(pdf64);
        List<byte[]> images = MakeImage.getPdfImage(pdf);

        PdfImage result = new PdfImage();
        for (int i = 0; i < images.size(); i++) {
            String image64 = Base64Utils.encodeToString(images.get(i));
            result.add(image64);
        }
        return result;
    }
}
