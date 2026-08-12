// お問い合わせフォーム送信処理
// public/ に置いた静的 JS（/_astro バンドルを通さない）→ CSP script-src 'self' で許可される
(function () {
  "use strict";
  var form = document.getElementById("contact-form");
  var result = document.getElementById("contact-result");
  if (!form || !result) {
    return;
  }
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    var submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "送信中…";
    }
    var failMessage =
      "送信に失敗しました。しばらくしてからもう一度お試しいただくか、X（@kuraberu_biyori）の DM でご連絡ください。";
    try {
      var res = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
      });
      var data = await res.json().catch(function () {
        return { ok: false };
      });
      result.hidden = false;
      if (res.ok && data.ok) {
        result.textContent = "送信しました。お問い合わせありがとうございます。";
        result.className = "contact-result success";
        form.reset();
      } else {
        result.textContent = failMessage;
        result.className = "contact-result error";
      }
    } catch (err) {
      result.hidden = false;
      result.textContent = failMessage;
      result.className = "contact-result error";
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "送信する";
      }
    }
  });
})();
