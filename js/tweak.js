/* ==========================================================================
   Live tweak panel — local preview only.
   site.js loads this file only on localhost / file://, never on the live site.
   It overrides the design tokens in css/styles.css (:root) as you drag, keeps
   your settings in this browser, and "Copy CSS" gives you the changed values
   so they can be made permanent in styles.css.
   ========================================================================== */

(() => {
  const STORE = "wei-tweaks";
  const root = document.documentElement;

  const COLORS = [
    ["paper", "Background"],
    ["paper-raised", "Raised surfaces"],
    ["ink", "Text"],
    ["slate", "Secondary text"],
    ["mist", "Inactive labels"],
    ["navy", "Accent (timeline, focus)"],
    ["navy-soft", "Light accent"],
    ["line", "Lines and borders"],
    ["signal", "Red accent (labels, hovers)"],
  ];

  const SIZES = [
    ["step-page", "Page titles"],
    ["step-4", "Section headings"],
    ["step-3", "Case study headings"],
    ["step-2", "Large text"],
    ["step-1", "Medium text"],
    ["step-0", "Body text"],
    ["step--1", "Small text"],
  ];

  const FONTS = [
    ["Instrument Sans", "sans-serif"],
    ["Inter", "sans-serif"],
    ["Hanken Grotesk", "sans-serif"],
    ["Schibsted Grotesk", "sans-serif"],
    ["Manrope", "sans-serif"],
    ["DM Sans", "sans-serif"],
    ["Figtree", "sans-serif"],
    ["Outfit", "sans-serif"],
    ["Work Sans", "sans-serif"],
    ["Space Grotesk", "sans-serif"],
    ["Bricolage Grotesque", "sans-serif"],
    ["IBM Plex Sans", "sans-serif"],
    ["Newsreader", "serif"],
    ["Source Serif 4", "serif"],
    ["Fraunces", "serif"],
  ];
  // Must match --font / --font-body in css/styles.css
  const DEFAULT_FONT = "Bricolage Grotesque";
  const DEFAULT_FONT_BODY = "DM Sans";

  // Read the stylesheet's values before any override is applied
  const css = getComputedStyle(root);
  const defaults = {
    colors: Object.fromEntries(COLORS.map(([k]) => [k, normalizeHex(css.getPropertyValue(`--${k}`))])),
    sizes: Object.fromEntries(SIZES.map(([k]) => [k, css.getPropertyValue(`--${k}`).trim()])),
    weight: Number(css.getPropertyValue("--weight-display")) || 500,
    bg: parseGradient(css.getPropertyValue("--page-bg")) || "solid",   // the stylesheet's page background
  };

  let state = load();
  applyAll();

  document.addEventListener("DOMContentLoaded", buildPanel);

  /* ---------------- state ---------------- */

  // bg: null = the stylesheet's own background; "solid" = the Colour; { from, to, angle } = a gradient
  function blank() { return { colors: {}, sizes: {}, font: null, fontBody: null, weight: null, bg: null, open: false }; }
  const GRADIENT_DEFAULT = { to: "#DCE3EE", angle: 180 };

  function load() {
    try { return { ...blank(), ...JSON.parse(localStorage.getItem(STORE) || "{}") }; }
    catch { return blank(); }
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch { /* private mode: still works for this page */ }
  }

  /* ---------------- applying ---------------- */

  function applyAll() {
    COLORS.forEach(([k]) => applyColor(k));
    SIZES.forEach(([k]) => applySize(k));
    applyFont();
    applyFontBody();
    applyWeight();
    applyBackground();
  }

  function gradientCSS(bg) { return `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})`; }

  function effectiveBg() { return state.bg ?? defaults.bg; }
  function sameGradient(a, b) {
    return typeof a === "object" && typeof b === "object" && a.from === b.from && a.to === b.to && a.angle === b.angle;
  }

  function applyBackground() {
    if (!state.bg) root.style.removeProperty("--page-bg");
    else if (state.bg === "solid") root.style.setProperty("--page-bg", "var(--paper)");
    else root.style.setProperty("--page-bg", gradientCSS(state.bg));
  }

  function parseGradient(value) {
    const m = String(value).match(/linear-gradient\(\s*(\d+)deg\s*,\s*(#[0-9a-f]{6})\s*,\s*(#[0-9a-f]{6})\s*\)/i);
    return m ? { angle: Number(m[1]), from: m[2].toUpperCase(), to: m[3].toUpperCase() } : null;
  }

  function applyColor(key) {
    const v = state.colors[key];
    if (v) root.style.setProperty(`--${key}`, v);
    else root.style.removeProperty(`--${key}`);
  }

  function applySize(key) {
    const f = state.sizes[key];
    if (f && f !== 1) root.style.setProperty(`--${key}`, `calc(${defaults.sizes[key]} * ${f})`);
    else root.style.removeProperty(`--${key}`);
  }

  function applyFont() {
    const name = state.font;
    if (!name || name === DEFAULT_FONT) { root.style.removeProperty("--font"); return; }
    const category = (FONTS.find(([n]) => n === name) || [, "sans-serif"])[1];
    loadGoogleFont(name);
    root.style.setProperty("--font", fontStack(name, category));
  }

  // Description (body) text: follows the heading font unless a different one is picked
  function applyFontBody() {
    const name = state.fontBody;
    if (!name || name === DEFAULT_FONT_BODY) { root.style.removeProperty("--font-body"); return; }
    const category = (FONTS.find(([n]) => n === name) || [, "sans-serif"])[1];
    loadGoogleFont(name);
    root.style.setProperty("--font-body", fontStack(name, category));
  }

  function applyWeight() {
    if (state.weight) root.style.setProperty("--weight-display", state.weight);
    else root.style.removeProperty("--weight-display");
  }

  function fontStack(name, category) {
    return category === "serif"
      ? `"${name}", Georgia, "Times New Roman", serif`
      : `"${name}", "Helvetica Neue", Arial, sans-serif`;
  }

  function loadGoogleFont(name) {
    const id = `tweak-font-${name.replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${name.replace(/\s+/g, "+")}:wght@400;500;600;700&display=swap`;
    document.head.appendChild(link);
  }

  function colorRow(k, label) {
    return `
            <div class="row color">
              <label for="c-${k}">${label}</label>
              <input type="color" id="c-${k}" data-color="${k}">
              <input type="text" class="hex" data-hex="${k}" aria-label="${label} hex value" spellcheck="false" maxlength="7">
            </div>`;
  }

  /* ---------------- panel ---------------- */

  function buildPanel() {
    const host = document.createElement("div");
    host.id = "tweak-panel-host";
    document.body.appendChild(host);
    const shadow = host.attachShadow({ mode: "open" });

    shadow.innerHTML = `
      <style>${PANEL_CSS}</style>
      <button class="toggle" type="button" aria-expanded="false" aria-controls="panel">Tweak</button>
      <section class="panel" id="panel" aria-label="Design tweaks" hidden>
        <header>
          <h2>Design tweaks</h2>
          <button class="icon" type="button" data-close aria-label="Close tweaks">&times;</button>
        </header>
        <div class="body">
          <h3>Page background</h3>
          <div class="segmented" role="radiogroup" aria-label="Background type">
            <label><input type="radio" name="bg-mode" value="solid"> Solid</label>
            <label><input type="radio" name="bg-mode" value="gradient"> Linear gradient</label>
          </div>
          <div data-bg-solid>${colorRow("paper", "Colour")}</div>
          <div data-bg-gradient hidden>
            <div class="row color">
              <label for="g-from">Start colour</label>
              <input type="color" id="g-from" data-grad="from">
              <input type="text" class="hex" data-grad-hex="from" aria-label="Start colour hex value" spellcheck="false" maxlength="7">
            </div>
            <div class="row color">
              <label for="g-to">End colour</label>
              <input type="color" id="g-to" data-grad="to">
              <input type="text" class="hex" data-grad-hex="to" aria-label="End colour hex value" spellcheck="false" maxlength="7">
            </div>
            <div class="row range">
              <label for="g-angle">Angle</label>
              <input type="range" id="g-angle" min="0" max="360" step="5">
              <output for="g-angle" data-out="angle"></output>
            </div>
            <div class="swatch" aria-hidden="true"></div>
          </div>

          <h3>Colours</h3>
          <div class="contrast" aria-live="polite"></div>
          ${COLORS.filter(([k]) => k !== "paper").map(([k, label]) => colorRow(k, label)).join("")}

          <h3>Font</h3>
          <div class="row">
            <label for="font">Heading typeface</label>
            <select id="font">${FONTS.map(([n, c]) => `<option value="${n}">${n}${c === "serif" ? " (serif)" : ""}</option>`).join("")}</select>
          </div>
          <div class="row">
            <label for="font-body">Description typeface</label>
            <select id="font-body">${FONTS.map(([n, c]) => `<option value="${n}">${n}${c === "serif" ? " (serif)" : ""}</option>`).join("")}</select>
          </div>
          <div class="row range">
            <label for="weight">Heading weight</label>
            <input type="range" id="weight" min="400" max="700" step="100">
            <output for="weight" data-out="weight"></output>
          </div>

          <h3>Sizes</h3>
          ${SIZES.map(([k, label]) => `
            <div class="row range">
              <label for="s-${k}">${label}</label>
              <input type="range" id="s-${k}" data-size="${k}" min="50" max="200" step="5">
              <output for="s-${k}" data-out="${k}"></output>
            </div>`).join("")}
        </div>
        <footer>
          <p class="changes" aria-live="polite"></p>
          <div class="buttons">
            <button type="button" class="primary" data-copy>Copy CSS</button>
            <button type="button" data-reset>Reset all</button>
          </div>
          <textarea class="output" readonly aria-label="Changed CSS values" hidden></textarea>
        </footer>
      </section>`;

    const $ = (sel) => shadow.querySelector(sel);
    const $$ = (sel) => [...shadow.querySelectorAll(sel)];
    const toggle = $(".toggle");
    const panel = $(".panel");

    const setOpen = (open) => {
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Close" : "Tweak";
      state.open = open;
      save();
    };

    toggle.addEventListener("click", () => setOpen(panel.hidden));
    $("[data-close]").addEventListener("click", () => { setOpen(false); toggle.focus(); });
    shadow.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !panel.hidden) { setOpen(false); toggle.focus(); }
    });

    // Colours
    $$("[data-color]").forEach((input) => {
      input.addEventListener("input", () => setColor(input.dataset.color, input.value));
    });
    $$("[data-hex]").forEach((input) => {
      input.addEventListener("change", () => {
        const v = normalizeHex(input.value);
        if (v) setColor(input.dataset.hex, v);
        else syncControls();   // invalid hex: put the current value back
      });
    });

    function setColor(key, value) {
      const v = value.toUpperCase();
      if (v === defaults.colors[key]) delete state.colors[key];
      else state.colors[key] = v;
      applyColor(key);
      save();
      syncControls();
    }

    // Page background: solid or linear gradient
    $$('input[name="bg-mode"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        if (radio.value === "gradient") {
          const current = effectiveBg();
          const next = typeof current === "object" ? current
            : { from: state.colors.paper || defaults.colors.paper, ...GRADIENT_DEFAULT, ...(state.lastGradient || {}) };
          state.bg = sameGradient(next, defaults.bg) ? null : next;
          state.lastGradient = { ...next };   // remembered if you switch back and forth
        } else {
          state.bg = defaults.bg === "solid" ? null : "solid";
        }
        applyBackground(); save(); syncControls();
      });
    });
    const setGradient = (patch) => {
      const next = { ...effectiveBg(), ...patch };
      state.bg = sameGradient(next, defaults.bg) ? null : next;
      state.lastGradient = { ...next };
      applyBackground(); save(); syncControls();
    };
    $$("[data-grad]").forEach((input) => {
      input.addEventListener("input", () => setGradient({ [input.dataset.grad]: input.value.toUpperCase() }));
    });
    $$("[data-grad-hex]").forEach((input) => {
      input.addEventListener("change", () => {
        const v = normalizeHex(input.value);
        if (v) setGradient({ [input.dataset.gradHex]: v });
        else syncControls();
      });
    });
    $("#g-angle").addEventListener("input", (e) => setGradient({ angle: Number(e.target.value) }));

    // Font
    $("#font").addEventListener("change", (e) => {
      state.font = e.target.value === DEFAULT_FONT ? null : e.target.value;
      applyFont(); save(); syncControls();
    });
    $("#font-body").addEventListener("change", (e) => {
      state.fontBody = e.target.value === DEFAULT_FONT_BODY ? null : e.target.value;
      applyFontBody(); save(); syncControls();
    });
    $("#weight").addEventListener("input", (e) => {
      const w = Number(e.target.value);
      state.weight = w === defaults.weight ? null : w;
      applyWeight(); save(); syncControls();
    });

    // Sizes
    $$("[data-size]").forEach((input) => {
      input.addEventListener("input", () => {
        const f = Number(input.value) / 100;
        if (f === 1) delete state.sizes[input.dataset.size];
        else state.sizes[input.dataset.size] = f;
        applySize(input.dataset.size); save(); syncControls();
      });
    });

    // Copy / reset
    $("[data-copy]").addEventListener("click", async () => {
      const text = exportCSS();
      const out = $(".output");
      out.value = text;
      out.hidden = false;
      try {
        await navigator.clipboard.writeText(text);
        $(".changes").textContent = "Copied. Paste it to Claude to make it permanent.";
      } catch {
        out.select();
        $(".changes").textContent = "Select the text below and copy it.";
      }
    });
    $("[data-reset]").addEventListener("click", () => {
      state = { ...blank(), open: true };
      applyAll(); save(); syncControls();
      $(".output").hidden = true;
    });

    function syncControls() {
      COLORS.forEach(([k]) => {
        const v = state.colors[k] || defaults.colors[k];
        $(`[data-color="${k}"]`).value = v.toLowerCase();
        $(`[data-hex="${k}"]`).value = v;
        $(`[data-color="${k}"]`).closest(".row").classList.toggle("changed", k in state.colors);
      });
      const bg = effectiveBg();
      const gradient = typeof bg === "object";
      $(`input[name="bg-mode"][value="${gradient ? "gradient" : "solid"}"]`).checked = true;
      $("[data-bg-solid]").hidden = gradient;
      $("[data-bg-gradient]").hidden = !gradient;
      $(".segmented").classList.toggle("changed", !!state.bg);
      if (gradient) {
        ["from", "to"].forEach((k) => {
          $(`[data-grad="${k}"]`).value = bg[k].toLowerCase();
          $(`[data-grad-hex="${k}"]`).value = bg[k];
        });
        $("#g-angle").value = bg.angle;
        $('[data-out="angle"]').textContent = `${bg.angle}°`;
        $(".swatch").style.background = gradientCSS(bg);
      }

      $("#font").value = state.font || DEFAULT_FONT;
      $("#font").closest(".row").classList.toggle("changed", !!state.font);
      $("#font-body").value = state.fontBody || DEFAULT_FONT_BODY;
      $("#font-body").closest(".row").classList.toggle("changed", !!state.fontBody);
      const w = state.weight || defaults.weight;
      $("#weight").value = w;
      $('[data-out="weight"]').textContent = w;
      $("#weight").closest(".row").classList.toggle("changed", !!state.weight);
      SIZES.forEach(([k]) => {
        const pct = Math.round((state.sizes[k] || 1) * 100);
        $(`[data-size="${k}"]`).value = pct;
        $(`[data-out="${k}"]`).textContent = `${pct}%`;
        $(`[data-size="${k}"]`).closest(".row").classList.toggle("changed", k in state.sizes);
      });

      const n = changeCount();
      $(".changes").textContent = n ? `${n} change${n === 1 ? "" : "s"}` : "No changes yet";
      $(".contrast").innerHTML = contrastReport();
    }

    syncControls();
    if (state.open) setOpen(true);
  }

  /* ---------------- export ---------------- */

  function changeCount() {
    return Object.keys(state.colors).length + Object.keys(state.sizes).length
      + (state.font ? 1 : 0) + (state.fontBody ? 1 : 0) + (state.weight ? 1 : 0) + (state.bg ? 1 : 0);
  }

  function exportCSS() {
    if (!changeCount()) return "/* No changes yet */";
    const lines = [];
    COLORS.forEach(([k, label]) => {
      if (state.colors[k]) lines.push(`  --${k}: ${state.colors[k]};   /* ${label}, was ${defaults.colors[k]} */`);
    });
    const wasBg = defaults.bg === "solid" ? "solid Colour" : gradientCSS(defaults.bg);
    if (state.bg === "solid") lines.push(`  --page-bg: var(--paper);   /* page background: solid Colour, was ${wasBg} */`);
    else if (state.bg) lines.push(`  --page-bg: ${gradientCSS(state.bg)};   /* page background, was ${wasBg} */`);
    if (state.font) {
      const category = FONTS.find(([n]) => n === state.font)[1];
      lines.push(`  --font: ${fontStack(state.font, category)};   /* headings, was ${DEFAULT_FONT} */`);
    }
    if (state.fontBody) {
      const category = FONTS.find(([n]) => n === state.fontBody)[1];
      lines.push(`  --font-body: ${fontStack(state.fontBody, category)};   /* descriptions, was ${DEFAULT_FONT_BODY} */`);
    }
    if (state.weight) lines.push(`  --weight-display: ${state.weight};   /* heading weight, was ${defaults.weight} */`);
    SIZES.forEach(([k, label]) => {
      const f = state.sizes[k];
      if (f) lines.push(`  --${k}: calc(${defaults.sizes[k]} * ${f});   /* ${label}, ${Math.round(f * 100)}% */`);
    });
    return `/* Tweaks from the preview panel */\n:root {\n${lines.join("\n")}\n}`;
  }

  /* ---------------- contrast ---------------- */

  function contrastReport() {
    const c = (k) => state.colors[k] || defaults.colors[k];
    // With a gradient, text must work on both ends, so report the weaker of the two
    const bg = effectiveBg();
    const page = typeof bg === "object" ? [bg.from, bg.to] : [c("paper")];
    const pairs = [
      ["Text", c("ink"), page, 4.5],
      ["Secondary text", c("slate"), page, 4.5],
      ["Inactive labels", c("mist"), page, 3],
      ["White on accent", "#FFFFFF", [c("navy")], 4.5],
    ];
    return pairs.map(([label, fg, bgs, min]) => {
      const r = Math.min(...bgs.map((bg) => ratio(fg, bg)));
      const ok = r >= min;
      return `<span class="${ok ? "pass" : "fail"}">${label} ${r.toFixed(1)}:1 ${ok ? "passes" : `needs ${min}:1`}</span>`;
    }).join("");
  }

  function ratio(a, b) {
    const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (l1 + 0.05) / (l2 + 0.05);
  }

  function luminance(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
      .map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  }

  function normalizeHex(value) {
    let v = String(value).trim().replace(/^#?/, "#");
    if (/^#[0-9a-f]{3}$/i.test(v)) v = "#" + [...v.slice(1)].map((ch) => ch + ch).join("");
    return /^#[0-9a-f]{6}$/i.test(v) ? v.toUpperCase() : null;
  }

  /* ---------------- panel styles (scoped to the shadow root) ---------------- */

  const PANEL_CSS = `
    :host { all: initial; }
    * { box-sizing: border-box; }
    button, input, select, textarea { font: inherit; color: inherit; }
    .toggle, .panel { font: 13px/1.4 -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1d1d1f; }
    .toggle {
      position: fixed; right: 16px; bottom: 16px; z-index: 2147483646;
      min-height: 40px; padding: 8px 16px; border-radius: 999px;
      border: 1px solid #d2d2d7; background: #fff; cursor: pointer; font-weight: 600;
      box-shadow: 0 6px 20px -8px rgba(0,0,0,.35);
    }
    .toggle:hover { background: #f5f5f7; }
    .panel {
      position: fixed; right: 16px; bottom: 68px; z-index: 2147483647;
      width: min(320px, calc(100vw - 32px)); max-height: calc(100vh - 100px);
      display: flex; flex-direction: column;
      background: #fff; border: 1px solid #d2d2d7; border-radius: 12px;
      box-shadow: 0 18px 48px -16px rgba(0,0,0,.4);
    }
    .panel[hidden] { display: none; }
    header { display: flex; align-items: center; justify-content: space-between; padding: 12px 12px 8px 16px; border-bottom: 1px solid #ececf0; }
    h2 { font-size: 14px; margin: 0; }
    h3 { font-size: 12px; margin: 18px 0 8px; color: #6e6e73; font-weight: 600; }
    h3:first-child { margin-top: 4px; }
    .icon { width: 32px; height: 32px; border: 0; border-radius: 8px; background: none; font-size: 20px; cursor: pointer; }
    .icon:hover { background: #f5f5f7; }
    .body { overflow-y: auto; padding: 8px 16px 12px; }
    .row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 8px; padding: 4px 0 4px 8px; border-left: 2px solid transparent; }
    .row.changed { border-left-color: #1E3A66; }
    .row.color { grid-template-columns: 1fr 32px 76px; }
    .row.range { grid-template-columns: 1fr 110px 40px; }
    input[type=color] { width: 32px; height: 26px; padding: 0; border: 1px solid #d2d2d7; border-radius: 6px; background: none; cursor: pointer; }
    input[type=color]::-webkit-color-swatch-wrapper { padding: 2px; }
    input[type=color]::-webkit-color-swatch { border: 0; border-radius: 4px; }
    .hex { width: 76px; padding: 4px 6px; border: 1px solid #d2d2d7; border-radius: 6px; font-family: ui-monospace, Menlo, monospace; font-size: 12px; }
    select { width: 150px; padding: 4px 6px; border: 1px solid #d2d2d7; border-radius: 6px; background: #fff; }
    input[type=range] { width: 110px; accent-color: #1E3A66; }
    output { text-align: right; font-variant-numeric: tabular-nums; color: #6e6e73; }
    .segmented { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; padding: 3px; margin: 0 0 6px 8px; border-radius: 8px; background: #f0f0f3; border-left: 2px solid transparent; }
    .segmented.changed { box-shadow: -10px 0 0 -8px #1E3A66; }
    .segmented label { position: relative; text-align: center; padding: 5px 6px; border-radius: 6px; cursor: pointer; }
    .segmented input { position: absolute; opacity: 0; inset: 0; margin: 0; cursor: pointer; }
    .segmented label:has(input:checked) { background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,.12); font-weight: 600; }
    .segmented label:has(input:focus-visible) { outline: 2px solid #1E3A66; outline-offset: 1px; }
    .swatch { height: 28px; margin: 6px 0 4px 8px; border-radius: 6px; border: 1px solid #d2d2d7; }
    .contrast { display: grid; gap: 2px; margin-bottom: 8px; font-size: 12px; }
    .pass { color: #1d7a3a; }
    .fail { color: #b3261e; font-weight: 600; }
    footer { padding: 10px 16px 14px; border-top: 1px solid #ececf0; }
    .changes { margin: 0 0 8px; color: #6e6e73; min-height: 1.4em; }
    .buttons { display: flex; gap: 8px; }
    .buttons button { flex: 1; min-height: 36px; border-radius: 8px; border: 1px solid #d2d2d7; background: #fff; cursor: pointer; font-weight: 600; }
    .buttons button:hover { background: #f5f5f7; }
    .buttons .primary { background: #1E3A66; border-color: #1E3A66; color: #fff; }
    .buttons .primary:hover { background: #0B0B0D; }
    .output { width: 100%; height: 120px; margin-top: 10px; padding: 8px; border: 1px solid #d2d2d7; border-radius: 6px; font: 11px/1.4 ui-monospace, Menlo, monospace; resize: vertical; }
    :focus-visible { outline: 2px solid #1E3A66; outline-offset: 2px; }
  `;
})();
