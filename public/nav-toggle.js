// ナビゲーション開閉のビューポート同期。
// summary はデスクトップ（≥561px）で display:none のため、
// 閉じた details の中身（navlinks）は CSS では再表示できない。
// 広い幅では details を open にしてナビを常時表示し、
// 狭い幅では閉じてモバイルのドロワー挙動（ネイティブ開閉）を維持する。
//
// marker: nav-toggle-sync
(function () {
  var mq = window.matchMedia("(min-width: 561px)");
  var details = document.querySelector("[data-nav-toggle]");
  if (!details) return;
  var summary = details.querySelector("summary");
  // 開閉状態に応じて summary のラベルを同期する（ネイティブ開閉にも追従）。
  // toggle イベントは非同期に発火するため、初期同期より先に登録する。
  details.addEventListener("toggle", function () {
    if (summary) {
      summary.setAttribute(
        "aria-label",
        details.open ? "メニューを閉じる" : "メニューを開く",
      );
    }
  });
  // 幅の変化に追従する（広い=常時表示のため開く / 狭い=ドロワーのため閉じる）。
  var syncByWidth = function () {
    details.open = mq.matches;
  };
  if (typeof mq.addEventListener === "function") {
    mq.addEventListener("change", syncByWidth);
  } else if (typeof mq.addListener === "function") {
    mq.addListener(syncByWidth);
  }
  // 初期同期。open 変更は上の toggle リスナー経由でラベルも連動する。
  syncByWidth();
})();
