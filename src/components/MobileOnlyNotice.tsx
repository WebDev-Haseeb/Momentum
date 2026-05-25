import { MonitorSmartphone, Smartphone } from "lucide-react";

export function MobileOnlyNotice() {
  return (
    <div className="fixed inset-0 z-[60] hidden bg-background px-6 py-8 min-[541px]:grid">
      <div className="absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklch,var(--color-primary)_22%,transparent),transparent_68%)]" />
      <div className="relative mx-auto flex min-h-full w-full max-w-3xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-white/60 bg-surface/90 p-8 text-center shadow-2xl shadow-black/10 backdrop-blur-xl dark:border-white/10 md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-foreground text-background">
            <MonitorSmartphone className="h-8 w-8" strokeWidth={2} />
          </div>
          <p className="mt-7 text-[12px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Mobile-only experience
          </p>
          <h1 className="mx-auto mt-3 max-w-xl text-[34px] font-semibold leading-tight tracking-tight text-balance md:text-[44px]">
            Momentum is designed for small mobile screens.
          </h1>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-6 text-muted-foreground">
            Open this site on your phone to use the focused app layout, bottom navigation, and
            home-screen install experience.
          </p>
          <div className="mx-auto mt-8 flex max-w-sm items-center gap-3 rounded-[24px] bg-muted/70 p-3 text-left">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-background">
              <Smartphone className="h-5 w-5 text-primary" strokeWidth={2.2} />
            </div>
            <div>
              <p className="text-sm font-semibold">Use a phone browser</p>
              <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                Then install it as an app from your mobile browser.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
