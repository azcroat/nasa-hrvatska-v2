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

  // iOS: Safari ITP deletes storage after 7 days unless installed. Show once.
  useEffect(() => {
    if (authScreen !== 'app') return;
    const _isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const _isSA = ('standalone' in navigator) && (navigator.standalone === true);
    if (_isIOS && !_isSA && !localStorage.getItem('nh_pwa_install_dismissed')) {
      setShowPwaInstall(true);
    }
  }, [authScreen]);

  // Android/Chrome: capture beforeinstallprompt for custom install banner
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault(); // prevent browser's default mini-infobar
      setDeferredInstallPrompt(e);
      if (!localStorage.getItem('nh_pwa_install_dismissed')) {
        setShowAndroidInstall(true);
      }
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setShowAndroidInstall(false);
      setShowPwaInstall(false);
    });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  return {
    showPwaInstall, setShowPwaInstall,
    showAndroidInstall, setShowAndroidInstall,
    deferredInstallPrompt, setDeferredInstallPrompt,
  };
}
