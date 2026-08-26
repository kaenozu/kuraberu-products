#!/usr/bin/env node
/**
 * Migration: Extract structured data from manual article .astro pages
 * and output seed entries compatible with CommercialArticlePage.
 *
 * Memory-efficient: processes one file at a time, no greedy regex.
 */
import fs from "node:fs";
import path from "node:path";

const PAGES_DIR = path.resolve("src/pages/articles");
const OUTPUT_FILE = path.resolve("src/content/articles/manual-seeds.ts");

// Find all manual pages (no CommercialArticlePage)
const manualPages = [];
for (const dir of fs.readdirSync(PAGES_DIR, { withFileTypes: true })) {
  if (!dir.isDirectory() || dir.name === "index") continue;
  const pageFile = path.join(PAGES_DIR, dir.name, "index.astro");
  if (!fs.existsSync(pageFile)) continue;
  manualPages.push({ slug: dir.name, file: pageFile });
}

console.log(`Found ${manualPages.length} manual pages to migrate`);

const seeds = [];

for (const page of manualPages) {
  // Read file content
  const content = fs.readFileSync(page.file, "utf8");
  if (content.includes("CommercialArticlePage")) continue;

  const seed = { slug: page.slug };

  // Extract FAQ entries using line-by-line parsing
  const faqEntries = [];
  const lines = content.split("\n");
  let inFaq = false;
  let currentQuestion = null;
  for (const line of lines) {
    if (line.includes("const faqEntries = [")) {
      inFaq = true;
      continue;
    }
    if (inFaq) {
      if (line.trim() === "];") {
        inFaq = false;
        continue;
      }
      const qMatch = line.match(
        /(?:"question"|question)\s*:\s*["'](.+?)["']\s*,/,
      );
      if (qMatch) {
        currentQuestion = qMatch[1];
        continue;
      }
      const aMatch = line.match(/(?:"answer"|answer)\s*:\s*["'](.+?)["']\s*/);
      if (aMatch && currentQuestion) {
        faqEntries.push({ question: currentQuestion, answer: aMatch[1] });
        currentQuestion = null;
      }
    }
  }
  if (faqEntries.length > 0) seed.faqEntries = faqEntries;

  // Extract official prose
  const officialProse = [];
  let currentHeading = null;
  let inOfficial = false;
  let inUl = false;
  for (const line of lines) {
    if (
      line.includes('class="fold-section"') &&
      line.includes('id="official"')
    ) {
      inOfficial = true;
      continue;
    }
    if (inOfficial && line.includes("</details>")) {
      inOfficial = false;
      inUl = false;
      currentHeading = null;
      continue;
    }
    if (inOfficial) {
      const h3Match = line.match(/<h3>(.+)<\/h3>/);
      if (h3Match) {
        currentHeading = h3Match[1];
        continue;
      }
      if (line.includes('class="official-list"')) {
        inUl = true;
        continue;
      }
      if (inUl && line.includes("</ul>")) {
        inUl = false;
        continue;
      }
      if (inUl) {
        const liMatch = line.match(/<li>(.+)<\/li>/);
        if (liMatch && currentHeading) {
          const existing = officialProse.find(
            (s) => s.heading === currentHeading,
          );
          if (existing) {
            existing.items.push(liMatch[1]);
          } else {
            officialProse.push({
              heading: currentHeading,
              items: [liMatch[1]],
            });
          }
        }
      }
    }
  }
  if (officialProse.length > 0) seed.officialProse = officialProse;

  // Extract social proof
  const spLine = lines.find((l) => l.includes("<ArticleSocialProof"));
  if (spLine) {
    const query = spLine.match(/query="([^"]+)"/)?.[1] || "";
    const checkedAt = spLine.match(/checkedAt="([^"]+)"/)?.[1] || "";
    const hasPosts = spLine.match(/hasPosts=\{([^}]+)\}/)?.[1] === "true";
    const bestMatch = spLine.match(/bestMatch="([^"]+)"/)?.[1] || "model";

    // Find embeds within ArticleSocialProof block
    const embeds = [];
    let inSp = false;
    for (const line of lines) {
      if (line.includes("<ArticleSocialProof")) inSp = true;
      if (inSp && line.includes("</ArticleSocialProof>")) inSp = false;
      if (inSp && line.includes("<ExternalEmbed")) {
        const provider = line.match(/provider="([^"]+)"/)?.[1];
        const match = line.match(/match="([^"]+)"/)?.[1];
        const url = line.match(/url="([^"]+)"/)?.[1];
        const title = line.match(/title="([^"]+)"/)?.[1];
        const purpose = line.match(/purpose="([^"]+)"/)?.[1];
        const tone = line.match(/tone="([^"]+)"/)?.[1];
        const autoload = line.includes("autoload");
        const compact = line.includes("compact");
        if (provider && url) {
          embeds.push({
            provider,
            match: match || "model",
            url,
            title: title || "",
            purpose: purpose || "",
            tone: tone || "neutral",
            autoload,
            compact,
          });
        }
      }
    }

    seed.socialProofQuery = query;
    seed.socialProofCheckedAt = checkedAt;
    seed.socialProofHasPosts = hasPosts;
    seed.socialProofBestMatch = bestMatch;
    if (embeds.length > 0) seed.embeds = embeds;
  }

  // Extract source links
  const sourceLinks = [];
  let inSourceList = false;
  for (const line of lines) {
    if (line.includes('class="source-list"')) {
      inSourceList = true;
      continue;
    }
    if (inSourceList && line.includes("</ul>")) {
      inSourceList = false;
      continue;
    }
    if (inSourceList) {
      const linkMatch = line.match(
        /<a href="([^"]+)"[^>]*>([^<]+)<\/a>(?:（([^）]+)）)?/,
      );
      if (linkMatch) {
        sourceLinks.push({
          url: linkMatch[1],
          label: linkMatch[2].trim(),
          date: linkMatch[3]?.replace(/確認$/, "").trim() || undefined,
        });
      }
    }
  }
  if (sourceLinks.length > 0) seed.sourceLinks = sourceLinks;

  // Extract lead
  const leadLine = lines.find((l) => l.includes('class="lead"'));
  if (leadLine) {
    const leadMatch = leadLine.match(/<p\s+class="lead">([^<]+)<\/p>/);
    if (leadMatch) seed.lead = leadMatch[1].trim();
  }

  // Extract disclaimer
  let inDisclaimer = false;
  for (const line of lines) {
    if (line.includes("購入") && line.includes("注意")) {
      inDisclaimer = true;
      continue;
    }
    if (inDisclaimer && line.includes("<p>")) {
      const pMatch = line.match(/<p>([^<]+)<\/p>/);
      if (pMatch && pMatch[1].length > 50) {
        seed.disclaimer = pMatch[1].trim();
        break;
      }
    }
  }

  seeds.push(seed);
  const fields = [
    seed.faqEntries ? `faq=${seed.faqEntries.length}` : null,
    seed.officialProse ? `prose=${seed.officialProse.length}` : null,
    seed.socialProofQuery ? "social=yes" : null,
    seed.sourceLinks ? `sources=${seed.sourceLinks.length}` : null,
  ].filter(Boolean);
  console.log(`  ${page.slug}: ${fields.join(" ") || "no data"}`);
}

