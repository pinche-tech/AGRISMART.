import React, { useState } from 'react';
import { Download, Check, X, Share, Smartphone } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showInstallModal, setShowInstallModal] = useState(false);

  if (isInstalled) {
    return (
      <span className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-sm font-sans-ui font-medium text-[#14532D] border border-[#D6CEBE] rounded-md whitespace-nowrap">
        <Check className="w-4 h-4 shrink-0" />
        Installed
      </span>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowInstallModal(true);
      }
    } else {
      setShowInstallModal(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleInstallClick}
        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-sans-ui font-semibold text-[#1C1917] bg-[#EBE6DF] hover:bg-[#DFD8CE] border border-[#C8BFA8] rounded-md transition-colors duration-150 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#14532D]"
      >
        <Download className="w-4 h-4 text-[#14532D] shrink-0" />
        <span>Install App</span>
      </button>

      {showInstallModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
        >
          <div className="w-full max-w-lg rounded-lg bg-[#FBF9F5] border border-[#D6CEBE] p-6 sm:p-8 shadow-xl text-[#1C1917]">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#D6CEBE]">
              <div>
                <p className="text-xs font-sans-ui uppercase tracking-widest text-[#57534E]">
                  Progressive Web Application · Offline Farm Companion
                </p>
                <h3 id="pwa-install-title" className="text-2xl sm:text-3xl font-display font-semibold text-[#1C1917] mt-1">
                  Install AgriSmart
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="p-2 text-[#57534E] hover:text-[#1C1917] rounded-md transition-colors cursor-pointer"
                aria-label="Close installation guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-base font-serif-prose leading-relaxed text-[#292524]">
              <p>
                Install <strong>AgriSmart</strong> directly onto your home screen or desktop for instant field camera access, GPS meteorological tracking, and offline access to your saved crop monographs.
              </p>

              {isIOS ? (
                <div className="p-4 bg-[#F3EFE6] border border-[#D6CEBE] rounded-md space-y-2 text-sm font-sans-ui">
                  <div className="flex items-center gap-2 font-semibold text-[#14532D]">
                    <Share className="w-4 h-4" />
                    <span>Install on iPhone or iPad (Safari)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[#292524]">
                    <li>Tap the <strong>Share</strong> icon in your Safari address bar.</li>
                    <li>Scroll down and select <strong>Add to Home Screen</strong>.</li>
                    <li>Tap <strong>Add</strong> in the top-right corner to launch Hortus standalone.</li>
                  </ol>
                </div>
              ) : (
                <div className="p-4 bg-[#F3EFE6] border border-[#D6CEBE] rounded-md space-y-2.5 text-sm font-sans-ui">
                  <div className="flex items-center gap-2 font-semibold text-[#14532D]">
                    <Smartphone className="w-4 h-4" />
                    <span>Direct Browser Installation</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[#292524]">
                    <li>
                      <strong>Desktop Chrome / Edge:</strong> Click the <strong>Install Hortus</strong> icon on the right side of your browser address bar (or open the browser menu ⋮ and choose <em>Install Hortus Botanicus</em>).
                    </li>
                    <li>
                      <strong>Android Chrome:</strong> Tap the browser menu (⋮) and select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
                    </li>
                    <li>
                      <strong>Preview Window Note:</strong> If viewing inside an embedded frame, open the app URL in a dedicated browser tab to trigger the one-click native OS installer.
                    </li>
                  </ol>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-[#D6CEBE] flex items-center justify-end gap-3">
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    await install();
                    setShowInstallModal(false);
                  }}
                  className="px-5 py-2.5 text-sm font-sans-ui font-semibold text-[#FBF9F5] bg-[#14532D] hover:bg-[#0F3F22] rounded-md transition-colors cursor-pointer"
                >
                  Prompt Native Installer
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowInstallModal(false)}
                className="px-5 py-2.5 text-sm font-sans-ui font-semibold text-[#1C1917] bg-[#EBE6DF] hover:bg-[#DFD8CE] rounded-md transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-md bg-[#78350F] px-4 py-2.5 text-sm font-sans-ui font-medium text-[#FBF9F5] shadow-lg">
      <span className="h-2.5 w-2.5 rounded-full bg-[#FBF9F5] animate-pulse" />
      <span>Offline Herbarium Mode — Viewing cached botanical monographs</span>
    </div>
  );
};
