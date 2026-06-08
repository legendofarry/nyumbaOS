import React, { useEffect } from "react";

let deferredPrompt: any = null;

export const getInstallPrompt = () => deferredPrompt;

export function PwaInstallProvider({ children }: { children?: React.ReactNode }) {
  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      try {
        e.preventDefault();
      } catch {}
      // @ts-ignore
      deferredPrompt = e;
      try {
        window.dispatchEvent(new CustomEvent("pwa-deferred"));
      } catch {}
    };

    const handleAppInstalled = () => {
      console.log("App installed");
      deferredPrompt = null;
      try {
        window.dispatchEvent(new CustomEvent("pwa-installed"));
      } catch {}
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  return <>{children}</>;
}

export default PwaInstallProvider;
