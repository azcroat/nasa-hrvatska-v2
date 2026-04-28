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
import android.webkit.WebView;
import android.net.Uri;
import androidx.activity.EdgeToEdge;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity — overrides the WebView's WebChromeClient so that
 * getUserMedia() microphone access is granted immediately whenever the
 * Android system-level RECORD_AUDIO permission has already been granted
 * by the user.
 *
 * Fix for the microphone permission cache problem:
 *   Android WebView caches its own per-origin permission state for https://localhost.
 *   If the user previously denied the in-app dialog, the WebView keeps a "denied" entry
 *   and never fires onPermissionRequest again — even after the user enables the permission
 *   in Android Settings.
 *
 *   Our WebChromeClient override intercepts every onPermissionRequest call and grants
 *   microphone access immediately when RECORD_AUDIO is already held at the OS level.
 *   This bypasses the WebView's internal dialog (which the user already answered) and
 *   avoids any stale cached denial state.
 *
 * All other WebChromeClient callbacks (console messages, geolocation, file chooser,
 * JS alerts) are delegated to the original Capacitor client so no existing functionality
 * is lost.
 *
 * NOTE: WebStorage.deleteAllData() was intentionally NOT used here — it would wipe all
 * localStorage and IndexedDB (user progress, Firebase auth tokens, app state) on every
 * launch. The WebChromeClient grant-on-permission approach is the correct targeted fix.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Enable edge-to-edge display (required for Android 15 / SDK 35+).
        // Must be called before super.onCreate() so the window flags are set
        // before Capacitor's BridgeActivity inflates the WebView layout.
        EdgeToEdge.enable(this);
        super.onCreate(savedInstanceState);

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
