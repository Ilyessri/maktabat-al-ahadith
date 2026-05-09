CREATE TABLE IF NOT EXISTS public.sources (
  id BIGSERIAL PRIMARY KEY,
  source_name TEXT NOT NULL,
  book_name TEXT,
  chapter_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.hadiths (
  id BIGSERIAL PRIMARY KEY,
  text TEXT NOT NULL,
  tawthiq TEXT,
  source TEXT,
  volume_no TEXT,
  page_no TEXT,
  hadith_no TEXT UNIQUE,
  book_name TEXT,
  chapter_name TEXT,
  witness TEXT,
  indication TEXT,
  keywords TEXT,
  takhrij TEXT,
  ruling TEXT,
  search_vector tsvector,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.synonyms (
  id BIGSERIAL PRIMARY KEY,
  keyword TEXT NOT NULL,
  synonym TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(keyword, synonym)
);

CREATE OR REPLACE FUNCTION public.hadiths_search_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector(
      'simple',
      coalesce(NEW.text, '') || ' ' ||
      coalesce(NEW.witness, '') || ' ' ||
      coalesce(NEW.keywords, '')
    );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hadiths_search_update ON public.hadiths;
CREATE TRIGGER hadiths_search_update
BEFORE INSERT OR UPDATE ON public.hadiths
FOR EACH ROW
EXECUTE PROCEDURE public.hadiths_search_trigger();

CREATE INDEX IF NOT EXISTS idx_hadiths_source ON public.hadiths(source);
CREATE INDEX IF NOT EXISTS idx_hadiths_book_name ON public.hadiths(book_name);
CREATE INDEX IF NOT EXISTS idx_hadiths_search_vector ON public.hadiths USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_synonyms_keyword ON public.synonyms(keyword);

ALTER TABLE public.hadiths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.synonyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read hadiths" ON public.hadiths;
CREATE POLICY "Public read hadiths" ON public.hadiths
FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public read synonyms" ON public.synonyms;
CREATE POLICY "Public read synonyms" ON public.synonyms
FOR SELECT TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Public read sources" ON public.sources;
CREATE POLICY "Public read sources" ON public.sources
FOR SELECT TO anon, authenticated
USING (true);
