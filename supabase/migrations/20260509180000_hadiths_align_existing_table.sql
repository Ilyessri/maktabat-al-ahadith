-- Align an older `hadiths` table with the app schema.
-- `CREATE TABLE IF NOT EXISTS` does not add new columns to an existing table;
-- this migration fixes missing columns (e.g. tawthiq) without dropping data.

ALTER TABLE public.hadiths
  ADD COLUMN IF NOT EXISTS tawthiq TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS volume_no TEXT,
  ADD COLUMN IF NOT EXISTS page_no TEXT,
  ADD COLUMN IF NOT EXISTS hadith_no TEXT,
  ADD COLUMN IF NOT EXISTS book_name TEXT,
  ADD COLUMN IF NOT EXISTS chapter_name TEXT,
  ADD COLUMN IF NOT EXISTS witness TEXT,
  ADD COLUMN IF NOT EXISTS indication TEXT,
  ADD COLUMN IF NOT EXISTS keywords TEXT,
  ADD COLUMN IF NOT EXISTS takhrij TEXT,
  ADD COLUMN IF NOT EXISTS ruling TEXT,
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Default timestamp if the legacy table had no created_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'hadiths' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.hadiths
      ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- Keep tsvector in sync for search
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

-- Backfill search_vector for existing rows
UPDATE public.hadiths
SET search_vector =
  to_tsvector(
    'simple',
    coalesce(text, '') || ' ' ||
    coalesce(witness, '') || ' ' ||
    coalesce(keywords, '')
  )
WHERE search_vector IS NULL;

CREATE INDEX IF NOT EXISTS idx_hadiths_source ON public.hadiths(source);
CREATE INDEX IF NOT EXISTS idx_hadiths_book_name ON public.hadiths(book_name);
CREATE INDEX IF NOT EXISTS idx_hadiths_search_vector ON public.hadiths USING GIN(search_vector);

ALTER TABLE public.hadiths ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read hadiths" ON public.hadiths;
CREATE POLICY "Public read hadiths" ON public.hadiths
FOR SELECT TO anon, authenticated
USING (true);
