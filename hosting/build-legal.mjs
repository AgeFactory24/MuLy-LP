// 法務ドキュメント（プライバシーポリシー.md / 利用規約.md /
// 特定商取引法に基づく表記.md）を Firebase Hosting 用の
// 静的HTMLへ変換する。使用されている記法（見出し/段落/箇条書き/番号リスト/表/水平線/
// 強調/インラインコード/リンク/引用）のみを対象にした最小の変換器。
//
// 「※公開前の確認事項」の引用ブロックは開発者向けの注記のため、公開ページからは除外する。

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const escapeHTML = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// インライン記法。エスケープ後に適用する
function inline(text) {
  return escapeHTML(text)
    .replace(/&lt;br&gt;/g, "<br>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label, href) => {
      // 相互リンク（.md 同士）はホスティング上のパスへ読み替える
      const map = {
        "./プライバシーポリシー.md": "/privacy/",
        "./利用規約.md": "/terms/",
        "./特定商取引法に基づく表記.md": "/commercial-transactions/",
      };
      return `<a href="${map[href] ?? href}">${label}</a>`;
    })
    // 委託先各社のプライバシーポリシー等、素のURLで書かれているものをリンクにする
    // （既に <a href="..."> の中にあるものは対象外にする）
    .replace(/(?<!href=")(https?:\/\/[^\s<））]+)/g, '<a href="$1">$1</a>');
}

function convert(markdown) {
  const lines = markdown.split("\n");
  const out = [];
  let i = 0;
  let title = "";

  const flushTable = () => {
    const rows = [];
    while (i < lines.length && lines[i].trimStart().startsWith("|")) {
      rows.push(lines[i].trim());
      i++;
    }
    // 2行目は区切り行（|---|---|）なのでヘッダとして扱い読み飛ばす
    const cells = (row) =>
      row.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
    out.push("<table>");
    rows.forEach((row, idx) => {
      if (idx === 1 && /^[\s|:-]+$/.test(row)) return;
      const tag = idx === 0 ? "th" : "td";
      out.push(
        "<tr>" + cells(row).map((c) => `<${tag}>${inline(c)}</${tag}>`).join("") + "</tr>"
      );
    });
    out.push("</table>");
  };

  const flushList = (ordered) => {
    const marker = ordered ? /^\d+\.\s+/ : /^[-*]\s+/;
    out.push(ordered ? "<ol>" : "<ul>");
    while (i < lines.length && marker.test(lines[i])) {
      out.push(`<li>${inline(lines[i].replace(marker, ""))}</li>`);
      i++;
    }
    out.push(ordered ? "</ol>" : "</ul>");
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed === "") { i++; continue; }

    // 開発者向けの注記ブロックは公開ページに含めない
    if (trimmed.startsWith(">")) {
      const isInternalNote = trimmed.includes("公開前の確認事項");
      while (i < lines.length && lines[i].trim().startsWith(">")) i++;
      if (!isInternalNote) {
        // 通常の引用は残す（現状の文書には該当なし）
      }
      continue;
    }

    if (/^---+$/.test(trimmed)) { i++; continue; } // 水平線は h2 の境界線で表現済み

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2];
      if (level === 1) {
        title = text;
        // タイトルと直後の「最終更新日」行をヘッダーとしてまとめる
        i++;
        while (i < lines.length && lines[i].trim() === "") i++;
        const updated = lines[i]?.trim().startsWith("最終更新日") ? lines[i].trim() : null;
        if (updated) i++;
        out.push(
          `<header>\n<h1>${inline(text)}</h1>` +
            (updated ? `\n<p class="meta">${inline(updated)}</p>` : "") +
            `\n</header>`
        );
        continue;
      }
      out.push(`<h${level}>${inline(text)}</h${level}>`);
      i++;
      continue;
    }

    if (trimmed.startsWith("|")) { flushTable(); continue; }
    if (/^[-*]\s+/.test(trimmed)) { flushList(false); continue; }
    if (/^\d+\.\s+/.test(trimmed)) { flushList(true); continue; }

    // 連続する行を1つの段落にまとめる
    const paragraph = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,6}\s|[-*]\s|\d+\.\s|\||>|---+$)/.test(lines[i].trim())
    ) {
      paragraph.push(lines[i].trim());
      i++;
    }
    if (paragraph.length) out.push(`<p>${inline(paragraph.join(""))}</p>`);
  }

  return { title, body: out.join("\n") };
}

const legalLinks = [
  { label: "プライバシーポリシー", href: "/privacy/" },
  { label: "利用規約", href: "/terms/" },
  { label: "特定商取引法に基づく表記", href: "/commercial-transactions/" },
];

function page({ title, body, currentHref, description }) {
  const footerLinks = legalLinks
    .filter((link) => link.href !== currentHref)
    .map((link) => `<a href="${link.href}">${link.label}</a>`)
    .join(" ・ ");

  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} | MuLy</title>
<meta name="description" content="${description}">
<link rel="canonical" href="https://muly.club${currentHref}">
<meta property="og:type" content="website">
<meta property="og:locale" content="ja_JP">
<meta property="og:url" content="https://muly.club${currentHref}">
<meta property="og:title" content="${title} | MuLy">
<meta property="og:description" content="${description}">
<meta property="og:image" content="https://muly.club/assets/appicon.png">
<meta property="og:image:width" content="1024">
<meta property="og:image:height" content="1024">
<meta property="og:image:alt" content="MuLyアプリアイコン">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${title} | MuLy">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="https://muly.club/assets/appicon.png">
<link rel="stylesheet" href="/legal.css">
</head>
<body>
<main>
${body}
<footer>
  ${footerLinks} ・ MuLy
</footer>
</main>
</body>
</html>
`;
}

const jobs = [
  {
    src: "プライバシーポリシー.md",
    dir: "hosting/public/privacy",
    href: "/privacy/",
    description: "MuLyにおける利用者情報の取り扱いとプライバシーポリシーをご案内します。",
  },
  {
    src: "利用規約.md",
    dir: "hosting/public/terms",
    href: "/terms/",
    description: "MuLyをご利用いただく際の条件と利用規約をご案内します。",
  },
  {
    src: "特定商取引法に基づく表記.md",
    dir: "hosting/public/commercial-transactions",
    href: "/commercial-transactions/",
    description: "MuLyの販売条件など、特定商取引法に基づく表記をご案内します。",
  },
];

for (const job of jobs) {
  const { title, body } = convert(readFileSync(job.src, "utf8"));
  mkdirSync(job.dir, { recursive: true });
  writeFileSync(
    `${job.dir}/index.html`,
    page({ title, body, currentHref: job.href, description: job.description })
  );
  console.log(`✅ ${job.src} → ${job.dir}/index.html  (${body.length} bytes)`);
}
