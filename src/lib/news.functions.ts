import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const CATEGORIES = [
  "general",
  "world",
  "nation",
  "business",
  "technology",
  "entertainment",
  "sports",
  "science",
  "health",
] as const;

const FetchInput = z.object({
  category: z.enum(CATEGORIES).default("general"),
  lang: z.string().min(2).max(5).default("en"),
  country: z.string().min(2).max(2).default("us"),
  q: z.string().max(120).optional(),
  max: z.number().int().min(1).max(25).default(15),
});

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  source: { name: string; url: string };
  category: string;
  lang: string;
  country: string;
  readingMinutes: number;
}

/** Trust ranking: known reputable outlets bubble to the top. */
const TRUSTED = new Set([
  "reuters.com", "apnews.com", "bbc.com", "bbc.co.uk", "nytimes.com",
  "wsj.com", "ft.com", "theguardian.com", "washingtonpost.com",
  "bloomberg.com", "economist.com", "npr.org", "aljazeera.com",
  "nature.com", "sciencemag.org", "nationalgeographic.com",
  "techcrunch.com", "theverge.com", "wired.com", "arstechnica.com",
  "cnn.com", "cnbc.com", "forbes.com", "lemonde.fr", "spiegel.de",
  "elpais.com", "corriere.it", "asahi.com", "nhk.or.jp",
]);

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return ""; }
}

function readingMinutes(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 220));
}

export const fetchNews = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => FetchInput.parse(d))
  .handler(async ({ data }): Promise<{ articles: NewsArticle[]; error?: string }> => {
    const key = process.env.GNEWS_API_KEY;
    if (!key) return { articles: [], error: "missing_key" };

    const params = new URLSearchParams();
    params.set("lang", data.lang);
    params.set("country", data.country);
    params.set("max", String(data.max));
    params.set("apikey", key);
    params.set("expand", "content");

    let endpoint: string;
    if (data.q && data.q.trim()) {
      params.set("q", data.q.trim());
      endpoint = `https://gnews.io/api/v4/search?${params.toString()}`;
    } else {
      params.set("category", data.category);
      endpoint = `https://gnews.io/api/v4/top-headlines?${params.toString()}`;
    }

    const res = await fetch(endpoint);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (res.status === 401 || res.status === 403) return { articles: [], error: "invalid_key" };
      if (res.status === 429) return { articles: [], error: "rate_limited" };
      return { articles: [], error: `gnews_${res.status}:${text.slice(0, 120)}` };
    }
    const json = (await res.json()) as {
      articles?: Array<{
        title: string; description?: string; content?: string;
        url: string; image?: string; publishedAt: string;
        source?: { name?: string; url?: string };
      }>;
    };

    const seen = new Set<string>();
    const articles: NewsArticle[] = [];
    for (const a of json.articles ?? []) {
      const title = (a.title ?? "").trim();
      if (!title || seen.has(title)) continue;
      seen.add(title);
      const src = a.source?.name ?? hostOf(a.url);
      const content = (a.content ?? a.description ?? "").trim();
      articles.push({
        id: a.url,
        title,
        description: (a.description ?? "").trim(),
        content,
        url: a.url,
        image: a.image ?? "",
        publishedAt: a.publishedAt,
        source: { name: src, url: a.source?.url ?? "" },
        category: data.category,
        lang: data.lang,
        country: data.country,
        readingMinutes: readingMinutes(content || title),
      });
    }

    // Rank trusted first, keeping recency inside each bucket.
    articles.sort((a, b) => {
      const ta = TRUSTED.has(hostOf(a.url)) ? 1 : 0;
      const tb = TRUSTED.has(hostOf(b.url)) ? 1 : 0;
      if (ta !== tb) return tb - ta;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return { articles };
  });

const SummarizeInput = z.object({
  title: z.string().min(1).max(400),
  content: z.string().min(1).max(8000),
  language: z.string().min(2).max(5).default("en"),
});

export const summarizeArticle = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SummarizeInput.parse(d))
  .handler(async ({ data }): Promise<{ summary: string; insight: string }> => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const sys = `You are a news analyst. Reply ONLY in language code "${data.language}".
Return compact JSON: {"summary":"...","insight":"..."}
- summary: what happened, why it matters, key facts, likely impact. Under 120 words. Original wording, not a copy.
- insight: 1-2 sentences on why this matters to a productivity-app reader and related tech/events.
No markdown, no preamble.`;

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
          { role: "user", content: `TITLE: ${data.title}\n\nARTICLE:\n${data.content}` },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("rate_limited");
      if (res.status === 402) throw new Error("credits_exhausted");
      throw new Error(`ai_error_${res.status}`);
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const raw = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: { summary?: string; insight?: string } = {};
    try { parsed = JSON.parse(raw); } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) { try { parsed = JSON.parse(m[0]); } catch { /* noop */ } }
    }
    return {
      summary: (parsed.summary ?? "").trim(),
      insight: (parsed.insight ?? "").trim(),
    };
  });