# MuLy-LP

MuLyの公式Webサイト、法務ページ、Universal Links、お問い合わせFunctionを管理するリポジトリです。

- GitHub: https://github.com/AgeFactory24/MuLy-LP
- 公式サイト: https://muly.club/
- Hosting配信元: `hosting/public/`
- お問い合わせFunction: `functions/src/index.ts`

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
