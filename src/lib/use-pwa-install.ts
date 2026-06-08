import { useSyncExternalStore } from "react";

type BeforeInstallPromptOutcome = "accepted" | "dismissed" | "unavailable";

type BeforeInstallPromptEvent = Event & {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
};

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

type InstallSnapshot = {
  canPrompt: boolean;
  installed: boolean;
};

type WindowWithPwaFlag = Window & {
  __pwaInstallListenersAttached?: boolean;
};

let promptEvent: BeforeInstallPromptEvent | null = null;
let snapshot: InstallSnapshot = {
  canPrompt: false,
  installed: isStandaloneMode(),
};
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => {
    listener();
  });
}

function setSnapshot(next: InstallSnapshot) {
  if (snapshot.canPrompt === next.canPrompt && snapshot.installed === next.installed) {
    return;
  }

  snapshot = next;
  emit();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

function getServerSnapshot() {
  return snapshot;
}

function ensureInstallListeners() {
  if (typeof window === "undefined") {
    return;
  }

  const win = window as WindowWithPwaFlag;
  if (win.__pwaInstallListenersAttached) {
    return;
  }
  win.__pwaInstallListenersAttached = true;

  const handleBeforeInstallPrompt = (event: Event) => {
    event.preventDefault();
    promptEvent = event as BeforeInstallPromptEvent;
    setSnapshot({
      canPrompt: true,
      installed: snapshot.installed,
    });
  };

  const handleAppInstalled = () => {
    promptEvent = null;
    setSnapshot({
      canPrompt: false,
      installed: true,
    });
  };

  const handleDisplayModeChange = () => {
    const nowInstalled = isStandaloneMode();
    if (nowInstalled) {
      promptEvent = null;
    }

    setSnapshot({
      canPrompt: nowInstalled ? false : !!promptEvent,
      installed: nowInstalled,
    });
  };

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt as EventListener);
  window.addEventListener("appinstalled", handleAppInstalled);

  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  if ("addEventListener" in mediaQuery) {
    mediaQuery.addEventListener("change", handleDisplayModeChange);
  }
}

ensureInstallListeners();

export function usePwaInstallPrompt() {
  async function promptInstall(): Promise<BeforeInstallPromptOutcome> {
    if (!promptEvent) {
      return "unavailable";
    }

    const currentEvent = promptEvent;
    await currentEvent.prompt();
    const choice = await currentEvent.userChoice;
    promptEvent = null;

    if (choice.outcome === "accepted") {
      setSnapshot({
        canPrompt: false,
        installed: true,
      });
      return "accepted";
    }

    setSnapshot({
      canPrompt: false,
      installed: snapshot.installed,
    });

    return "dismissed";
  }

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return {
    canPrompt: state.canPrompt,
    installed: state.installed,
    promptInstall,
  };
}
