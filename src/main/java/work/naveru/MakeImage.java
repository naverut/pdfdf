package work.naveru;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.*;
import java.util.ArrayList;
import java.util.List;

public class MakeImage {
    public static final int DPI = 100;
    public static final String TYPE = "jpg";
// ローカルテスト用。mainが複数あるとSpringが起動しないことがあるためコメント化
//    public static void main(String[] args) throws Exception {
//        byte[] bytes = Files.readAllBytes(Paths.get("C:\\work\\hoge.pdf"));
//        getPdfImage(bytes);
//    }
    /**
     * PDFバイト配列を画像イメージリストに変換
     * @param pdf PDFのバイト配列
     * @return 画像のリスト
     * @throws Exception 例外
     */
    public static List<byte[]> getPdfImage(byte[] pdf) throws Exception {
        return getPdfImage(pdf, DPI, TYPE);
    }
    /**
     * PDFバイト配列を画像イメージリストに変換
     * @param pdf PDFのバイト配列
     * @param dpi DPI値
     * @return 画像のリスト
     * @throws Exception 例外
     */
    public static List<byte[]> getPdfImage(byte[] pdf, int dpi) throws Exception {
        return getPdfImage(pdf, dpi, TYPE);
    }
    /**
     * PDFバイト配列を画像イメージリストに変換
     * @param pdf PDFのバイト配列
     * @param type 画像タイプ
     * @return 画像のリスト
     * @throws Exception 例外
     */
    public static List<byte[]> getPdfImage(byte[] pdf, String type) throws Exception {
        return getPdfImage(pdf, DPI, type);
    }
    /**
     * PDFバイト配列を画像イメージリストに変換
     * @param pdf PDFのバイト配列
     * @param dpi DPI値
     * @param type 画像タイプ
     * @return 画像のリスト
     * @throws Exception 例外
     */
    public static List<byte[]> getPdfImage(byte[] pdf, int dpi, String type) throws Exception {
        InputStream in = new ByteArrayInputStream(pdf);
        PDDocument doc = PDDocument.load(in);
        PDFRenderer pdfRenderer = new PDFRenderer(doc);

        List<byte[]> imageList = new ArrayList<>();
        for (int i = 0; i < doc.getNumberOfPages(); i++) {
            BufferedImage image = pdfRenderer.renderImageWithDPI(i, dpi, ImageType.RGB);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, type, baos);
            imageList.add(baos.toByteArray());
        }
        return imageList;
    }
}
