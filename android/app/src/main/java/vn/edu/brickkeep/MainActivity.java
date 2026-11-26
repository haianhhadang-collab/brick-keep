package vn.edu.brickkeep;

import android.app.Activity;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.InputStream;
import java.util.Locale;

/**
 * Vỏ Android cho Brick Keep: WebView chạy game (assets/www) và cầu nối đọc to bằng TextToSpeech.
 * Game được phục vụ qua https://appassets.androidplatform.net/ (tên miền Android dành riêng cho tài nguyên trong app)
 * để trang có "secure context", nhờ đó WebRTC (chơi 2 máy) và localStorage chạy ổn định.
 */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";

    private WebView web;
    private TextToSpeech tts;
    private boolean ttsReady = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Window w = getWindow();
        w.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 28) {
            w.getAttributes().layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        web = new WebView(this);
        web.setBackgroundColor(Color.parseColor("#0E1A24"));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setTextZoom(100);
        s.setAllowFileAccess(false);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (!HOST.equals(u.getHost())) return null;
                String path = u.getPath();
                if (path == null || path.equals("/")) path = "/www/index.html";
                if (path.contains("..")) return null;
                try {
                    InputStream in = getAssets().open(path.substring(1));
                    return new WebResourceResponse(mime(path), "utf-8", in);
                } catch (Exception e) {
                    return null;
                }
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        web.addJavascriptInterface(new TtsBridge(), "AndroidTTS");
        setContentView(web);
        hideBars();
        web.loadUrl("https://" + HOST + "/www/index.html");

        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                tts.setLanguage(Locale.US);
                ttsReady = true;
            }
        });
    }

    private static String mime(String p) {
        if (p.endsWith(".html")) return "text/html";
        if (p.endsWith(".js")) return "text/javascript";
        if (p.endsWith(".css")) return "text/css";
        if (p.endsWith(".json")) return "application/json";
        if (p.endsWith(".png")) return "image/png";
        if (p.endsWith(".svg")) return "image/svg+xml";
        if (p.endsWith(".woff2")) return "font/woff2";
        return "application/octet-stream";
    }

    @SuppressWarnings("deprecation")
    private void hideBars() {
        web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideBars();
    }

    // ---------- Đọc to ----------
    public class TtsBridge {
        @JavascriptInterface
        public void speak(String text, String language, float rate) {
            if (!ttsReady || text == null) return;
            runOnUiThread(() -> {
                tts.setSpeechRate(rate > 0 ? rate : 0.8f);
                tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "bk");
            });
        }

        @JavascriptInterface
        public boolean ready() {
            return ttsReady;
        }
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        web.evaluateJavascript("window.__back ? window.__back() : false", value -> {
            if (!"true".equals(value)) MainActivity.super.onBackPressed();
        });
    }

    @Override
    protected void onPause() {
        super.onPause();
        // Chơi một mình: tự tạm dừng khi rời app
        web.evaluateJavascript("window.__pause && window.__pause()", null);
    }

    @Override
    protected void onDestroy() {
        if (tts != null) tts.shutdown();
        web.destroy();
        super.onDestroy();
    }
}
