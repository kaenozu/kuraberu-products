// 記事検索のクライアント側絞り込み。
// 通常時は静的ページの12件表示、条件指定時は全公開記事の検索結果を表示する。
(() => {
  const root = document.querySelector("[data-article-discovery]");
  if (!(root instanceof HTMLElement)) return;
  const query = root.querySelector("[data-discovery-query]");
  const category = root.querySelector("[data-discovery-category]");
  const tag = root.querySelector("[data-discovery-tag]");
  const count = root.querySelector("[data-discovery-count]");
  const empty = root.querySelector("[data-discovery-empty]");
  const results = root.querySelector("[data-discovery-results]");
  const pagination = root.querySelector(".article-pagination");
  const indexNode = root.querySelector("[data-discovery-index]");
  if (
    !(query instanceof HTMLInputElement) ||
    !(category instanceof HTMLSelectElement) ||
    !(tag instanceof HTMLSelectElement) ||
    !(results instanceof HTMLElement) ||
    !(indexNode instanceof HTMLScriptElement)
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

  // 同義語辞書 — src/lib/article-discovery.ts と同一の内容に保つこと。
  const SYNONYMS = new Map([
    ["軽い", ["軽量", "重量"]],
    ["重い", ["重量"]],
    ["静か", ["静音", "騒音"]],
    ["うるさい", ["騒音"]],
    ["小さい", ["コンパクト", "幅", "奥行"]],
    ["大きい", ["容量"]],
    ["手入れ", ["洗浄", "掃除", "お手入れ"]],
    ["きれい", ["洗浄"]],
    ["暖かい", ["保温"]],
    ["冷たい", ["保冷"]],
    ["安全", ["耐熱"]],
    ["丈夫", ["耐久"]],
    ["便利", ["便利"]],
    ["安い", ["価格"]],
    ["高い", ["価格"]],
    ["広い", ["容量", "幅"]],
    ["狭い", ["寸法"]],
    ["片付け", ["収納"]],
  ]);
  const initialMarkup = results.innerHTML;
  let index = [];
  try {
    index = JSON.parse(indexNode.textContent || "[]");
  } catch {
    index = [];
  }

  const articleSearchText = (article) =>
    normalize(
      [
        article.headline,
        article.summary,
        article.category,
        ...(article.tags || []),
        ...(article.audiences || []),
        ...(article.uses || []),
        ...(Array.isArray(article.subjects) ? article.subjects : []),
      ].join(" "),
    );

  const articleSearchTextExpanded = (article) => {
    const base = articleSearchText(article);
    const synonyms = [];
    for (const [key, syns] of SYNONYMS) {
      if (base.includes(key)) synonyms.push(...syns);
    }
    return synonyms.length ? base + " " + synonyms.join(" ") : base;
  };

  const createCard = (article) => {
    const card = document.createElement("article");
    card.className = `card article-list-card${article.imagePath ? " has-image" : ""}`;
    card.dataset.articleCard = "";
    card.dataset.search = articleSearchText(article);
    card.dataset.category = article.category;
    card.dataset.tags = JSON.stringify(article.tags || []);
    if (article.imagePath) {
      const image = document.createElement("img");
      image.className = "card-thumb";
      image.src = article.imagePath;
      image.alt = article.headline;
      image.width = 132;
      image.height = 132;
      image.loading = "lazy";
      card.append(image);
    }
    const body = document.createElement("div");
    body.className = "card-body";
    const tagRow = document.createElement("span");
    tagRow.className = "card-tag-row";
    const tagLabel = document.createElement("span");
    tagLabel.className = "tag";
    tagLabel.textContent = article.category;
    tagRow.append(tagLabel);
    body.append(tagRow);
    const heading = document.createElement("h2");
    const link = document.createElement("a");
    link.href = article.path;
    link.textContent = article.headline;
    heading.append(link);
    body.append(heading);
    // コンテンツタイプタグ（静的表示の ArticleCard と統一）
    const contentType = document.createElement("span");
    contentType.className = "tag";
    contentType.textContent =
      article.productCount > 1 ? "比較記事" : "商品ガイド";
    tagRow.append(contentType);
    if (
      Array.isArray(article.subjects) &&
      article.subjects.length >= 2 &&
      article.subjects[0] &&
      article.subjects[1]
    ) {
      const subjects = document.createElement("p");
      subjects.className = "card-subjects";
      subjects.textContent = article.subjects.join(" / ");
      body.append(subjects);
    }
    if ((article.audiences || []).length > 0) {
      const audiences = document.createElement("p");
      audiences.className = "card-audiences";
      audiences.textContent = `向き: ${article.audiences.join("・")}`;
      body.append(audiences);
    }
    // 更新日表示
    if (article.modifiedAt) {
      const updated = document.createElement("p");
      updated.className = "card-date";
      updated.textContent = `更新日: ${article.modifiedAt}`;
      body.append(updated);
    }
    card.append(body);
    return card;
  };

  const initial = new URLSearchParams(location.search);
  query.value = (initial.get("q") || "").slice(0, 100);
  category.value = allowed(category, initial.get("category") || "");
  tag.value = allowed(tag, initial.get("tag") || "");

  const apply = () => {
    const queryText = normalize(query.value);
    const terms = queryText.split(" ").filter(Boolean);
    const hasFilter = Boolean(queryText || category.value || tag.value);
    let visible = 0;
    if (hasFilter) {
      const matches = index.filter(
        (article) =>
          (!category.value || article.category === category.value) &&
          (!tag.value || (article.tags || []).includes(tag.value)) &&
          terms.every((term) =>
            articleSearchTextExpanded(article).includes(term),
          ),
      );
      results.replaceChildren(...matches.map(createCard));
      visible = matches.length;
      if (pagination instanceof HTMLElement) pagination.hidden = true;
    } else {
      results.innerHTML = initialMarkup;
      visible = results.querySelectorAll("[data-article-card]").length;
      if (pagination instanceof HTMLElement) pagination.hidden = false;
    }
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
