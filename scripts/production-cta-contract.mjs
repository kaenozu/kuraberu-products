function parseTagAttributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([a-z_:][-a-z0-9_:.]*)\s*=\s*["']([^"']*)["']/gi)].map(
      (match) => [match[1].toLowerCase(), match[2]],
    ),
  );
}

export function validateProductionCtas(articleHtml, file = "article.html") {
  const errors = [];
  const requiredProductIds = [
    "pampers-premium-newborn",
    "pampers-sarasara-newborn",
  ];
  const ctas = [...articleHtml.matchAll(/<a\b[^>]*>/gi)]
    .map((match) => parseTagAttributes(match[0]))
    .filter(
      (attributes) =>
        (attributes.class ?? "").split(/\s+/).includes("cta") &&
        attributes["data-product-id"],
    );

  for (const productId of requiredProductIds) {
    const productCtas = ctas.filter(
      (attributes) => attributes["data-product-id"] === productId,
    );
    if (productCtas.length !== 1) {
      errors.push(
        `${file}: expected exactly one production CTA for ${productId}, found ${productCtas.length}`,
      );
      continue;
    }
    const [cta] = productCtas;
    let allowedHost = false;
    try {
      const url = new URL(cta.href ?? "");
      allowedHost =
        url.protocol === "https:" &&
        (url.hostname === "rakuten.co.jp" ||
          url.hostname.endsWith(".rakuten.co.jp") ||
          url.hostname === "r10.to");
    } catch {
      allowedHost = false;
    }
    if (!allowedHost) {
      errors.push(
        `${file}: production CTA ${productId} has an unapproved HTTPS host`,
      );
    }
    const rel = new Set((cta.rel ?? "").split(/\s+/).filter(Boolean));
    if (!rel.has("sponsored") || !rel.has("nofollow")) {
      errors.push(
        `${file}: production CTA ${productId} must include rel=sponsored nofollow`,
      );
    }
  }
  return errors;
}
