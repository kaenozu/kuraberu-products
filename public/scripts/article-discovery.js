// 記事検索のクライアント側絞り込み。
// normalize の仕様（NFKC → toLocaleLowerCase('ja-JP') → trim → 空白正規化）は
// src/lib/article-discovery.ts と同一に保つこと（仕様の単一情報源はTS側）。
// 変更時は両方と tests/article-discovery.test.ts を同期させる。
(() => {
  const root = document.querySelector("[data-article-discovery]");
  if (!(root instanceof HTMLElement)) return;
  const query = root.querySelector("[data-discovery-query]");
  const category = root.querySelector("[data-discovery-category]");
  const tag = root.querySelector("[data-discovery-tag]");
  const count = root.querySelector("[data-discovery-count]");
  const empty = root.querySelector("[data-discovery-empty]");
  const cards = [...root.querySelectorAll("[data-article-card]")];
  if (
    !(query instanceof HTMLInputElement) ||
    !(category instanceof HTMLSelectElement) ||
    !(tag instanceof HTMLSelectElement)
  )
    return;

  const normalize = (value) =>
    value
      .normalize("NFKC")
      .toLocaleLowerCase("ja-JP")
      .trim()
      .replace(/\s+/g, " ");
  const allowed = (select, value) =>
    [...select.options].some((option) => option.value === value) ? value : "";
  const initial = new URLSearchParams(location.search);
  query.value = (initial.get("q") || "").slice(0, 100);
  category.value = allowed(category, initial.get("category") || "");
  tag.value = allowed(tag, initial.get("tag") || "");

  const apply = () => {
    const terms = normalize(query.value).split(" ").filter(Boolean);
    let visible = 0;
    cards.forEach((card) => {
      if (!(card instanceof HTMLElement)) return;
      const tags = JSON.parse(card.dataset.tags || "[]");
      const matches =
        (!category.value || card.dataset.category === category.value) &&
        (!tag.value || tags.includes(tag.value)) &&
        terms.every((term) => (card.dataset.search || "").includes(term));
      card.hidden = !matches;
      if (matches) visible += 1;
    });
    if (count) count.textContent = visible + "件の記事";
    if (empty instanceof HTMLElement) empty.hidden = visible !== 0;
    const params = new URLSearchParams();
    if (query.value.trim()) params.set("q", query.value.trim());
    if (category.value) params.set("category", category.value);
    if (tag.value) params.set("tag", tag.value);
    history.replaceState(
      null,
      "",
      location.pathname +
        (params.size ? "?" + params.toString() : "") +
        location.hash,
    );
  };

  root
    .querySelector("[data-discovery-form]")
    ?.addEventListener("submit", (event) => event.preventDefault());
  query.addEventListener("input", apply);
  category.addEventListener("change", apply);
  tag.addEventListener("change", apply);
  root.querySelectorAll("[data-discovery-clear]").forEach((button) =>
    button.addEventListener("click", () => {
      query.value = "";
      category.value = "";
      tag.value = "";
      apply();
      query.focus();
    }),
  );
  apply();
})();
