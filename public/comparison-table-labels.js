(function () {
  function labelComparisonTables() {
    document.querySelectorAll("table.comparison").forEach(function (table) {
      var thead = table.querySelector("thead");
      var tbody = table.querySelector("tbody");
      if (!thead || !tbody) return;
      var headers = Array.prototype.slice.call(thead.querySelectorAll("th"));
      if (headers.length < 2) return;
      Array.prototype.forEach.call(
        tbody.querySelectorAll("tr"),
        function (row) {
          var cells = row.querySelectorAll("td");
          for (var i = 0; i < cells.length; i++) {
            var header = headers[i + 1];
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
