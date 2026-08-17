import { describe, expect, it } from "vitest";
import { babyBottleProducts } from "../src/data/products/baby-bottles";
import {
  babyBottleDiagnosis,
  babyBottleReasonDictionary,
} from "../src/data/diagnoses/baby-bottle";
import { validateDiagnosisData } from "../src/domain/diagnosis/validate";

describe("validateDiagnosisData", () => {
  it("本番の哺乳瓶データは検証を通過する", () => {
    expect(() =>
      validateDiagnosisData(
        babyBottleDiagnosis,
        babyBottleProducts,
        babyBottleReasonDictionary,
      ),
    ).not.toThrow();
  });

  it("存在しない商品IDを参照すると throw する", () => {
    const config = {
      ...babyBottleDiagnosis,
      productIds: [...babyBottleDiagnosis.productIds, "missing-product"],
    };
    expect(() =>
      validateDiagnosisData(
        config,
        babyBottleProducts,
        babyBottleReasonDictionary,
      ),
    ).toThrow(/存在しない商品/);
  });

  it("理由辞書に無い reasonCode を使うと throw する", () => {
    expect(() =>
      validateDiagnosisData(babyBottleDiagnosis, babyBottleProducts, {}),
    ).toThrow(/理由辞書/);
  });
});
