import { describe, expect, it } from "vitest";
import { publicArticleMetadata } from "../src/content/articles";
import { comparisonSubjects } from "../src/lib/article-subjects";

const article = (overrides: {
  productCount?: number;
  headline?: string;
  title?: string;
  aboutProductNames?: readonly string[];
}) => ({
  productCount: 2,
  headline: "見出し",
  title: "タイトル｜くらべる商品メモ",
  ...overrides,
});

describe("comparisonSubjects", () => {
  it("uses aboutProductNames when declared", () => {
    expect(
      comparisonSubjects(
        article({
          aboutProductNames: ["サーモス JNL-S500", "タイガー MTA-J050"],
        }),
      ),
    ).toEqual(["サーモス JNL-S500", "タイガー MTA-J050"]);
  });

  it("extracts the 「A」と「B」 pair from the headline", () => {
    expect(
      comparisonSubjects(
        article({
          headline:
            "サーモスとタイガーの水筒、どっち？「JNL-S500」と「MTA-J050」を比較",
        }),
      ),
    ).toEqual(["JNL-S500", "MTA-J050"]);
  });

  it("extracts the plain A と B、どっち？ pair from the title", () => {
    expect(
      comparisonSubjects(
        article({
          headline: "コードレス掃除機を比較。吸引・軽さ・ゴミ捨てで選ぶ",
          title:
            "ダイソン V12 Detect SlimとShark EVOPOWER、どっち？｜くらべる商品メモ",
        }),
      ),
    ).toEqual(["ダイソン V12 Detect Slim", "Shark EVOPOWER"]);
  });

  it("extracts the plain A と B、どっち？ pair from the headline", () => {
    expect(
      comparisonSubjects(
        article({
          headline:
            "パナソニック NT-T501とNT-D700、どっち？ 公式仕様で比較。違いと選び方を整理",
        }),
      ),
    ).toEqual(["パナソニック NT-T501", "NT-D700"]);
  });

  it("extracts the A と B を比較 pair from the headline", () => {
    expect(
      comparisonSubjects(
        article({
          headline:
            "タイガー MTA-J050とMTA-J080を比較。容量・重さ・保温保冷の違い",
        }),
      ),
    ).toEqual(["タイガー MTA-J050", "MTA-J080"]);
  });

  it("returns null for guides (productCount = 1)", () => {
    expect(comparisonSubjects(article({ productCount: 1 }))).toBeNull();
  });

  it("returns null when no pair can be derived", () => {
    expect(
      comparisonSubjects(
        article({
          headline: "人気の枕を比較。素材・高さ調整で選ぶ",
          title: "枕の比較｜くらべる商品メモ",
        }),
      ),
    ).toBeNull();
  });
});

describe("comparisonSubjects coverage over the article registry", () => {
  it("derives a non-empty pair for every comparison article", () => {
    const missing = publicArticleMetadata
      .filter((article) => article.productCount === 2)
      .filter((article) => comparisonSubjects(article) === null)
      .map((article) => article.id);
    expect(missing).toEqual([]);
  });

  it("derives no pair for guide articles", () => {
    const unexpected = publicArticleMetadata
      .filter((article) => article.productCount === 1)
      .filter((article) => comparisonSubjects(article) !== null)
      .map((article) => article.id);
    expect(unexpected).toEqual([]);
  });
});
