import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Battery, Bell, CheckCircle2, Clock, RefreshCw, Settings, ShieldAlert, Smartphone, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getAlarmDiagnostics, openAppSettings, openBatterySettings, openExactAlarmSettings, type NativeAlarmDiagnostics } from "@/lib/alarm-sync";

export const Route = createFileRoute("/alarm-diagnostics")({
  head: () => ({ meta: [{ title: "Alarm Diagnostics — LifeFlow AI" }, { name: "description", content: "Android alarm diagnostics for wake-up and prayer alarms." }] }),
  component: AlarmDiagnosticsPage,
});

function AlarmDiagnosticsPage() {
  const [data, setData] = useState<NativeAlarmDiagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    setData(await getAlarmDiagnostics());
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const rows = useMemo(() => data ? [
    ["إذن الإشعارات", data.notifications, "يجب تفعيله حتى يظهر التنبيه."],
    ["Exact Alarm", data.exactAlarm, "ضروري للدقة العالية في Android 12+."],
    ["قناة التنبيهات", data.channel, "قناة عالية الأولوية للتنبيهات الحرجة."],
    ["Full Screen Intent", data.fullScreenIntent, "يفتح واجهة فوق شاشة القفل."],
    ["Foreground Service", data.foregroundService, "يبقي صوت المنبه نشطًا حتى الإيقاف."],
    ["WakeLock", data.wakeLock, "يبقي المعالج مستيقظًا عند إطلاق المنبه."],
    ["Boot Receiver", data.bootReceiver, "يعيد الجدولة بعد إعادة تشغيل الهاتف."],
    ["تحسين البطارية", !data.batteryOptimized, "يفضل تعطيله للتنبيهات الحرجة."],
  ] as const : [], [data]);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">تشخيص المنبهات</h1>
            <p className="text-sm text-muted-foreground">حالة متطلبات منبهات الاستيقاظ والصلاة على Android.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`me-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> تحديث
          </Button>
        </div>

        {data && (
          <>
            <Card className="grid gap-3 p-5 sm:grid-cols-3">
              <Info icon={<Smartphone className="h-4 w-4" />} label="الجهاز" value={`${data.manufacturer ?? "Web"} ${data.model ?? ""}`} />
              <Info icon={<Clock className="h-4 w-4" />} label="منبهات محفوظة" value={String(data.storedAlarms)} />
              <Info icon={<Bell className="h-4 w-4" />} label="منبهات مجدولة" value={String(data.pendingAlarms)} />
            </Card>

            <div className="grid gap-3 sm:grid-cols-2">
              {rows.map(([label, ok, note]) => (
                <Card key={label} className="flex items-start gap-3 p-4">
                  {ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" /> : <XCircle className="mt-0.5 h-5 w-5 text-destructive" />}
                  <div>
                    <div className="font-semibold">{label}</div>
                    <div className="text-xs text-muted-foreground">{note}</div>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="space-y-3 p-5">
              <div className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4 text-primary" /> إرشادات الشركة المصنّعة</div>
              <p className="text-sm text-muted-foreground">{data.oemGuide}</p>
              <div className="flex flex-wrap gap-2">
                <Button className="bg-gradient-primary" onClick={() => void openAppSettings()}><Settings className="me-2 h-4 w-4" /> إعدادات التطبيق</Button>
                <Button variant="outline" onClick={() => void openExactAlarmSettings()}><AlertTriangle className="me-2 h-4 w-4" /> Exact Alarm</Button>
                <Button variant="outline" onClick={() => void openBatterySettings()}><Battery className="me-2 h-4 w-4" /> البطارية</Button>
              </div>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-background p-4"><div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">{icon}{label}</div><div className="font-display text-xl font-bold">{value}</div></div>;
}