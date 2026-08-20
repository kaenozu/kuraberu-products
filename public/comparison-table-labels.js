(function () {
  function labelComparisonTables() {
    document.querySelectorAll("table.comparison").forEach(function (table) {
      const thead = table.querySelector("thead");
      const tbody = table.querySelector("tbody");
      if (!thead || !tbody) return;
      const headers = Array.prototype.slice.call(thead.querySelectorAll("th"));
      if (headers.length < 2) return;
      Array.prototype.forEach.call(
        tbody.querySelectorAll("tr"),
        function (row) {
          const cells = row.querySelectorAll("td");
          for (let i = 0; i < cells.length; i++) {
            const header = headers[i + 1];
            if (header && !cells[i].hasAttribute("data-label")) {
              cells[i].setAttribute("data-label", header.textContent.trim());
            }
          }
        },
      );
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", labelComparisonTables);
  } else {
    labelComparisonTables();
  }
})();
