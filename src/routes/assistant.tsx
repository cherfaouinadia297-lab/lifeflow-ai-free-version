import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { askAssistant } from "@/lib/assistant.functions";
import { makeI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/assistant")({
  head: () => ({
    meta: [
      { title: "المساعد الذكي — LifeFlow AI" },
      { name: "description", content: "تحدث مع مساعدك الذكي لإنجاز مهامك." },
    ],
  }),
  component: AssistantPage,
});

type Msg = { role: "user" | "assistant"; content: string };

function AssistantPage() {
  const { state } = useStore();
  const i18n = makeI18n(state.language);
  const { t } = i18n;
  const lang = state.language;
  const suggestions = [t("assistant.s1"), t("assistant.s2"), t("assistant.s3"), t("assistant.s4")];
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", content: t("assistant.hello") },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;
    const nextMsgs: Msg[] = [...messages, { role: "user", content }];
    setMessages(nextMsgs);
    setInput("");
    setLoading(true);
    try {
      const tasksContext = state.tasks
        .filter((tk) => !tk.completed)
        .slice(0, 10)
        .map((tk) => `- ${tk.title} (${tk.date} ${tk.startTime})`)
        .join("\n");
      const systemContext = tasksContext
        ? `User's upcoming tasks:\n${tasksContext}`
        : "User has no pending tasks yet.";
      const res = await askAssistant({
        data: {
          language: lang,
          messages: [
            { role: "system", content: systemContext },
            ...nextMsgs.map((m) => ({ role: m.role, content: m.content })),
          ],
        },
      });
      setMessages((m) => [...m, { role: "assistant", content: res.reply || "..." }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      if (msg === "rate_limited") toast.error(t("assistant.errorRate"));
      else if (msg === "credits_exhausted") toast.error(t("assistant.errorCredits"));
      else toast.error(t("assistant.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-180px)] max-w-2xl flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">{t("assistant.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("assistant.subtitle")}</p>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-soft">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                  m.role === "user"
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-gradient-primary text-primary-foreground"
                }`}
              >
                {m.role === "user" ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
              </div>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary text-primary-foreground">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>
              <div className="rounded-2xl bg-secondary px-4 py-2 text-sm text-muted-foreground">
                {t("assistant.thinking")}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => void send(s)}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:border-primary"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void send(input);
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t("assistant.placeholder")}
            className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground shadow-soft focus:border-primary focus:outline-none"
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !input.trim()} className="bg-gradient-primary">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </AppShell>
  );
}