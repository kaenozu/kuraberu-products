import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import {
  collectImageLies,
  detectImageFormat,
  extensionFormat,
} from "../scripts/check-image-magic.mjs";

const PNG_BYTES = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.alloc(20, 0x01),
]);
const JPEG_BYTES = Buffer.concat([
  Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  Buffer.alloc(20, 0x02),
]);
const WEBP_BYTES = Buffer.concat([
  Buffer.from([0x52, 0x49, 0x46, 0x46]),
  Buffer.from([0x24, 0x00, 0x00, 0x00]),
  Buffer.from([0x57, 0x45, 0x42, 0x50]), // WEBP
  Buffer.alloc(12, 0x03),
]);
const GIF_BYTES = Buffer.concat([
  Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]),
  Buffer.alloc(12, 0x04),
]);
const AVIF_BYTES = Buffer.concat([
  Buffer.alloc(4, 0x00),
  Buffer.from([0x66, 0x74, 0x79, 0x70]), // ftyp
  Buffer.from([0x61, 0x76, 0x69, 0x66]), // avif
  Buffer.alloc(12, 0x05),
]);

describe("detectImageFormat", () => {
  it("detects each supported format from magic bytes only", () => {
    expect(detectImageFormat(PNG_BYTES)).toBe("PNG");
    expect(detectImageFormat(JPEG_BYTES)).toBe("JPEG");
    expect(detectImageFormat(WEBP_BYTES)).toBe("WEBP");
    expect(detectImageFormat(GIF_BYTES)).toBe("GIF");
    expect(detectImageFormat(AVIF_BYTES)).toBe("AVIF");
  });

  it("returns null for unknown or too-short headers", () => {
    expect(detectImageFormat(Buffer.from("hello"))).toBeNull();
    expect(detectImageFormat(Buffer.alloc(4))).toBeNull();
  });
});

describe("extensionFormat", () => {
  it("maps every catalog extension to its claimed format", () => {
    expect(extensionFormat("a.jpg")).toBe("JPEG");
    expect(extensionFormat("a.JPEG")).toBe("JPEG");
    expect(extensionFormat("a.png")).toBe("PNG");
    expect(extensionFormat("a.webp")).toBe("WEBP");
    expect(extensionFormat("a.avif")).toBe("AVIF");
    expect(extensionFormat("a.gif")).toBe("GIF");
    expect(extensionFormat("a.txt")).toBeNull();
  });
});

describe("collectImageLies (synthetic catalog)", () => {
  const cleanup: Array<() => void> = [];

  afterEach(() => {
    for (const fn of cleanup.splice(0)) fn();
  });

  function makeCatalog(files: Record<string, Buffer>) {
    const dir = mkdtempSync(join(tmpdir(), "img-magic-"));
    for (const [name, bytes] of Object.entries(files)) {
      writeFileSync(join(dir, name), bytes);
    }
    cleanup.push(() => rmSync(dir, { recursive: true, force: true }));
    return pathToFileURL(dir + "/");
  }

  it("flags a JPEG-bytes file wearing a .png extension", async () => {
    const dir = makeCatalog({
      "lies.png": JPEG_BYTES,
      "honest.jpg": JPEG_BYTES,
    });
    const lies = await collectImageLies([dir]);
    expect(lies).toHaveLength(1);
    expect(lies[0].file.endsWith("lies.png")).toBe(true);
    expect(lies[0].claimed).toBe("PNG");
    expect(lies[0].actual).toBe("JPEG");
  });

  it("flags every other mismatch direction and unknown formats", async () => {
    const dir = makeCatalog({
      "webp-as-jpg.jpg": WEBP_BYTES,
      "png-as-webp.webp": PNG_BYTES,
      "mystery.jpg": Buffer.from("not an image at all........."),
    });
    const lies = await collectImageLies([dir]);
    expect(lies.map((l) => l.actual ?? "UNKNOWN").sort()).toEqual(
      ["PNG", "UNKNOWN", "WEBP"].sort(),
    );
  });

  it("passes an honest catalog and ignores non-image files", async () => {
    const dir = makeCatalog({
      "ok.png": PNG_BYTES,
      "ok.jpg": JPEG_BYTES,
      "ok.webp": WEBP_BYTES,
      "notes.txt": Buffer.from("plain text"),
    });
    expect(await collectImageLies([dir])).toEqual([]);
  });

  it("scans multiple directories and reports which one lied", async () => {
    const assets = makeCatalog({ "a.png": PNG_BYTES });
    const publicDir = makeCatalog({ "b.png": JPEG_BYTES });
    const lies = await collectImageLies([assets, publicDir]);
    expect(lies).toHaveLength(1);
    expect(lies[0].file.includes("b.png")).toBe(true);
  });

  it("tolerates a missing directory", async () => {
    const missing = pathToFileURL(
      join(tmpdir(), "img-magic-does-not-exist") + "/",
    );
    expect(await collectImageLies([missing])).toEqual([]);
  });
});

describe("real product catalog", () => {
  it("has no extension lies in src/assets/products or public/products", async () => {
    const lies = await collectImageLies();
    expect(
      lies.map(
        (l) =>
          `${l.file} (claimed ${l.claimed}, actual ${l.actual ?? "UNKNOWN"})`,
      ),
    ).toEqual([]);
  });
});
