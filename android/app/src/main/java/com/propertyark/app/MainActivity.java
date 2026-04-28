package com.propertyark.app;

import com.getcapacitor.BridgeActivity;
import androidx.core.splashscreen.SplashScreen;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;

public class MainActivity extends BridgeActivity {
    private static final long SPLASH_DURATION_MS = 5000L;
    private volatile boolean keepSplashOnScreen = true;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> keepSplashOnScreen);

        new Handler(Looper.getMainLooper()).postDelayed(() -> keepSplashOnScreen = false, SPLASH_DURATION_MS);

        super.onCreate(savedInstanceState);
    }
}
