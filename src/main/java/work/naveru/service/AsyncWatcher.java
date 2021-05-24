package work.naveru.service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

public class AsyncWatcher {
    /** PDF作成実行Map */
    public static Map<Long, MakeImageAsync> map = new HashMap<>();

    private static final long HOUR_1 = 3600000;
    public static void watch() {
        Set<Long> targetSet = new HashSet<>();

        while(true) {
            for (Map.Entry<Long, MakeImageAsync> entry : AsyncWatcher.map.entrySet()) {
                // 以前チェックした時点でも存在したら削除対象
                if (targetSet.contains(entry.getKey())) {
                    MakeImageAsync mk = entry.getValue();
                    mk = null;
                    AsyncWatcher.map.put(entry.getKey(), null);
                    targetSet.remove(entry.getKey());
                }
            }
            try {
                Thread.sleep(HOUR_1);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
        }
    }
}
