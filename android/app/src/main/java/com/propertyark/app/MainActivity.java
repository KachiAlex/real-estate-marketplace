package com.propertyark.app;

import com.getcapacitor.BridgeActivity;
import androidx.core.splashscreen.SplashScreen;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import android.widget.FrameLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.view.ViewGroup;
import android.view.Gravity;
import android.graphics.Color;
import android.util.Log;
import android.view.animation.AlphaAnimation;

public class MainActivity extends BridgeActivity {
    private static final long SPLASH_DURATION_MS = 3000L;
    private volatile boolean keepSplashOnScreen = true;
    private boolean nativeBridgeInjected = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> keepSplashOnScreen);

        WebView.setWebContentsDebuggingEnabled(true);

        super.onCreate(savedInstanceState);

        // Add a centered loading bar and 'Loading...' text below the splash logo
        FrameLayout rootLayout = (FrameLayout) findViewById(android.R.id.content);
        if (rootLayout != null) {
            // Progress bar
            ProgressBar progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
            progressBar.setIndeterminate(true);
            progressBar.getIndeterminateDrawable().setColorFilter(
                Color.parseColor("#F59E0B"), android.graphics.PorterDuff.Mode.SRC_IN
            );
            FrameLayout.LayoutParams barParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                10
            );
            barParams.gravity = Gravity.CENTER_HORIZONTAL | Gravity.BOTTOM;
            barParams.bottomMargin = 210;
            progressBar.setLayoutParams(barParams);
            rootLayout.addView(progressBar);

            // Loading text
            TextView loadingText = new TextView(this);
            loadingText.setText("Loading...");
            loadingText.setTextColor(Color.parseColor("#F59E0B"));
            loadingText.setTextSize(14f);
            loadingText.setGravity(Gravity.CENTER);
            FrameLayout.LayoutParams textParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT,
                ViewGroup.LayoutParams.WRAP_CONTENT
            );
            textParams.gravity = Gravity.CENTER_HORIZONTAL | Gravity.BOTTOM;
            textParams.bottomMargin = 180;
            loadingText.setLayoutParams(textParams);
            rootLayout.addView(loadingText);

            new Handler(Looper.getMainLooper()).postDelayed(() -> {
                keepSplashOnScreen = false;
                // Smooth fade out
                AlphaAnimation fadeOut = new AlphaAnimation(1.0f, 0.0f);
                fadeOut.setDuration(400);
                fadeOut.setFillAfter(true);
                progressBar.startAnimation(fadeOut);
                loadingText.startAnimation(fadeOut);
                new Handler(Looper.getMainLooper()).postDelayed(() -> {
                    rootLayout.removeView(progressBar);
                    rootLayout.removeView(loadingText);
                }, 400);
            }, SPLASH_DURATION_MS);
        } else {
            new Handler(Looper.getMainLooper()).postDelayed(() -> keepSplashOnScreen = false, SPLASH_DURATION_MS);
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        injectNativeBridge("onStart");
    }

    @Override
    public void onResume() {
        super.onResume();
        injectNativeBridge("onResume");
    }

    private void injectNativeBridge(String source) {
        if (nativeBridgeInjected) return;
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().addJavascriptInterface(new NativeLoginBridge(), "NativeLoginBridge");
                nativeBridgeInjected = true;
                Log.d("MainActivity", "NativeLoginBridge injected successfully from " + source);
            } else {
                Log.w("MainActivity", "Bridge or WebView not ready yet in " + source);
            }
        } catch (Exception e) {
            Log.e("MainActivity", "Failed to inject NativeLoginBridge from " + source, e);
        }
    }
}
