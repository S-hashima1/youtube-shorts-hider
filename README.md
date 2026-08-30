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
- **キーワードブロック**: 指定した語(初期設定は「乃木坂」)を含む動画も非表示
  - Chrome 版はポップアップの「ブロックするキーワード」欄で自由に編集可能
  - ユーザースクリプト版はファイル冒頭の `BLOCK_KEYWORDS` 配列を編集
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

## iPhone(Safari)で使う

Chrome 拡張は iPhone では動きませんが、ユーザースクリプト版
(`userscript/youtube-shorts-hider.user.js`)を用意しています。

1. App Store から無料アプリ **「Userscripts」** をインストールする
2. iPhone の **設定 → アプリ → Safari → 機能拡張 → Userscripts** を ON にする
   (「すべてのウェブサイト」で許可しておく)
3. Userscripts アプリを開き、保存先フォルダを設定する
4. このリポジトリの `userscript/youtube-shorts-hider.user.js` をiPhoneへ保存する
5. Userscripts アプリで保存したファイルを開くか、「＋」→「New JS」を選んで中身を貼り付けて保存する
6. Safari で `youtube.com` を開くと Shorts が非表示になる

※ YouTube 公式アプリの表示は変更できません。Safari で youtube.com を
開いたときのみ有効です。

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
userscript/        iPhone(Safari + Userscripts アプリ)用のユーザースクリプト版
```

## 注意

YouTube の DOM 構造は予告なく変わることがあります。
非表示にならない要素を見つけたら、`hide-shorts.css` にセレクタを追加してください。
