# YouTube Shorts Hider

YouTube のショート動画(Shorts)を非表示にする Chrome 拡張機能です。
「ショート動画を減らす」を何度クリックしても復活してしまう Shorts を、
フィード・検索結果・サイドバーからまとめて消します。

## 機能

- ホーム / 登録チャンネルのショート棚を非表示
- 検索結果・関連動画に混ざるショート動画を非表示
- 左サイドバーとミニサイドバーの「ショート」リンクを非表示
- チャンネルページの「ショート」タブを非表示
- `/shorts/` の URL を開いたら通常プレイヤー(`/watch?v=...`)へ自動リダイレクト
- ツールバーのアイコンから ON / OFF を切り替え(設定は同期保存)
- モバイル版レイアウト(m.youtube.com)にも対応

## インストール方法(デベロッパーモード)

1. このリポジトリをダウンロード(`Code` → `Download ZIP`)して展開するか、`git clone` する
2. Chrome で `chrome://extensions` を開く
3. 右上の「デベロッパーモード」を ON にする
4. 「パッケージ化されていない拡張機能を読み込む」をクリック
5. このリポジトリのフォルダ(`manifest.json` がある場所)を選択

## 使い方

インストールするだけで Shorts が非表示になります。
一時的に Shorts を見たいときは、ツールバーの拡張機能アイコンをクリックして
「ショート動画を非表示」のスイッチを OFF にしてください。
開いている YouTube のタブに即時反映されます。

## 仕組み

- CSS(`hide-shorts.css`)で Shorts 関連の要素を `display: none` にします
- YouTube は SPA(ページ遷移なしで画面が切り替わる)なので、
  `content.js` が MutationObserver と `yt-navigate-*` イベントで
  動的に追加される要素も監視して非表示にします
- 棚のタイトル(「ショート」/「Shorts」)でしか判別できない要素は
  テキストを見て非表示にします

## ファイル構成

```
manifest.json      拡張機能の定義(Manifest V3)
content.js         動的要素の非表示と /shorts/ リダイレクト
hide-shorts.css    Shorts 要素を隠す CSS
popup/             ON/OFF 切り替え用ポップアップ
icons/             拡張機能アイコン
```

## 注意

YouTube の DOM 構造は予告なく変わることがあります。
非表示にならない要素を見つけたら、`hide-shorts.css` にセレクタを追加してください。
