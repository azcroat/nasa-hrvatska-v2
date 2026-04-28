import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nasahrvatska.app',
  appName: 'Naša Hrvatska',
  webDir: 'dist',
  // Bundle the web assets inside the native app (no live reload in production)
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#fffbeb',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      // Light style = dark status bar icons (readable on the app's cream background).
      // backgroundColor removed — setting it called the deprecated Window.setStatusBarColor()
      // API on Android 15+. With EdgeToEdge.enable() in MainActivity, the status bar is
      // transparent; the app's cream background (#fffbeb) shows through naturally.
      style: 'Light',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      // Croatian keyboard: allow resize so content scrolls above keyboard
      resize: 'body',
      style: 'light',
      resizeOnFullScreen: true,
    },
  },
  // iOS-specific configuration
  ios: {
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
    backgroundColor: '#fffbeb',
  },
  // Android-specific configuration
  android: {
    backgroundColor: '#fffbeb',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    // Production: serve bundled assets from the app
    // Development: point to Vite dev server (set via cap run --livereload)
    androidScheme: 'https',
    iosScheme: 'https',
  },
};

export default config;
