// YouTube Shorts Hider - content script
// CSS だけでは拾いきれない要素の非表示と、/shorts/ URL のリダイレクトを行う。

(() => {
  "use strict";

  const HIDE_CLASS = "ysh-hide-shorts";
  let enabled = true;

  // ---- 有効/無効の反映 -------------------------------------------------

  function applyEnabledState() {
    document.documentElement.classList.toggle(HIDE_CLASS, enabled);
    if (enabled) {
      redirectIfShortsPage();
      hideDynamicElements();
    }
  }

  chrome.storage.sync.get({ enabled: true }, (items) => {
    enabled = items.enabled;
    applyEnabledState();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "sync" && changes.enabled) {
      enabled = changes.enabled.newValue;
      applyEnabledState();
    }
  });

  // ---- /shorts/ ページを通常プレイヤーへリダイレクト -------------------

  function redirectIfShortsPage() {
    const match = location.pathname.match(/^\/shorts\/([\w-]{5,})/);
    if (match) {
      location.replace(`${location.origin}/watch?v=${match[1]}`);
    }
  }

  // ---- CSS で拾えない要素の非表示 --------------------------------------

  // テキストラベルでしか判別できない要素(棚のタイトルが「ショート」等)を隠す。
  const SHELF_SELECTOR = [
    "ytd-rich-section-renderer",
    "ytd-shelf-renderer",
    "grid-shelf-view-model",
  ].join(",");

  const SHORTS_TITLE = /^(shorts|ショート)$/i;

  function hideDynamicElements() {
    if (!enabled) return;
    for (const shelf of document.querySelectorAll(SHELF_SELECTOR)) {
      if (shelf.hidden) continue;
      const title = shelf.querySelector(
        "#title, .shelf-title, h2, [id='title-text']"
      );
      if (title && SHORTS_TITLE.test(title.textContent.trim())) {
        shelf.hidden = true;
        shelf.style.display = "none";
      }
    }
  }

  // ---- SPA 遷移・動的読み込みへの追従 ----------------------------------

  let scheduled = false;
  function scheduleHide() {
    if (scheduled || !enabled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      hideDynamicElements();
    });
  }

  const observer = new MutationObserver(scheduleHide);

  function startObserver() {
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  // YouTube は SPA なので、ページ内遷移でも /shorts/ を検知する。
  window.addEventListener("yt-navigate-start", () => {
    if (enabled) redirectIfShortsPage();
  });
  window.addEventListener("yt-navigate-finish", () => {
    if (enabled) {
      redirectIfShortsPage();
      scheduleHide();
    }
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver);
  } else {
    startObserver();
  }
})();
