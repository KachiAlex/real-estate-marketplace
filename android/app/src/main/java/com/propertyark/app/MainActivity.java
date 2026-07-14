package com.propertyark.app;

import android.animation.ObjectAnimator;
import android.content.pm.ApplicationInfo;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.animation.AccelerateDecelerateInterpolator;
import android.webkit.WebView;
import android.widget.ProgressBar;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    private View splashOverlay;
    private ProgressBar splashProgress;
    private final Handler splashHandler = new Handler(Looper.getMainLooper());

    private final Runnable pollContentReadyRunnable = new Runnable() {
        @Override
        public void run() {
            if (splashOverlay == null) {
                return;
            }

            WebView webView = getBridge() != null ? getBridge().getWebView() : null;
            if (webView != null && webView.getProgress() >= 80) {
                hideCustomSplash();
            } else {
                splashHandler.postDelayed(this, 120);
            }
        }
    };

    private final Runnable forceDismissRunnable = new Runnable() {
        @Override
        public void run() {
            hideCustomSplash();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        if ((getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> false);
        splashScreen.setOnExitAnimationListener(splashScreenView -> splashScreenView.remove());
        super.onCreate(savedInstanceState);

        showCustomSplash();
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        splashHandler.removeCallbacksAndMessages(null);
    }

    private void showCustomSplash() {
        if (splashOverlay != null) {
            return;
        }

        LayoutInflater inflater = LayoutInflater.from(this);
        splashOverlay = inflater.inflate(R.layout.splash_overlay, null);
        splashProgress = splashOverlay.findViewById(R.id.splashProgress);

        ViewGroup decor = (ViewGroup) getWindow().getDecorView();
        decor.addView(splashOverlay, new ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
        ));

        animateProgressBar();
        splashHandler.postDelayed(pollContentReadyRunnable, 250);
        splashHandler.postDelayed(forceDismissRunnable, 2000);
    }

    private void animateProgressBar() {
        if (splashProgress == null) {
            return;
        }

        splashProgress.setProgress(0);
        ObjectAnimator animator = ObjectAnimator.ofInt(splashProgress, "progress", 0, 100);
        animator.setDuration(900);
        animator.setInterpolator(new AccelerateDecelerateInterpolator());
        animator.start();
    }

    private void hideCustomSplash() {
        if (splashOverlay == null) {
            return;
        }

        splashHandler.removeCallbacks(pollContentReadyRunnable);
        splashHandler.removeCallbacks(forceDismissRunnable);

        View overlay = splashOverlay;
        splashOverlay = null;
        splashProgress = null;

        overlay.animate()
                .alpha(0f)
                .setDuration(250)
                .withEndAction(() -> {
                    ViewGroup decor = (ViewGroup) getWindow().getDecorView();
                    decor.removeView(overlay);
                })
                .start();
    }
}

