import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider, useStore } from "../lib/store";
import { Toaster } from "../components/ui/sonner";
import { notify, scheduleTaskAlarms } from "../lib/notifications";
import type { RingtoneId } from "../lib/sound";
import { startAlarm, stopAlarm } from "../lib/sound";
import { registerNotificationSW } from "../lib/sw-register";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { BellRing } from "lucide-react";
import { t } from "../lib/i18n";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LifeFlow AI — مساعدك الذكي لتنظيم اليوم" },
      { name: "description", content: "نظّم وقتك، تابع عاداتك، وحقّق أهدافك مع LifeFlow AI." },
      { name: "theme-color", content: "#2E8B8B" },
      { property: "og:title", content: "LifeFlow AI — مساعدك الذكي لتنظيم اليوم" },
      { property: "og:description", content: "نظّم وقتك، تابع عاداتك، وحقّق أهدافك مع LifeFlow AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:site", content: "@Lovable" },
      { name: "twitter:title", content: "LifeFlow AI — مساعدك الذكي لتنظيم اليوم" },
      { name: "twitter:description", content: "نظّم وقتك، تابع عاداتك، وحقّق أهدافك مع LifeFlow AI." },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/AtxHtqXdw3Mmn38OnUyv6653KgU2/social-images/social-1782146160713-ChatGPT_Image_22_يونيو_2026،_06_34_49_م.webp" },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/AtxHtqXdw3Mmn38OnUyv6653KgU2/social-images/social-1782146160713-ChatGPT_Image_22_يونيو_2026،_06_34_49_م.webp" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&family=Reem+Kufi:wght@500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <NotificationScheduler />
        <AlarmDialog />
        {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
        <Outlet />
        <Toaster position="top-center" richColors />
      </StoreProvider>
    </QueryClientProvider>
  );
}

function NotificationScheduler() {
  const { state, updateTask, setRinging, finishTimer } = useStore();

  // Register the service worker once
  useEffect(() => {
    void registerNotificationSW();
  }, []);

  // Precise per-task alarm scheduling (re-runs whenever tasks change)
  useEffect(() => {
    const cleanup = scheduleTaskAlarms(state.tasks, (t) => {
      const body = `حان موعد النشاط (${t.startTime})`;
      notify(t.title, body);
      startAlarm(state.ringtone as RingtoneId, state.volume);
      setRinging({ title: t.title, body, startedAt: Date.now() });
      updateTask(t.id, { notified: true });
    });
    return cleanup;
  }, [state.tasks, state.ringtone, state.volume, updateTask, setRinging]);

  // Background-persistent timer: check every second whether endsAt elapsed
  useEffect(() => {
    const endsAt = state.timer.endsAt;
    if (!endsAt) return;
    const tick = () => {
      if (Date.now() >= endsAt) {
        notify("انتهى الموقت", "حان وقت العودة!");
        startAlarm(state.ringtone as RingtoneId, state.volume);
        setRinging({ title: "انتهى الموقت", body: "حان وقت العودة!", startedAt: Date.now() });
        finishTimer();
      }
    };
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [state.timer.endsAt, state.ringtone, state.volume, finishTimer, setRinging]);

  return null;
}

function AlarmDialog() {
  const { state, setRinging } = useStore();
  const ringing = state.ringing;
  const open = !!ringing;
  const lang = state.language;
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          stopAlarm();
          setRinging(null);
        }
      }}
    >
      <DialogContent className="max-w-sm text-center">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center justify-center gap-2 text-xl">
            <BellRing className="h-5 w-5 animate-pulse text-primary" />
            {ringing?.title ?? ""}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{ringing?.body ?? ""}</p>
        <Button
          className="mt-3 bg-gradient-primary"
          size="lg"
          onClick={() => {
            stopAlarm();
            setRinging(null);
          }}
        >
          {t(lang, "stopAlarm")}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
