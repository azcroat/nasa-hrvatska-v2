# Naša Hrvatska — ProGuard / R8 rules
# Applied to release builds only (minifyEnabled true in build.gradle).

# ── Capacitor core ──────────────────────────────────────────────────────────
# Capacitor bridges JS↔Java via reflection; preserve all plugin interfaces.
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }

# ── Capacitor official plugins ───────────────────────────────────────────────
-keep class com.capacitorjs.plugins.** { *; }

# ── Firebase / Google Services ───────────────────────────────────────────────
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ── WebView JavaScript interface ─────────────────────────────────────────────
# Capacitor injects a JS bridge object — its methods are called by name from JS.
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# ── AndroidX / Support libraries ─────────────────────────────────────────────
-keep class androidx.** { *; }
-dontwarn androidx.**

# ── Debugging: keep line numbers in crash reports ────────────────────────────
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# ── Kotlin (if added later) ──────────────────────────────────────────────────
-keep class kotlin.** { *; }
-dontwarn kotlin.**
