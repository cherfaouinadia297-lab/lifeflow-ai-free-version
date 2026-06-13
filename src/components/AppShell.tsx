import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, ListChecks, BarChart3, Settings, Home, Sparkles, Bot, Timer as TimerIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";

const NAV = [
  { to: "/", label: "اليوم", icon: Home },
  { to: "/schedule", label: "الجدول", icon: CalendarDays },
  { to: "/tasks", label: "المهام", icon: ListChecks },
  { to: "/assistant", label: "المساعد", icon: Bot },
  { to: "/timer", label: "الموقت", icon: TimerIcon },
  { to: "/stats", label: "الإحصائيات", icon: BarChart3 },
  { to: "/settings", label: "الإعدادات", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { state } = useStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar (mobile + desktop) */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold text-foreground">LifeFlow AI</div>
              <div className="text-[11px] text-muted-foreground">مساعدك الذكي لتنظيم اليوم</div>
            </div>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-sm shadow-soft md:flex">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-bold text-primary">
                {state.progress.level}
              </span>
              <span className="text-xs text-muted-foreground">المستوى</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-foreground">{state.progress.xp}</span>
              <span className="text-xs text-muted-foreground">XP</span>
            </div>
            <span className="text-border">•</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base">🔥</span>
              <span className="font-bold text-foreground">{state.progress.streak}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:py-8">
        {/* Sidebar (desktop) */}
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-24 flex flex-col gap-1">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    active
                      ? "bg-gradient-primary text-primary-foreground shadow-soft"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-24 md:pb-0">{children}</main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 backdrop-blur-lg md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1.5 text-[10px] font-medium transition-colors ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "fill-primary/10" : ""}`} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}