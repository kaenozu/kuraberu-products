/**
 * 比較メモページのクライアント側ロジック。
 *
 * memo.astro の <script> タグから抽出し、メンテナンス性を向上させる。
 * localStorage 上の比較メモ（記事IDリスト）と比較プロジェクト（目的/条件/候補/判断）を
 * 画面のフォーム・リストと同期する。
 *
 * レンダリングは <template> ベースで、保存された ID の順序に
 * 該当テンプレートを cloneNode して追加する。
 * 削除時はフォーカス管理を行い、次の項目またはセクション見出しへ移動する。
 */
import { publicArticleMetadata } from "../content/articles";
import {
  comparisonMemoStorageKey,
  encodeComparisonMemo,
  sanitizeComparisonMemo,
} from "./comparison-memo";
import {
  comparisonProjectStorageKey,
  encodeComparisonProject,
  sanitizeComparisonProject,
  type ComparisonDecision,
} from "./comparison-project";

export function initMemoApp(): void {
  const root = document.querySelector("[data-memo-page]");
  if (!(root instanceof HTMLElement)) return;

  const knownIds = publicArticleMetadata.map((article) => article.id);
  const form = root.querySelector("[data-project-form]");
  const status = root.querySelector("[data-project-status]");
  const empty = root.querySelector("[data-memo-empty]");
  const list = root.querySelector("[data-memo-list]");
  const templates = [
    ...root.querySelectorAll("template[data-memo-template]"),
  ].filter(
    (entry): entry is HTMLTemplateElement =>
      entry instanceof HTMLTemplateElement,
  );
  let renderedItems: HTMLElement[] = [];
  let candidateInputs: HTMLInputElement[] = [];
  let ids: string[] = [];
  let storageAvailable = true;

  const field = (name: string) => form?.querySelector(`[name="${name}"]`);
  const fieldValue = (name: string) => {
    const input = field(name);
    return input instanceof HTMLInputElement ||
      input instanceof HTMLTextAreaElement
      ? input.value
      : "";
  };
  const setField = (name: string, value: string) => {
    const input = field(name);
    if (
      input instanceof HTMLInputElement ||
      input instanceof HTMLTextAreaElement
    )
      input.value = value;
  };
  const listValue = (name: string) =>
    fieldValue(name)
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);

  // 削除後にフォーカスが document/body へ落ちるのを防ぐ。
  // リスト上の次の項目へ、末尾削除なら前の項目へ、リストが空になったら
  // セクション見出しへフォーカスを移動する。
  const sectionHeading = root.querySelector("#saved-articles-heading");
  const moveFocusAfterRemoval = (removedIndex: number) => {
    const nextId = ids[removedIndex] ?? ids[ids.length - 1];
    const nextItem =
      nextId !== undefined && list instanceof HTMLElement
        ? list.querySelector(
            `[data-memo-item][data-article-id="${CSS.escape(nextId)}"]`,
          )
        : null;
    if (nextItem instanceof HTMLElement) {
      nextItem.tabIndex = -1;
      nextItem.focus();
    } else if (sectionHeading instanceof HTMLElement) {
      sectionHeading.tabIndex = -1;
      sectionHeading.focus();
    }
  };

  const render = () => {
    if (!(list instanceof HTMLElement)) return;
    list.replaceChildren();
    renderedItems = [];
    candidateInputs = [];
    for (const id of ids) {
      const template = templates.find(
        (entry) => entry.dataset.articleId === id,
      );
      const item = template?.content.firstElementChild?.cloneNode(true);
      if (!(item instanceof HTMLElement)) continue;
      list.appendChild(item);
      renderedItems.push(item);
      const candidate = item.querySelector("[data-project-candidate]");
      if (candidate instanceof HTMLInputElement)
        candidateInputs.push(candidate);
      const remove = item.querySelector("[data-memo-remove]");
      remove?.addEventListener("click", () => {
        const removedId = item.dataset.articleId ?? "";
        const removedIndex = ids.indexOf(removedId);
        ids = ids.filter((savedId) => savedId !== removedId);
        try {
          localStorage.setItem(
            comparisonMemoStorageKey,
            encodeComparisonMemo(ids),
          );
          render();
          moveFocusAfterRemoval(removedIndex);
        } catch {
          storageAvailable = false;
          render();
          moveFocusAfterRemoval(removedIndex);
        }
      });
    }
    if (empty instanceof HTMLElement)
      empty.hidden = !storageAvailable || renderedItems.length !== 0;
  };

  try {
    ids = [
      ...sanitizeComparisonMemo(
        localStorage.getItem(comparisonMemoStorageKey),
        knownIds,
      ).ids,
    ];
    localStorage.setItem(comparisonMemoStorageKey, encodeComparisonMemo(ids));
    const project = sanitizeComparisonProject(
      localStorage.getItem(comparisonProjectStorageKey),
      knownIds,
    );
    setField("purpose", project.purpose);
    setField("budget", project.budget);
    setField("mustHave", project.mustHave.join("\n"));
    setField("avoid", project.avoid.join("\n"));
    setField("decisionReason", project.decisionReason);
    setField("unresolved", project.unresolved.join("\n"));
    const selectedDecision = form?.querySelector(
      `[name="decision"][value="${project.decision}"]`,
    );
    if (selectedDecision instanceof HTMLInputElement)
      selectedDecision.checked = true;
    render();
    candidateInputs.forEach((input) => {
      if (input instanceof HTMLInputElement)
        input.checked = project.candidateIds.includes(input.value);
    });
  } catch {
    storageAvailable = false;
    if (status)
      status.textContent = "このブラウザでは比較メモを利用できません。";
  }

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!storageAvailable) return;
    const decisionInput = form.querySelector("input[name=decision]:checked");
    const project = sanitizeComparisonProject(
      JSON.stringify({
        version: 1,
        purpose: fieldValue("purpose"),
        budget: fieldValue("budget"),
        mustHave: listValue("mustHave"),
        avoid: listValue("avoid"),
        candidateIds: candidateInputs
          .filter(
            (input): input is HTMLInputElement =>
              input instanceof HTMLInputElement && input.checked,
          )
          .map((input) => input.value),
        decision:
          decisionInput instanceof HTMLInputElement
            ? (decisionInput.value as ComparisonDecision)
            : "undecided",
        decisionReason: fieldValue("decisionReason"),
        unresolved: listValue("unresolved"),
      }),
      knownIds,
    );
    try {
      localStorage.setItem(
        comparisonProjectStorageKey,
        encodeComparisonProject(project),
      );
      if (status) status.textContent = "比較メモを保存しました";
    } catch {
      storageAvailable = false;
      if (status)
        status.textContent =
          "保存できませんでした。ブラウザの保存設定を確認してください";
    }
  });

  render();
}
