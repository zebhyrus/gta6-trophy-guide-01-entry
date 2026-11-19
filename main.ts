// Leonida Trophy Guide entry (Node 22, standard library only).
//
// The guide itself is plain static files under app/: index.html, style.css,
// app.js, and data/trophies.json plus data/roadmap.json. A browser opens
// app/index.html and the guide works with the network off. This program
// hands the guide in: it copies app/ and screenshots/ beside this file
// into the output directory and writes dossier.json there, using the
// vendored make.fun library, which must stay byte for byte the kit's copy.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-frontend.ts";

const repoRoot = fileURLToPath(new URL(".", import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

function copyEntryTree(name) {
  const from = join(repoRoot, name);
  if (!existsSync(from)) return;
  cpSync(from, join(outputDir, name), { recursive: true });
}

mkdirSync(outputDir, { recursive: true });
copyEntryTree("app");
copyEntryTree("screenshots");

// The scorer's own caps, from the kit's reference/gate.json: the text cap
// shapes the dossier's bytes; the others refuse an entry the scorer would
// refuse (more than 4 screenshots or one over 256 KiB; more than 993 files
// and directories in app/ or 48 MiB of app files, which share /output's
// own 1000-entry cap with screenshots/ and dossier.json).
const dossierText = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
});
writeFileSync(join(outputDir, "dossier.json"), dossierText);
console.log("wrote " + join(outputDir, "dossier.json") + " (" + dossierText.length + " bytes)");
