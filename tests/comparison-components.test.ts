import fs from "node:fs";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { describe, expect, it } from "vitest";
import DifferenceList from "../src/components/DifferenceList.astro";
import ThirtySecondComparison from "../src/components/ThirtySecondComparison.astro";
import {
  normalizeIdPrefix,
  normalizeVerificationStatus,
  verificationStatusLabel,
  type ComparisonCandidate,
} from "../src/lib/comparison";

const left: ComparisonCandidate = {
  product: "非常に長い商品カテゴリ名でも折り返して表示できる候補商品",
  line: "候補Aの長い商品名",
  tone: "premium",
  audience: "候補Aを確認したい人",
  note: "一次情報を確認",
  status: "official",
};

const right: ComparisonCandidate = {
  product: "非常に長い商品カテゴリ名でも折り返して表示できる候補商品",
  line: "候補Bの長い商品名",
  tone: "standard",
  audience: "候補Bを確認したい人",
  note: "一次情報を確認",
  status: "unexpected-status",
};

describe("comparison helpers", () => {
  it("normalizes id prefixes and prevents invalid leading characters", () => {
    expect(normalizeIdPrefix("  First Section  ")).toBe("first-section");
    expect(normalizeIdPrefix("123 section")).toBe("comparison-123-section");
    expect(normalizeIdPrefix("比較", "fallback-id")).toBe("fallback-id");
  });

  it("falls back unknown verification statuses safely", () => {
    expect(normalizeVerificationStatus("official")).toBe("official");
    expect(normalizeVerificationStatus("unexpected-status")).toBe("unverified");
    expect(verificationStatusLabel("unexpected-status")).toBe("未確認");
  });
});

describe("generic comparison components", () => {
  it("renders caller labels and unique heading ids for multiple instances", async () => {
    const container = await AstroContainer.create();
    const first = await container.renderToString(ThirtySecondComparison, {
      props: {
        idPrefix: "comparison-one",
        heading: "最初の比較",
        conclusion: "候補を比較します。",
        left,
        right,
        rows: [{ label: "比較軸", left: "左", right: "右" }],
        detailHref: "#details-one",
      },
    });
    const second = await container.renderToString(ThirtySecondComparison, {
      props: {
        idPrefix: "comparison-two",
        heading: "次の比較",
        conclusion: "別の候補を比較します。",
        left,
        right,
        rows: [{ label: "別の軸", left: "左2", right: "右2" }],
        detailHref: "#details-two",
      },
    });

    expect(first).toContain('id="comparison-one-heading"');
    expect(second).toContain('id="comparison-two-heading"');
    expect(first).not.toContain('id="comparison-two-heading"');
    expect(first).toContain("候補Aの長い商品名");
    expect(first).toContain("候補Bの長い商品名");
    expect(first).toContain("確認状態: 未確認");
  });

  it("renders empty comparison rows without broken list markup", async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(ThirtySecondComparison, {
      props: {
        idPrefix: "empty-summary",
        heading: "空データ",
        conclusion: "比較準備中です。",
        left,
        right,
        rows: [],
        detailHref: "#empty-details",
        emptyMessage: "比較行はありません。",
      },
    });

    expect(html).toContain("比較行はありません。");
    expect(html).not.toContain('class="summary-differences"');
  });

  it("renders difference labels, unknown statuses, and empty state", async () => {
    const container = await AstroContainer.create();
    const populated = await container.renderToString(DifferenceList, {
      props: {
        idPrefix: "difference-one",
        leftLabel: "左の商品名",
        rightLabel: "右の商品名",
        items: [
          {
            label: "比較項目",
            left: "左の内容",
            right: "右の内容",
            leftStatus: "official",
            rightStatus: "unknown",
          },
        ],
      },
    });
    const empty = await container.renderToString(DifferenceList, {
      props: {
        idPrefix: "difference-empty",
        leftLabel: "左",
        rightLabel: "右",
        items: [],
      },
    });

    expect(populated).toContain('id="difference-one-heading"');
    expect(populated).toContain("左の商品名");
    expect(populated).toContain("右の商品名");
    expect(populated).toContain("公式確認済み");
    expect(populated).toContain("未確認");
    expect(empty).toContain("比較できる差分はまだありません。");
  });

  it("keeps product-specific copy outside generic components", () => {
    const differenceSource = fs.readFileSync(
      "src/components/DifferenceList.astro",
      "utf8",
    );
    const summarySource = fs.readFileSync(
      "src/components/ThirtySecondComparison.astro",
      "utf8",
    );

    for (const source of [differenceSource, summarySource]) {
      expect(source).not.toContain("パンパース");
      expect(source).not.toContain("肌へのいちばん");
      expect(source).not.toContain("さらさらケア");
      expect(source).not.toContain('id="difference-heading"');
      expect(source).not.toContain('id="thirty-second-heading"');
    }
  });
});
