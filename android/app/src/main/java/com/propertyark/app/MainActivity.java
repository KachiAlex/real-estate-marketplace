package com.propertyark.app;

import com.getcapacitor.BridgeActivity;
import androidx.core.splashscreen.SplashScreen;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.view.ViewGroup;
import android.view.Gravity;
import android.graphics.Color;

public class MainActivity extends BridgeActivity {
    private static final long SPLASH_DURATION_MS = 3000L;
    private volatile boolean keepSplashOnScreen = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> keepSplashOnScreen);

        WebView.setWebContentsDebuggingEnabled(true);

        super.onCreate(savedInstanceState);

        // Register native login bridge for APK login bypassing WebView CORS
        WebView webView = this.getBridge().getWebView();
        webView.addJavascriptInterface(new NativeLoginBridge(), "NativeLoginBridge");

        // Add a simple indeterminate progress bar below the splash logo
        FrameLayout rootLayout = (FrameLayout) findViewById(android.R.id.content);
        if (rootLayout != null) {
            ProgressBar progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
            progressBar.setIndeterminate(true);
            progressBar.getIndeterminateDrawable().setColorFilter(
                Color.parseColor("#F59E0B"), android.graphics.PorterDuff.Mode.SRC_IN
            );
            FrameLayout.LayoutParams params = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                8
            );
            params.gravity = Gravity.CENTER_HORIZONTAL | Gravity.BOTTOM;
            params.bottomMargin = 180;
            progressBar.setLayoutParams(params);
            rootLayout.addView(progressBar);

            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                keepSplashOnScreen = false;
                rootLayout.removeView(progressBar);
            }, SPLASH_DURATION_MS);
        } else {
            new Handler(Looper.getMainLooper()).postDelayed(() -> keepSplashOnScreen = false, SPLASH_DURATION_MS);
        }
    }
}
