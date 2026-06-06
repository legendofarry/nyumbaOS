import { useEffect, useState } from "react";

type BeforeInstallPromptOutcome = "accepted" | "dismissed" | "unavailable";

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_TTL_MS = 1000 * 60 * 60 * 24 * 21;

function isStandaloneMode() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function readDismissedAt() {
  if (typeof window === "undefined") {
    return 0;
  }

  try {
    return Number(window.localStorage.getItem(DISMISS_KEY) ?? 0);
  } catch {
    return 0;
  }
}

function persistDismissal() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Ignore storage failures in privacy modes.
  }
}

function clearDismissal() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(DISMISS_KEY);
  } catch {
    // Ignore storage failures in privacy modes.
  }
}

export function usePwaInstallPrompt() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandaloneMode());
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedAt = readDismissedAt();
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) {
      setDismissed(true);
    }

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setDismissed(false);
      clearDismissal();
    };

    const handleDisplayModeChange = () => {
      setInstalled(isStandaloneMode());
    };

    const mediaQuery = window.matchMedia("(display-mode: standalone)");

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
    window.addEventListener("appinstalled", handleAppInstalled);

    if ("addEventListener" in mediaQuery) {
      mediaQuery.addEventListener("change", handleDisplayModeChange);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
      window.removeEventListener("appinstalled", handleAppInstalled);

      if ("removeEventListener" in mediaQuery) {
        mediaQuery.removeEventListener("change", handleDisplayModeChange);
      }
    };
  }, []);

  async function promptInstall(): Promise<BeforeInstallPromptOutcome> {
    if (!promptEvent) {
      return "unavailable";
    }

    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);

    if (choice.outcome === "accepted") {
      setInstalled(true);
      setDismissed(false);
      clearDismissal();
      return "accepted";
    }

    setDismissed(true);
    persistDismissal();
    return "dismissed";
  }

  function dismiss() {
    setDismissed(true);
    persistDismissal();
  }

  return {
    canPrompt: !!promptEvent,
    dismissed,
    dismiss,
    installed,
    promptInstall,
    showPrompt: !installed && !dismissed,
  };
}
