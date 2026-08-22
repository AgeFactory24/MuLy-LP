# AGENTS.md — MuLy LP

このリポジトリはMuLy公式サイト専用。iOSアプリ本体は`../MusicLibrary/`で管理する。

## 配信構成

- Firebaseプロジェクト: `musiclibrary-lp`
- Firebase Hostingサイト: `musiclibrary-lp`
- 公式ドメイン: `muly.club`
- 配信ディレクトリ: `hosting/public/`
- お問い合わせFunction: `functions/src/index.ts`

## 編集ルール

1. LP・サポート・法務ページ・AASAはすべてこのリポジトリで管理する。
2. `hosting/public/privacy/`、`terms/`、`commercial-transactions/`は生成物。ルートのMarkdownを編集し、`node hosting/build-legal.mjs`で再生成する。
3. `hosting/public/.well-known/apple-app-site-association`の`appID`と`/u/*`は、iOSアプリのAssociated Domainsと合わせる。
4. `hosting/public/support.html`は`musiclibrary-lp`の`submitContact` Functionを呼ぶ。
5. Hostingのみ更新するときは`firebase deploy --only hosting --project musiclibrary-lp`を使い、Functionsを不要に再デプロイしない。

## 確認

- `node hosting/build-legal.mjs`
- `firebase emulators:start --only hosting --project musiclibrary-lp`
- デプロイ後に`/`、`/support.html`、`/privacy/`、`/terms/`、`/.well-known/apple-app-site-association`、`/u/test`を確認する。
