// Shared appearance for the legal pages and contact page.
export const pageLinks = [
  { label: "プライバシーポリシー", href: "/privacy/", code: "01", english: "PRIVACY" },
  { label: "利用規約", href: "/terms/", code: "02", english: "TERMS" },
  { label: "特定商取引法に基づく表記", href: "/commercial-transactions/", code: "03", english: "LEGAL" },
  { label: "お問い合わせ", href: "/support.html", code: "04", english: "CONTACT" },
];

export const pageStyles = `<meta name="theme-color" content="#F2EFE7">
<link rel="icon" type="image/png" href="/assets/favicon-32.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;800;900&amp;family=Dela+Gothic+One&amp;family=JetBrains+Mono:wght@400;600&amp;family=Zen+Kaku+Gothic+New:wght@400;500;700&amp;display=swap" rel="stylesheet">
<link rel="stylesheet" href="/legal.css?v=20261004-colorful">`;

export function pageHeader(currentHref) {
  return `<a class="skip" href="#main">本文へスキップ</a>
<header class="site-header">
  <a class="site-logo" href="/" aria-label="MuLy トップへ"><img src="/assets/img/app-icon-512.png" alt="" width="28" height="28"><span>MuLy</span></a>
</header>
<nav class="page-nav" aria-label="サポート・法務ページ">
${pageLinks.map(link => `<a href="${link.href}"${link.href === currentHref ? ' aria-current="page"' : ''}><span class="mono">${link.code}</span>${link.label}</a>`).join("\n")}
</nav>`;
}

export function pageHero(currentHref, title, meta = "") {
  const link = pageLinks.find(link => link.href === currentHref);
  return `<header class="page-hero">
  <p class="eyebrow mono">[ ${link.code} / MuLy ]</p>
  <p class="page-display" aria-hidden="true">${link.english}</p>
  <h1>${title}</h1>
  ${meta ? `<p class="meta">${meta}</p>` : ""}
</header>`;
}

export function pageFooter(currentHref) {
  return `<footer class="site-footer">
  <div class="footer-top"><a class="footer-word" href="/" aria-label="MuLy トップへ"><span>M</span><span>u</span><span>L</span><span>y</span></a>
  <p>聴いた音楽を、もっと好きになる。</p></div>
  <nav aria-label="フッター">${pageLinks.map(link => `<a href="${link.href}"${link.href === currentHref ? ' aria-current="page"' : ''}>${link.label}<span aria-hidden="true">↗</span></a>`).join("\n")}</nav>
  <p class="copyright mono">© 2026 MuLy — Music Life + You</p>
</footer>`;
}
