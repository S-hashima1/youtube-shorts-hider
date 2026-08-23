// ==UserScript==
// @name         YouTube Shorts Hider
// @namespace    https://github.com/S-hashima1/meditation
// @version      1.0.0
// @description  YouTube のショート動画(Shorts)を非表示にします。iPhone の Safari では「Userscripts」アプリで動作します。
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  // ---- /shorts/ ページを通常プレイヤーへリダイレクト -------------------

  function redirectIfShortsPage() {
    const match = location.pathname.match(/^\/shorts\/([\w-]{5,})/);
    if (match) {
      location.replace(`${location.origin}/watch?v=${match[1]}`);
    }
  }

  redirectIfShortsPage();

  // ---- Shorts 関連要素を隠す CSS ---------------------------------------

  const CSS = `
    /* ホーム/登録チャンネルのショート棚(PC・新旧UI両対応) */
    ytd-rich-shelf-renderer[is-shorts],
    ytd-reel-shelf-renderer,
    ytd-rich-section-renderer:has([is-shorts]),
    grid-shelf-view-model:has(ytm-shorts-lockup-view-model),
    grid-shelf-view-model:has(shorts-lockup-view-model),

    /* 個別のショート動画タイル */
    ytd-rich-item-renderer:has(a[href^="/shorts/"]),
    ytd-video-renderer:has(a[href^="/shorts/"]),
    ytd-grid-video-renderer:has(a[href^="/shorts/"]),
    ytd-compact-video-renderer:has(a[href^="/shorts/"]),
    ytm-shorts-lockup-view-model,
    ytm-shorts-lockup-view-model-v2,

    /* サイドバーの「ショート」リンク・チャンネルの「ショート」タブ */
    ytd-guide-entry-renderer:has(a[title="Shorts"]),
    ytd-guide-entry-renderer:has(a[title="ショート"]),
    ytd-mini-guide-entry-renderer:has(a[title="Shorts"]),
    ytd-mini-guide-entry-renderer:has(a[title="ショート"]),
    yt-tab-shape[tab-title="Shorts"],
    yt-tab-shape[tab-title="ショート"],
    ytd-reel-item-renderer,

    /* モバイル版 (iPhone の Safari はこちらの UI になる) */
    ytm-reel-shelf-renderer,
    ytm-rich-section-renderer:has(ytm-reel-shelf-renderer),
    ytm-pivot-bar-item-renderer:has(.pivot-shorts),
    ytm-video-with-context-renderer:has(a[href^="/shorts/"]),
    ytm-item-section-renderer:has(> lazy-list > ytm-reel-shelf-renderer) {
      display: none !important;
    }
  `;

  function injectCss() {
    const style = document.createElement("style");
    style.textContent = CSS;
    (document.head || document.documentElement).appendChild(style);
  }

  if (document.head) {
    injectCss();
  } else {
    document.addEventListener("DOMContentLoaded", injectCss);
  }

  // ---- テキストラベルでしか判別できない棚を隠す ------------------------

  const SHELF_SELECTOR = [
    "ytd-rich-section-renderer",
    "ytd-shelf-renderer",
    "grid-shelf-view-model",
    "ytm-rich-section-renderer",
    "ytm-item-section-renderer",
  ].join(",");

  const SHORTS_TITLE = /^(shorts|ショート)$/i;

  function hideDynamicElements() {
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
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      hideDynamicElements();
    });
  }

  function startObserver() {
    new MutationObserver(scheduleHide).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  window.addEventListener("yt-navigate-start", redirectIfShortsPage);
  window.addEventListener("yt-navigate-finish", () => {
    redirectIfShortsPage();
    scheduleHide();
  });
  // モバイル版は History API での遷移も監視する
  window.addEventListener("popstate", redirectIfShortsPage);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startObserver);
  } else {
    startObserver();
  }
})();
