import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, BookOpen, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "مكتبة الأحاديث النبوية — بحث بالكلمة والمرادف" },
      {
        name: "description",
        content:
          "البحث الذكي بالكلمة المفتاحية والمرادفات العربية في الأحاديث النبوية.",
      },
    ],
  }),
});

type Hadith = {
  id: number;
  text: string;
  tawthiq?: string | null;
  source?: string | null;
  volume_no?: string | null;
  page_no?: string | null;
  book_name?: string | null;
  chapter_name?: string | null;
  hadith_no?: string | null;
  witness?: string | null;
  indication?: string | null;
  ruling?: string | null;
  takhrij?: string | null;
  keywords?: string | null;
};

function Index() {
  const [query, setQuery] = useState("");
  const [exactTerm, setExactTerm] = useState("");
  const [activeTerms, setActiveTerms] = useState<string[]>([]);
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState("all");
  const [matchMode, setMatchMode] = useState<"all" | "exact" | "synonym">("all");

  // Fetch synonyms from edge function + saved table
  const synMutation = useMutation({
    mutationFn: async (kw: string) => {
      // Saved synonyms first
      const { data: saved } = await supabase.from("synonyms").select("synonym").eq("keyword", kw);
      const savedList = (saved ?? []).map((s) => s.synonym);

      // AI synonyms
      const { data, error } = await supabase.functions.invoke("get-synonyms", {
        body: { keyword: kw },
      });
      if (error) throw error;
      const ai = (data?.synonyms ?? []) as string[];

      const merged = Array.from(new Set([...savedList, ...ai])).filter((s) => s && s !== kw);
      return merged;
    },
    onSuccess: (list) => {
      setSynonyms(list);
      setActiveTerms((prev) => Array.from(new Set([...prev, ...list])));
      if (list.length === 0) toast.info("لم يُعثر على مرادفات.");
    },
    onError: (e: Error) => toast.error(e.message || "فشل جلب المرادفات"),
  });

  const sourcesQuery = useQuery({
    queryKey: ["sources"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("hadiths")
        .select("source")
        .not("source", "is", null)
        .limit(1000);
      if (error) {
        console.error("[sources]", error);
        toast.error("تعذر تحميل قائمة المصادر.");
        return [];
      }
      const unique = Array.from(
        new Set((data ?? []).map((r) => r.source).filter(Boolean) as string[]),
      );
      return unique.sort((a, b) => a.localeCompare(b, "ar"));
    },
  });

  const hadithsQuery = useQuery({
    queryKey: ["hadiths", activeTerms, exactTerm, sourceFilter, matchMode],
    enabled: activeTerms.length > 0,
    queryFn: async (): Promise<Hadith[]> => {
      const terms =
        matchMode === "exact"
          ? [exactTerm].filter(Boolean)
          : matchMode === "synonym"
            ? activeTerms.filter((t) => t !== exactTerm)
            : activeTerms;
      if (terms.length === 0) return [];

      // OR search: نص + كلمات مفتاحية + شاهد + وجه الدلالة + مصدر/كتاب/باب/حكم (colonnes souvent renseignées)
      const orFilter = terms
        .map(
          (t) =>
            `text.ilike.%${t}%,keywords.ilike.%${t}%,witness.ilike.%${t}%,indication.ilike.%${t}%,source.ilike.%${t}%,book_name.ilike.%${t}%,chapter_name.ilike.%${t}%,ruling.ilike.%${t}%`,
        )
        .join(",");
      // Use * so missing DB columns (older tables) do not break the query; optional fields stay undefined.
      let queryBuilder = supabase.from("hadiths").select("*").or(orFilter)
        .limit(100);
      if (sourceFilter !== "all") {
        queryBuilder = queryBuilder.eq("source", sourceFilter);
      }
      const { data, error } = await queryBuilder;
      if (error) {
        console.error("[hadiths]", error);
        throw new Error(error.message);
      }
      return data as Hadith[];
    },
  });

  const onSearch = () => {
    const q = query.trim();
    if (!q) return;
    setExactTerm(q);
    setActiveTerms([q]);
    setSynonyms([]);
    synMutation.mutate(q);
  };

  const toggleTerm = (term: string) => {
    setActiveTerms((prev) =>
      prev.includes(term) ? prev.filter((t) => t !== term) : [...prev, term],
    );
  };

  const highlight = (text: string) => {
    if (activeTerms.length === 0) return text;
    const re = new RegExp(`(${activeTerms.map(escapeReg).join("|")})`, "g");
    const parts = text.split(re);
    return parts.map((p, i) =>
      activeTerms.some((t) => t === p) ? (
        <mark
          key={i}
          className="rounded px-0.5"
          style={{ background: "rgba(212, 168, 67, 0.35)" }}
        >
          {p}
        </mark>
      ) : (
        <span key={i}>{p}</span>
      ),
    );
  };

  return (
    <div className="min-h-screen">
      <div className="hadith-page-wrap">
        <header className="hadith-site-header">
          <div className="hadith-header-emblem" aria-hidden>
            🕌
          </div>
          <h1 className="hadith-header-title">مكتبة الأحاديث النبوية</h1>
          <p className="hadith-header-sub">
            البحث الذكي بالكلمة المفتاحية والمرادفات العربية
          </p>
          <div className="hadith-header-ornament">
            <div className="hadith-ornament-line" />
            <div className="hadith-ornament-diamond" />
            <div className="hadith-ornament-line" />
          </div>
        </header>

        <div className="hadith-gold-stripe" aria-hidden />

        {/* Search */}
        <section className="px-0 pt-0">
        <div className="ornament-card rounded-xl p-2">
          <div className="flex items-center gap-2">
            <Input
              dir="rtl"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
              placeholder="ابحث بكلمة عربية… مثال: الرحمة، الصلاة، الجنازة"
              className="text-arabic h-14 border-0 bg-transparent text-xl shadow-none focus-visible:ring-0"
            />
            <Button
              onClick={onSearch}
              disabled={!query.trim() || synMutation.isPending}
              className="h-12 gap-2 px-6 text-base font-bold shadow-none transition-[filter] hover:brightness-110"
              style={{
                background: "var(--green-deep)",
                color: "var(--gold-light-ref)",
              }}
            >
              {synMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              بحث
            </Button>
          </div>
        </div>

        {/* Synonyms */}
        {(synonyms.length > 0 || activeTerms.length > 0) && (
          <div className="mt-6 space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="h-10 bg-background">
                  <SelectValue placeholder="تصفية حسب المصدر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المصادر</SelectItem>
                  {(sourcesQuery.data ?? []).map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={matchMode}
                onValueChange={(v) => setMatchMode(v as "all" | "exact" | "synonym")}
              >
                <SelectTrigger className="h-10 bg-background">
                  <SelectValue placeholder="نوع المطابقة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">النص + المرادفات</SelectItem>
                  <SelectItem value="exact">الكلمة الأصلية فقط</SelectItem>
                  <SelectItem value="synonym">المرادفات فقط</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              <span className="text-[var(--text-hint-ref)]">⟳ </span>
              المرادفات المقترحة (Arabic WordNet) — انقر للإضافة أو الإزالة:
            </div>
            <div className="flex flex-wrap gap-2">
              {activeTerms.map((t) => (
                <Badge
                  key={t}
                  className="bg-emerald-gradient gap-1 px-3 py-1 text-sm"
                  onClick={() => toggleTerm(t)}
                  style={{ cursor: "pointer" }}
                >
                  {t} <X className="h-3 w-3" />
                </Badge>
              ))}
              {synonyms
                .filter((s) => !activeTerms.includes(s))
                .map((s) => (
                  <Badge
                    key={s}
                    variant="outline"
                    onClick={() => toggleTerm(s)}
                    className="border-[var(--gold)] px-3 py-1 text-sm text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--gold)_15%,transparent)]"
                    style={{ cursor: "pointer" }}
                  >
                    + {s}
                  </Badge>
                ))}
            </div>
          </div>
        )}
        </section>

        {/* Results */}
        <main className="px-0 py-8">
        {hadithsQuery.isFetching && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {hadithsQuery.isError && activeTerms.length > 0 && (
          <div className="ornament-card mb-6 rounded-lg border-destructive/40 bg-destructive/5 p-4 text-center text-sm">
            <p className="font-medium text-destructive">تعذر تحميل الأحاديث من قاعدة البيانات.</p>
            <p className="mt-2 text-muted-foreground">
              تأكد أن جداول Supabase منشأة (migration) وأن المفتاح العام صحيح في المتغيرات.
            </p>
            <p className="mt-1 text-xs opacity-80">
              {(hadithsQuery.error as Error)?.message ?? ""}
            </p>
          </div>
        )}

        {hadithsQuery.data && (
          <>
            <div className="mb-4 text-center text-muted-foreground">
              <BookOpen className="ml-1 inline h-4 w-4" />
              عدد النتائج: {hadithsQuery.data.length}
            </div>
            <div className="space-y-5">
              {hadithsQuery.data.map((h) => (
                <article key={h.id} className="ornament-card rounded-lg p-6">
                  <p className="text-hadith-body text-[17px] leading-[2.1] text-foreground">
                    {highlight(h.text)}
                  </p>
                  {h.indication && (
                    <p className="mt-4 border-r-[3.5px] border-[var(--gold-ref)] pr-3 text-sm italic text-muted-foreground">
                      {h.indication}
                    </p>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    {h.source && (
                      <Badge variant="secondary" className="font-normal">
                        {h.source}
                      </Badge>
                    )}
                    {h.hadith_no && (
                      <Badge variant="outline" className="font-normal">
                        رقم: {h.hadith_no}
                      </Badge>
                    )}
                    {h.book_name && (
                      <Badge variant="outline" className="font-normal">
                        الكتاب: {h.book_name}
                      </Badge>
                    )}
                    {h.chapter_name && (
                      <Badge variant="outline" className="font-normal">
                        الباب: {h.chapter_name}
                      </Badge>
                    )}
                    {h.volume_no && (
                      <Badge variant="outline" className="font-normal">
                        جزء: {h.volume_no}
                      </Badge>
                    )}
                    {h.page_no && (
                      <Badge variant="outline" className="font-normal">
                        ص: {h.page_no}
                      </Badge>
                    )}
                    {h.ruling && (
                      <Badge
                        className="font-normal"
                        style={{
                          background: "color-mix(in oklab, var(--primary) 15%, transparent)",
                          color: "var(--primary)",
                        }}
                      >
                        {h.ruling}
                      </Badge>
                    )}
                  </div>
                  {h.witness && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      <span className="font-semibold">الشاهد: </span>
                      {h.witness}
                    </p>
                  )}
                  {h.tawthiq && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      <span className="font-semibold">التوثيق: </span>
                      {h.tawthiq}
                    </p>
                  )}
                  {h.takhrij && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      <span className="font-semibold">التخريج: </span>
                      {h.takhrij}
                    </p>
                  )}
                </article>
              ))}
              {hadithsQuery.data.length === 0 && (
                <div className="ornament-card rounded-lg p-10 text-center text-muted-foreground">
                  لم يُعثر على أحاديث تطابق البحث.
                </div>
              )}
            </div>
          </>
        )}

        {!activeTerms.length && (
          <div className="mt-10 text-center text-muted-foreground">
            <p className="text-lg">
              ابدأ بإدخال كلمة في حقل البحث للحصول على المرادفات والأحاديث المرتبطة.
            </p>
            <p className="mt-2 text-sm opacity-70">قاعدة بيانات تحوي ٦١٠ حديثًا شريفًا.</p>
          </div>
        )}
      </main>

        <footer className="hadith-site-footer">
          <p className="hadith-footer-ayah">
            ﴿ وَمَا يَنطِقُ عَنِ الْهَوَىٰ ۝ إِنْ هُوَ إِلَّا وَحْيٌ يُوحَىٰ ﴾
          </p>
          <p className="hadith-footer-ref">سورة النجم — الآيتان ٣–٤</p>
        </footer>
      </div>
    </div>
  );
}

function escapeReg(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
