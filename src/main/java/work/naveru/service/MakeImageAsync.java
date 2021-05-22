package work.naveru.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.util.Base64Utils;
import work.naveru.restservice.PdfImageController;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;


@lombok.Getter
public class MakeImageAsync extends Thread {
    /** デフォルトDPI */
    public static final int DPI = 100;
    /** デフォルトjpg */
    public static final String TYPE = "jpg";

    /** リクエスト情報 */
    private final PdfImageController.PdfImageBody pdfImageBody;
    /**
     * コンストラクタ
     * @param pdfImageBody 陸枝エスト情報
     */
    public MakeImageAsync(PdfImageController.PdfImageBody pdfImageBody) {
        this.pdfImageBody = pdfImageBody;
    }

    /** 全ページ数 */
    private int max;
    /** 処理ページ数 */
    private int cnt;
    /** 完了状態 */
    private boolean fin = false;
    /** エラーメッセージ */
    private String errMsg;
    /** Image化したList */
    private List<byte[]> imageList = new ArrayList<>();

    /**
     * 実行
     */
    public void run() {
        try {
            this.fin = false;
            this.errMsg = "";

            // DPI値のデフォルト設定
            int dpi = this.DPI;
            if (this.pdfImageBody.getDpi() > 1) {
                dpi = this.pdfImageBody.getDpi();
            }
            // 画像ファイルタイプのデフォルト設定
            String type = this.TYPE;
            if (this.pdfImageBody.getType() != null) {
                type = this.pdfImageBody.getType();
            }

            // BASE64をdecode
            byte[] pdf = Base64Utils.decodeFromString(this.pdfImageBody.getPdf64());

            InputStream in = new ByteArrayInputStream(pdf);
            PDDocument doc = PDDocument.load(in);
            PDFRenderer pdfRenderer = new PDFRenderer(doc);

            this.max = doc.getNumberOfPages();
            for (int i = 0; i < this.max; i++) {
                this.cnt = i;
                BufferedImage image = pdfRenderer.renderImageWithDPI(i, dpi, ImageType.RGB);
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                ImageIO.write(image, type, baos);
                this.imageList.add(baos.toByteArray());
            }
        } catch(Exception e) {
            this.fin = true;
            this.errMsg = e.getMessage();
            e.printStackTrace();
        }
        this.fin = true;
    }
}
