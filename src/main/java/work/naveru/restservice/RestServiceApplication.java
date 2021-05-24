package work.naveru.restservice;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import work.naveru.service.AsyncWatcher;
import work.naveru.service.MakeImageAsync;

import java.util.HashMap;
import java.util.Map;

@SpringBootApplication
public class RestServiceApplication {
    /** Spring開始 */
    public static void main(String[] args) {
        SpringApplication.run(RestServiceApplication.class, args);
    }
}
