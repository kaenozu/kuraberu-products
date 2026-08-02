import { describe, expect, it } from "vitest";
import { selectRakutenProduct, type RakutenProduct } from "../src/lib/rakuten";

const product = (
  id: string,
  name: string,
  overrides: Partial<RakutenProduct> = {},
): RakutenProduct => ({
  id,
  name,
  url: `https://item.rakuten.co.jp/shop/${id}`,
  price: 1980,
  ...overrides,
});

const premium66 = product(
  "shop:premium-66",
  "パンパース 肌へのいちばん 新生児 テープ 66枚",
  { affiliateUrl: "https://hb.afl.rakuten.co.jp/hgc/premium-66" },
);
const premium90 = product(
  "shop:premium-90",
  "パンパース 肌へのいちばん 新生児 テープ 90枚",
);

describe("selectRakutenProduct", () => {
  it("selects the same product when API order is reversed or shuffled", () => {
    const criteria = {
      excludedTerms: ["90枚"],
      exactIdentifiers: ["shop:premium-66"],
    };
    const first = selectRakutenProduct(
      [premium90, premium66],
      ["パンパース", "肌へのいちばん", "新生児", "テープ"],
      criteria,
    );
    const second = selectRakutenProduct(
      [premium66, premium90],
      ["パンパース", "肌へのいちばん", "新生児", "テープ"],
      criteria,
    );
    expect(first?.id).toBe("shop:premium-66");
    expect(second?.id).toBe(first?.id);
  });

  it("requires every required term", () => {
    expect(
      selectRakutenProduct([premium66], ["パンパース", "さらさらケア"]),
    ).toBeUndefined();
  });

  it("excludes another capacity, count, set product, and old model", () => {
    const candidates = [
      premium66,
      product("shop:large", "パンパース 肌へのいちばん 新生児 テープ 90枚"),
      product(
        "shop:set",
        "パンパース 肌へのいちばん 新生児 テープ 66枚 2パックセット",
      ),
      product("shop:old", "パンパース 肌へのいちばん 新生児 旧モデル 66枚"),
    ];
    expect(
      selectRakutenProduct(
        candidates,
        ["パンパース", "肌へのいちばん", "新生児"],
        {
          excludedTerms: ["90枚", "2パック", "セット", "旧モデル"],
        },
      )?.id,
    ).toBe("shop:premium-66");
  });

  it("supports an exact item code and fails closed when it does not match", () => {
    expect(
      selectRakutenProduct([premium66, premium90], ["パンパース"], {
        exactItemCodes: ["shop:premium-90"],
      })?.id,
    ).toBe("shop:premium-90");
    expect(
      selectRakutenProduct([premium66], ["パンパース"], {
        exactItemCodes: ["shop:missing"],
      }),
    ).toBeUndefined();
  });

  it("supports an exact JAN or model identifier without prefix matches", () => {
    const identified = product(
      "shop:model-a",
      "パンパース 新生児 テープ 型番 AB-123 4902430900001",
    );
    expect(
      selectRakutenProduct([identified], ["パンパース", "新生児"], {
        exactIdentifiers: ["4902430900001"],
      })?.id,
    ).toBe("shop:model-a");
    expect(
      selectRakutenProduct([identified], ["パンパース"], {
        exactIdentifiers: ["490243090000"],
      }),
    ).toBeUndefined();
  });

  it("returns undefined for zero, ambiguous, and same-score candidates", () => {
    const sameScore = [
      product("shop:a", "パンパース 新生児 テープ 66枚"),
      product("shop:b", "パンパース 新生児 テープ 66枚"),
    ];
    expect(selectRakutenProduct([], ["パンパース"])).toBeUndefined();
    expect(selectRakutenProduct(sameScore, ["パンパース"])).toBeUndefined();
    expect(
      selectRakutenProduct([premium66, premium90], ["パンパース", "新生児"]),
    ).toBeUndefined();
  });

  it("does not use affiliate URL presence or input order as a tie breaker", () => {
    const withoutAffiliate = product(
      "shop:no-ad",
      "パンパース 新生児 テープ 66枚",
    );
    const withAffiliate = product("shop:ad", "パンパース 新生児 テープ 66枚", {
      affiliateUrl: "https://hb.afl.rakuten.co.jp/hgc/ad",
    });
    expect(
      selectRakutenProduct(
        [withAffiliate, withoutAffiliate],
        ["パンパース", "新生児"],
      ),
    ).toBeUndefined();
  });

  it("normalizes long names, full-width text, and whitespace", () => {
    expect(
      selectRakutenProduct(
        [
          product(
            "shop:normalized",
            "パンパース　肌へのいちばん 新生児　テープ　６６枚",
          ),
        ],
        ["パンパース", "肌へのいちばん", "新生児", "テープ", "66枚"],
      )?.id,
    ).toBe("shop:normalized");
  });

  it("handles empty and invalid conditions safely", () => {
    expect(selectRakutenProduct([premium66], [])).toBe(premium66);
    expect(selectRakutenProduct([premium66], [""])).toBeUndefined();
    expect(
      selectRakutenProduct([premium66], ["パンパース"], {
        excludedTerms: [""],
      }),
    ).toBeUndefined();
    expect(
      selectRakutenProduct([premium66], ["パンパース"], {
        exactIdentifiers: ["shop:missing"],
      }),
    ).toBeUndefined();
  });
});
