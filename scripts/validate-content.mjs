import fs from "node:fs";
import path from "node:path";
const root = "src/pages";
const files = [];
function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (p.endsWith(".astro")) files.push(p);
  }
}
walk(root);
const banned = ["大人気", "話題", "絶対におすすめ", "これ一択"];
const text = files.map((f) => fs.readFileSync(f, "utf8")).join("\n");
const bad = banned.filter((x) => text.includes(x));
if (bad.length) throw new Error(`禁止表現: ${bad.join(",")}`);
if (text.includes("example.com")) throw new Error("仮URL");
console.log(`content ok: ${files.length} pages`);
