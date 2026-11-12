/* ==========================================================================
   Wei Li — portfolio
   Shared nav + footer, and the small behaviours each page needs.
   Loaded in <head> without defer so the nav/footer elements upgrade as
   soon as the parser reaches them (no flash of an empty header).
   ========================================================================== */

document.documentElement.classList.add("js");

// Live tweak panel: only when previewing on this computer, never on the live site.
// document.write keeps it synchronous so saved tweaks apply before first paint.
if (["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) || location.protocol === "file:") {
  document.write('<script src="js/tweak.js"><\/script>');
}

// TODO(Wei): replace these placeholders with your real details.
// Every page reads from here, so you only need to change them once.
const SITE = {
  name: "Wei Li",
  email: "weilee0406@gmail.com",
  phone: "(647) 510 4737",
  location: "Toronto, Ontario",
  linkedin: "https://www.linkedin.com/in/hi-itswei/",
  resume: "assets/Wei-Li-Resume.pdf",
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/* --------------------------------------------------------------------------
   <site-nav current="home|work|about|contact">
   -------------------------------------------------------------------------- */
class SiteNav extends HTMLElement {
  connectedCallback() {
    const current = this.getAttribute("current");
    const links = [
      ["work", "Work", "work.html"],
      ["about", "About", "about.html"],
      ["contact", "Contact", "contact.html"],
    ];
    this.innerHTML = `
      <a class="skip-link" href="#main">Skip to content</a>
      <header class="site-nav">
        <nav class="site-nav__inner wrap" aria-label="Main">
          <a class="site-nav__name" href="index.html"${current === "home" ? ' aria-current="page"' : ""}>${SITE.name}</a>
          <ul class="site-nav__links">
            ${links.map(([key, label, href]) =>
              `<li><a href="${href}"${key === current ? ' aria-current="page"' : ""}>${label}</a></li>`).join("")}
          </ul>
        </nav>
      </header>`;
  }
}

/* --------------------------------------------------------------------------
   <site-footer>
   -------------------------------------------------------------------------- */
class SiteFooter extends HTMLElement {
  connectedCallback() {
    const year = new Date().getFullYear();
    this.innerHTML = `
      <footer class="site-footer wrap">
        <button class="btn btn--small back-to-top" type="button" aria-label="Back to top" hidden>
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M10 16V4M5 9l5-5 5 5"/></svg>
        </button>
        <div class="site-footer__grid">
          <p class="site-footer__copy">© ${year} ${SITE.name}</p>
          <div class="site-footer__status">
            <h2 class="label">Work Status</h2>
            <p>Currently looking for co-op positions for summer-fall 2027. Feel free to
              <a class="link" href="contact.html">contact</a> me for a coffee chat!</p>
          </div>
          <div class="site-footer__elsewhere">
            <h2 class="label">View More</h2>
            <ul>
              <li><a class="link" href="${SITE.linkedin}" rel="noopener">LinkedIn</a></li>
              <li><a class="link" href="${SITE.resume}">Resume (PDF)</a></li>
            </ul>
          </div>
        </div>
      </footer>`;
  }
}

customElements.define("site-nav", SiteNav);
customElements.define("site-footer", SiteFooter);

/* --------------------------------------------------------------------------
   Page behaviours
   -------------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  fillSiteDetails();
  initCaseStudyProgress();
  initTimeline();
  initReveal();
  initBackToTop();
  initHeroIntro();
  initCarousel();
  initContact();
  initCollageVideos();
});

// Elements marked data-site="email|phone|location|resume" take their value from SITE
function fillSiteDetails() {
  document.querySelectorAll("[data-site]").forEach((el) => {
    const key = el.dataset.site;
    const value = SITE[key];
    if (!value) return;
    if (el.tagName === "A") {
      if (key === "email") el.href = `mailto:${value}`;
      else if (key === "phone") el.href = `tel:${value.replace(/[^\d+]/g, "")}`;
      else el.href = value;
      if (key !== "resume") el.textContent = value;
    } else {
      el.textContent = value;
    }
  });
}

/* Case study: left section list goes grey → dark, right-hand % progress */
function initCaseStudyProgress() {
  const content = document.querySelector(".cs-content");
  if (!content) return;

  const sections = [...content.querySelectorAll(".cs-section")];
  const tocLinks = [...document.querySelectorAll(".cs-toc a")];
  const pct = document.querySelector(".cs-progress__pct");
  const fill = document.querySelector(".cs-progress__fill");
  const mobileName = document.querySelector(".cs-mobilebar__name");
  const mobilePct = document.querySelector(".cs-mobilebar__pct");
  const mobileFill = document.querySelector(".cs-mobilebar__fill");

  let ticking = false;
  const update = () => {
    ticking = false;
    const rect = content.getBoundingClientRect();
    const start = window.innerHeight * 0.35;
    const total = rect.height - window.innerHeight * 0.5;
    const progress = Math.min(1, Math.max(0, (start - rect.top) / total));
    const percent = Math.round(progress * 100);

    if (pct) pct.textContent = `${percent}%`;
    if (fill) fill.style.transform = `scaleY(${progress})`;
    if (mobilePct) mobilePct.textContent = `${percent}%`;
    if (mobileFill) mobileFill.style.transform = `scaleX(${progress})`;

    // Active section = last one whose top has crossed 40% of the viewport
    const line = window.innerHeight * 0.4;
    let active = 0;
    sections.forEach((s, i) => { if (s.getBoundingClientRect().top <= line) active = i; });

    tocLinks.forEach((a, i) => {
      a.classList.toggle("is-active", i === active);
      a.classList.toggle("is-passed", i < active);
      if (i === active) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
    if (mobileName) mobileName.textContent = sections[active].querySelector("h2").textContent;
  };

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}

/* Every page: content blocks fade in with a small upward move as they scroll into view.
   Blocks already on screen when the page loads are left alone, and nothing is hidden
   when reduced motion is on or the browser can't observe scrolling. */
const REVEAL_TARGETS = [
  ".section-head", ".feature-row", ".experience-teaser",   // home, work
  "#experience .split", ".duo__col", ".collage", ".collage-intro",   // about
  ".cs-section", ".cs-next",                                // case studies
  ".contact-grid",                                          // contact
  ".site-footer__grid",
].join(", ");

function initReveal() {
  if (reduceMotion.matches || !("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver((entries) => {
    entries.filter((e) => e.isIntersecting).forEach((entry, i) => {
      // Blocks that arrive together (e.g. Skills and Education) follow each other by a beat
      entry.target.style.transitionDelay = `${i * 90}ms`;
      entry.target.classList.remove("is-hidden");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });

  document.querySelectorAll(REVEAL_TARGETS).forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
    el.setAttribute("data-reveal", "");
    el.classList.add("is-hidden");
    io.observe(el);
  });
}

/* Home: the hero intro (CSS) plays on every load. When the page comes back from the
   Back/Forward cache, swap to the identical "-again" animations so it plays again. */
function initHeroIntro() {
  const stage = document.querySelector(".hero-stage");
  if (!stage) return;
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) stage.classList.toggle("is-replay");
  });
}

/* Every page except Home: "Back to top" above the footer, shown only on pages longer than 2700px */
const BACK_TO_TOP_MIN_HEIGHT = 2700;

function initBackToTop() {
  const button = document.querySelector(".back-to-top");
  if (!button || document.querySelector('site-nav[current="home"]')) return;   // stays hidden on Home

  const check = () => {
    button.hidden = document.documentElement.scrollHeight <= BACK_TO_TOP_MIN_HEIGHT;
  };
  check();
  // Page length changes as images load or the window is resized
  if ("ResizeObserver" in window) new ResizeObserver(check).observe(document.body);
  window.addEventListener("load", check);

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
    // Move keyboard focus to the top too, without a second jump
    document.querySelector(".site-nav__name")?.focus({ preventScroll: true });
  });
}

