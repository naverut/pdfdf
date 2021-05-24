package work.naveru.restservice;

import org.springframework.util.Base64Utils;
import org.springframework.web.bind.annotation.*;
import work.naveru.service.AsyncWatcher;
import work.naveru.service.MakeImageAsync;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

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
     * PDFを画像化を開始する
     * @param body 画像イメージ化するPDF情報
     * @return スレッドId
     * @throws Exception 例外
     */
    @PostMapping("/pdf/image/start")
    public long startMakeImage(@RequestBody PdfImageBody body) throws Exception {
        MakeImageAsync mk = new MakeImageAsync(body);

        long tid = mk.getId();
        mk.start();

        AsyncWatcher.map.put(tid, mk);

        return tid;
    }

    /**
     * 処理状態
     */
    @lombok.Getter
    public static class MakeStatus {
        /** 処理件数 */
        private final int cnt;
        /** 全ページ数 */
        private final int max;
        /** 終了状態 */
        private final boolean fin;

        /**
         * コンストラクタ
         * @param mk
         */
        public MakeStatus(MakeImageAsync mk) {
            this.cnt = mk.getCnt();
            this.max = mk.getMax();
            this.fin = mk.isFin();
        }
    }

    /**
     * 処理状態を取得する
     * @param id スレッドID
     * @return MakeStatus 処理状態
     */
    @GetMapping("/pdf/image/status")
    public MakeStatus checkStatus(@RequestParam(name="tid", required=true) Long id) {
        MakeImageAsync mk = AsyncWatcher.map.get(id);

        if (mk == null) {
            return null;
        }

        return new MakeStatus(mk);
    }

    /**
     * 処理状態
     */
    @lombok.Getter
    public static class WatchStatus {
        /** メモリ */
        private final long memory;
        /** 全メモリ */
        private final long max;
        /** 全処理 */
        private final List<WatchTarget> targets;

        /**
         * コンストラクタ
         * @param targets
         */
        public WatchStatus(List<WatchTarget> targets) {
            this.memory = Runtime.getRuntime().totalMemory() - Runtime.getRuntime().freeMemory();
            this.max = Runtime.getRuntime().maxMemory();
            this.targets = targets;
        }
    }
    /**
     * 処理状態
     */
    @lombok.Getter
    public static class WatchTarget {
        /** ID */
        private final Long id;
        /** ステータス */
        private final MakeStatus status;

        /**
         * コンストラクタ
         * @param id ID
         * @param status ステータス
         */
        public WatchTarget(Long id, MakeStatus status) {
            this.id = id;
            this.status = status;
        }
    }

    /**
     * 全処理を取得する
     * @return Map 全処理
     */
    @GetMapping("/pdf/image/watch")
    public WatchStatus getWatchStatus() {
        List<WatchTarget> targetList = new ArrayList<>();

        for (Map.Entry<Long, MakeImageAsync> entry : AsyncWatcher.map.entrySet()) {
            if (entry.getValue() == null) {
                continue;
            }
            targetList.add(new WatchTarget(entry.getKey(), new MakeStatus(entry.getValue())));
        }

        return new WatchStatus(targetList);
    }

    /**
     * 処理が完了していればImage化データを返却する
     * @param id スレッドID
     * @return PDFイメージ
     */
    @PostMapping("/pdf/image/data")
    public Image64s getImage64s(@RequestParam(name="tid", required=true) Long id) {
        MakeImageAsync mk = AsyncWatcher.map.get(id);

        // 指定IDに対応するものがなければnull返却
        if (mk == null) {
            return null;
        }

        Image64s result = new Image64s();

        // 終わってなければ空で返す
        if (!mk.isFin()) {
            return result;
        }

        List<byte[]> images = mk.getImageList();
        for (int i = 0; i < images.size(); i++) {
            String image64 = Base64Utils.encodeToString(images.get(i));
            result.add(image64);
        }
        AsyncWatcher.map.remove(id);
        mk = null;

        return result;
    }
}
