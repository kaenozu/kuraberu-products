// スクロール中も見失わない sticky 比較バー（水筒記事ほか比較記事用）
// CSP script-src 'self' のため public/ に置き <script src> で読み込む（contact.js と同方式）。
// Astro バンドルを通すと小さいスクリプトがインライン化され CSP にブロックされるため。
(function () {
  var bar = document.getElementById("sticky-compare-bar");
  var keyDiffSection = document.getElementById("key-differences");
  if (!bar || !keyDiffSection) return;
  // 主要差分セクションが画面内にある間だけ固定バーを表示する。
  // ヘッダー（72px）と下部の20%は判定範囲から外し、見え始め〜見え終わりを検知する。
  var observer = new IntersectionObserver(
    function (entries) {
      bar.hidden = !entries[0].isIntersecting;
    },
    { rootMargin: "-72px 0px -20% 0px", threshold: 0 },
  );
  observer.observe(keyDiffSection);
})();
