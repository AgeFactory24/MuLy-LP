/* =========================================================
   MuLy colorful edition — interactions
   GSAP + ScrollTrigger + Lenis（js/vendor に同梱）
   参考: runrobrun（ピクセル転換・ピン留めの横スクロール・数字のロール）
        flshfrm（文字の組み上がり・パネルが上に重なる）
        heronaiapp（慣性スクロール・線が引かれる）
   ========================================================= */
(() => {
  /** App Store の配信URL（公開後に設定）。空のままだとボタンはダウンロード欄へ移動し、準備中表示を出します。 */
  const APP_STORE_URL = "";

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  // ---------- App Store links
  if (APP_STORE_URL) {
    $$("[data-appstore]").forEach((a) => { a.href = APP_STORE_URL; a.target = "_blank"; a.rel = "noopener"; });
  } else {
    const s = $("[data-appstore-status]"); if (s) s.hidden = false;
  }

  // ---------- mobile menu
  const btn = $("[data-menu]"), nav = $("#nav");
  const setMenu = (o) => { if (!nav) return; nav.classList.toggle("open", o); btn && btn.setAttribute("aria-expanded", String(o)); };
  btn && btn.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
  addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // ---------- drag-to-scroll for the strip when it is not pinned
  const strip = $("[data-drag]");
  const hs = $("[data-hscroll]");
  const slides = hs ? $$(".slide", hs) : [];
  const rolls = hs ? $$("[data-roll]", hs) : [];
  let activeSlide = -1;
  const setActiveSlide = (i) => {
    if (i === activeSlide || !slides.length) return;
    activeSlide = i;
    rolls.forEach((r) => { r.style.transform = `translateY(${-i * 100 / slides.length}%)`; });
    $(".hs-count", hs).setAttribute("aria-label", `表示中の画面 ${i + 1} / ${slides.length}`);
  };
  const syncNativeSlide = () => {
    if (!strip || !slides.length || hs.classList.contains("is-pinned")) return;
    const bounds = strip.getBoundingClientRect();
    const center = bounds.left + strip.clientWidth / 2;
    let nearest = 0, distance = Infinity;
    slides.forEach((slide, i) => {
      const r = slide.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - center);
      if (d < distance) { nearest = i; distance = d; }
    });
    setActiveSlide(nearest);
  };
  if (strip) {
    let pending = false;
    const scheduleSync = () => {
      if (pending) return;
      pending = true;
      requestAnimationFrame(() => { pending = false; syncNativeSlide(); });
    };
    strip.addEventListener("scroll", scheduleSync, { passive: true });
    addEventListener("resize", scheduleSync);
    addEventListener("load", scheduleSync);
    syncNativeSlide();
    let down = false, sx = 0, sl = 0;
    strip.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse" || strip.closest(".is-pinned")) return; down = true; sx = e.clientX; sl = strip.scrollLeft; });
    addEventListener("pointerup", () => { down = false; });
    addEventListener("pointermove", (e) => { if (down) strip.scrollLeft = sl - (e.clientX - sx); });
  }

  const gsap = window.gsap, ST = window.ScrollTrigger;
  if (reduce || !gsap || !ST) {
    // 動きなし：通常のスクロールとアンカーのみ
    document.documentElement.classList.remove("js-motion");
    nav && nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
    return;
  }

  gsap.registerPlugin(ST);

  // ---------- Lenis smooth scroll
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true });
    lenis.on("scroll", ST.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  // anchor links through Lenis
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href"); if (id.length < 2) return;
    const t = $(id); if (!t) return;
    e.preventDefault(); setMenu(false);
    lenis ? lenis.scrollTo(t, { offset: -56, duration: 1.4 }) : t.scrollIntoView({ behavior: "smooth" });
  }));

  // ---------- helpers: split text into characters
  const splitChars = (el, cls = "ch") => {
    const walk = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          [...n.textContent].forEach((c) => {
            if (c === " " || c === "\n") { frag.appendChild(document.createTextNode(c)); return; }
            const s = document.createElement("span"); s.className = cls; s.textContent = c; frag.appendChild(s);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    };
    walk(el);
    return $$("." + cls, el);
  };
  // giant English headings: each <br>-line becomes a masked line of chars
  const splitGiant = (el) => {
    const lines = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = lines.map((l) => `<span class="gl">${[...l.replace(/&amp;/g, "&")].map((c) => c === " " ? " " : `<span>${c === "&" ? "&amp;" : c}</span>`).join("")}</span>`).join("");
    return $$(".gl > span", el);
  };

  // ---------- intro: loader → hero
  const heroChars = splitChars($(".hero-title"));
  gsap.set(heroChars, { yPercent: 110, rotate: 8, opacity: 0 });
  gsap.set(".hero-title mark", { "--mk": 0 });
  gsap.set(".w", { yPercent: 105 });
  gsap.set([".hero-lead", ".hero-actions"], { y: 24, opacity: 0 });
  gsap.set([".hstar", ".disc"], { scale: 0 });
  gsap.set(".hero-phone", { y: 140, opacity: 0 });

  const intro = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } })
    .to(heroChars, { yPercent: 0, rotate: 0, opacity: 1, duration: 1.1, stagger: 0.035 }, 0)
    .to(".hero-title mark", { "--mk": 1, duration: 0.8, ease: "power4.inOut" }, 0.35)
    .to(".disc", { scale: 1, duration: 1.2, stagger: 0.12, ease: "elastic.out(1, .7)" }, 0.2)
    .to(".hero-phone", { y: 0, opacity: 1, duration: 1.2 }, 0.35)
    .to(".hstar", { scale: 1, duration: 1, stagger: 0.1, ease: "back.out(2.2)" }, 0.6)
    .add(() => $$(".hstar").forEach((h, i) => gsap.fromTo(h, { rotate: -6 }, { rotate: 6, duration: 2.6 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1 })), 1.4)
    .to([".hero-lead", ".hero-actions"], { y: 0, opacity: 1, duration: 0.9, stagger: 0.08 }, 0.55)
    .to(".w", { yPercent: 12, duration: 1.1, stagger: 0.08, ease: "back.out(1.6)" }, 0.5);

  const loader = $("[data-loader]");
  if (loader) {
    lenis && lenis.stop();
    const count = $("[data-count]", loader), o = { v: 0 };
    gsap.timeline({ defaults: { ease: "power3.inOut" } })
      .to(".ld-bars i", { scaleY: 1, duration: 0.9, stagger: 0.09, ease: "back.out(1.8)" }, 0)
      .to(o, { v: 100, duration: 1.1, ease: "power2.inOut", onUpdate: () => { count.textContent = String(Math.round(o.v)).padStart(3, "0"); } }, 0)
      .to(".ld-center", { yPercent: -100, duration: 0.7 }, 1.2)
      .to(".ld-panels i", { yPercent: -100, duration: 0.8, stagger: 0.07 }, 1.35)
      .add(() => intro.play(), 1.55)
      .add(() => { loader.remove(); lenis && lenis.start(); ST.refresh(); });
  } else intro.play();

  // ---------- hero scroll: wordmark letters split apart, visual drifts
  gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.6 } })
    .to(".w1", { yPercent: -30, rotate: -6 }, 0)
    .to(".w2", { yPercent: -60, rotate: 8 }, 0)
    .to(".w3", { yPercent: -20, rotate: -4 }, 0)
    .to(".w4", { yPercent: -50, rotate: 10 }, 0)
    .to(".hero-phone", { yPercent: -18, rotate: 10 }, 0)
    // A restored scroll position can initialize this while the intro scale is 0.
    // Use the normal size explicitly, without interrupting the entrance animation.
    .fromTo(".disc-cd", { scale: 1 }, { scale: 1.2, immediateRender: false }, 0)
    .to(".hero-copy", { yPercent: 12, opacity: 0.2 }, 0);

  // CDs spin; scrolling speeds them up (and reverses when scrolling up)
  const spins = $$(".cd-spin").map((el, i) => gsap.to(el, { rotation: i ? -360 : 360, duration: i ? 14 : 10, ease: "none", repeat: -1 }));
  ST.create({ trigger: ".hero", start: "top top", end: "bottom top",
    onUpdate: (self) => { const k = gsap.utils.clamp(-8, 8, self.getVelocity() / 250); spins.forEach((t) => gsap.to(t, { timeScale: (self.direction || 1) * (1 + Math.abs(k)), duration: 0.25, overwrite: true })); } });
  ST.addEventListener("scrollEnd", () => spins.forEach((t) => gsap.to(t, { timeScale: 1, duration: 1.2 })));

  // parallax on pointer (hero)
  const stage = $("[data-parallax]");
  if (stage && fine) {
    const layers = $$("[data-depth]", stage).map((l) => ({ d: +l.dataset.depth, x: gsap.quickTo(l, "x", { duration: 0.8 }), y: gsap.quickTo(l, "y", { duration: 0.8 }) }));
    addEventListener("pointermove", (e) => {
      const mx = e.clientX - innerWidth / 2, my = e.clientY - innerHeight / 2;
      layers.forEach((l) => { l.x(-mx * l.d); l.y(-my * l.d); });
    });
  }

  // ---------- marquee: speed & direction follow the scroll velocity (skew)
  $$(".mq-track").forEach((track) => {
    track.style.animation = "none";
    const tw = gsap.to(track, { xPercent: -50, duration: track.classList.contains("big") ? 18 : 36, ease: "none", repeat: -1 });
    const skewTo = gsap.quickTo(track, "skewX", { duration: 0.4 });
    ST.create({
      trigger: track, start: "top bottom", end: "bottom top",
      onUpdate: (self) => {
        const v = self.getVelocity();
        gsap.to(tw, { timeScale: gsap.utils.clamp(-5, 5, (self.direction) * (1 + Math.abs(v) / 400)), duration: 0.3, overwrite: true });
        skewTo(gsap.utils.clamp(-12, 12, -v / 250));
      },
      onToggle: (self) => { if (!self.isActive) skewTo(0); }
    });
    ST.addEventListener("scrollEnd", () => { skewTo(0); gsap.to(tw, { timeScale: tw.timeScale() < 0 ? -1 : 1, duration: 0.8 }); });
  });

  // ---------- section labels: slide in with a line
  $$(".sec-label").forEach((el) => gsap.from(el.children, { x: -30, opacity: 0, stagger: 0.08, duration: 0.8, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%" } }));

  // ---------- giant English headings: letters rise out of a mask, scrubbed
  $$(".giant").forEach((el) => {
    const chars = splitGiant(el);
    gsap.fromTo(chars, { yPercent: 115 }, { yPercent: 0, stagger: 0.03, ease: "none",
      scrollTrigger: { trigger: el, start: "top 92%", end: "top 45%", scrub: 0.5 } });
  });

  // ---------- JP display headings: chars pop in
  $$(".sec-jp, .story-title, .panel-title, .dl-copy h2, .pd-copy h3").forEach((el) => {
    const chars = splitChars(el);
    gsap.from(chars, { yPercent: 80, opacity: 0, rotate: 6, duration: 0.9, stagger: 0.025, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } });
  });

  // ---------- Story: paragraphs light up as they cross the center (scrub)
  $$(".story-text p").forEach((p) => {
    gsap.fromTo(p, { opacity: 0.14, y: 30 }, { opacity: 1, y: 0, ease: "none", scrollTrigger: { trigger: p, start: "top 88%", end: "top 55%", scrub: true } });
  });
  gsap.timeline({ scrollTrigger: { trigger: ".equation", start: "top 85%", end: "top 35%", scrub: 0.6 } })
    .from(".eq-sub", { xPercent: -120, rotate: -25, opacity: 0 }, 0)
    .from(".eq-cd", { xPercent: 120, rotate: 25, opacity: 0 }, 0)
    .from(".equation .eq-op", { scale: 0, rotate: 180 }, 0.3);

  // ---------- pixel transition (runrobrun の section-scroll-transition-pixels)
  const px = $("[data-pixels]");
  if (px) {
    const cols = innerWidth < 640 ? 8 : 16, rows = innerWidth < 640 ? 6 : 7;
    px.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    px.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const d = document.createElement("i"); d.className = "px" + (Math.random() < 0.06 ? " l" : "");
      // 下の行ほど先に、少しランダムに
      d._o = (rows - 1 - r) / rows * 0.6 + Math.random() * 0.4;
      px.appendChild(d); cells.push(d);
    }
    cells.sort((a, b) => a._o - b._o);
    gsap.to(cells, { scale: 1.02, ease: "none", stagger: { each: 1 / cells.length, from: "start" },
      scrollTrigger: { trigger: px, start: "top 85%", end: "bottom 30%", scrub: 0.4 } });
  }

  // ---------- feature rows: lines draw, text rises
  $$(".flist > li").forEach((li) => {
    gsap.timeline({ scrollTrigger: { trigger: li, start: "top 88%" } })
      .fromTo(li, { "--ls": 0 }, { "--ls": 1, duration: 1.1, ease: "expo.inOut" }, 0)
      .from(li.querySelectorAll(".fnum, .fbody h3, .fbody p, .chips li"), { y: 30, opacity: 0, stagger: 0.06, duration: 0.8, ease: "expo.out" }, 0.15);
  });

  // ---------- pinned horizontal strip with rolling counter (runrobrun Tools)
  if (hs) {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px)", () => {
      hs.classList.add("is-pinned");
      const track = $(".shots", hs);
      const dist = () => track.scrollWidth - innerWidth + 40;
      const tw = gsap.to(track, { x: () => -dist(), ease: "none",
        scrollTrigger: { trigger: hs, start: "top top", end: () => "+=" + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true,
          onUpdate: (self) => {
            const i = Math.min(slides.length - 1, Math.round(self.progress * (slides.length - 1)));
            setActiveSlide(i);
          } } });
      // phones tilt while travelling
      slides.forEach((s) => gsap.fromTo($(".phone", s), { rotate: -10, y: 40 }, { rotate: 4, y: -20, ease: "none",
        scrollTrigger: { trigger: s, containerAnimation: tw, start: "left right", end: "right left", scrub: true } }));
      return () => { hs.classList.remove("is-pinned"); gsap.set(track, { x: 0 }); requestAnimationFrame(syncNativeSlide); };
    });
  }

  // ---------- quote: characters light up one by one (scrub)
  const q = $("[data-scrubtext]");
  if (q) {
    const chars = splitChars(q, "st-ch");
    gsap.fromTo(chars, { opacity: 0.12 }, { opacity: 1, stagger: 0.05, ease: "none", scrollTrigger: { trigger: q, start: "top 80%", end: "bottom 45%", scrub: 0.3 } });
    gsap.from(".quote mark", { scale: 0.4, rotate: -8, ease: "back.out(2)", scrollTrigger: { trigger: q, start: "center 60%", end: "center 45%", scrub: 0.5 } });
  }

  // ---------- 10 stars: tiles pop in, stars turn with scroll
  ST.batch(".bento li", {
    start: "top 90%",
    onEnter: (els) => gsap.fromTo(els, { y: 80, scale: 0.85, rotate: () => gsap.utils.random(-10, 10), opacity: 0 },
      { y: 0, scale: 1, rotate: 0, opacity: 1, duration: 1, stagger: 0.07, ease: "back.out(1.6)", overwrite: true })
  });
  gsap.set(".bento li", { opacity: 0 });
  $$(".bento li img").forEach((img, i) => gsap.fromTo(img, { rotate: i % 2 ? 12 : -12 }, { rotate: i % 2 ? -12 : 12, ease: "none", scrollTrigger: { trigger: ".bento", start: "top bottom", end: "bottom top", scrub: true } }));
  gsap.fromTo(".pd-phone", { y: 80, rotate: -8 }, { y: -40, rotate: 2, ease: "none", scrollTrigger: { trigger: ".pd", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.fromTo(".pd-star", { rotate: -25, y: 60 }, { rotate: 12, y: -30, ease: "none", scrollTrigger: { trigger: ".pd", start: "top bottom", end: "bottom top", scrub: true } });
  gsap.from(".pd-copy p", { y: 24, opacity: 0, stagger: 0.1, duration: 0.8, ease: "expo.out", scrollTrigger: { trigger: ".pd-copy", start: "top 80%" } });

  // ---------- friends: panel slides up over the page (flshfrm の over-revealer)
  gsap.fromTo(".panel", { y: 160, scale: 0.9, borderRadius: 120 }, { y: 0, scale: 1, borderRadius: 32, ease: "none",
    scrollTrigger: { trigger: ".friends", start: "top bottom", end: "top 20%", scrub: 0.6 } });
  $$(".rows li").forEach((li, i) => gsap.timeline({ scrollTrigger: { trigger: li, start: "top 90%" } })
    .fromTo(li, { "--ls": 0 }, { "--ls": 1, duration: 1, ease: "expo.inOut", delay: i * 0.05 })
    .from(li.children, { x: -20, opacity: 0, stagger: 0.1, duration: 0.6 }, 0.2));
  gsap.fromTo(".friends-shots .phone", { y: (i) => 160 + i * 80 }, { y: (i) => i * 40, ease: "none", stagger: 0,
    scrollTrigger: { trigger: ".friends-shots", start: "top bottom", end: "center center", scrub: 0.6 } });

  // ---------- plans: cards rise, prices count up
  gsap.from(".plan", { y: 100, rotate: (i) => (i ? 4 : -4), opacity: 0, duration: 1.1, stagger: 0.15, ease: "expo.out", scrollTrigger: { trigger: ".plans", start: "top 85%" } });
  $$("[data-num]").forEach((el) => {
    const to = +el.dataset.num, o = { v: 0 };
    ST.create({ trigger: el, start: "top 85%", once: true, onEnter: () => gsap.to(o, { v: to, duration: 1.4, ease: "power3.out", onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString("ja-JP"); } }) });
  });
  gsap.fromTo(".plan-star", { rotate: -40, scale: 0 }, { rotate: 14, scale: 1, ease: "back.out(2)", scrollTrigger: { trigger: ".plan-plus", start: "top 80%", end: "top 40%", scrub: 0.6 } });

  // ---------- FAQ: lines draw
  $$(".faq details").forEach((d) => gsap.fromTo(d, { "--ls": 0 }, { "--ls": 1, duration: 1, ease: "expo.inOut", scrollTrigger: { trigger: d, start: "top 92%" } }));

  // ---------- download: big marquee pushed by scroll + art spins in
  gsap.fromTo(".dl-art", { rotate: -20, scale: 0.7, y: 80 }, { rotate: 0, scale: 1, y: 0, ease: "none", scrollTrigger: { trigger: ".dl-inner", start: "top bottom", end: "center center", scrub: 0.6 } });

  // header hides on scroll down, shows on scroll up
  const hd = $("[data-header]");
  ST.create({ start: 200, end: "max", onUpdate: (self) => { gsap.to(hd, { yPercent: self.direction === 1 && !nav.classList.contains("open") ? -100 : 0, duration: 0.35, ease: "power2.out", overwrite: true }); } });

  addEventListener("load", () => ST.refresh());
})();
