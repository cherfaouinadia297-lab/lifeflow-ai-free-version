import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1).max(4000),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1).max(40),
  language: z.string().min(2).max(10).default("ar"),
});

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const system = `You are LifeFlow AI, a warm, concise productivity coach inside a personal task app.
Reply ONLY in the user's language code: "${data.language}".
Keep answers short (2-5 sentences), practical, and motivating. Help them plan tasks, build habits, manage time, and stay focused.
Use bullet points only when listing steps. Avoid emojis unless the user uses them.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "custom",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("rate_limited");
      if (res.status === 402) throw new Error("credits_exhausted");
      throw new Error(`ai_error_${res.status}: ${text.slice(0, 200)}`);
    }

    const json = (await res.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const reply = json.choices?.[0]?.message?.content ?? "";
    return { reply };
  });

const ParseTaskInput = z.object({
  text: z.string().min(1).max(500),
  todayISO: z.string(),
  language: z.string().default("ar"),
});

/** Parse a free-form (often voice-dictated) phrase into a task draft. */
export const parseTaskFromText = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ParseTaskInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const sys = `You extract a single task from the user's natural-language phrase.
Today's date is ${data.todayISO} (YYYY-MM-DD). The user speaks language code "${data.language}".
Reply ONLY as compact JSON with this exact shape and nothing else:
{"title":"...","date":"YYYY-MM-DD","startTime":"HH:mm","endTime":"HH:mm","category":"study|work|sport|prayer|reading|cooking|sleep|meeting"}
Rules:
- title is short, in the user's language.
- If no time is given, pick a reasonable default (e.g. 09:00) with 60-minute duration.
- If no date is given, use today. "tomorrow"/"غدا"/"demain"/"mañana"/"yarın" => tomorrow.
- endTime must be after startTime.
- category is the best guess from the allowed list.`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "custom",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: data.text },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 429) throw new Error("rate_limited");
      if (res.status === 402) throw new Error("credits_exhausted");
      throw new Error(`ai_error_${res.status}: ${text.slice(0, 200)}`);
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { parsed = {}; } }
    }
    return {
      title: String(parsed.title ?? data.text).slice(0, 120),
      date: typeof parsed.date === "string" ? parsed.date : data.todayISO,
      startTime: typeof parsed.startTime === "string" ? parsed.startTime : "09:00",
      endTime: typeof parsed.endTime === "string" ? parsed.endTime : "10:00",
      category: typeof parsed.category === "string" ? parsed.category : "work",
    };
  });