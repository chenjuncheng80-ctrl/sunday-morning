/* ==========================================================================
   scenes.js — scene illustrations (pure SVG, no external images)
   Canvas is 1200x560 (about 2.14:1), so a wide stage barely crops it.
   Arches: spring line y = apex y + radius, or the apex lands off-canvas.
   ========================================================================== */

const Scenes = (() => {

  let uid = 0;

  /* ── Shared materials ─────────────────────────────────────────── */
  const DEFS = `<defs>
    <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f2e7cf"/><stop offset="1" stop-color="#e0ceae"/>
    </linearGradient>
    <linearGradient id="wallLow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#e6d5b4"/><stop offset="1" stop-color="#d4bf9a"/>
    </linearGradient>
    <linearGradient id="bedding" x1="0" y1="0" x2="0.25" y2="1">
      <stop offset="0" stop-color="#fdf9ee"/><stop offset="1" stop-color="#e9dfc8"/>
    </linearGradient>
    <linearGradient id="quilt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f6efdf"/><stop offset="1" stop-color="#dccfb3"/>
    </linearGradient>
    <pattern id="planks" width="150" height="44" patternUnits="userSpaceOnUse">
      <rect width="150" height="44" fill="#b8895c"/>
      <path d="M0 43.5H150" stroke="#946b41" stroke-width="1.8" opacity=".6"/>
      <path d="M52 0v44M126 0v44" stroke="#a97c52" stroke-width="1" opacity=".35"/>
    </pattern>
    <pattern id="tiles" width="56" height="56" patternUnits="userSpaceOnUse">
      <rect width="56" height="56" fill="#e8ddc4"/>
      <path d="M0 0h56v56H0Z" fill="none" stroke="#cdbb99" stroke-width="1.4"/>
    </pattern>
    <pattern id="wallpaper" width="22" height="22" patternUnits="userSpaceOnUse">
      <path d="M0 0v22" stroke="#c9ac80" stroke-width="1" opacity=".24"/>
    </pattern>
    <radialGradient id="sunGlow">
      <stop offset="0" stop-color="#fff8dc" stop-opacity=".95"/>
      <stop offset="1" stop-color="#fff8dc" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="roomShade" cx="50%" cy="44%" r="74%">
      <stop offset="52%" stop-color="#3a2c18" stop-opacity="0"/>
      <stop offset="100%" stop-color="#3a2c18" stop-opacity=".32"/>
    </radialGradient>
    <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="blur14"><feGaussianBlur stdDeviation="14"/></filter>
  </defs>`;

  const wrap = (body) =>
    `<svg viewBox="0 0 1200 560" preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">${DEFS}${body}</svg>`;

  /* ── Sky outside the window (absolute coords) ─────────────────────────────── */
  const SKY = {
    "Clear and mild":  ["#cfe4e9", "#eff2e6"],
    "Bright sunshine": ["#a9d6ee", "#fbf3d2"],
    "Overcast":        ["#c8cdcf", "#e6e6e1"],
    "Drizzles":        ["#9fb0b9", "#c8d2d5"],
    "Storm":           ["#3f4856", "#767d89"],
    "Unknown":         ["#dbe4e0", "#f3efe2"],
  };

  function skyIn(x, y, w, h, weather) {
    const [a, b] = SKY[weather] || SKY.Unknown;
    const id = `sky${++uid}`;
    const P = (fx, fy) => [x + fx * w, y + fy * h];
    let g = "";

    if (weather === "Bright sunshine") {
      const [sx, sy] = P(0.74, 0.27);
      g += `<circle cx="${sx}" cy="${sy}" r="${h * 0.36}" fill="url(#sunGlow)"/>
            <circle cx="${sx}" cy="${sy}" r="${h * 0.072}" fill="#fffdf0"/>`;
    } else if (weather === "Clear and mild") {
      const [sx, sy] = P(0.72, 0.24);
      g += `<circle cx="${sx}" cy="${sy}" r="${h * 0.28}" fill="url(#sunGlow)" opacity=".6"/>`;
    }

    const cloudCol = weather === "Storm" ? "#5b6472"
      : weather === "Overcast" ? "#b7bcbe"
      : weather === "Drizzles" ? "#a6b4bb" : "#ffffff";
    const n = (weather === "Overcast" || weather === "Storm") ? 4
      : weather === "Drizzles" ? 3 : 2;

    for (let i = 0; i < n; i++) {
      const [cx, cy] = P(0.16 + i * 0.25, 0.12 + (i % 3) * 0.14);
      const s = (1 + (i % 2) * 0.35) * (w / 320);
      g += `<g fill="${cloudCol}" opacity="${weather === "Bright sunshine" ? 0.7 : 0.8}">
        <ellipse cx="${cx}" cy="${cy}" rx="${17 * s}" ry="${8 * s}"/>
        <ellipse cx="${cx - 11 * s}" cy="${cy + 4 * s}" rx="${10 * s}" ry="${5.6 * s}"/>
        <ellipse cx="${cx + 10 * s}" cy="${cy + 4.5 * s}" rx="${12 * s}" ry="${6.2 * s}"/>
      </g>`;
    }

    /* Distant buildings: uneven heights, not a row of blocks */
    const cityCol = weather === "Storm" ? "#454d59" : "#7b8580";
    const cityOp = weather === "Storm" ? 0.4 : 0.2;
    const base = y + h;
    const u = w / 700;
    g += `<g fill="${cityCol}" opacity="${cityOp}">
      <path d="M${x} ${base}V${base - 62 * u}h${48 * u}v-14l${14 * u}-9v${85 * u}Z"/>
      <path d="M${x + 96 * u} ${base}V${base - 96 * u}h${38 * u}V${base}Z"/>
      <path d="M${x + 172 * u} ${base}V${base - 54 * u}h${62 * u}V${base}Z"/>
      <path d="M${x + 288 * u} ${base}V${base - 84 * u}h${34 * u}V${base}Z"/>
      <path d="M${x + 366 * u} ${base}V${base - 48 * u}h${58 * u}V${base}Z"/>
      <path d="M${x + 476 * u} ${base}V${base - 76 * u}h${32 * u}V${base}Z"/>
      <path d="M${x + 556 * u} ${base}V${base - 40 * u}h${72 * u}V${base}Z"/>
    </g>`;

    if (weather === "Drizzles" || weather === "Storm") {
      const cnt = weather === "Storm" ? 26 : 12;
      const len = (weather === "Storm" ? 34 : 22) * (h / 230);
      for (let i = 0; i < cnt; i++) {
        const rx = x + ((i * 97) % Math.max(1, w - 10));
        const ry = y + ((i * 61) % Math.max(1, h - len));
        g += `<line x1="${rx}" y1="${ry}" x2="${rx - len * 0.28}" y2="${ry + len}"
          stroke="#eef5f8" stroke-width="${weather === "Storm" ? 1.7 : 1.1}"
          opacity="${weather === "Storm" ? 0.5 : 0.4}" stroke-linecap="round"/>`;
      }
    }

    return `<defs><clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs>
      <g clip-path="url(#${id})">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${a}"/>
        <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${b}" opacity=".5"/>
        ${g}
      </g>`;
  }

  /* ── Wall clock: the hands really move ───────────────────────────────── */
  function clock(cx, cy, r, time) {
    const [hh, mm] = time.split(":").map(Number);
    const hAng = ((hh % 12) + mm / 60) * 30 - 90;
    const mAng = mm * 6 - 90;
    const tick = Array.from({ length: 12 }, (_, i) => {
      const a = (i * 30 - 90) * Math.PI / 180;
      const r1 = r - 5, r2 = r - (i % 3 === 0 ? 12 : 8);
      return `<line x1="${cx + Math.cos(a) * r1}" y1="${cy + Math.sin(a) * r1}"
        x2="${cx + Math.cos(a) * r2}" y2="${cy + Math.sin(a) * r2}"
        stroke="#7a6a50" stroke-width="${i % 3 === 0 ? 1.8 : 1}" opacity=".6"/>`;
    }).join("");
    return `<g>
      <ellipse cx="${cx + 3}" cy="${cy + 4}" rx="${r + 3}" ry="${r + 2}" fill="#a8895e" opacity=".25"/>
      <circle cx="${cx}" cy="${cy}" r="${r + 4}" fill="#e6d4b2" stroke="#b99465" stroke-width="2"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#fbf5e6"/>
      ${tick}
      <line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(hAng * Math.PI / 180) * (r * 0.5)}"
        y2="${cy + Math.sin(hAng * Math.PI / 180) * (r * 0.5)}"
        stroke="#3a3128" stroke-width="3.4" stroke-linecap="round"/>
      <line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(mAng * Math.PI / 180) * (r * 0.74)}"
        y2="${cy + Math.sin(mAng * Math.PI / 180) * (r * 0.74)}"
        stroke="#3a3128" stroke-width="1.9" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="2.8" fill="#b04f33"/>
    </g>`;
  }

  /* ── Window ───────────────────────────────────────────────── */
  function windowUnit(x, y, w, h, weather, opts = {}) {
    return `<rect x="${x - 12}" y="${y - 12}" width="${w + 24}" height="${h + 24}" rx="2"
      fill="#e9d9ba" stroke="#b99465" stroke-width="2.4"/>
    <rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${h + 10}" fill="#f6ecd6"/>
    ${skyIn(x, y, w, h, weather)}
    <g stroke="#cfb389" stroke-width="5.5" fill="none">
      <path d="M${x + w / 2} ${y}V${y + h}"/>
      <path d="M${x} ${y + h * 0.48}H${x + w}"/>
    </g>
    ${opts.reflect === false ? "" : `
      <path d="M${x + w * 0.07} ${y + h} L${x + w * 0.41} ${y} L${x + w * 0.54} ${y} L${x + w * 0.2} ${y + h} Z"
        fill="#ffffff" opacity=".13"/>
      <path d="M${x + w * 0.63} ${y + h} L${x + w * 0.89} ${y} L${x + w * 0.95} ${y} L${x + w * 0.69} ${y + h} Z"
        fill="#ffffff" opacity=".07"/>`}
    ${weather === "Drizzles" || weather === "Storm" ? `
      <g stroke="#f4f9fb" stroke-width="1.6" fill="none" opacity=".42" stroke-linecap="round">
        <path d="M${x + w * 0.16} ${y + 6}q6 24 -2 48q-6 20 2 40"/>
        <path d="M${x + w * 0.32} ${y + 20}q5 18 -1 36"/>
        <path d="M${x + w * 0.74} ${y + 4}q7 28 -1 54q-5 18 3 36"/>
        <path d="M${x + w * 0.88} ${y + 38}q4 16 -2 32"/>
      </g>` : ""}
    <rect x="${x - 22}" y="${y + h + 4}" width="${w + 44}" height="10" rx="1" fill="#e4d2ac" stroke="#b99465" stroke-width="1.4"/>
    <rect x="${x - 22}" y="${y + h + 14}" width="${w + 44}" height="6" fill="#8a6238" opacity=".18"/>`;
  }

  /* ── Window light on the floor ─────────────────────────────────────────── */
  function sunPatch(time, x, w, floorY, strength) {
    const shift = { "08:00": 0, "09:00": 22, "10:00": 46, "11:00": 70,
                    "12:00": 86, "15:00": 140, "15:30": 156 }[time] ?? 0;
    const x0 = x + shift;
    return `<g opacity="${strength}">
      <path d="M${x0} ${floorY} L${x0 + w} ${floorY} L${x0 + w + 70} 560 L${x0 - 44} 560 Z"
        fill="#ffe9b8" opacity=".5"/>
      <path d="M${x0 + w / 2 - 2} ${floorY} L${x0 + w / 2 + 2} ${floorY} L${x0 + w / 2 + 74} 560 L${x0 + w / 2 + 54} 560 Z"
        fill="#e6cb92" opacity=".4"/>
    </g>`;
  }

  /* ── Hotspots ─────────────────────────────────────────────── */
  function hot(key, inner, label, ring) {
    return `<g class="hotspot" data-hot="${key}" tabindex="0" role="button" aria-label="${label}">
      <g class="hs-glow" filter="url(#blur6)">${ring || ""}</g>
      <g class="hs-ring">${ring || ""}</g>
      ${inner}
    </g>`;
  }

  /* ======================================================================
     Bedroom
     ====================================================================== */
  function bedroom(s) {
    const w = s.weather;
    const dim = ["Storm", "Drizzles", "Overcast"].includes(w);
    // bare: the wake-up screen draws the room with no clickable hotspots
    const H = s.bare ? (key, inner) => `<g>${inner}</g>` : hot;
    return wrap(`
    <rect width="1200" height="352" fill="url(#wall)"/>
    <rect width="1200" height="352" fill="url(#wallpaper)"/>
    <rect y="330" width="1200" height="22" fill="url(#wallLow)"/>
    <rect y="330" width="1200" height="3" fill="#b99465" opacity=".35"/>
    <rect y="352" width="1200" height="208" fill="url(#planks)"/>
    <rect y="352" width="1200" height="208" fill="#5d4526" opacity="${dim ? 0.26 : 0.12}"/>

    ${sunPatch(s.time, 220, 320, 352, dim ? 0.18 : 0.9)}

    <!-- Doorway to the kitchen -->
    ${H("kitchen", `
      <rect x="36" y="58" width="118" height="294" fill="#2b2318"/>
      <path d="M48 352V150q47-46 94 0v202Z" fill="#1a130c"/>
      <rect x="48" y="72" width="94" height="280" fill="url(#sunGlow)" opacity=".13"/>
      <rect x="24" y="46" width="142" height="12" fill="#dcc8a2" stroke="#b99465" stroke-width="1.4"/>
      <rect x="24" y="58" width="12" height="294" fill="#dcc8a2" stroke="#b99465" stroke-width="1.2"/>
      <rect x="154" y="58" width="12" height="294" fill="#dcc8a2" stroke="#b99465" stroke-width="1.2"/>
      <ellipse cx="95" cy="352" rx="66" ry="10" fill="#3a2c18" opacity=".2"/>`,
      "Go to the kitchen", `<rect x="24" y="46" width="142" height="308" rx="2"/>`)}

    <!-- Window -->
    ${H("window", windowUnit(220, 42, 320, 232, w), "Look out of the window",
      `<rect x="204" y="28" width="352" height="278" rx="2"/>`)}

    <!-- Clock -->
    ${clock(602, 136, 40, s.time)}

    <!-- Mirror -->
    ${H("mirror", `
      <path d="M662 300V150a74 74 0 0 1 148 0v150Z" fill="#c8a878" stroke="#9c7846" stroke-width="2.6"/>
      <path d="M673 294V151a63 63 0 0 1 126 0v143Z" fill="#d5c8ae"/>
      <path d="M673 294V151a63 63 0 0 1 126 0v143Z" fill="url(#sunGlow)" opacity=".16"/>
      <path d="M690 286L760 168" stroke="#ffffff" stroke-width="14" opacity=".24"/>
      <path d="M702 292L772 174" stroke="#ffffff" stroke-width="4" opacity=".18"/>
      <rect x="648" y="294" width="176" height="9" rx="1" fill="#dcc8a2" stroke="#9c7846" stroke-width="1.2"/>`,
      "Look in the mirror", `<path d="M656 302V150a80 80 0 0 1 160 0v152Z"/>`)}

    <!-- Bed -->
    <g>
      <ellipse cx="480" cy="506" rx="316" ry="15" fill="#3a2c18" opacity=".14"/>

      <path d="M158 470V252a12 12 0 0 1 12-12h16a12 12 0 0 1 12 12v218Z"
        fill="#a97f4f" stroke="#8a6238" stroke-width="2"/>
      <path d="M166 260h24" stroke="#c19a6c" stroke-width="2" opacity=".7"/>

      <rect x="198" y="436" width="594" height="26" fill="#b98d5c" stroke="#8f6939" stroke-width="1.8"/>
      <rect x="210" y="462" width="20" height="30" fill="#8f6939"/>
      <rect x="762" y="462" width="20" height="30" fill="#8f6939"/>

      <rect x="198" y="330" width="594" height="78" rx="8" fill="url(#bedding)" stroke="#d3c3a2" stroke-width="1.4"/>

      <path d="M296 356h496v74a14 14 0 0 1-14 14H310a14 14 0 0 1-14-14Z"
        fill="url(#quilt)" stroke="#d3c3a2" stroke-width="1.4"/>
      <path d="M296 356h496v16c-56 9-102-6-158 2s-94 6-150-2-130 2-188-2Z"
        fill="#ffffff" opacity=".55"/>
      <path d="M320 398q38 7 76 0t76 0 76 0 76 0 76 0" stroke="#d8c9aa" stroke-width="1.4" fill="none" opacity=".85"/>
      <path d="M348 424q34 6 68 0t68 0 68 0 68 0" stroke="#d8c9aa" stroke-width="1.2" fill="none" opacity=".5"/>
      <path d="M296 428h496v16H296Z" fill="#e9e0cc"/>

      <path d="M224 300q58-24 116 0 9 4 9 15v16q0 11-11 11H226q-11 0-11-11v-16q0-11 9-15Z"
        fill="#fefbf1" stroke="#ded0b4" stroke-width="1.4"/>
      <path d="M238 320q44-10 88 0" stroke="#e8dcc4" stroke-width="1.5" fill="none"/>
    </g>

    <!-- Jeans at the foot of the bed -->
    ${H("jeans", `
      <path d="M722 300q30-8 56 0l11 47-16 7-6-26-5 40-14 3 2-42-13 4-6-24Z"
        fill="#4a5f7a" stroke="#37485c" stroke-width="1.8"/>
      <path d="M732 309q26-6 44 0" stroke="#d9c48a" stroke-width="1.3" fill="none" stroke-dasharray="3 3"/>
      <rect x="740" y="340" width="24" height="15" rx="1.5" fill="#42566e"/>`,
      "Put on the jeans", `<rect x="722" y="296" width="76" height="96" rx="4"/>`)}

    <!-- Front door -->
    ${H("door", `
      <rect x="862" y="48" width="190" height="302" fill="#dcc8a2" stroke="#b99465" stroke-width="2"/>
      <rect x="872" y="58" width="170" height="292" fill="#8a5c30"/>
      <rect x="878" y="64" width="158" height="286" fill="#a87544" stroke="#8a5c30" stroke-width="1.6"/>
      <rect x="890" y="76" width="134" height="122" fill="#9d6a3c" stroke="#8a5c30" stroke-width="1.2"/>
      <rect x="890" y="214" width="134" height="124" fill="#9d6a3c" stroke="#8a5c30" stroke-width="1.2"/>
      <circle cx="1008" cy="212" r="5.6" fill="#d9b26a" stroke="#8a5c30" stroke-width="1.4"/>
      <rect x="922" y="74" width="68" height="34" rx="1" fill="#e8d8b4" stroke="#b99465" stroke-width="1.2"/>
      <text x="956" y="97" text-anchor="middle" font-family="Georgia,serif" font-size="17" fill="#5c4a30">38</text>
      <circle cx="1052" cy="174" r="6.4" fill="#e8d8b4" stroke="#b99465" stroke-width="1.4"/>
      <circle cx="1052" cy="174" r="2.4" fill="#b04f33"/>`,
      "Go to the door", `<rect x="856" y="42" width="202" height="316" rx="2"/>`)}

    <ellipse cx="470" cy="524" rx="204" ry="20" fill="#c98f6a" opacity=".4"/>
    <ellipse cx="470" cy="524" rx="172" ry="13" fill="#d9a37e" opacity=".45"/>
    <g opacity=".85">
      <ellipse cx="124" cy="514" rx="22" ry="9" fill="#8f5f3e"/>
      <ellipse cx="164" cy="520" rx="22" ry="9" fill="#8f5f3e"/>
    </g>

    <rect width="1200" height="560" fill="url(#roomShade)"/>`);
  }

  /* ======================================================================
     The window (close-up)
     ====================================================================== */
  function windowView(s) {
    return wrap(`
    <rect width="1200" height="430" fill="url(#wall)"/>
    <rect width="1200" height="430" fill="url(#wallpaper)"/>
    <rect y="418" width="1200" height="142" fill="url(#planks)"/>
    ${windowUnit(250, 38, 700, 380, s.weather)}
    <g transform="translate(866,404)">
      <path d="M0 0h54l-7 32H7Z" fill="#b96a45" stroke="#8f4a2c" stroke-width="1.4"/>
      <path d="M27-3c-4-22-17-30-29-32 12 20 17 24 23 34Z" fill="#6f7f57"/>
      <path d="M29-3c6-24 19-30 31-30-13 18-19 22-25 32Z" fill="#7d8c62"/>
      <path d="M27-4v-26" stroke="#5f6e49" stroke-width="1.6"/>
    </g>
    <rect width="1200" height="560" fill="url(#roomShade)"/>`);
  }

  /* ======================================================================
     The mirror
     ====================================================================== */
  const VISIONS = {
    idle: `<g>
        <rect x="356" y="96" width="488" height="440" fill="#d6cbb3"/>
        <rect x="356" y="330" width="488" height="206" fill="#c8ba9e"/>
        <path d="M356 330h488" stroke="#ffffff" stroke-width="2" opacity=".26"/>
        <g opacity=".4" fill="#8d7f66">
          <ellipse cx="600" cy="250" rx="48" ry="58"/>
          <path d="M526 440c0-48 33-82 74-82s74 34 74 82Z"/>
        </g>
        <rect x="356" y="96" width="488" height="440" fill="#8fa0a0" opacity=".1"/>
      </g>`,
    lonely: `<g>
        <rect x="356" y="96" width="488" height="440" fill="#bcc7c6"/>
        <rect x="356" y="352" width="488" height="184" fill="#a6b2b1"/>
        <path d="M356 352h488" stroke="#ffffff" stroke-width="2" opacity=".28"/>
        <g opacity=".5" fill="#6f7f7d">
          <ellipse cx="600" cy="334" rx="14" ry="18"/>
          <path d="M583 360c0-11 8-18 17-18s17 7 17 18Z"/>
        </g>
        <rect x="356" y="96" width="488" height="440" fill="#5b6b74" opacity=".18"/>
      </g>`,
    toothpaste: `<g>
        <rect x="356" y="96" width="488" height="440" fill="#f2f6f7"/>
        <path d="M356 536L844 168v368H356Z" fill="#e6eff3"/>
        <path d="M440 536L844 292v244Z" fill="#ffffff" opacity=".85"/>
        <circle cx="470" cy="220" r="36" fill="#ffffff"/>
        <circle cx="470" cy="220" r="23" fill="#cfe6ef"/>
        <path d="M454 226q16 12 32 0" stroke="#8fc3d4" stroke-width="3.2" fill="none" stroke-linecap="round"/>
        <g fill="#ffffff" opacity=".9">
          <path d="M706 186l8 27 27 8-27 8-8 27-8-27-27-8 27-8Z"/>
          <path d="M772 274l5.5 18 18 5.5-18 5.5-5.5 18-5.5-18-18-5.5 18-5.5Z"/>
        </g>
      </g>`,
    wheat: `<g>
        <rect x="356" y="96" width="488" height="440" fill="#efe1ba"/>
        <rect x="356" y="300" width="488" height="236" fill="#dcbe82"/>
        <g stroke="#b8914f" stroke-width="2" opacity=".5" fill="none">
          <path d="M356 352q66-22 132 0t132 0 132 0 92 0"/>
          <path d="M356 390q66-22 132 0t132 0 132 0 92 0"/>
          <path d="M356 428q66-22 132 0t132 0 132 0 92 0"/>
          <path d="M356 466q66-22 132 0t132 0 132 0 92 0"/>
        </g>
        <g stroke="#a8813f" stroke-width="1.6" opacity=".4">
          <path d="M420 352v130M494 372v110M600 352v130M700 372v110M786 352v130"/>
        </g>
        <g fill="#c9a45c" opacity=".5">
          <ellipse cx="420" cy="342" rx="3.6" ry="9"/><ellipse cx="494" cy="362" rx="3.6" ry="9"/>
          <ellipse cx="600" cy="342" rx="3.6" ry="9"/><ellipse cx="700" cy="362" rx="3.6" ry="9"/>
          <ellipse cx="786" cy="342" rx="3.6" ry="9"/>
        </g>
        <circle cx="756" cy="158" r="42" fill="#fff3cc" opacity=".85"/>
        <circle cx="756" cy="158" r="20" fill="#fffaea"/>
      </g>`,
    lotus: `<g>
        <rect x="356" y="96" width="488" height="440" fill="#dfe9e4"/>
        <ellipse cx="600" cy="400" rx="150" ry="32" fill="#9fb6ab"/>
        <ellipse cx="600" cy="400" rx="112" ry="21" fill="#b6c9bd" opacity=".65"/>
        <g transform="translate(600,368)">
          <path d="M0 34C-72 26-96-14-74-52-44-32-14-4 0 34Z" fill="#f4c6d1"/>
          <path d="M0 34C72 26 96-14 74-52 44-32 14-4 0 34Z" fill="#f0b8c5"/>
          <path d="M0 32C-48 20-58-16-40-44-18-26-4-4 0 32Z" fill="#fad9e1"/>
          <path d="M0 32C48 20 58-16 40-44 18-26 4-4 0 32Z" fill="#f8cfda"/>
          <path d="M0 28C-27 14-32-14-17-34-5-18 0 0 0 28Z" fill="#fdeff2"/>
          <path d="M0 28C27 14 32-14 17-34 5-18 0 0 0 28Z" fill="#fce6ec"/>
          <ellipse cx="0" cy="10" rx="12" ry="15" fill="#f7c9a0" opacity=".9"/>
          <ellipse cx="0" cy="34" rx="38" ry="8" fill="#d993a4" opacity=".45"/>
        </g>
        <path d="M600 396v48" stroke="#7d8c62" stroke-width="3"/>
        <path d="M600 424q-28-13-40 3 24 8 40-3Z" fill="#8fa07a" opacity=".75"/>
      </g>`,
    eyes: `<g>
        <rect x="356" y="96" width="488" height="440" fill="#e7dcc4"/>
        <g transform="translate(600,300)">
          <ellipse cx="-96" cy="0" rx="78" ry="47" fill="#fbf7ec" stroke="#3a3128" stroke-width="3.2"/>
          <ellipse cx="96" cy="0" rx="78" ry="47" fill="#fbf7ec" stroke="#3a3128" stroke-width="3.2"/>
          <circle cx="-42" cy="2" r="24" fill="#6b5b3e"/>
          <circle cx="138" cy="2" r="24" fill="#6b5b3e"/>
          <circle cx="-42" cy="2" r="9" fill="#241d15"/>
          <circle cx="138" cy="2" r="9" fill="#241d15"/>
          <circle cx="-36" cy="-6" r="4" fill="#fff"/>
          <circle cx="144" cy="-6" r="4" fill="#fff"/>
          <path d="M-174-6q78-42 156 0M18-6q78-42 156 0" stroke="#3a3128" stroke-width="3.2" fill="none"/>
        </g>
        <g stroke="#3a3128" stroke-width="2.4" opacity=".3" fill="none">
          <path d="M486 160q120 36 120 0"/><path d="M594 160q120 36 120 0"/>
        </g>
      </g>`,
  };

  function mirror(s, vision = "idle") {
    return wrap(`
    <rect width="1200" height="486" fill="url(#wall)"/>
    <rect width="1200" height="486" fill="url(#wallpaper)"/>
    <rect y="486" width="1200" height="74" fill="url(#planks)"/>

    <ellipse cx="603" cy="288" rx="250" ry="222" fill="#a8895e" opacity=".16" filter="url(#blur14)"/>
    <path d="M360 470V330a240 240 0 0 1 480 0v140Z" fill="#c8a878" stroke="#9c7846" stroke-width="3.2"/>
    <path d="M374 470V331a226 226 0 0 1 452 0v139Z" fill="#e8d4ae"/>
    <path d="M386 470V332a214 214 0 0 1 428 0v138Z" fill="#b9c9c7"/>

    <clipPath id="mc"><path d="M386 470V332a214 214 0 0 1 428 0v138Z"/></clipPath>
    <g clip-path="url(#mc)">
      <g class="vision">${VISIONS[vision] || VISIONS.idle}</g>
      <path d="M386 470V332a214 214 0 0 1 428 0v138Z" fill="url(#sunGlow)" opacity=".15"/>
      <path d="M424 470L606 332" stroke="#ffffff" stroke-width="46" opacity=".13"/>
      <path d="M494 470L660 332" stroke="#ffffff" stroke-width="10" opacity=".11"/>
    </g>

    <rect x="330" y="470" width="540" height="13" fill="#dcc8a2" stroke="#9c7846" stroke-width="1.4"/>
    <rect x="330" y="483" width="540" height="4" fill="#8a6238" opacity=".18"/>

    <g transform="translate(706,422)">
      <path d="M2 48V8h30v40Z" fill="#efe6cf" stroke="#b99465" stroke-width="1.4"/>
      <ellipse cx="17" cy="8" rx="15" ry="3.4" fill="#ddd0b4"/>
      <path d="M10 8V-24M22 8V-20" stroke="#b04f33" stroke-width="4.4" stroke-linecap="round"/>
      <path d="M22-20v-12" stroke="#9c7846" stroke-width="3.2"/>
      <rect x="20.6" y="-36" width="2.8" height="7" fill="#6b5b3e"/>
    </g>

    <rect width="1200" height="560" fill="url(#roomShade)"/>`);
  }

  /* ======================================================================
     The kitchen
     ====================================================================== */
  function kitchen(s, food = null) {
    let table = "";
    if (food === "bread") table = `
      <ellipse cx="902" cy="392" rx="62" ry="16" fill="#e8dcc0" stroke="#c9b48c" stroke-width="1.4"/>
      <path d="M870 386q15-23 32-8t32-6 19 15q-17 10-41 8t-42-10Z" fill="#e8c07a" stroke="#c39a4e" stroke-width="1.2"/>
      <path d="M878 380q13-13 25-4" stroke="#f6e0b0" stroke-width="2.4" fill="none"/>`;
    if (food === "apple") table = `
      <ellipse cx="902" cy="394" rx="36" ry="10" fill="#e8dcc0" stroke="#c9b48c" stroke-width="1.2"/>
      <circle cx="902" cy="374" r="19" fill="#b0463c" stroke="#8d332a" stroke-width="1.2"/>
      <circle cx="896" cy="368" r="5" fill="#d4705f" opacity=".5"/>
      <path d="M902 355v-9" stroke="#6b5b3e" stroke-width="2.4"/>
      <path d="M904 349q11-9 18-2-9 7-18 2Z" fill="#6f7f57"/>`;
    if (food === "noodles") table = `
      <path d="M866 352h72l-9 44h-54Z" fill="#f2eee2" stroke="#c9bfa6" stroke-width="1.6"/>
      <rect x="858" y="344" width="88" height="11" rx="3" fill="#e4dbc4" stroke="#c9bfa6" stroke-width="1.3"/>
      <path d="M872 358h60" stroke="#d9ceb6" stroke-width="1.6"/>
      <g class="steam" stroke="#ffffff" stroke-width="3" opacity=".55" fill="none" stroke-linecap="round">
        <path d="M882 330q9-18 0-32"/><path d="M902 326q11-20 0-36"/><path d="M922 330q9-16 0-30"/>
      </g>`;
    if (food === "empty") table = `
      <ellipse cx="902" cy="392" rx="44" ry="11" fill="#e8dcc0" stroke="#c9b48c" stroke-width="1.1" opacity=".6"/>`;

    const dim = ["Storm", "Drizzles", "Overcast"].includes(s.weather);

    return wrap(`
    <rect width="1200" height="360" fill="url(#wall)"/>
    <rect width="1200" height="360" fill="url(#wallpaper)"/>
    <rect y="196" width="1200" height="164" fill="url(#tiles)"/>
    <rect y="196" width="1200" height="6" fill="#c9b48c"/>
    <rect y="352" width="1200" height="12" fill="#dcc8a2"/>
    <rect y="364" width="1200" height="196" fill="url(#planks)"/>
    <rect y="364" width="1200" height="196" fill="#5d4526" opacity="${dim ? 0.26 : 0.14}"/>

    ${hot("fridge", `
      <ellipse cx="162" cy="528" rx="110" ry="12" fill="#3a2c18" opacity=".18"/>
      <rect x="50" y="56" width="222" height="470" rx="6" fill="#efe7d3" stroke="#bda67e" stroke-width="2.4"/>
      <rect x="50" y="56" width="222" height="470" rx="6" fill="#ffffff" opacity=".3"/>
      <path d="M50 246h222" stroke="#bda67e" stroke-width="2.2"/>
      <path d="M50 250h222" stroke="#ffffff" stroke-width="2" opacity=".5"/>
      <rect x="248" y="136" width="8" height="60" rx="4" fill="#b99465"/>
      <rect x="248" y="276" width="8" height="86" rx="4" fill="#b99465"/>
      <rect x="70" y="80" width="40" height="50" rx="2" fill="#fbf7ea" opacity=".9"/>
      <path d="M78 104h24M78 116h16" stroke="#c9b48c" stroke-width="1.6"/>
      <circle cx="104" cy="84" r="2.6" fill="#c04a3a" opacity=".75"/>
      <rect x="50" y="516" width="222" height="10" fill="#8a6238" opacity=".2"/>`,
      "Open the fridge", `<rect x="42" y="48" width="238" height="486" rx="6"/>`)}

    <g>
      <rect x="322" y="120" width="368" height="7" rx="3" fill="#a97f4f" stroke="#8a6238" stroke-width="1.2"/>
      <path d="M372 120v24" stroke="#8a6238" stroke-width="2.6"/>
      <path d="M484 120v20" stroke="#8a6238" stroke-width="2.6"/>
      <path d="M596 120v28" stroke="#8a6238" stroke-width="2.6"/>
      <path d="M338 168h68l-7 30a27 27 0 0 1-54 0Z" fill="#8a9391" stroke="#6d7573" stroke-width="1.8"/>
      <ellipse cx="372" cy="168" rx="34" ry="9" fill="#a3abaa" stroke="#6d7573" stroke-width="1.6"/>
      <path d="M406 176h16" stroke="#6d7573" stroke-width="4" stroke-linecap="round"/>
      <path d="M456 164h56l-5 26a23 23 0 0 1-46 0Z" fill="#b8785c" stroke="#96573f" stroke-width="1.8"/>
      <ellipse cx="484" cy="164" rx="28" ry="8" fill="#c98f6a" stroke="#96573f" stroke-width="1.6"/>
      <rect x="618" y="148" width="12" height="44" rx="5" fill="#c19a6c" stroke="#a17c50" stroke-width="1.2"/>
      <ellipse cx="624" cy="196" rx="11" ry="9" fill="#c19a6c" stroke="#a17c50" stroke-width="1.2"/>
    </g>

    <rect x="322" y="272" width="332" height="16" rx="2" fill="#8f8578" stroke="#6f6659" stroke-width="1.6"/>
    <rect x="322" y="288" width="332" height="242" fill="#d9c8a6" stroke="#bfa87e" stroke-width="1.8"/>
    <rect x="322" y="288" width="332" height="18" fill="#c9b48c"/>
    <ellipse cx="410" cy="280" rx="34" ry="9" fill="#5f574c"/>
    <ellipse cx="410" cy="278" rx="22" ry="6" fill="#6f6659"/>
    <ellipse cx="410" cy="277" rx="9" ry="3" fill="#b04f33" opacity=".5"/>
    <ellipse cx="556" cy="280" rx="28" ry="8" fill="#5f574c"/>
    <ellipse cx="556" cy="278" rx="17" ry="5" fill="#6f6659"/>
    <rect x="344" y="330" width="288" height="88" rx="2" fill="#cbb894" stroke="#bfa87e" stroke-width="1.3"/>
    <rect x="362" y="352" width="112" height="9" rx="4" fill="#a97f4f"/>
    <rect x="362" y="376" width="112" height="9" rx="4" fill="#a97f4f"/>
    <rect x="344" y="436" width="288" height="76" rx="2" fill="#c2ad88" stroke="#bfa87e" stroke-width="1.3"/>
    <path d="M488 470h64" stroke="#a97f4f" stroke-width="6" stroke-linecap="round"/>

    ${windowUnit(736, 42, 300, 216, s.weather)}

    <path d="M700 352h468l-14 18H714Z" fill="#dcb98e"/>
    <path d="M714 370h426l-30 20H744Z" fill="#c9a274" stroke="#a17c50" stroke-width="2"/>
    <rect x="742" y="390" width="16" height="146" fill="#a17c50"/>
    <rect x="1100" y="390" width="16" height="146" fill="#a17c50"/>
    <rect x="760" y="528" width="360" height="8" fill="#8a6238" opacity=".45"/>
    ${table}

    <rect width="1200" height="560" fill="url(#roomShade)"/>`);
  }

  /* ======================================================================
     The jeans (floor, seen from above)
     ====================================================================== */
  function jeans(s, phase = "before") {
    const coinPair = (cls) => `
      <g class="${cls}">
        <circle cx="588" cy="236" r="8" fill="#d9a441" stroke="#a87a22" stroke-width="1.4"/>
        <circle cx="608" cy="246" r="8" fill="#c99a37" stroke="#a87a22" stroke-width="1.4"/>
        <circle cx="585" cy="233" r="2.6" fill="#f6e2a8" opacity=".85"/>
      </g>`;

    const coins = phase === "before" ? coinPair("coin")
      : phase === "throw" ? coinPair("coin coin--flying")
      : "";

    const rows = Array.from({ length: 15 }, (_, i) => {
      const y = 14 + i * i * 1.7 + i * 12;
      return y < 560 ? `<path d="M0 ${y}H1200"/>` : "";
    }).join("");

    return wrap(`
    <rect width="1200" height="560" fill="#b8895c"/>
    <g stroke="#946b41" stroke-width="1.8" opacity=".55">${rows}</g>
    <g stroke="#a97c52" stroke-width="1.2" opacity=".4">
      ${Array.from({ length: 18 }, (_, i) => {
        const x = (i * 157) % 1200;
        return `<path d="M${x} ${16 + (i % 6) * 44}v${32 + (i % 3) * 24}"/>`;
      }).join("")}
    </g>

    <rect x="1012" width="188" height="560" fill="#7a5530"/>
    <rect x="1012" width="188" height="560" fill="#1d1610" opacity=".82"/>
    <rect x="1012" width="10" height="560" fill="#4f3a22"/>
    <rect x="1022" width="16" height="560" fill="#000" opacity=".35"/>
    <ellipse cx="1044" cy="280" rx="30" ry="300" fill="#000" opacity=".18"/>

    <g>
      <path d="M452 112h236l26 86-19 10-34-48-6 310h-62l-10-244-12 244h-64l-8-310-32 48-19-11Z"
        fill="#4a5f7a" stroke="#37485c" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M474 134h192" stroke="#d9c48a" stroke-width="1.8" stroke-dasharray="6 5" opacity=".8"/>
      <path d="M512 156v292M620 156v292" stroke="#5b7290" stroke-width="1.8" opacity=".5"/>
      <path d="M470 188h74v44h-74Z" fill="#42566e" stroke="#37485c" stroke-width="1.6"/>
      <path d="M470 200h74" stroke="#d9c48a" stroke-width="1.3" stroke-dasharray="4 4" opacity=".6"/>
      <path d="M474 232q34 8 66 0" stroke="#5b7290" stroke-width="1.2" fill="none" opacity=".7"/>
      <path d="M512 438h58v22h-58ZM608 438h58v22h-58Z" fill="#40536a" opacity=".85"/>
      <path d="M512 438h58M608 438h58" stroke="#37485c" stroke-width="1.6"/>
      <circle cx="500" cy="152" r="4.2" fill="#d9b26a"/>
      <circle cx="640" cy="152" r="4.2" fill="#d9b26a"/>
    </g>

    ${coins}

    ${phase === "after" ? `
      <ellipse cx="700" cy="300" rx="82" ry="20" fill="#8a6a42" opacity=".14"/>
      <g fill="#a8865b" opacity=".4">
        <circle cx="674" cy="296" r="2.6"/><circle cx="706" cy="304" r="2"/>
        <circle cx="734" cy="294" r="1.8"/><circle cx="692" cy="312" r="2"/>
        <circle cx="720" cy="288" r="1.6"/>
      </g>` : ""}

    <rect width="1200" height="560" fill="url(#roomShade)" opacity=".7"/>`);
  }

  /* ======================================================================
     The afternoon
     ====================================================================== */
  function afternoon(s, picked = null) {
    const raining = ["Storm", "Drizzles"].includes(s.weather);
    return wrap(`
    <rect width="1200" height="330" fill="url(#wall)"/>
    <rect width="1200" height="330" fill="url(#wallpaper)"/>
    <rect y="322" width="1200" height="10" fill="#dcc8a2"/>
    <rect y="332" width="1200" height="228" fill="url(#planks)"/>
    <rect y="332" width="1200" height="228" fill="#a8702c" opacity=".2"/>

    <g transform="translate(150,96) rotate(-3)">
      <rect width="112" height="132" rx="2" fill="#fbf6e6" stroke="#c9b48c" stroke-width="1.6"/>
      <rect width="112" height="26" fill="#b04f33" opacity=".85"/>
      <text x="56" y="19" text-anchor="middle" font-family="Georgia,serif" font-size="12" fill="#fdf6e6">SUNDAY</text>
      <g stroke="#d3c3a2" stroke-width="1.2">
        <path d="M0 58h112M0 82h112M0 106h112"/>
        <path d="M28 26v106M56 26v106M84 26v106"/>
      </g>
      <circle cx="70" cy="70" r="9" fill="#d79a41" opacity=".75"/>
    </g>

    ${raining ? "" : `<g opacity=".34">
      <path d="M790 10h280l-230 480H520Z" fill="#ffe6b0"/>
      <path d="M826 10h110l-172 480H660Z" fill="#fff2cf" opacity=".6"/>
    </g>`}

    ${windowUnit(780, 36, 292, 236, s.weather)}

    <!-- Table: narrow at the back, wide at the front, so things can rest on it -->
    <path d="M300 330H940L1000 470H220Z" fill="#9d6d42"/>
    <path d="M300 330H940L944 342H296Z" fill="#bb8b56"/>
    <path d="M220 470H1000L1006 492H214Z" fill="#8a6238" stroke="#6d4a26" stroke-width="1.6"/>
    <rect x="286" y="492" width="26" height="54" fill="#7d5730"/>
    <rect x="908" y="492" width="26" height="54" fill="#7d5730"/>
    <path d="M286 542h648" stroke="#5c4020" stroke-width="9" opacity=".24"/>

    ${hot("hamper", `
      <ellipse cx="150" cy="524" rx="76" ry="10" fill="#3a2c18" opacity=".16"/>
      <path d="M74 392h136l-14 128H88Z" fill="#b98d5c" stroke="#8a6238" stroke-width="2.2"/>
      <path d="M82 418h120M88 448h108M94 478h96" stroke="#a17c50" stroke-width="1.8"/>
      <path d="M94 384q46-24 92 0" stroke="#8a6238" stroke-width="4.2" fill="none"/>
      <path d="M118 380q20-13 42 0" stroke="#ece3cc" stroke-width="9" fill="none" opacity=".85"/>
      <path d="M126 376q16-18 34-6" stroke="#d9c9a6" stroke-width="7" fill="none" opacity=".8"/>`,
      "Deal with the laundry", `<rect x="66" y="374" width="150" height="154" rx="4"/>`)}

    ${hot("postcard", `
      <g transform="rotate(-7 372 384)">
        <rect x="314" y="344" width="118" height="78" rx="2" fill="#fbf7ea" stroke="#c9b48c" stroke-width="1.8"/>
        <rect x="322" y="352" width="102" height="50" fill="#9ec4cf"/>
        <path d="M322 388q24-14 48 0t54 0v14H322Z" fill="#7fa8b8"/>
        <path d="M322 372q18-9 40 0" stroke="#ffffff" stroke-width="2.4" fill="none" opacity=".8"/>
        <path d="M342 410h54" stroke="#c9b48c" stroke-width="1.5"/>
        <ellipse cx="374" cy="428" rx="62" ry="8" fill="#5c4020" opacity=".16"/>
      </g>`,
      "Sai Wan beach", `<rect x="304" y="334" width="138" height="100" rx="3"/>`)}

    ${hot("letter", `
      <g transform="rotate(4 520 388)">
        <rect x="458" y="342" width="130" height="90" rx="2" fill="#fdfaf0" stroke="#d3c3a2" stroke-width="1.8"/>
        <path d="M472 362h102M472 376h90M472 390h102M472 404h64"
          stroke="#c2b393" stroke-width="1.7" stroke-linecap="round"/>
        <ellipse cx="523" cy="440" rx="66" ry="8" fill="#5c4020" opacity=".16"/>
        <g transform="translate(548,412) rotate(26)">
          <rect x="0" y="0" width="72" height="8" rx="3.6" fill="#3a3128"/>
          <path d="M72 0l13 4L72 8Z" fill="#b04f33"/>
        </g>
      </g>`,
      "Write an application letter", `<rect x="448" y="332" width="150" height="110" rx="3"/>`)}

    ${hot("novel", `
      <g transform="rotate(-4 760 392)">
        <rect x="696" y="344" width="134" height="92" rx="3" fill="#6f5a3e" stroke="#4f3f2a" stroke-width="1.8"/>
        <rect x="706" y="352" width="114" height="76" fill="#fbf6e6"/>
        <path d="M763 352v76" stroke="#d3c3a2" stroke-width="1.5"/>
        <path d="M716 370h38M716 384h38M716 398h30M772 370h38M772 384h38M772 398h24"
          stroke="#b9ab8e" stroke-width="1.5"/>
        <ellipse cx="763" cy="444" rx="70" ry="8" fill="#5c4020" opacity=".16"/>
      </g>`,
      "Start writing a novel", `<rect x="686" y="334" width="154" height="112" rx="3"/>`)}

    ${hot("sing", `<rect x="780" y="36" width="292" height="236" fill="#000" opacity="0"/>`,
      "Sing in the rain", `<rect x="780" y="36" width="292" height="236" rx="3"/>`)}

    ${raining ? `<g stroke="#e8f0f4" stroke-width="2.4" opacity=".4" stroke-linecap="round">
      <path d="M430 0l-20 62M520-12l-20 62M1010-6l-20 62M1100 18l-20 62"/>
    </g>` : ""}

    <rect width="1200" height="560" fill="url(#roomShade)"/>`);
  }

  /* ======================================================================
     The door
     ====================================================================== */
  const VISITOR = {
    broom: `<g fill="#3a3128">
        <ellipse cx="600" cy="222" rx="22" ry="26"/>
        <path d="M572 270h58l11 124h-80Z"/>
        <rect x="500" y="238" width="6" height="176" fill="#6b5b3e"/>
        <path d="M486 414h36l-10 46h-16Z" fill="#8a6238"/>
        <rect x="668" y="228" width="48" height="7" rx="3" transform="rotate(-16 668 228)"/>
      </g>`,
    fee: `<g fill="#3a3128">
        <ellipse cx="600" cy="222" rx="21" ry="25"/>
        <path d="M574 270h56l9 124h-74Z"/>
        <rect x="568" y="288" width="44" height="56" rx="2" fill="#d9c49c" stroke="#3a3128" stroke-width="2.4"/>
        <path d="M577 304h26M577 316h26M577 328h18" stroke="#3a3128" stroke-width="1.7"/>
        <path d="M562 284l-16 70" stroke="#3a3128" stroke-width="5" stroke-linecap="round"/>
      </g>`,
    stereo: `<g fill="#3a3128">
        <rect x="504" y="258" width="196" height="126" rx="4"/>
        <rect x="517" y="271" width="170" height="48" rx="2" fill="#6b5b3e"/>
        <circle cx="562" cy="346" r="20" fill="#6b5b3e"/>
        <circle cx="644" cy="346" r="20" fill="#6b5b3e"/>
        <rect x="530" y="220" width="144" height="40" rx="17"/>
        <circle cx="602" cy="240" r="8.4" fill="#d9c49c"/>
      </g>`,
    telegram: `<g>
        <rect x="504" y="258" width="196" height="120" rx="3" fill="#e8d08a" stroke="#3a3128" stroke-width="2.4"/>
        <path d="M504 258l98 66 98-66" fill="none" stroke="#3a3128" stroke-width="2.4"/>
        <path d="M530 356h76" stroke="#8a6238" stroke-width="2.4"/>
        <path d="M696 232l-60 34" stroke="#3a3128" stroke-width="15" stroke-linecap="round"/>
      </g>`,
    nobody: `<g fill="#cfc7b2" opacity=".45">
        <rect x="428" y="86" width="344" height="4"/>
        <rect x="428" y="400" width="344" height="7"/>
        <path d="M520 92v310M680 92v310" stroke="#cfc7b2" stroke-width="4.5" opacity=".4"/>
      </g>`,
    balloons: `<g>
        ${[["#b04f33", 512, 178, 40], ["#d79a41", 566, 116, 52], ["#6f7f57", 646, 168, 44],
           ["#8a6f9e", 528, 246, 34], ["#c98f6a", 690, 232, 38], ["#7d9aa8", 606, 66, 32],
           ["#a8574a", 660, 108, 28]]
          .map(([c, x, y, r]) => `
          <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.16}" fill="${c}" opacity=".9"/>
          <path d="M${x} ${y + r * 1.16}q12 36-6 68" stroke="#8a7c65" stroke-width="1.3" fill="none"/>
          <ellipse cx="${x - r * 0.3}" cy="${y - r * 0.42}" rx="${r * 0.19}" ry="${r * 0.27}"
            fill="#ffffff" opacity=".4"/>`).join("")}
      </g>`,
  };

  function door(s, visitor = null) {
    const open = !!visitor;
    return wrap(`
    <rect width="1200" height="500" fill="url(#wall)"/>
    <rect width="1200" height="500" fill="url(#wallpaper)"/>
    <rect y="486" width="1200" height="74" fill="url(#planks)"/>

    <rect x="404" y="56" width="392" height="436" fill="#dcc8a2" stroke="#b99465" stroke-width="2.6"/>
    <rect x="424" y="76" width="352" height="400" fill="#2a231a"/>

    ${open ? `
      <rect x="424" y="76" width="352" height="400" fill="#f4e9cd"/>
      <rect x="424" y="76" width="352" height="400" fill="url(#sunGlow)" opacity=".55"/>
      <path d="M424 400h352v76H424Z" fill="#c9b48c"/>
      <path d="M424 400h352" stroke="#a89272" stroke-width="2.4"/>
      <path d="M424 400l40 76h-40ZM776 400l-40 76h40Z" fill="#b8a179" opacity=".7"/>
      <g>${VISITOR[visitor] || ""}</g>` : ""}

    <g class="doorleaf" data-open="${open ? 1 : 0}" style="transform-origin: 776px 276px">
      <rect x="424" y="76" width="352" height="400" fill="#8a5c30"/>
      <rect x="430" y="82" width="340" height="388" fill="#a87544" stroke="#8a5c30" stroke-width="1.8"/>
      <rect x="444" y="96" width="146" height="160" fill="#9d6a3c" stroke="#8a5c30" stroke-width="1.6"/>
      <rect x="610" y="96" width="146" height="160" fill="#9d6a3c" stroke="#8a5c30" stroke-width="1.6"/>
      <rect x="444" y="276" width="146" height="176" fill="#9d6a3c" stroke="#8a5c30" stroke-width="1.6"/>
      <rect x="610" y="276" width="146" height="176" fill="#9d6a3c" stroke="#8a5c30" stroke-width="1.6"/>
      <circle cx="462" cy="272" r="7" fill="#d9b26a" stroke="#8a5c30" stroke-width="1.6"/>
      <rect x="516" y="106" width="168" height="52" rx="2" fill="#e8d8b4" stroke="#b99465" stroke-width="1.4"/>
      <text x="600" y="133" text-anchor="middle" font-family="Georgia,serif" font-size="24" fill="#5c4a30">38</text>
      <text x="600" y="149" text-anchor="middle" font-family="Georgia,serif" font-size="7.4" letter-spacing="1.5" fill="#6b5b3e">LOUD SPARROWS</text>
    </g>

    ${!open ? `
      <circle cx="806" cy="272" r="9" fill="#e8d8b4" stroke="#b99465" stroke-width="1.8"/>
      <circle cx="806" cy="272" r="3.2" fill="#b04f33"/>
      <circle cx="806" cy="272" r="15" fill="none" stroke="#b04f33" stroke-width="1.2" opacity=".28"/>` : ""}

    <rect width="1200" height="560" fill="url(#roomShade)"/>`);
  }

  return { bedroom, windowView, mirror, kitchen, jeans, afternoon, door };
})();