/* About: jobs appear as they scroll into view */
function initTimeline() {
  const jobs = document.querySelectorAll(".job");
  if (!jobs.length) return;
  initTimelineLine(jobs);
  if (reduceMotion.matches || !("IntersectionObserver" in window)) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.remove("is-pending");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -12% 0px", threshold: 0.15 });

  jobs.forEach((job) => {
    // Jobs already on screen at load stay visible; only later ones reveal
    if (job.getBoundingClientRect().top < window.innerHeight * 0.88) return;
    job.classList.add("is-pending");
    io.observe(job);
  });
}

/* About: the timeline line fills grey → navy as you scroll, and each dot
   fills in once the line reaches it. Follows the scroll directly, so it
   stays on with reduced motion. */
function initTimelineLine(jobs) {
  const timeline = document.querySelector(".timeline");
  let ticking = false;

  const update = () => {
    ticking = false;
    const reading = window.innerHeight * 0.6;   // the "pen" sits 60% down the screen
    const rect = timeline.getBoundingClientRect();
    const line = getComputedStyle(timeline, "::before");   // the line's own top/bottom insets
    const top = rect.top + parseFloat(line.top);
    const height = rect.height - parseFloat(line.top) - parseFloat(line.bottom);
    const progress = Math.min(1, Math.max(0, (reading - top) / height));
    timeline.style.setProperty("--line-progress", progress.toFixed(4));

    jobs.forEach((job) => {
      const dot = job.getBoundingClientRect().top + 22;
      job.classList.toggle("is-reached", dot <= reading);
    });
  };

  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
}