console.log(`\nExtracted data for ${seeds.length} articles`);

// Write output
const output = `/**
 * Auto-generated by scripts/extract-manual-seeds.mjs
 * Seed data for manual article pages to be migrated to CommercialArticlePage.
 */
import type { CommercialArticleSeed } from "./commercial";

type ManualSeed = Pick<
  CommercialArticleSeed,
  | "id"
  | "faqEntries"
  | "officialProse"
  | "socialProofQuery"
  | "socialProofCheckedAt"
  | "socialProofHasPosts"
  | "socialProofBestMatch"
  | "embeds"
  | "sourceLinks"
  | "lead"
  | "disclaimer"
>;

export const manualArticleSeeds: readonly ManualSeed[] = ${JSON.stringify(
  seeds.map((s) => ({
    id: s.slug,
    ...(s.faqEntries && { faqEntries: s.faqEntries }),
    ...(s.officialProse && { officialProse: s.officialProse }),
    ...(s.socialProofQuery && {
      socialProofQuery: s.socialProofQuery,
      socialProofCheckedAt: s.socialProofCheckedAt,
      socialProofHasPosts: s.socialProofHasPosts,
      socialProofBestMatch: s.socialProofBestMatch,
    }),
    ...(s.embeds && { embeds: s.embeds }),
    ...(s.sourceLinks && { sourceLinks: s.sourceLinks }),
    ...(s.lead && { lead: s.lead }),
    ...(s.disclaimer && { disclaimer: s.disclaimer }),
  })),
  null,
  2,
).replace(/null/g, "undefined")};
`;

fs.writeFileSync(OUTPUT_FILE, output);
console.log(`\nWrote ${OUTPUT_FILE}`);
