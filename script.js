document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  /* =========================================================
     HELPERS
  ========================================================= */

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function readStorage(key, fallback = []) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      showToast("Could not save. File may be too large.");
      return false;
    }
  }

  function escapeHTML(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  /* =========================================================
     TOAST
  ========================================================= */

  const toast = $("#toast");
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 4200);
  }

  /* =========================================================
     YEAR
  ========================================================= */

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* =========================================================
     THEME (day = paper, night = plum)
  ========================================================= */

  const themeToggle = $("#themeToggle");

  function syncThemeButton() {
    if (!themeToggle) return;
    const dark = root.getAttribute("data-theme") === "dark";
    themeToggle.querySelector(".theme-icon").textContent = dark ? "☀" : "☾";
    themeToggle.querySelector(".theme-label").textContent = dark ? "day" : "night";
    themeToggle.setAttribute("aria-label", dark ? "Switch to day mode" : "Switch to night mode");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#1c1421" : "#f7f1ea");
  }

  if (themeToggle) {
    syncThemeButton();
    themeToggle.addEventListener("click", () => {
      const dark = root.getAttribute("data-theme") === "dark";
      if (dark) root.removeAttribute("data-theme");
      else root.setAttribute("data-theme", "dark");
      try { localStorage.setItem("sadia_theme", dark ? "light" : "dark"); } catch {}
      syncThemeButton();
    });
  }

  /* =========================================================
     MOBILE MENU
  ========================================================= */

  const menuBtn = $("#menuBtn");
  const navLinks = $("#navLinks");

  function setMenu(open) {
    if (!navLinks || !menuBtn) return;
    navLinks.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "close" : "menu";
  }

  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => setMenu(!navLinks.classList.contains("open")));
    navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
  }

  /* =========================================================
     ACTIVE TAB WHILE SCROLLING
  ========================================================= */

  const tabLinks = $$("#navLinks a");
  const tabSections = tabLinks.map((a) => document.querySelector(a.getAttribute("href"))).filter(Boolean);

  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        tabLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    tabSections.forEach((section) => spy.observe(section));
  }

  /* =========================================================
     TYPING PROMPT  (~$ building with ...)
  ========================================================= */

  const typed = $("#typed");
  const WORDS = ["AI", "machine learning", "computer vision", "generative AI", "python", "curiosity ✿"];

  if (typed && !reduceMotion) {
    let word = 0;
    let chars = WORDS[0].length;
    let deleting = true;

    const tick = () => {
      const current = WORDS[word];
      chars += deleting ? -1 : 1;
      typed.textContent = current.slice(0, chars);

      let delay = deleting ? 45 : 85;

      if (!deleting && chars === current.length) {
        deleting = true;
        delay = 1700;
      } else if (deleting && chars === 0) {
        deleting = false;
        word = (word + 1) % WORDS.length;
        delay = 300;
      }

      setTimeout(tick, delay);
    };

    setTimeout(tick, 1800);
  }

  /* =========================================================
     RIBBON MARQUEE (seamless)
     Repeats the word group until it fills the screen twice,
     then slides exactly one group width so it never jumps.
  ========================================================= */

  const TICKER_SPEED = 40; // pixels per second

  const tickerTrack = $(".ticker-track");
  const tickerGroup = tickerTrack && tickerTrack.querySelector(".ticker-group");

  function buildTicker() {
    if (!tickerTrack || !tickerGroup) return;

    tickerTrack.querySelectorAll(".ticker-group[aria-hidden]").forEach((g) => g.remove());

    const groupWidth = tickerGroup.getBoundingClientRect().width;
    if (!groupWidth) return;

    const copies = Math.ceil((window.innerWidth * 2) / groupWidth);
    for (let i = 0; i < copies; i++) {
      const clone = tickerGroup.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      tickerTrack.appendChild(clone);
    }

    tickerTrack.style.setProperty("--ticker-shift", groupWidth + "px");
    tickerTrack.style.setProperty("--ticker-duration", groupWidth / TICKER_SPEED + "s");
  }

  buildTicker();

  let tickerResize;
  window.addEventListener("resize", () => {
    clearTimeout(tickerResize);
    tickerResize = setTimeout(buildTicker, 200);
  });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(buildTicker);

  /* =========================================================
     REVEAL ON SCROLL
  ========================================================= */

  function observeReveals(elements) {
    if (!("IntersectionObserver" in window) || reduceMotion) {
      elements.forEach((el) => el.classList.add("visible"));
      return;
    }
    elements.forEach((el) => revealObserver.observe(el));
  }

  const revealObserver = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.08 })
    : null;

  // small stagger inside grids
  $$(".repo-grid .repo, .cert-grid .cert").forEach((el) => {
    const index = [...el.parentElement.children].indexOf(el);
    el.style.transitionDelay = (index % 4) * 70 + "ms";
  });

  observeReveals($$(".reveal"));

  /* =========================================================
     CONTACT FORM
     Sends through FormSubmit (free, no account). The FIRST message
     triggers an activation email to you: click the link in it once.
     If sending fails, the visitor's email app opens instead.
  ========================================================= */

  const CONTACT_EMAIL = "sayedasadiakawser@gmail.com";
  const CONTACT_ENDPOINT = "https://formsubmit.co/ajax/" + CONTACT_EMAIL;

  const contactForm = $("#contactForm");
  const contactStatus = $("#contactStatus");
  const contactSubmit = $("#contactSubmit");

  function setStatus(message, type = "") {
    if (!contactStatus) return;
    contactStatus.textContent = message;
    contactStatus.className = `form-status ${type}`.trim();
  }

  function openMailApp(name, email, message) {
    const body = `${message}\n\n— ${name} (${email})`;
    window.location.href =
      `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Portfolio message from " + name)}` +
      `&body=${encodeURIComponent(body)}`;
  }

  if (contactForm) {
    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const data = new FormData(contactForm);
      if (data.get("botcheck")) return;

      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const message = String(data.get("message") || "").trim();

      if (!name || !email || !message) {
        setStatus("// please fill in all fields", "error");
        return;
      }

      contactSubmit.disabled = true;
      setStatus("sending…");

      try {
        const response = await fetch(CONTACT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            name,
            email,
            message,
            _replyto: email,
            _subject: `Portfolio message from ${name}`,
            _template: "table",
          }),
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok || String(result.success) === "false") {
          throw new Error(result.message || `HTTP ${response.status}`);
        }

        contactForm.reset();
        setStatus("✓ sent! I'll reply soon.", "ok");
        showToast("message sent ✿");
      } catch (error) {
        console.error(error);
        setStatus("// couldn't send directly, opening your email app…", "error");
        openMailApp(name, email, message);
      } finally {
        contactSubmit.disabled = false;
      }
    });
  }

  const copyBtn = $("#copyEmail");

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(CONTACT_EMAIL);
        showToast("email copied ✓");
      } catch {
        showToast(CONTACT_EMAIL);
      }
    });
  }

  /* =========================================================
     EDIT MODE + IMAGE SLOTS
     Owner buttons (add/delete publications & certificates) show only
     on your own computer (file://, localhost) or with ?edit in the URL.
     Images that fail to load are hidden so the placeholder shows.
  ========================================================= */

  const editMode =
    location.protocol === "file:" ||
    ["localhost", "127.0.0.1"].includes(location.hostname) ||
    /[?&]edit\b/.test(location.search);

  document.body.classList.toggle("edit-mode", editMode);

  function watchImage(img) {
    img.addEventListener("error", () => img.classList.add("is-missing"));
    img.addEventListener("load", () => img.classList.remove("is-missing"));
    if (img.complete && img.naturalWidth === 0) img.classList.add("is-missing");
  }

  $$(".media-slot img").forEach(watchImage);

  /* =========================================================
     MODALS
  ========================================================= */

  const modalBackdrop = $("#modalBackdrop");

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal || !modalBackdrop) return;
    $$(".modal").forEach((m) => m.classList.remove("open"));
    modalBackdrop.classList.add("open");
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    const first = modal.querySelector("input");
    if (first) first.focus();
  }

  function closeModal() {
    if (!modalBackdrop) return;
    modalBackdrop.classList.remove("open");
    $$(".modal").forEach((m) => m.classList.remove("open"));
    document.body.style.overflow = "";
  }

  $$("[data-close]").forEach((button) => button.addEventListener("click", closeModal));

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", (event) => {
      if (event.target === modalBackdrop) closeModal();
    });
  }

  /* =========================================================
     LIGHTBOX
  ========================================================= */

  const lightbox = $("#lightbox");

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  document.addEventListener("click", (event) => {
    const img = event.target.closest(".cert-media img, .pub-cover img");

    if (img && lightbox && !img.classList.contains("is-missing")) {
      lightbox.querySelector("img").src = img.src;
      lightbox.querySelector("img").alt = img.alt;
      lightbox.classList.add("open");
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      return;
    }

    if (event.target.closest(".lightbox") && !event.target.matches(".lightbox img")) {
      closeLightbox();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeModal();
    closeLightbox();
    setMenu(false);
  });

  /* =========================================================
     ADD PUBLICATIONS / CERTIFICATES (edit mode only)
     Each add/delete downloads an updated content.js: replace the
     one in your site folder so every visitor sees the change.
  ========================================================= */

  const baseContent = window.PORTFOLIO_CONTENT || {};
  const items = {
    publications: readStorage("sadia_content_publications", null) || [...(baseContent.publications || [])],
    certificates: readStorage("sadia_content_certificates", null) || [...(baseContent.certificates || [])],
  };

  function saveItems(kind) {
    if (!writeStorage("sadia_content_" + kind, items[kind])) return false;

    const text =
      "// Replace the content.js in your site folder with this file.\n" +
      "window.PORTFOLIO_CONTENT = " +
      JSON.stringify({ publications: items.publications, certificates: items.certificates }, null, 2) +
      ";\n";

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
    link.download = "content.js";
    link.click();

    showToast("saved! replace content.js in your site folder to publish it.");
    return true;
  }

  function renderItems(kind) {
    const isPub = kind === "publications";
    const list = $(isPub ? "#publicationList" : "#certificateList");
    if (!list) return;

    list.querySelectorAll("[data-dynamic]").forEach((node) => node.remove());

    items[kind].forEach((item, index) => {
      const card = document.createElement("article");
      card.dataset.dynamic = "1";

      const isImage = item.file && item.file.startsWith("data:image");
      const fileBtn = item.file && !isImage
        ? `<button type="button" class="link-btn open-file" data-kind="${kind}" data-index="${index}">${isPub ? "open paper" : "view certificate"} ↗</button>`
        : "";
      const linkBtn = item.link
        ? `<a class="repo-link" href="${escapeHTML(item.link)}" target="_blank" rel="noopener noreferrer">${isPub ? "publication" : "credential"} ↗</a>`
        : "";
      const delBtn = `<button type="button" class="link-btn danger owner-only del-item" data-kind="${kind}" data-index="${index}">delete</button>`;

      if (isPub) {
        card.className = "pub";
        card.innerHTML = `
          <div class="pub-cover media-slot">
            <div class="paper-cover"><span class="paper-sheet">
              <span class="paper-venue">${escapeHTML(item.venue || "PUBLICATION")}</span>
              <span class="paper-title">${escapeHTML(item.title)}</span>
              <span class="paper-lines"><i></i><i></i><i></i><i></i></span>
            </span></div>
            ${isImage ? `<img src="${item.file}" alt="" />` : ""}
          </div>
          <div class="pub-body">
            <p class="pub-meta"><span class="badge">@publication</span> ${escapeHTML(item.year || "")}</p>
            <h3>${escapeHTML(item.title)}</h3>
            <p class="pub-venue">${escapeHTML(item.venue || "")}</p>
            <div class="pub-actions cert-actions">${linkBtn}${fileBtn}${delBtn}</div>
          </div>`;
      } else {
        card.className = "cert";
        const meta = [item.issuer || "certificate", item.date].filter(Boolean).join(" · ");
        card.innerHTML = `
          <div class="cert-media media-slot">
            <span class="tape tape-cert" aria-hidden="true"></span>
            <div class="media-placeholder">✿ certificate</div>
            ${isImage ? `<img src="${item.file}" alt="" />` : ""}
          </div>
          <p class="cert-meta">${escapeHTML(meta)}</p>
          <h3>${escapeHTML(item.title)}</h3>
          <div class="cert-actions">${linkBtn}${fileBtn}${delBtn}</div>`;
      }

      list.appendChild(card);
    });
  }

  document.addEventListener("click", async (event) => {
    const open = event.target.closest(".open-file");
    const del = event.target.closest(".del-item");

    if (open) {
      const item = items[open.dataset.kind][Number(open.dataset.index)];
      const blob = await (await fetch(item.file)).blob();
      window.open(URL.createObjectURL(blob), "_blank");
    }

    if (del) {
      const kind = del.dataset.kind;
      items[kind].splice(Number(del.dataset.index), 1);
      if (saveItems(kind)) renderItems(kind);
    }
  });

  [["#openPublicationModal", "publicationModal"], ["#openCertificateModal", "certificateModal"]].forEach(([button, modal]) => {
    const el = $(button);
    if (el) el.addEventListener("click", () => openModal(modal));
  });

  [["#publicationForm", "publications", ["title", "venue", "year", "link"]],
   ["#certificateForm", "certificates", ["title", "issuer", "date", "link"]]].forEach(([selector, kind, fields]) => {
    const form = $(selector);
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const data = new FormData(form);
      const item = {};
      fields.forEach((name) => (item[name] = String(data.get(name) || "").trim()));

      if (!item.title) return showToast("please enter a title.");

      const file = data.get("file");

      if (file && file.size) {
        if (file.size > 2 * 1024 * 1024) return showToast("please use a file under 2 MB.");
        try {
          item.file = await readFile(file);
        } catch {
          return showToast("could not read the file.");
        }
      }

      items[kind].push(item);

      if (saveItems(kind)) {
        renderItems(kind);
        form.reset();
        closeModal();
      }
    });
  });

  renderItems("publications");
  renderItems("certificates");
});
