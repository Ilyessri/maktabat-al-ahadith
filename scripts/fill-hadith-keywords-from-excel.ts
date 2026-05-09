/**
 * Remplit la colonne Excel « الكلمات المفتاحية » lorsqu'elle est vide,
 * à partir du texte (النص) + وجه الدلالة + الشاهد si colonnes présentes.
 *
 * Usage:
 *   npx tsx scripts/fill-hadith-keywords-from-excel.ts "chemin/vers/fichier.xlsx"
 *   npx tsx scripts/fill-hadith-keywords-from-excel.ts "fichier.xlsx" --out "fichier-rempli.xlsx"
 *   npx tsx scripts/fill-hadith-keywords-from-excel.ts "fichier.xlsx" --dry-run
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";

const STOP = new Set([
  "عن",
  "أن",
  "ان",
  "في",
  "من",
  "إلى",
  "الى",
  "على",
  "ما",
  "لا",
  "لم",
  "لن",
  "قد",
  "كل",
  "ذلك",
  "هذا",
  "هذه",
  "كان",
  "كانت",
  "يكون",
  "قال",
  "قالت",
  "يقول",
  "فقال",
  "إن",
  "أو",
  "و",
  "ف",
  "ثم",
  "له",
  "لها",
  "لهم",
  "به",
  "بها",
  "منه",
  "منها",
  "عنه",
  "عنها",
  "غير",
  "سوى",
  "بين",
  "حتى",
  "إذا",
  "اذا",
  "إذ",
  "كما",
  "لكن",
  "لو",
  "إلا",
  "الا",
  "الذي",
  "التي",
  "يا",
  "أي",
  "رسول",
  "الله",
  "صلي",
  "صلى",
  "وسلم",
  "ﷺ",
  "بن",
  "بنت",
  "ابن",
  "ابنة",
  "أبو",
  "أبي",
  "أم",
]);

const MAX_KW = 18;

function normalizeCell(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  return String(v).trim();
}

function isKeywordColumnEmpty(v: string): boolean {
  return v === "" || v === "-" || v === "—";
}

function extractKeywordsFromCorpus(corpus: string): string {
  const cleaned = corpus.replace(/[،؛.٫٬»«()[\]{}:/\\٭\n\rـ]/g, " ");
  const tokens = cleaned
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of tokens) {
    const t = raw;
    if (t.length < 3) continue;
    if (STOP.has(t)) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= MAX_KW) break;
  }
  return out.length ? out.join("، ") : "";
}

function findHeaderRow(
  sheet: XLSX.WorkSheet,
  maxScan = 5,
): { row: number; map: Map<string, number> } | null {
  const range = XLSX.utils.decode_range(sheet["!ref"] ?? "A1");
  for (let r = range.s.r; r <= Math.min(range.s.r + maxScan, range.e.r); r++) {
    const map = new Map<string, number>();
    for (let c = range.s.c; c <= range.e.c; c++) {
      const addr = XLSX.utils.encode_cell({ r, c });
      const cell = sheet[addr];
      const h = normalizeCell(cell?.v);
      if (h) map.set(h, c);
    }
    if (map.has("النص") && map.has("الكلمات المفتاحية")) {
      return { row: r, map };
    }
  }
  return null;
}

function main() {
  const argv = process.argv.slice(2);
  let dryRun = false;
  let outPath: string | undefined;
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") dryRun = true;
    else if (a === "--out") {
      const next = argv[i + 1];
      if (next) {
        outPath = next;
        i++;
      }
    } else if (!a.startsWith("--")) positional.push(a);
  }
  const fileArg = positional[0];
  if (!fileArg) {
    console.error(
      "Usage: npx tsx scripts/fill-hadith-keywords-from-excel.ts <fichier.xlsx> [--out sortie.xlsx] [--dry-run]",
    );
    process.exit(1);
  }

  const abs = path.resolve(fileArg);
  if (!fs.existsSync(abs)) {
    console.error("Fichier introuvable:", abs);
    process.exit(1);
  }

  const wb = XLSX.readFile(abs);
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  if (!sheet || !sheet["!ref"]) {
    console.error("Feuille vide.");
    process.exit(1);
  }

  const found = findHeaderRow(sheet);
  if (!found) {
    console.error(
      "En-têtes attendus introuvables (lignes 1–5): « النص » et « الكلمات المفتاحية ».",
    );
    process.exit(1);
  }

  const { row: headerRow, map } = found;
  const colText = map.get("النص")!;
  const colKw = map.get("الكلمات المفتاحية")!;
  const colIndication = map.get("وجه الدلالة");
  const colWitness = map.get("الشاهد");

  const range = XLSX.utils.decode_range(sheet["!ref"]);
  let filled = 0;
  let skipped = 0;

  for (let r = headerRow + 1; r <= range.e.r; r++) {
    const addrText = XLSX.utils.encode_cell({ r, c: colText });
    const addrKw = XLSX.utils.encode_cell({ r, c: colKw });
    const text = normalizeCell(sheet[addrText]?.v);
    const kwExisting = normalizeCell(sheet[addrKw]?.v);

    if (!text) {
      skipped++;
      continue;
    }
    if (!isKeywordColumnEmpty(kwExisting)) {
      skipped++;
      continue;
    }

    let corpus = text;
    if (colIndication !== undefined) {
      corpus += " " + normalizeCell(sheet[XLSX.utils.encode_cell({ r, c: colIndication })]?.v);
    }
    if (colWitness !== undefined) {
      corpus += " " + normalizeCell(sheet[XLSX.utils.encode_cell({ r, c: colWitness })]?.v);
    }

    const generated = extractKeywordsFromCorpus(corpus);
    if (!generated) {
      skipped++;
      continue;
    }

    if (!dryRun) {
      sheet[addrKw] = { t: "s", v: generated };
    }
    filled++;
  }

  const dest = outPath ?? abs.replace(/\.xlsx$/i, "-mots-cles-remplis.xlsx");
  if (!dryRun) {
    XLSX.writeFile(wb, dest);
  }

  console.log(
    `Feuille: ${sheetName} | Lignes complétées: ${filled} | Ignorées (déjà remplies ou sans نص): ${skipped}`,
  );
  if (dryRun) {
    console.log("Mode --dry-run: aucun fichier écrit.");
  } else {
    console.log("Fichier écrit:", dest);
  }
}

main();
