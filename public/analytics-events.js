(() => {
  const send = (name, props) => {
    if (typeof window.plausible === "function") {
      window.plausible(name, { props });
    }
  };

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('[data-analytics-event="OutboundClick"]');
    if (link instanceof HTMLElement) {
      send("OutboundClick", {
        product: link.dataset.analyticsProduct || "unknown",
        placement: link.dataset.placement || "unknown",
      });
      return;
    }

    const memoButton = target.closest(
      '[data-analytics-event="ComparisonMemoSave"]',
    );
    if (memoButton instanceof HTMLElement) {
      const control = memoButton.closest("[data-memo-control]");
      send("ComparisonMemoSave", {
        article:
          control instanceof HTMLElement
            ? control.dataset.articleId || "unknown"
            : "unknown",
      });
    }
  });
})();
