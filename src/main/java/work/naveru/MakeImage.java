package work.naveru;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;

import javax.imageio.ImageIO;
import javax.imageio.stream.ImageOutputStream;
import java.awt.image.BufferedImage;
import java.awt.image.DataBufferByte;
import java.awt.image.WritableRaster;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;

public class MakeImage {
    private static final int DPI = 72;

    /**
     * 動作確認用
     * @param args
     * @throws Exception
     */
    public static void main(String[] args) throws Exception {
        byte[] bytes = Files.readAllBytes(Paths.get("c:/work/serverStartup.pdf"));
        List<byte[]> images = getPdfImage(bytes);
        for (int i = 0; i < images.size(); i++) {
//            ImageIO.write(image, "jpg", new File("c:/work/xxx" + i + ".jpg"));
            Files.write(Paths.get("c:/work/xxx" + i + ".jpg"), images.get(i));
        }
    }

    /**
     * PDFバイト配列を画像イメージリストに変換
     * @param pdf PDFのバイト配列
     * @return 画像のリスト
     * @throws Exception 例外
     */
    public static List<byte[]> getPdfImage(byte[] pdf) throws Exception {
        return getPdfImage(pdf, DPI, "jpg");
    }
    /**
     * PDFバイト配列を画像イメージリストに変換
     * @param pdf PDFのバイト配列
     * @param dpi DPI値
     * @return 画像のリスト
     * @throws Exception 例外
     */
    public static List<byte[]> getPdfImage(byte[] pdf, int dpi) throws Exception {
        return getPdfImage(pdf, dpi, "jpg");
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
