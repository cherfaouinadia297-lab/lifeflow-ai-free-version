import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { ensureNotificationPermission } from "@/lib/notifications";
import { Moon, Sun, Bell, Languages, Trash2, Monitor } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات — LifeFlow AI" },
      { name: "description", content: "تخصيص اللغة والوضع الليلي والإشعارات." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { state, setLanguage, setTheme, resetAll } = useStore();

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">الإعدادات</h1>
          <p className="text-sm text-muted-foreground">خصّص التطبيق ليناسبك.</p>
        </div>

        <Section icon={<Languages className="h-4 w-4" />} title="اللغة">
          <div className="flex gap-2">
            <Choice active={state.language === "ar"} onClick={() => setLanguage("ar")}>العربية</Choice>
            <Choice active={state.language === "en"} onClick={() => setLanguage("en")}>English</Choice>
          </div>
        </Section>

        <Section icon={<Sun className="h-4 w-4" />} title="المظهر">
          <div className="flex gap-2">
            <Choice active={state.theme === "light"} onClick={() => setTheme("light")}>
              <Sun className="me-1 h-4 w-4" /> فاتح
            </Choice>
            <Choice active={state.theme === "dark"} onClick={() => setTheme("dark")}>
              <Moon className="me-1 h-4 w-4" /> داكن
            </Choice>
            <Choice active={state.theme === "system"} onClick={() => setTheme("system")}>
              <Monitor className="me-1 h-4 w-4" /> النظام
            </Choice>
          </div>
        </Section>

        <Section icon={<Bell className="h-4 w-4" />} title="الإشعارات">
          <p className="mb-3 text-sm text-muted-foreground">
            فعّل إشعارات المتصفح لتلقّي تذكير عند بدء كل نشاط (يعمل ما دام التطبيق مفتوحًا).
          </p>
          <Button
            onClick={async () => {
              const p = await ensureNotificationPermission();
              if (p === "granted") toast.success("تم تفعيل الإشعارات");
              else toast.error("لم يتم منح الإذن");
            }}
            className="bg-gradient-primary"
          >
            <Bell className="me-1 h-4 w-4" />
            تفعيل الإشعارات
          </Button>
        </Section>

        <Section icon={<Trash2 className="h-4 w-4" />} title="إعادة الضبط">
          <p className="mb-3 text-sm text-muted-foreground">
            احذف جميع البيانات والتقدّم. لا يمكن التراجع عن هذا الإجراء.
          </p>
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm("هل أنت متأكد من حذف جميع البيانات؟")) {
                resetAll();
                toast.success("تمت إعادة الضبط");
              }
            }}
          >
            مسح كل البيانات
          </Button>
        </Section>

        <div className="pt-4 text-center text-xs text-muted-foreground">
          LifeFlow AI · بياناتك محفوظة محليًا في متصفحك.
        </div>
      </div>
    </AppShell>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
          {icon}
        </span>
        <h2 className="font-display text-base font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center rounded-xl border px-4 py-2 text-sm font-medium transition-all ${
        active
          ? "border-transparent bg-gradient-primary text-primary-foreground shadow-soft"
          : "border-border bg-background text-foreground hover:border-primary"
      }`}
    >
      {children}
    </button>
  );
}