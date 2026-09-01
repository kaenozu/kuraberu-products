import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  extractArticleIdFromPath,
  extractArticleIdsFromProduct,
  addProductArticlesToMemo,
  removeProductArticlesFromMemo,
} from "../src/lib/diagnosis-comparison-memo";
import {
  comparisonMemoStorageKey,
  comparisonMemoLimit,
  encodeComparisonMemo,
} from "../src/lib/comparison-memo";

// Node.js テスト環境では localStorage が未定義のため、モックを作成
const localStorageMock = new Map<string, string>();
const originalLocalStorage = globalThis.localStorage;

beforeEach(() => {
  localStorageMock.clear();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => localStorageMock.get(key) ?? null,
      setItem: (key: string, value: string) => localStorageMock.set(key, value),
      removeItem: (key: string) => localStorageMock.delete(key),
      clear: () => localStorageMock.clear(),
      get length() {
        return localStorageMock.size;
      },
      key: (index: number) => [...localStorageMock.keys()][index] ?? null,
    },
    writable: true,
  });
});

afterEach(() => {
  if (originalLocalStorage) {
    Object.defineProperty(globalThis, "localStorage", {
      value: originalLocalStorage,
      writable: true,
    });
  }
});

describe("diagnosis-comparison-memo", () => {
  describe("extractArticleIdFromPath", () => {
    it("extracts article id from path", () => {
      expect(extractArticleIdFromPath("/articles/pigeon-bottle-160-240/")).toBe(
        "pigeon-bottle-160-240",
      );
    });

    it("extracts article id from path without trailing slash", () => {
      expect(extractArticleIdFromPath("/articles/pigeon-bottle-160-240")).toBe(
        "pigeon-bottle-160-240",
      );
    });

    it("returns null for invalid path", () => {
      expect(extractArticleIdFromPath("/invalid/path")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(extractArticleIdFromPath("")).toBeNull();
    });

    it("handles nested paths", () => {
      expect(
        extractArticleIdFromPath("/articles/category/product/"),
      ).toBeNull();
    });
  });

  describe("extractArticleIdsFromProduct", () => {
    it("extracts article ids from product", () => {
      const product = {
        articleUrls: [
          "/articles/pigeon-bottle-160-240/",
          "/articles/pigeon-bottle-240/",
        ],
      };
      expect(extractArticleIdsFromProduct(product)).toEqual([
        "pigeon-bottle-160-240",
        "pigeon-bottle-240",
      ]);
    });

    it("filters out invalid paths", () => {
      const product = {
        articleUrls: [
          "/articles/valid-article/",
          "/invalid/path",
          "/articles/another-article",
        ],
      };
      expect(extractArticleIdsFromProduct(product)).toEqual([
        "valid-article",
        "another-article",
      ]);
    });

    it("returns empty array for no article urls", () => {
      const product = { articleUrls: [] };
      expect(extractArticleIdsFromProduct(product)).toEqual([]);
    });
  });

  describe("addProductArticlesToMemo", () => {
    const knownIds = ["article-1", "article-2", "article-3"];

    it("adds product articles to memo", () => {
      const product = {
        articleUrls: ["/articles/article-1/", "/articles/article-2/"],
      };
      const result = addProductArticlesToMemo(product, knownIds);

      expect(result.added).toEqual(["article-1", "article-2"]);
      expect(result.alreadyExists).toEqual([]);
      expect(result.atLimit).toBe(false);

      // Verify localStorage was updated
      const saved = JSON.parse(
        localStorageMock.get(comparisonMemoStorageKey) ?? "{}",
      );
      expect(saved.ids).toContain("article-1");
      expect(saved.ids).toContain("article-2");
    });

    it("does not add duplicates", () => {
      // Pre-populate memo
      localStorageMock.set(
        comparisonMemoStorageKey,
        JSON.stringify({ version: 1, ids: ["article-1"] }),
      );

      const product = {
        articleUrls: ["/articles/article-1/", "/articles/article-2/"],
      };
      const result = addProductArticlesToMemo(product, knownIds);

      expect(result.added).toEqual(["article-2"]);
      expect(result.alreadyExists).toEqual(["article-1"]);
    });

    it("respects memo limit", () => {
      // Pre-populate memo with items at the limit using knownIds
      const existingIds = Array.from(
        { length: comparisonMemoLimit },
        (_, i) => `article-${(i % 3) + 1}`,
      );
      localStorageMock.set(
        comparisonMemoStorageKey,
        encodeComparisonMemo(existingIds),
      );

      // Verify the memo is at the limit
      const saved = JSON.parse(
        localStorageMock.get(comparisonMemoStorageKey) ?? "{}",
      );
      expect(saved.ids.length).toBe(comparisonMemoLimit);

      // Try to add a new article that's not in the memo
      const product = { articleUrls: ["/articles/article-1/"] };
      const result = addProductArticlesToMemo(product, knownIds);

      // article-1 is already in the memo, so it should be in alreadyExists
      expect(result.alreadyExists).toContain("article-1");
      expect(result.added).toEqual([]);
    });
  });

  describe("removeProductArticlesFromMemo", () => {
    const knownIds = ["article-1", "article-2", "article-3"];

    it("removes product articles from memo", () => {
      localStorageMock.set(
        comparisonMemoStorageKey,
        JSON.stringify({
          version: 1,
          ids: ["article-1", "article-2", "article-3"],
        }),
      );

      const product = {
        articleUrls: ["/articles/article-1/", "/articles/article-2/"],
      };
      const result = removeProductArticlesFromMemo(product, knownIds);

      expect(result.removed).toEqual(["article-1", "article-2"]);

      // Verify localStorage was updated
      const saved = JSON.parse(
        localStorageMock.get(comparisonMemoStorageKey) ?? "{}",
      );
      expect(saved.ids).toEqual(["article-3"]);
    });

    it("does nothing if articles are not in memo", () => {
      localStorageMock.set(
        comparisonMemoStorageKey,
        JSON.stringify({ version: 1, ids: ["article-3"] }),
      );

      const product = { articleUrls: ["/articles/article-1/"] };
      const result = removeProductArticlesFromMemo(product, knownIds);

      expect(result.removed).toEqual([]);
    });
  });
});
