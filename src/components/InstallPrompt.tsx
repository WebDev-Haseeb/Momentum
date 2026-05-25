import { useEffect, useState } from "react";
import { Download, Share, Smartphone, X } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isSmallMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(max-width: 540px) and (pointer: coarse)").matches;
}

function isAppleMobile() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isApple, setIsApple] = useState(false);

  useEffect(() => {
    setIsApple(isAppleMobile());

    if (!isSmallMobileViewport() || isStandalone()) {
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 900);

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    };
  }, []);

  const install = async () => {
    if (!installEvent) return;

    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[480px] px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="rounded-[28px] border border-white/60 bg-surface/95 p-4 shadow-2xl shadow-black/20 backdrop-blur-xl dark:border-white/10">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-foreground text-background">
            <Smartphone className="h-5 w-5" strokeWidth={2.2} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[15px] font-semibold leading-tight">Install Momentum</p>
                <p className="mt-1 text-[13px] leading-5 text-muted-foreground">
                  Add it to your home screen for the cleanest mobile app experience.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVisible(false)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition active:scale-95"
                aria-label="Dismiss install prompt"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {installEvent ? (
              <button
                type="button"
                onClick={install}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground transition active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                Install app
              </button>
            ) : (
              <div className="mt-4 rounded-2xl bg-muted/70 px-3 py-3 text-[12.5px] leading-5 text-muted-foreground">
                {isApple ? (
                  <span className="inline-flex items-center gap-1.5">
                    Tap <Share className="inline h-3.5 w-3.5" /> Share, then choose Add to Home
                    Screen.
                  </span>
                ) : (
                  "Open your browser menu and choose Install app or Add to Home screen."
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