/* About: "See works" opens a full-screen horizontal carousel for that job.
   Browse by scroll wheel, trackpad, mouse drag, touch swipe, clicking a side
   image, or the arrow keys. Images shrink and dim with distance from the centre. */
function initCarousel() {
  const dialog = document.querySelector(".carousel");
  if (!dialog) return;

  const titleEl = dialog.querySelector(".carousel__title");
  const scroller = dialog.querySelector(".carousel__scroller");
  const countEl = dialog.querySelector(".carousel__count");
  const fill = dialog.querySelector(".carousel__progress-fill");
  let slides = [];
  let active = 0;
  let ticking = false;

  const behavior = () => (reduceMotion.matches ? "auto" : "smooth");
  // scrollLeft that puts a slide in the middle of the scroller
  const centreOf = (slide) => slide.offsetLeft + slide.offsetWidth / 2 - scroller.clientWidth / 2;
  const goTo = (i) => {
    if (!slides.length) return;
    const target = slides[Math.max(0, Math.min(slides.length - 1, i))];
    scroller.scrollTo({ left: centreOf(target), behavior: behavior() });
  };

  const update = () => {
    ticking = false;
    const mid = scroller.scrollLeft + scroller.clientWidth / 2;
    let nearest = 0;
    let best = Infinity;
    slides.forEach((slide, i) => {
      const d = (slide.offsetLeft + slide.offsetWidth / 2 - mid) / slide.offsetWidth;   // in slide widths
      const a = Math.min(Math.abs(d), 1);
      const media = slide.firstElementChild;
      media.style.transform = `scale(${1 - a * 0.22})`;
      media.style.opacity = String(1 - a * 0.55);
      const caption = slide.querySelector("figcaption");
      if (caption) caption.style.opacity = String(1 - Math.min(Math.abs(d) * 2, 1));
      if (Math.abs(d) < best) { best = Math.abs(d); nearest = i; }
    });

    if (nearest !== active || countEl.dataset.total !== String(slides.length)) {
      active = nearest;
      countEl.dataset.total = slides.length;
      countEl.textContent = `${active + 1} / ${slides.length}`;
      slides.forEach((s, i) => {
        if (i === active) s.setAttribute("aria-current", "true");
        else s.removeAttribute("aria-current");
      });
    }
    const max = scroller.scrollWidth - scroller.clientWidth;
    fill.style.transform = `scaleX(${max > 0 ? scroller.scrollLeft / max : 1})`;
  };
  const requestUpdate = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };

  document.querySelectorAll("[data-works]").forEach((button) => {
    button.addEventListener("click", () => {
      const job = button.closest(".job");
      const template = job.querySelector("template.job__works");
      const role = job.querySelector(".job__title").textContent;
      const org = job.querySelector(".job__org").textContent;

      titleEl.innerHTML = `${role} <span>${org}</span>`;
      scroller.replaceChildren(template.content.cloneNode(true));
      slides = [...scroller.children];
      slides.forEach((s, n) => {
        s.setAttribute("role", "group");
        s.setAttribute("aria-roledescription", "slide");
        s.setAttribute("aria-label", `${n + 1} of ${slides.length}`);
        s.querySelectorAll("img").forEach((img) => { img.draggable = false; });
      });
      // Videos loop silently; with reduced motion they wait for the viewer to press play
      scroller.querySelectorAll("video").forEach((video) => {
        video.muted = true;
        if (reduceMotion.matches) video.controls = true;
        else video.play().catch(() => { video.controls = true; });
      });
      active = -1;
      dialog.showModal();
      scroller.scrollLeft = 0;
      update();
    });
  });

  scroller.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", () => { if (dialog.open) { goTo(active); requestUpdate(); } });
  dialog.querySelector("[data-carousel-close]").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => scroller.querySelectorAll("video").forEach((video) => video.pause()));

  dialog.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); goTo(active - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); goTo(active + 1); }
    if (e.key === "Home") { e.preventDefault(); goTo(0); }
    if (e.key === "End") { e.preventDefault(); goTo(slides.length - 1); }
  });

  // Vertical wheel: each notch (or short burst of trackpad scrolling) steps one image.
  // Sideways trackpad swipes scroll freely, then settle on the nearest image.
  let wheelLocked = false;
  let wheelSum = 0;
  let wheelIdle;
  let settle;
  dialog.addEventListener("wheel", (e) => {
    clearTimeout(settle);
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) {
      settle = setTimeout(() => goTo(active), 180);
      return;
    }
    e.preventDefault();
    const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? scroller.clientHeight : 1;   // lines / pages → px
    clearTimeout(wheelIdle);
    wheelIdle = setTimeout(() => { wheelSum = 0; }, 200);
    if (wheelLocked) return;
    wheelSum += e.deltaY * unit;
    if (Math.abs(wheelSum) >= 30) {
      goTo(active + Math.sign(wheelSum));
      wheelSum = 0;
      wheelLocked = true;
      setTimeout(() => { wheelLocked = false; }, 450);
    }
  }, { passive: false });

  // Clicking a side image brings it to the centre; clicking empty space closes
  const activate = (target) => {
    const slide = target.closest(".carousel__slide");
    if (!slide) { if (target === scroller || target === dialog) dialog.close(); return; }
    const i = slides.indexOf(slide);
    if (i !== active) goTo(i);
  };

  // Mouse drag (touch screens already swipe natively)
  let drag = null;
  let lastPointer = "mouse";
  scroller.addEventListener("pointerdown", (e) => {
    lastPointer = e.pointerType;
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag = { x: e.clientX, left: scroller.scrollLeft, moved: false };
    scroller.setPointerCapture(e.pointerId);
    scroller.classList.add("is-dragging");
  });
  scroller.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) drag.moved = true;
    scroller.scrollLeft = drag.left - dx;
  });
  const endDrag = (e) => {
    if (!drag) return;
    const { moved } = drag;
    drag = null;
    scroller.classList.remove("is-dragging");
    if (moved) goTo(active);
    else if (e.type === "pointerup") activate(document.elementFromPoint(e.clientX, e.clientY) || scroller);
  };
  scroller.addEventListener("pointerup", endDrag);
  scroller.addEventListener("pointercancel", endDrag);
  scroller.addEventListener("click", (e) => { if (lastPointer !== "mouse") activate(e.target); });
  dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });
}

