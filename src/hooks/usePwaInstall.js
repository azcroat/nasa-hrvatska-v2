/**
 * usePwaInstall — PWA install prompt state for iOS and Android/Chrome.
 *
 * @param {{ authScreen: string }} params
 */
import { useState, useEffect } from 'react';

export function usePwaInstall({ authScreen }) {
  const [showPwaInstall, setShowPwaInstall] = useState(false);
  const [showAndroidInstall, setShowAndroidInstall] = useState(false);
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null);

  // iOS: Safari ITP deletes storage after 7 days unless installed.
  // Wait until user has practiced at least once (first value moment) before prompting.
  useEffect(() => {
    if (authScreen !== 'app') return;
    if (!localStorage.getItem('nh_last_practice')) return; // no value experienced yet
    const _isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const _isSA = ('standalone' in navigator) && (navigator.standalone === true);
    if (_isIOS && !_isSA && !localStorage.getItem('nh_pwa_install_dismissed')) {
      setShowPwaInstall(true);
    }
  }, [authScreen]);

  // Android/Chrome: capture beforeinstallprompt for custom install banner.
  // Only show after user has practiced at least once.
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // prevent browser's default mini-infobar
      setDeferredInstallPrompt(e);
      if (!localStorage.getItem('nh_pwa_install_dismissed') && localStorage.getItem('nh_last_practice')) {
        setShowAndroidInstall(true);
      }
    };
    const installedHandler = () => {
      setShowAndroidInstall(false);
      setShowPwaInstall(false);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  return {
    showPwaInstall, setShowPwaInstall,
    showAndroidInstall, setShowAndroidInstall,
    deferredInstallPrompt, setDeferredInstallPrompt,
  };
}
