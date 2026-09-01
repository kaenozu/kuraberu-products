/**
 * E2E verification: exercises the diagnosis-comparison-memo module.
 * Pure functions tested directly; localStorage-dependent functions tested with mock.
 */
import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  extractArticleIdFromPath,
  extractArticleIdsFromProduct,
  loadComparisonMemo,
  saveComparisonMemo,
  addProductArticlesToMemo,
  removeProductArticlesFromMemo,
  isProductInMemo,
} from "../src/lib/diagnosis-comparison-memo";
import {
  comparisonMemoStorageKey,
  encodeComparisonMemo,
  type ComparisonMemoState,
} from "../src/lib/comparison-memo";

// --- localStorage mock ---
function setupLocalStorage() {
  const store = new Map<string, string>();
  const mock = {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    get length() {
      return store.size;
    },
    key: vi.fn((_i: number) => null),
  };
  Object.defineProperty(globalThis, "localStorage", {
    value: mock,
    writable: true,
  });
  return { store, mock };
}

describe("E2E: extractArticleIdFromPath", () => {
  it("extracts article ID from standard path", () => {
    expect(extractArticleIdFromPath("/articles/pigeon-bottle-160-240/")).toBe(
      "pigeon-bottle-160-240",
    );
  });

  it("extracts article ID without trailing slash", () => {
    expect(extractArticleIdFromPath("/articles/combi-milk-cup")).toBe(
      "combi-milk-cup",
    );
  });

  it("returns null for non-article paths", () => {
    expect(
      extractArticleIdFromPath("/tools/product-finder/baby-bottle"),
    ).toBeNull();
    expect(extractArticleIdFromPath("/memo")).toBeNull();
    expect(extractArticleIdFromPath("")).toBeNull();
  });

  it("handles nested paths (not article root)", () => {
    expect(
      extractArticleIdFromPath("/articles/some-article/sub-page"),
    ).toBeNull();
  });
});

describe("E2E: extractArticleIdsFromProduct", () => {
  it("extracts multiple IDs from product articleUrls", () => {
    const product = {
      articleUrls: [
        "/articles/pigeon-160/",
        "/articles/combi-240/",
        "/tools/product-finder/baby-bottle",
      ],
    };
    const ids = extractArticleIdsFromProduct(product);
    expect(ids).toEqual(["pigeon-160", "combi-240"]);
  });

  it("returns empty array when no article paths", () => {
    const product = { articleUrls: [] };
    expect(extractArticleIdsFromProduct(product)).toEqual([]);
  });

  it("filters out invalid paths", () => {
    const product = {
      articleUrls: ["/articles/valid-id/", "/invalid/path", ""],
    };
    expect(extractArticleIdsFromProduct(product)).toEqual(["valid-id"]);
  });
});

describe("E2E: Full memo lifecycle (add → check → remove)", () => {
  let store: Map<string, string>;
  const knownIds = ["pigeon-160", "combi-240", "baby-bottle-guide"];

  beforeEach(() => {
    setupLocalStorage();
    store = (globalThis.localStorage as any)._store;
  });

  it("add product articles → check included → remove → check excluded", () => {
    const product = {
      articleUrls: ["/articles/pigeon-160/", "/articles/combi-240/"],
    };

    // Initially empty
    expect(isProductInMemo(product, knownIds)).toBe(false);

    // Add
    const addResult = addProductArticlesToMemo(product, knownIds);
    expect(addResult.added).toEqual(["pigeon-160", "combi-240"]);
    expect(addResult.alreadyExists).toEqual([]);
    expect(addResult.atLimit).toBe(false);

    // Check included
    expect(isProductInMemo(product, knownIds)).toBe(true);

    // Add again — should detect already exists
    const addAgain = addProductArticlesToMemo(product, knownIds);
    expect(addAgain.added).toEqual([]);
    expect(addAgain.alreadyExists).toEqual(["pigeon-160", "combi-240"]);

    // Remove
    const removeResult = removeProductArticlesFromMemo(product, knownIds);
    expect(removeResult.removed).toEqual(["pigeon-160", "combi-240"]);

    // Check excluded
    expect(isProductInMemo(product, knownIds)).toBe(false);
  });

  it("partial add + remove works correctly", () => {
    const productA = { articleUrls: ["/articles/pigeon-160/"] };
    const productB = { articleUrls: ["/articles/combi-240/"] };

    // Add product A
    addProductArticlesToMemo(productA, knownIds);
    expect(isProductInMemo(productA, knownIds)).toBe(true);
    expect(isProductInMemo(productB, knownIds)).toBe(false);

    // Add product B
    addProductArticlesToMemo(productB, knownIds);
    expect(isProductInMemo(productB, knownIds)).toBe(true);

    // Remove only A — B stays
    removeProductArticlesFromMemo(productA, knownIds);
    expect(isProductInMemo(productA, knownIds)).toBe(false);
    expect(isProductInMemo(productB, knownIds)).toBe(true);
  });

  it("save/load roundtrip through localStorage", () => {
    const product = { articleUrls: ["/articles/pigeon-160/"] };
    addProductArticlesToMemo(product, knownIds);

    // Verify localStorage was called
    expect(globalThis.localStorage.setItem).toHaveBeenCalled();

    // Read back from the same store
    const loaded = loadComparisonMemo(knownIds);
    expect(loaded.ids).toContain("pigeon-160");
  });
});
