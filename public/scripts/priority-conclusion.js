(() => {
  const verified = (evaluation) =>
    evaluation.status === "official" && evaluation.score !== undefined;
  const resolve = (selectedId, options, labels, standard) => {
    const option = options.find((candidate) => candidate.id === selectedId);
    if (!option)
      return {
        outcome: "standard",
        heading: standard.heading,
        summary: standard.summary,
        reasons: [],
        caution: standard.caution,
        evidenceHref: standard.evidenceHref,
      };
    const reasons = [
      `${labels.left}：${option.left.reason}`,
      `${labels.right}：${option.right.reason}`,
    ];
    if (!verified(option.left) || !verified(option.right))
      return {
        selectedId: option.id,
        outcome: "unknown",
        heading: `${option.label}：判断材料不足`,
        summary:
          "確認済みの記事データだけでは一方を選べません。価格・在庫などは購入時点の販売ページで確認してください。",
        reasons,
        caution: option.caution,
        evidenceHref: option.evidenceHref,
      };
    if (option.left.score === option.right.score)
      return {
        selectedId: option.id,
        outcome: "tie",
        heading: `${option.label}：確認済みデータ上は同点`,
        summary:
          "この重視ポイントだけでは一方に絞れません。ほかの比較軸と実際の合いやすさも確認してください。",
        reasons,
        caution: option.caution,
        evidenceHref: option.evidenceHref,
      };
    const leftWins = option.left.score > option.right.score;
    const winner = leftWins ? labels.left : labels.right;
    return {
      selectedId: option.id,
      outcome: leftWins ? "left" : "right",
      heading: `${option.label}：${winner}を先に確認`,
      summary: `記事内で公式確認済みの項目では、${winner}がこの重視ポイントに対応する機能を多く示しています。`,
      reasons,
      caution: option.caution,
      evidenceHref: option.evidenceHref,
    };
  };
  document.querySelectorAll("[data-priority-conclusion]").forEach((root) => {
    if (!(root instanceof HTMLElement) || root.dataset.priorityBound === "true")
      return;
    root.dataset.priorityBound = "true";
    const dataNode = root.querySelector("[data-priority-data]");
    if (!(dataNode instanceof HTMLScriptElement)) return;
    const payload = JSON.parse(dataNode.textContent || "{}");
    const heading = root.querySelector("[data-priority-heading]");
    const summary = root.querySelector("[data-priority-summary]");
    const reasons = root.querySelector("[data-priority-reasons]");
    const caution = root.querySelector("[data-priority-caution]");
    const evidence = root.querySelector("[data-priority-evidence]");
    const radios = [...root.querySelectorAll('input[name="priority"]')].filter(
      (node) => node instanceof HTMLInputElement,
    );
    const render = (selectedId) => {
      const result = resolve(
        selectedId,
        payload.options,
        payload.labels,
        payload.standard,
      );
      if (heading) heading.textContent = result.heading;
      if (summary) summary.textContent = result.summary;
      if (caution) caution.textContent = result.caution;
      if (evidence instanceof HTMLAnchorElement)
        evidence.href = result.evidenceHref;
      if (reasons instanceof HTMLUListElement) {
        reasons.replaceChildren(
          ...result.reasons.map((reason) => {
            const item = document.createElement("li");
            item.textContent = reason;
            return item;
          }),
        );
        reasons.hidden = result.reasons.length === 0;
      }
      radios.forEach((radio) => {
        radio.checked = radio.value === (result.selectedId || "");
      });
      const params = new URLSearchParams(location.search);
      if (result.selectedId) params.set("priority", result.selectedId);
      else params.delete("priority");
      history.replaceState(
        null,
        "",
        location.pathname +
          (params.size ? `?${params.toString()}` : "") +
          location.hash,
      );
    };
    const value = new URLSearchParams(location.search)
      .get("priority")
      ?.normalize("NFKC")
      .trim();
    const initial =
      value && payload.options.some((option) => option.id === value)
        ? value
        : undefined;
    radios.forEach((radio) =>
      radio.addEventListener("change", () => render(radio.value || undefined)),
    );
    render(initial);
  });
})();
