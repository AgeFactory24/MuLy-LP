# MuLy-LP

MuLyの公式Webサイト、法務ページ、Universal Links、お問い合わせFunctionを管理するリポジトリです。

- GitHub: https://github.com/AgeFactory24/MuLy-LP
- 公式サイト: https://muly.club/
- Hosting配信元: `hosting/public/`
- お問い合わせFunction: `functions/src/index.ts`

## 管理ファイル

現在の公式サイトのソース・画像・設定は、このリポジトリに集約している。
旧版の `LP サイト/` や別フォルダの `MuLy-site-colorful` からコピーする必要はない。

| 場所 | 用途 |
| --- | --- |
| `hosting/public/` | 配信するHTML・CSS・JavaScript・画像・AASA。TestFlight案内と `/u/` も含む |
| `hosting/source-assets/stars/` | Figmaから書き出した透明背景の星の原本（非公開） |
| `hosting/personality-*.json` | Figma素材の対応表と、承認済みの配置・サイズ |
| `hosting/build-personality.mjs` | 星の原本から配信用SVGを再生成 |
| ルートの法務Markdown3ファイル | 法務本文の正本 |
| `hosting/build-legal.mjs`・`hosting/page-chrome.mjs` | 法務HTMLの生成と共通デザイン |
| `functions/src/`・`functions/test-*.cjs` | 問い合わせ送信・添付画像の処理とテスト |
| `firebase.json`・`.firebaserc` | 配信先とFirebase設定 |

`functions/node_modules/` はビルドに使う依存ライブラリ、`functions/lib/` は
TypeScriptから生成するFunctionの実行コード。いずれも必要なため削除対象にしない。
フォント・Firebaseなどの外部サービスは、各ページから読み込む。

星の配信用SVGを再生成する場合:

```bash
node hosting/build-personality.mjs
```

## Firebase

Firebase上の識別子は、リポジトリ名とは別に既存の値を継続して使用しています。

- FirebaseプロジェクトID: `musiclibrary-lp`
- HostingサイトID: `musiclibrary-lp`

これらはFirebaseの内部識別子であり、サービス名とGitHubリポジトリ名は `MuLy` / `MuLy-LP` です。

## デプロイ

```bash
firebase deploy --only hosting --project musiclibrary-lp
firebase deploy --only functions --project musiclibrary-lp
```

## お問い合わせの添付画像

フォームはPNG・JPEG・WebPを最大3枚、1枚5 MiB・合計10 MiBまで受け付ける。
画像は送信時にJSON/base64でApp Check付きのFunctionへ渡し、
サーバー側で件数・容量・形式を確認して問い合わせメールに添付する。
Cloud Storageなどへの画像の公開保存は行わない。

添付機能を公開するときは、`submitContact`を先にデプロイしてからHostingを更新する。
フロントだけの公開では、古いFunctionが添付画像を処理できない。

```bash
npm --prefix functions test
npm --prefix functions run lint
firebase deploy --only functions:submitContact --project musiclibrary-lp
firebase deploy --only hosting --project musiclibrary-lp
```

テストはローカルのメール生成と送信処理のモックを使い、実メールは送信しない。

## 法務ページ

次のMarkdownが正本。

- `プライバシーポリシー.md`
- `利用規約.md`
- `特定商取引法に基づく表記.md`

編集後は生成スクリプトを実行してからHostingへデプロイする。

```bash
node hosting/build-legal.mjs
```

`hosting/public/privacy/`、`terms/`、`commercial-transactions/`のHTMLは生成物なので直接編集しない。

## Universal Links

`hosting/public/.well-known/apple-app-site-association`と`/u/**`のリライトは、iOSアプリの`applinks:muly.club`と対になっている。ドメインやパスを変更する場合はアプリ側と同時に更新する。
