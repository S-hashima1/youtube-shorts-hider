// YouTube Shorts Hider - content script
// CSS だけでは拾いきれない要素の非表示と、/shorts/ URL のリダイレクトを行う。

(() => {
  "use strict";

  const HIDE_CLASS = "ysh-hide-shorts";
  const JS_HIDE_ATTR = "data-ysh-hidden";
  const DEFAULT_KEYWORDS = [];
  let enabled = true;
  let keywordsLower = DEFAULT_KEYWORDS.map((k) => k.toLowerCase());

  // ---- 有効/無効の反映 -------------------------------------------------

  function applyEnabledState() {
    document.documentElement.classList.toggle(HIDE_CLASS, enabled);
    if (enabled) {
      redirectIfShortsPage();
      hideDynamicElements();
    } else {
      restoreHiddenElements();
    }
  }

  chrome.storage.sync.get(
    { enabled: true, blockKeywords: DEFAULT_KEYWORDS },
    (items) => {
      enabled = items.enabled;
      keywordsLower = items.blockKeywords
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
      applyEnabledState();
    }
  );

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    if (changes.enabled) {
      enabled = changes.enabled.newValue;
    }
    if (changes.blockKeywords) {
      keywordsLower = changes.blockKeywords.newValue
        .map((k) => k.trim().toLowerCase())
        .filter(Boolean);
    }
    applyEnabledState();
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

  // /shorts へのリンクを含む動画タイル・棚の入れ物。DOM 構造が変わっても
  // リンク先 URL は変わらないので、これが最後の砦になる。
  const ITEM_CONTAINERS = [
    "ytm-rich-item-renderer",
    "ytm-video-with-context-renderer",
    "ytm-reel-item-renderer",
    "ytm-reel-shelf-renderer",
    "ytm-rich-section-renderer",
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-compact-video-renderer",
    "yt-lockup-view-model",
    "grid-shelf-view-model",
  ].join(",");

  function hideElement(el) {
    if (!el || el.hasAttribute(JS_HIDE_ATTR) || el.hidden) return;
    el.setAttribute(JS_HIDE_ATTR, "");
    el.hidden = true;
    el.style.setProperty("display", "none", "important");
  }

  // OFF にしたとき、JS で付けた非表示を外して Shorts を戻す。
  function restoreHiddenElements() {
    for (const el of document.querySelectorAll(`[${JS_HIDE_ATTR}]`)) {
      el.removeAttribute(JS_HIDE_ATTR);
      el.hidden = false;
      el.style.removeProperty("display");
    }
  }

  // キーワードブロック対象となる「動画1件分のタイル」。棚やセクション全体を
  // 巻き込まないよう、タイル単位の要素だけを見る。
  const TILE_SELECTOR = [
    "ytm-rich-item-renderer",
    "ytm-video-with-context-renderer",
    "ytm-shorts-lockup-view-model",
    "ytm-shorts-lockup-view-model-v2",
    "ytd-rich-item-renderer",
    "ytd-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-compact-video-renderer",
    "yt-lockup-view-model",
  ].join(",");

  function hideBlockedKeywordTiles() {
    if (!keywordsLower.length) return;
    for (const tile of document.querySelectorAll(TILE_SELECTOR)) {
      if (tile.hidden) continue;
      const text = tile.textContent.toLowerCase();
      if (keywordsLower.some((k) => text.includes(k))) {
        hideElement(tile);
      }
    }
  }

  function hideDynamicElements() {
    if (!enabled) return;
    hideBlockedKeywordTiles();
    for (const shelf of document.querySelectorAll(SHELF_SELECTOR)) {
      if (shelf.hidden) continue;
      const title = shelf.querySelector(
        "#title, .shelf-title, h2, [id='title-text']"
      );
      if (title && SHORTS_TITLE.test(title.textContent.trim())) {
        hideElement(shelf);
      }
    }
    // /shorts へのリンクを含むタイル(URL ベースなので UI 変更に強い)
    for (const link of document.querySelectorAll('a[href^="/shorts"]')) {
      hideElement(link.closest(ITEM_CONTAINERS));
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
