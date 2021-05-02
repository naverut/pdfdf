package work.naveru.restservice;

import org.springframework.util.Base64Utils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import work.naveru.MakeImage;

import java.util.ArrayList;
import java.util.List;

/**
 * PDFファイルを画像で返却するAPI
 */
@RestController
public class PdfImageController {
    /**
     * 画像イメージ化するPDF情報を受け取る
     */
    @lombok.Getter
    @lombok.Setter
    public static class PdfImageBody {
        /** BASE64化したPDF */
        private String pdf64;
        /** 画像化する際のDPI */
        private int dpi;
        /** 画像化するファイルタイプ */
        private String type;
    }

    /**
     * 画像イメージをBASE64のリストで持つ
     */
    public static class Image64s {
        /** リスト */
        private final List<String> image64s = new ArrayList<>();

        /**
         * 画像イメージ追加
         * @param image64 BASE64化した画像ファイル
         */
        public void add(String image64) {
            this.image64s.add(image64);
        }

        /**
         * 画像イメージ取得
         * @return List<String> BASE64化した画像ファイルのリスト
         */
        public List<String> getImage64s() {
            return this.image64s;
        }

    }

    /**
     * PDFを画像化するAPI本体
     * @param body 画像イメージ化するPDF情報
     * @return Image64s 画像イメージをBASE64にしたリスト
     * @throws Exception 例外
     */
    @PostMapping("/pdf/image")
    public Image64s getImage(@RequestBody PdfImageBody body) throws Exception {
        // BASE64をdecode
        byte[] pdf = Base64Utils.decodeFromString(body.getPdf64());

        // DPI値のデフォルト設定
        int dpi = MakeImage.DPI;
        if (body.getDpi() > 1) {
            dpi = body.getDpi();
        }
        // 画像ファイルタイプのデフォルト設定
        String type = MakeImage.TYPE;
        if (body.getType() != null) {
            type = body.getType();
        }

        // 画像イメージ取得
        List<byte[]> images = MakeImage.getPdfImage(pdf, dpi, type);

        // 画像をBASE64encodeしてリスト化
        Image64s result = new Image64s();
        for (int i = 0; i < images.size(); i++) {
            String image64 = Base64Utils.encodeToString(images.get(i));
            result.add(image64);
        }

        return result;
    }
}
