package com.nasahrvatska.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebStorage;
import android.webkit.WebView;
import android.net.Uri;
import android.content.Intent;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity — overrides the WebView's WebChromeClient so that
 * getUserMedia() microphone access is granted immediately whenever the
 * Android system-level RECORD_AUDIO permission has already been granted
 * by the user.
 *
 * Two-layer fix for the microphone permission cache problem:
 *
 * Layer 1 — WebStorage.deleteAllData() on every launch:
 *   Android WebView caches its own per-origin permission state for https://localhost.
 *   If the user previously denied the in-app dialog, the WebView keeps a "denied" entry
 *   and never fires onPermissionRequest again — even after the user enables the permission
 *   in Android Settings. Clearing WebStorage on startup wipes that stale cache entry.
 *
 * Layer 2 — WebChromeClient.onPermissionRequest override:
 *   When the permission cache is clear (or on first install), onPermissionRequest fires.
 *   We grant it immediately if RECORD_AUDIO is already held at the OS level, bypassing
 *   the WebView's internal dialog which the user already answered via the rationale screen.
 *
 * All other WebChromeClient callbacks (console messages, geolocation, file chooser,
 * JS alerts) are delegated to the original Capacitor client so no existing functionality
 * is lost.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // ── Layer 1: Clear WebView permission cache ──────────────────────────
        // Forces Android WebView to re-evaluate getUserMedia permissions on this launch.
        // Safe to call on every startup — only clears the WebView's internal origin DB,
        // not user data. This is idempotent.
        WebStorage.getInstance().deleteAllData();

        WebView webView = getBridge().getWebView();
        if (webView == null) return;

        // Keep a reference to Capacitor's own WebChromeClient so we can
        // delegate all other callbacks to it unchanged.
        final WebChromeClient capacitorClient = webView.getWebChromeClient();

        // ── Layer 2: Grant mic immediately if OS permission already held ─────
        webView.setWebChromeClient(new WebChromeClient() {

            /** Grant microphone if RECORD_AUDIO is already permitted at OS level. */
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                boolean micGranted = ContextCompat.checkSelfPermission(
                        MainActivity.this, Manifest.permission.RECORD_AUDIO)
                        == PackageManager.PERMISSION_GRANTED;

                if (micGranted) {
                    request.grant(request.getResources());
                } else if (capacitorClient != null) {
                    capacitorClient.onPermissionRequest(request);
                } else {
                    request.deny();
                }
            }

            // ── Delegate everything else to Capacitor ──────────────────────

            @Override
            public boolean onConsoleMessage(ConsoleMessage m) {
                return capacitorClient != null && capacitorClient.onConsoleMessage(m);
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (capacitorClient != null) capacitorClient.onGeolocationPermissionsShowPrompt(origin, callback);
            }

            @Override
            public void onGeolocationPermissionsHidePrompt() {
                if (capacitorClient != null) capacitorClient.onGeolocationPermissionsHidePrompt();
            }

            @Override
            public boolean onShowFileChooser(WebView wv, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (capacitorClient != null) return capacitorClient.onShowFileChooser(wv, cb, params);
                return false;
            }

            @Override
            public boolean onJsAlert(WebView wv, String url, String message, JsResult result) {
                if (capacitorClient != null) return capacitorClient.onJsAlert(wv, url, message, result);
                return false;
            }

            @Override
            public boolean onJsConfirm(WebView wv, String url, String message, JsResult result) {
                if (capacitorClient != null) return capacitorClient.onJsConfirm(wv, url, message, result);
                return false;
            }

            @Override
            public boolean onJsPrompt(WebView wv, String url, String message, String defaultValue, JsPromptResult result) {
                if (capacitorClient != null) return capacitorClient.onJsPrompt(wv, url, message, defaultValue, result);
                return false;
            }
        });
    }
}
