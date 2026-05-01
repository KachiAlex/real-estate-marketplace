package com.propertyark.app;

import android.webkit.JavascriptInterface;
import android.util.Log;
import org.json.JSONObject;
import org.json.JSONException;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class NativeLoginBridge {
    private static final String TAG = "NativeLoginBridge";
    private static final String API_BASE = "https://real-estate-marketplace-delta.vercel.app";
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    @JavascriptInterface
    public void nativeLogin(String email, String password, String callbackFunction) {
        executor.execute(() -> {
            try {
                URL url = new URL(API_BASE + "/api/auth/jwt/login");
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(15000);

                JSONObject body = new JSONObject();
                body.put("email", email);
                body.put("password", password);

                try (OutputStream os = conn.getOutputStream()) {
                    os.write(body.toString().getBytes(StandardCharsets.UTF_8));
                }

                int status = conn.getResponseCode();
                BufferedReader reader;
                if (status >= 200 && status < 300) {
                    reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
                } else {
                    reader = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8));
                }

                StringBuilder response = new StringBuilder();
                String line;
                while ((line = reader.readLine()) != null) {
                    response.append(line);
                }
                reader.close();

                JSONObject result = new JSONObject();
                result.put("status", status);
                result.put("body", response.toString());
                result.put("success", status >= 200 && status < 300);

                // Execute callback on main thread via BridgeActivity webView
                Log.d(TAG, "Login response: " + result.toString());

            } catch (Exception e) {
                Log.e(TAG, "Login error", e);
                JSONObject error = new JSONObject();
                try {
                    error.put("status", 0);
                    error.put("body", "{\"error\":\"" + e.getMessage() + "\"}");
                    error.put("success", false);
                } catch (JSONException je) {
                    Log.e(TAG, "JSON error", je);
                }
            }
        });
    }

    @JavascriptInterface
    public String nativeLoginSync(String email, String password) {
        try {
            URL url = new URL(API_BASE + "/api/auth/jwt/login");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(15000);
            conn.setReadTimeout(15000);

            JSONObject body = new JSONObject();
            body.put("email", email);
            body.put("password", password);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(body.toString().getBytes(StandardCharsets.UTF_8));
            }

            int status = conn.getResponseCode();
            BufferedReader reader;
            if (status >= 200 && status < 300) {
                reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
            } else {
                reader = new BufferedReader(new InputStreamReader(conn.getErrorStream(), StandardCharsets.UTF_8));
            }

            StringBuilder response = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();

            JSONObject result = new JSONObject();
            result.put("status", status);
            result.put("body", response.toString());
            result.put("success", status >= 200 && status < 300);
            return result.toString();

        } catch (Exception e) {
            Log.e(TAG, "Login sync error", e);
            return "{\"status\":0,\"body\":\"{\\\"error\\\":\\\"" + e.getMessage() + "\\\"}\",\"success\":false}";
        }
    }
}
