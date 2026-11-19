// Leonida Trophy Guide — the entry program (Node 22, standard library only).
//
// What it hands in: this repository's app/ folder (the offline guide: index.html,
// styles, scripts and data) and its screenshots/, copied into the output directory,
// plus a dossier.json the judge reads. The dossier is built by the vendored make.fun
// library — vendor/makefun-frontend.ts is the kit's copy, left exactly as shipped,
// so the dossier matches byte for byte what the scorer rebuilds.
//
// Run locally with:  mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader the output directory is /output instead.

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

// The repository root: the folder this file lives in.
const repoRoot = fileURLToPath(new URL(".", import.meta.url));
// The grader hands us /output; anywhere else MAKEFUN_OUTPUT_DIR stands in.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function copyTree(sourceName) {
  const source = join(repoRoot, sourceName);
  const target = join(outputDir, sourceName);
  if (!existsSync(source)) return;
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyTree("app");
copyTree("screenshots");

// The scorer's own caps for this bounty: at most 4 screenshots of 256 KiB each,
// app/ at most 993 files and 48 MiB, and the dossier text at most 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, "dossier.json"), dossier);

// A short confirmation on stdout so a local run shows what was handed in.
console.log(`Leonida Trophy Guide: wrote ${join(outputDir, "dossier.json")} (${dossier.length} bytes)`);
