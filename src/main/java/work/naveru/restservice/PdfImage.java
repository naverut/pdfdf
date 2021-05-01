package work.naveru.restservice;

import java.util.ArrayList;
import java.util.List;

public class PdfImage {
    private final List<String> image64s = new ArrayList<>();
    public void add(String image64) {
        this.image64s.add(image64);
    }
    public List<String> getImage64s() {
        return this.image64s;
    }

}
