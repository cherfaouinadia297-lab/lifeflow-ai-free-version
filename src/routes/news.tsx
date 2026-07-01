import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Newspaper, Search, Bookmark, BookmarkCheck, Share2, Sparkles,
  ExternalLink, RefreshCw, Loader2, ShieldCheck, Clock, Globe,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/lib/store";
import { makeI18n, getLangMeta } from "@/lib/i18n";
import { fetchNews, summarizeArticle, type NewsArticle } from "@/lib/news.functions";

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "World News — LifeFlow AI" },
      { name: "description", content: "AI-summarised world news from trusted sources." },
    ],
  }),
  component: NewsPage,
});

const CATEGORIES = [
  "general", "world", "technology", "science", "business",
  "health", "sports", "entertainment", "nation",
] as const;
type CategoryKey = (typeof CATEGORIES)[number];

const BOOKMARKS_KEY = "lifeflow-news-bookmarks-v1";

function readBookmarks(): NewsArticle[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(BOOKMARKS_KEY) ?? "[]"); }
  catch { return []; }
}
function writeBookmarks(list: NewsArticle[]) {
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(list));
}

function NewsPage() {
  const { state } = useStore();
  const i18n = useMemo(() => makeI18n(state.language), [state.language]);
  const meta = getLangMeta(state.language);
  const [category, setCategory] = useState<CategoryKey>("general");
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState("");
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState<NewsArticle[]>([]);

  useEffect(() => { setBookmarks(readBookmarks()); }, []);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchNews({ data: {
        category, lang: meta.newsLang, country: meta.country.toLowerCase(),
        q: query.trim() || undefined, max: 15,
      }});
      if (res.error === "missing_key") setError(i18n.t("news.missingKey"));
      else if (res.error) setError(res.error);
      setArticles(res.articles);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setArticles([]);
    } finally { setLoading(false); }
  }, [category, meta.newsLang, meta.country, query, i18n]);

  useEffect(() => { void load(); }, [load]);

  const toggleBookmark = (a: NewsArticle) => {
    setBookmarks((prev) => {
      const exists = prev.some((x) => x.id === a.id);
      const next = exists ? prev.filter((x) => x.id !== a.id) : [a, ...prev].slice(0, 200);
      writeBookmarks(next);
      return next;
    });
  };

  const displayed = showBookmarks ? bookmarks : articles;
  const bookmarkedIds = useMemo(() => new Set(bookmarks.map((b) => b.id)), [bookmarks]);

  return (
    <AppShell>
      <div className="space-y-6" dir={meta.dir}>
        {/* Header */}
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-soft backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
                <Newspaper className="h-6 w-6" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-foreground">{i18n.t("news.title")}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> {i18n.t("news.trusted")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showBookmarks ? "default" : "outline"}
                size="sm"
                onClick={() => setShowBookmarks((v) => !v)}
              >
                <Bookmark className="h-4 w-4 me-1.5" />
                {i18n.t("news.bookmarks")} {bookmarks.length > 0 && `(${bookmarks.length})`}
              </Button>
              <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Search */}
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => { e.preventDefault(); setQuery(pending); }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={pending}
                onChange={(e) => setPending(e.target.value)}
                placeholder={i18n.t("news.searchPlaceholder")}
                className="ps-9"
              />
            </div>
            <Button type="submit" variant="secondary">{i18n.t("common.search")}</Button>
          </form>

          {/* Category tabs */}
          {!showBookmarks && (
            <Tabs value={category} onValueChange={(v) => setCategory(v as CategoryKey)} className="mt-4">
              <TabsList className="flex w-full flex-wrap justify-start gap-1 h-auto bg-transparent p-0">
                {CATEGORIES.map((c) => (
                  <TabsTrigger
                    key={c}
                    value={c}
                    className="rounded-full border border-border/60 bg-card data-[state=active]:bg-gradient-primary data-[state=active]:text-primary-foreground data-[state=active]:border-transparent"
                  >
                    {i18n.t(`news.category.${c}`)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Content */}
        {loading && !showBookmarks ? (
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => <ArticleSkeleton key={i} />)}
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-sm text-muted-foreground">{error}</p>
          </Card>
        ) : displayed.length === 0 ? (
          <Card className="p-12 text-center">
            <Newspaper className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{i18n.t("news.empty")}</p>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {displayed.map((a) => (
              <ArticleCard
                key={a.id}
                article={a}
                bookmarked={bookmarkedIds.has(a.id)}
                onBookmark={() => toggleBookmark(a)}
                i18n={i18n}
                dir={meta.dir}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function ArticleSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

function ArticleCard({
  article, bookmarked, onBookmark, i18n, dir,
}: {
  article: NewsArticle;
  bookmarked: boolean;
  onBookmark: () => void;
  i18n: ReturnType<typeof makeI18n>;
  dir: "ltr" | "rtl";
}) {
  const [expanded, setExpanded] = useState(false);
  const [summary, setSummary] = useState<{ summary: string; insight: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleExpand = async () => {
    setExpanded((v) => !v);
    if (!summary && !loading) {
      setLoading(true); setErr(null);
      try {
        const res = await summarizeArticle({ data: {
          title: article.title,
          content: (article.content || article.description || article.title).slice(0, 7000),
          language: i18n.lang,
        }});
        setSummary(res);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally { setLoading(false); }
    }
  };

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: article.title, url: article.url });
      else await navigator.clipboard.writeText(article.url);
    } catch { /* user cancelled */ }
  };

  return (
    <Card className="group overflow-hidden rounded-2xl border-border/60 bg-card/80 backdrop-blur transition-all hover:shadow-glow" dir={dir}>
      {article.image ? (
        <div className="relative h-52 overflow-hidden bg-muted">
          <img
            src={article.image}
            alt={article.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <Badge className="absolute top-3 start-3 bg-black/60 text-white backdrop-blur border-0">
            {article.source.name}
          </Badge>
        </div>
      ) : (
        <div className="grid h-52 place-items-center bg-gradient-to-br from-primary/10 to-accent/10">
          <Newspaper className="h-10 w-10 text-primary/40" />
        </div>
      )}

      <div className="space-y-3 p-5">
        <h2 className="font-display text-lg font-bold leading-tight text-foreground">
          {article.title}
        </h2>
        {article.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">{article.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3 w-3" /> {i18n.t("news.readingTime", { n: article.readingMinutes })}
          </span>
          <span>•</span>
          <span>{i18n.formatDate(article.publishedAt, { month: "short", day: "numeric", weekday: undefined, year: undefined })}</span>
          <span>•</span>
          <span className="inline-flex items-center gap-1">
            <Globe className="h-3 w-3" /> {article.country.toUpperCase()}
          </span>
        </div>

        {expanded && (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" /> {i18n.t("news.aiSummary")}
            </div>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> {i18n.t("news.generating")}
              </div>
            ) : err ? (
              <p className="text-sm text-destructive">{err}</p>
            ) : summary ? (
              <>
                <p className="text-sm leading-relaxed text-foreground">{summary.summary}</p>
                {summary.insight && (
                  <div className="border-t border-primary/10 pt-3">
                    <div className="mb-1 text-xs font-semibold text-primary/80">{i18n.t("news.aiInsight")}</div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{summary.insight}</p>
                  </div>
                )}
              </>
            ) : null}
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          <Button size="sm" variant="secondary" onClick={handleExpand}>
            <Sparkles className="h-3.5 w-3.5 me-1.5" />
            {expanded ? i18n.t("common.readMore") : i18n.t("news.aiSummary")}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <a href={article.url} target="_blank" rel="noreferrer noopener">
              <ExternalLink className="h-3.5 w-3.5 me-1.5" />
              {i18n.t("news.openOriginal")}
            </a>
          </Button>
          <Button size="sm" variant="ghost" onClick={onBookmark}>
            {bookmarked
              ? <BookmarkCheck className="h-4 w-4 text-primary" />
              : <Bookmark className="h-4 w-4" />}
          </Button>
          <Button size="sm" variant="ghost" onClick={share}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}