// ==UserScript==
// @name         YouTube Shorts Hider
// @namespace    https://github.com/S-hashima1/youtube-shorts-hider
// @version      1.3.0
// @description  YouTube のショート動画(Shorts)を非表示にします。iPhone の Safari では「Userscripts」アプリで動作します。
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(() => {
  "use strict";

  // ---- ブロックしたいキーワード ----------------------------------------
  // ここに書いた語を含む動画タイルを非表示にする(大文字小文字は区別しない)。
  // 追加したい語があればこの配列に足すだけでよい。
  const BLOCK_KEYWORDS = ["乃木坂", "nogizaka"];

  // ---- /shorts/ ページを通常プレイヤーへリダイレクト -------------------

  function redirectIfShortsPage() {
    const match = location.pathname.match(/^\/shorts\/([\w-]{5,})/);
    if (match) {
      location.replace(`${location.origin}/watch?v=${match[1]}`);
    } else if (/^\/shorts\/?$/.test(location.pathname)) {
      // ID なしの Shorts フィードはホームへ
      location.replace(`${location.origin}/`);
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
    if (!el || el.hidden) return;
    el.hidden = true;
    el.style.setProperty("display", "none", "important");
  }

  // タグ名に依存せず「タイルや棚の入れ物らしい要素」を親方向に探す。
  // YouTube のコンポーネントは -renderer / -view-model / lockup を含む
  // タグ名を使い続けているので、具体名が変わっても拾える。
  const CONTAINER_TAG = /-(renderer|view-model)$|lockup|shelf/;

  function containerFor(el) {
    let node = el;
    for (let i = 0; i < 8 && node && node !== document.body; i++) {
      if (CONTAINER_TAG.test(node.tagName.toLowerCase())) return node;
      node = node.parentElement;
    }
    return el;
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

  const KEYWORDS_LOWER = BLOCK_KEYWORDS.map((k) => k.toLowerCase()).filter(
    Boolean
  );

  function hideBlockedKeywordTiles() {
    if (!KEYWORDS_LOWER.length) return;
    for (const tile of document.querySelectorAll(TILE_SELECTOR)) {
      if (tile.hidden) continue;
      const text = tile.textContent.toLowerCase();
      if (KEYWORDS_LOWER.some((k) => text.includes(k))) {
        hideElement(tile);
      }
    }
  }

  function hideDynamicElements() {
    if (!document.body) return;
    hideBlockedKeywordTiles();
    // 「ショート」というタイトルの棚
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
    for (const link of document.querySelectorAll(
      'a[href^="/shorts"], a[href^="https://www.youtube.com/shorts"], a[href^="https://m.youtube.com/shorts"]'
    )) {
      const item = link.closest(ITEM_CONTAINERS) || containerFor(link);
      hideElement(item);
    }
    // 「ショート」「Shorts」というラベルを持つ要素(棚の見出し・下部タブ等)を
    // テキストから探し、その入れ物ごと隠す
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT
    );
    const hits = [];
    let textNode;
    while ((textNode = walker.nextNode())) {
      const text = textNode.nodeValue.trim();
      if (text && SHORTS_TITLE.test(text)) {
        hits.push(textNode.parentElement);
      }
    }
    for (const el of hits) {
      if (el) hideElement(containerFor(el));
    }
  }

  // ---- 動作確認バッジ(起動時に3秒だけ表示) ---------------------------

  function showBadge() {
    if (!document.body) return;
    const badge = document.createElement("div");
    badge.textContent = "Shorts Hider v1.3.0 動作中";
    badge.style.cssText =
      "position:fixed;bottom:80px;left:50%;transform:translateX(-50%);" +
      "background:rgba(0,0,0,.75);color:#fff;padding:6px 14px;" +
      "border-radius:16px;font-size:12px;z-index:2147483647;" +
      "pointer-events:none;font-family:sans-serif;";
    document.body.appendChild(badge);
    setTimeout(() => badge.remove(), 3000);
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

  function start() {
    startObserver();
    showBadge();
    hideDynamicElements();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  // MutationObserver が拾えない再描画への保険
  setInterval(hideDynamicElements, 1500);
})();
