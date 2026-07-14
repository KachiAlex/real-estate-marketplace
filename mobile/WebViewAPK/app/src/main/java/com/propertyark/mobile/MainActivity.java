package com.propertyark.mobile;

import android.app.Activity;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.LinearLayout;
import android.widget.TextView;

public class MainActivity extends Activity {
    private static final String TAG = "PropertyArk";
    private WebView webView;
    private ProgressBar progressBar;
    private TextView statusText;
    
    // Production web app URL
    private static final String APP_URL = "https://real-estate-marketplace-delta.vercel.app";
    
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "=== PropertyArk WebView App Starting ===");
        Log.d(TAG, "Target URL: " + APP_URL);
        
        // Create main layout
        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setLayoutParams(new android.view.ViewGroup.LayoutParams(
            android.view.ViewGroup.LayoutParams.MATCH_PARENT,
            android.view.ViewGroup.LayoutParams.MATCH_PARENT
        ));
        
        // Create status text
        statusText = new TextView(this);
        statusText.setText("Loading PropertyArk...");
        statusText.setTextSize(14);
        statusText.setPadding(16, 16, 16, 16);
        layout.addView(statusText);
        
        // Create WebView
        webView = new WebView(this);
        webView.setLayoutParams(new android.view.ViewGroup.LayoutParams(
            android.view.ViewGroup.LayoutParams.MATCH_PARENT,
            android.view.ViewGroup.LayoutParams.MATCH_PARENT
        ));
        layout.addView(webView);
        
        setContentView(layout);
        
        try {
            // Configure WebView
            Log.d(TAG, "Configuring WebView settings...");
            WebSettings webSettings = webView.getSettings();
            webSettings.setJavaScriptEnabled(true);
            webSettings.setDomStorageEnabled(true);
            webSettings.setAllowFileAccess(true);
            webSettings.setAllowContentAccess(true);
            webSettings.setBuiltInZoomControls(true);
            webSettings.setDisplayZoomControls(false);
            webSettings.setLoadWithOverviewMode(true);
            webSettings.setUseWideViewPort(true);
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            
            // Enable debugging
            WebView.setWebContentsDebuggingEnabled(true);
            Log.d(TAG, "WebView debugging enabled");
            
            // Set WebViewClient to handle page navigation
            webView.setWebViewClient(new WebViewClient() {
                @Override
                public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                    super.onPageStarted(view, url, favicon);
                    Log.d(TAG, "Page started loading: " + url);
                    statusText.setText("Loading: " + url);
                }
                
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    Log.d(TAG, "Navigating to: " + url);
                    view.loadUrl(url);
                    return true;
                }
                
                @Override
                public void onPageFinished(WebView view, String url) {
                    super.onPageFinished(view, url);
                    Log.d(TAG, "Page finished loading: " + url);
                    statusText.setText("PropertyArk loaded successfully");
                    statusText.postDelayed(new Runnable() {
                        @Override
                        public void run() {
                            statusText.setVisibility(View.GONE);
                        }
                    }, 2000);
                }
                
                @Override
                public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                    super.onReceivedError(view, errorCode, description, failingUrl);
                    Log.e(TAG, "WebView Error: " + errorCode + " - " + description);
                    Log.e(TAG, "Failing URL: " + failingUrl);
                    statusText.setText("Error loading: " + description);
                }
            });
            
            // Set WebChromeClient for progress and console
            webView.setWebChromeClient(new WebChromeClient() {
                @Override
                public void onProgressChanged(WebView view, int newProgress) {
                    Log.d(TAG, "Loading progress: " + newProgress + "%");
                }
                
                @Override
                public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                    Log.d(TAG, "JS Console: " + consoleMessage.message() + 
                          " (Line " + consoleMessage.lineNumber() + ")");
                    return true;
                }
            });
            
            // Load the web app
            Log.d(TAG, "Loading URL: " + APP_URL);
            webView.loadUrl(APP_URL);
            
        } catch (Exception e) {
            Log.e(TAG, "Error initializing WebView: " + e.getMessage(), e);
            statusText.setText("Error: " + e.getMessage());
        }
    }
    
    @Override
    public void onBackPressed() {
        Log.d(TAG, "Back button pressed");
        if (webView.canGoBack()) {
            Log.d(TAG, "WebView going back");
            webView.goBack();
        } else {
            Log.d(TAG, "No history, finishing activity");
            super.onBackPressed();
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Activity destroyed");
    }
}
