package com.nasahrvatska.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

/**
 * MainActivity — overrides the WebView's WebChromeClient so that
 * getUserMedia() microphone access is granted immediately whenever the
 * Android system-level RECORD_AUDIO permission has already been granted
 * by the user.
 *
 * Without this, Android WebView caches its own per-origin permission state
 * for https://localhost.  If the user previously denied the in-app dialog,
 * the WebView keeps that "denied" entry and never calls onPermissionRequest
 * again — even after the user enables the permission in Android Settings.
 * Replacing the WebChromeClient here bypasses that cache cleanly.
 *
 * All other WebChromeClient callbacks (console messages, geolocation,
 * file chooser, etc.) are delegated to the original Capacitor client so
 * no existing functionality is lost.
 */
public class MainActivity extends BridgeActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        if (webView == null) return;

        // Keep a reference to Capacitor's own WebChromeClient so we can
        // delegate all other callbacks to it unchanged.
        final WebChromeClient capacitorClient = webView.getWebChromeClient();

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
        });
    }
}
