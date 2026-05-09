-- Remplit automatiquement public.hadiths.keywords quand la colonne est vide,
-- en extrayant des tokens du texte (+ indication + witness) hors mots-outils courants.
-- À exécuter une fois après import des 610 lignes (ou après correction Excel + import).

CREATE OR REPLACE FUNCTION public.hadith_keywords_from_text(p_text text, p_max int DEFAULT 18)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  tokens text[];
  t text;
  out_arr text[] := ARRAY[]::text[];
  n int;
  stops text[] := ARRAY[
    'عن', 'أن', 'ان', 'في', 'من', 'إلى', 'الى', 'على', 'ما', 'لا', 'لم', 'لن', 'قد', 'كل',
    'ذلك', 'هذا', 'هذه', 'هؤلاء', 'كان', 'كانت', 'يكون', 'قال', 'قالت', 'يقول', 'فقال',
    'إن', 'ان', 'أو', 'و', 'ف', 'ثم', 'له', 'لها', 'لهم', 'به', 'بها', 'منه', 'منها',
    'إلى', 'عنه', 'عنها', 'غير', 'سوى', 'بين', 'حتى', 'إذا', 'اذا', 'إذ', 'اذ', 'ما',
    'لا', 'ولا', 'ألا', 'كما', 'لكن', 'ليت', 'لو', 'إلا', 'الا', 'مما', 'عما', 'فيما',
    'الذي', 'التي', 'اللذان', 'اللتان', 'الذين', 'اللاتي', 'ذو', 'ذات', 'ذوي',
    'يا', 'أي', 'أيها', 'أيتها', 'من', 'ما', 'متى', 'أين', 'كيف', 'لماذا',
    'رسول', 'الله', 'صلي', 'صلى', 'وسلم', 'ﷺ', 'صلى الله عليه وسلم',
    'بن', 'بنت', 'ابن', 'ابنة', 'أبو', 'أبي', 'أم', 'أمي'
  ];
BEGIN
  IF p_text IS NULL OR btrim(p_text) = '' THEN
    RETURN NULL;
  END IF;

  tokens := regexp_split_to_array(
    regexp_replace(
      coalesce(p_text, ''),
      '[،؛.٫٬»«()\[\]{}:/\\٭\n\rـ]',
      ' ',
      'g'
    ),
    '\s+'
  );

  FOREACH t IN ARRAY tokens
  LOOP
    t := btrim(t);
    IF length(t) < 3 THEN
      CONTINUE;
    END IF;
    IF t = ANY (stops) THEN
      CONTINUE;
    END IF;
    IF t = ANY (out_arr) THEN
      CONTINUE;
    END IF;
    out_arr := array_append(out_arr, t);
    n := coalesce(array_length(out_arr, 1), 0);
    IF n >= p_max THEN
      EXIT;
    END IF;
  END LOOP;

  IF coalesce(array_length(out_arr, 1), 0) = 0 THEN
    RETURN NULL;
  END IF;

  RETURN array_to_string(out_arr, '، ');
END;
$$;

-- Mise à jour des lignes sans mots-clés (idempotent : ne touche pas aux lignes déjà remplies)
UPDATE public.hadiths
SET keywords = public.hadith_keywords_from_text(
  coalesce(text, '') || ' ' || coalesce(indication, '') || ' ' || coalesce(witness, '')
)
WHERE (keywords IS NULL OR btrim(keywords) = '')
  AND text IS NOT NULL
  AND btrim(text) <> '';
