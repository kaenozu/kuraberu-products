import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const verifierSource = readFileSync(
  "tools/production/Invoke-PostDeployVerification.ps1",
  "utf8",
);

describe("post-deploy top-page semantic gate (#602)", () => {
  it("derives latest article from the exact built top page", () => {
    expect(verifierSource).toContain("dist/index.html");
    expect(verifierSource).toContain("$expectedLatestArticlePath");
    expect(verifierSource).toContain("data-top-latest");
    expect(verifierSource).toContain(
      "Expected latest article from exact build",
    );

    // 新着記事を検証スクリプトへ固定値で埋め込まず、exact build の
    // data-top-latest 先頭リンクから導出する契約を固定する。
    expect(verifierSource).toContain("$expectedLatestLink = [regex]::Match(");
    expect(verifierSource).toContain(
      "$expectedLatestArticlePath = $expectedLatestLink.Groups['href'].Value",
    );
    expect(verifierSource).not.toMatch(
      /expectedLatestArticlePath\s*=\s*["']\/articles\/[^"']+\/["']/,
    );
  });

  it("fails a stale or incomplete public top page", () => {
    expect(verifierSource).toContain("Top build-sha present /");
    expect(verifierSource).toContain("Top build-sha matches /");
    expect(verifierSource).toContain("Top latest section /");
    expect(verifierSource).toContain("Top latest article matches exact build");
    expect(verifierSource).toContain(
      "[regex]::Escape($expectedLatestArticlePath)",
    );

    // これらは既存の Check() を通るため、失敗時に hasFailure=true となり、
    // CDN propagation の retry 単位から外れない。
    expect(verifierSource).toMatch(
      /function Check[\s\S]*\$script:hasFailure\s*=\s*\$true/,
    );
    expect(verifierSource).toMatch(
      /while \(\$true\)[\s\S]*Invoke-VerificationAttempt[\s\S]*Waiting .*CDN edge propagation/,
    );
  });

  it("records the derived expectation in deployment evidence", () => {
    expect(verifierSource).toMatch(
      /expectedLatestArticlePath\s*=\s*\$expectedLatestArticlePath/,
    );
    expect(verifierSource).toContain("Expected latest article:");
  });
});

describe("post-deploy newest-article smoke check", () => {
  it("fetches the exact-build-derived newest article page, never a hardcoded path", () => {
    expect(verifierSource).toContain("Newest article HTTP");
    expect(verifierSource).toContain("Newest article HTML content type");
    // 新着記事は静的リスト $ArticlePaths に依存せず、exact build の
    // data-top-latest から導出したパスを必ず fetch する契約を固定する。
    expect(verifierSource).toContain(
      "$ArticlePaths -contains $expectedLatestArticlePath",
    );
    expect(verifierSource).toMatch(
      /\$latestUri = \[uri\]::new\(\$BaseUrl, \$expectedLatestArticlePath\)/,
    );
  });

  it("asserts the page actually renders and comes from the exact build", () => {
    // 「render している」= 空シェルでない実体 HTML が返っていること。
    expect(verifierSource).toContain("Newest article renders");
    expect(verifierSource).toMatch(
      /Check 'Newest article renders' \$hasBody "htmlLength=/,
    );
    expect(verifierSource).toContain("Newest article build-sha present");
    expect(verifierSource).toContain("Newest article build-sha matches");
  });

  it("fails the run when the newest article does not render", () => {
    // 失敗は Check() → hasFailure=true → 最終試行 BLOCKER → exit 1 で
    // run 全体を失敗させる。
    expect(verifierSource).toContain("Newest article renders");
    expect(verifierSource).toMatch(
      /function Check[\s\S]*\$script:hasFailure\s*=\s*\$true/,
    );
    expect(verifierSource).toMatch(
      /if \(\$attemptResult\.hasFailure\) \{ exit 1 \}/,
    );
  });

  it("records the newest article in the pages evidence", () => {
    expect(verifierSource).toContain(
      "$pages.Add([ordered]@{ path = $expectedLatestArticlePath",
    );
  });
});