/* Contact: click the address to copy it; the button opens the mail app */
function initContact() {
  document.querySelectorAll("[data-mailto]").forEach((a) => {
    a.href = `mailto:${SITE.email}?subject=${encodeURIComponent("Hello Wei")}`;
  });

  document.querySelectorAll(".copy-field").forEach(initCopyField);
}

/* Contact: click a phone number or email address to copy it.
   A bubble with a copy icon follows the pointer; it turns into a checkmark once copied. */
function initCopyField(wrap) {
  const button = wrap.querySelector(".copy-field__button");
  const tip = wrap.querySelector(".copy-field__tip");
  const status = wrap.querySelector("[data-copy-status]");
  const label = tip.querySelector(".copy-field__label");   // screen-reader text; shown only if copying fails
  const labelText = label.textContent;
  const value = () => SITE[button.dataset.copy];
  let resetTimer;

  // Keep the bubble just above the pointer while hovering the text
  wrap.addEventListener("mousemove", (e) => {
    const rect = wrap.getBoundingClientRect();
    wrap.style.setProperty("--tip-x", `${e.clientX - rect.left}px`);
    wrap.style.setProperty("--tip-y", `${e.clientY - rect.top}px`);
  });
  wrap.addEventListener("mouseleave", () => {
    wrap.style.removeProperty("--tip-x");
    wrap.style.removeProperty("--tip-y");
  });

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(value());
      tip.classList.add("is-copied");           // copy icon swaps to a checkmark
      label.textContent = "Copied";
      status.textContent = `Copied ${value()}`;
    } catch {
      tip.classList.add("is-failed");           // no icon can say this, so show the words
      label.textContent = "Couldn't copy. Select the text instead";
      status.textContent = label.textContent;
    }
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      tip.classList.remove("is-copied", "is-failed");
      label.textContent = labelText;
      status.textContent = "";
    }, 1800);
  });
}

/* About: collage videos loop silently while on screen. With reduced motion they stay
   on the poster frame and show controls, so the viewer chooses to play them. */
function initCollageVideos() {
  const videos = document.querySelectorAll(".collage video");
  if (!videos.length) return;

  if (reduceMotion.matches || !("IntersectionObserver" in window)) {
    videos.forEach((video) => {
      video.controls = true;
      // The autoplay attribute starts it; people who asked for less motion press play themselves
      if (reduceMotion.matches) { video.autoplay = false; video.pause(); }
    });
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(({ target: video, isIntersecting }) => {
      if (isIntersecting) video.play().catch(() => { video.controls = true; });
      else video.pause();
    });
  }, { threshold: 0.25 });
  videos.forEach((video) => io.observe(video));
}
