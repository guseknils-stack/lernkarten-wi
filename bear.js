// Zeichnet den PaukBär als SVG – weiche Formen, Schattierung, Muskeln wachsen mit.
// muskeln: 0–10, stimmung: "fit" | "muede" | "zerzaust" | "krank", brille / kette: true/false
let zaehler = 0;

export function baerSVG({ muskeln = 0, stimmung = "fit", brille = false, kette = false }) {
  const m = Math.max(0, Math.min(10, muskeln));
  const id = "b" + (zaehler++);
  const krank = stimmung === "krank";
  const zerzaust = stimmung === "zerzaust" || krank;

  // Farben
  const fell = krank ? "#8f8f63" : "#93603a";
  const fellHell = krank ? "#b3b285" : "#b98256";
  const fellDunkel = krank ? "#5f5f3d" : "#5e3a20";
  const bauch = krank ? "#cfcca0" : "#e0bd92";
  const bauchDunkel = krank ? "#a9a679" : "#c39a6c";

  // Proportionen: breite Schultern, schmale Taille (V-Form) je mehr Muskeln
  const W = 38 + m * 2.4;        // halbe Schulterbreite
  const w = 33 - m * 0.5;        // halbe Taillenbreite
  const cx = 120;
  const flex = m >= 4;           // ab 4 Muskeln: Bizeps-Pose

  const torso = `M ${cx - W} 124
    C ${cx - W} 108, ${cx - W / 2} 102, ${cx} 102
    C ${cx + W / 2} 102, ${cx + W} 108, ${cx + W} 124
    C ${cx + W} 150, ${cx + w + 6} 168, ${cx + w} 190
    Q ${cx} 204, ${cx - w} 190
    C ${cx - w - 6} 168, ${cx - W} 150, ${cx - W} 124 Z`;

  // ---------- Arme ----------
  const arm = (s) => {
    const sx = cx + s * (W - 4), sy = 122;
    if (!flex) {
      const dicke = 22 + m * 1.5;
      const ex = cx + s * (W + 10), ey = 176;
      return `
        <path d="M ${sx} ${sy} Q ${cx + s * (W + 12)} ${sy + 22}, ${ex} ${ey}" stroke="${fell}" stroke-width="${dicke}" stroke-linecap="round" fill="none"/>
        <circle cx="${ex}" cy="${ey + 4}" r="${dicke / 2 + 1}" fill="${fellDunkel}"/>
        <ellipse cx="${ex - s * 2}" cy="${ey + 1}" rx="${dicke / 4}" ry="${dicke / 6}" fill="${fellHell}" opacity=".35"/>`;
    }
    const k = m - 4;                                // 0–6 Stufen in der Pose
    const ellX = cx + s * (W + 30), ellY = 128;     // Ellbogen
    const faustX = cx + s * (W + 32), faustY = 82 - k;
    const oberDicke = 24 + k * 1.6, unterDicke = 19 + k * 1.1;
    const bizepsRx = 17 + k * 2.2, bizepsRy = 12 + k * 2.4;
    const bX = cx + s * (W + 14), bY = 116 - k * 1.2;
    return `
      <path d="M ${sx} ${sy} L ${ellX} ${ellY}" stroke="${fell}" stroke-width="${oberDicke}" stroke-linecap="round"/>
      <path d="M ${ellX} ${ellY} Q ${ellX + s * 6} ${(ellY + faustY) / 2}, ${faustX} ${faustY}" stroke="${fell}" stroke-width="${unterDicke}" stroke-linecap="round" fill="none"/>
      <!-- Unterarm-Muskel -->
      <path d="M ${ellX - s * 4} ${ellY - 6} Q ${ellX + s * 9} ${(ellY + faustY) / 2}, ${faustX + s * 4} ${faustY + 14}" stroke="${fellHell}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".35"/>
      <!-- Bizeps -->
      <ellipse cx="${bX}" cy="${bY}" rx="${bizepsRx}" ry="${bizepsRy}" fill="url(#${id}muskel)" transform="rotate(${s * -8} ${bX} ${bY})"/>
      <path d="M ${bX - s * bizepsRx * 0.7} ${bY + 2} Q ${bX} ${bY - bizepsRy * 1.05}, ${bX + s * bizepsRx * 0.75} ${bY + 4}" stroke="${fellDunkel}" stroke-width="2" fill="none" opacity=".35"/>
      <ellipse cx="${bX - s * 4}" cy="${bY - bizepsRy * 0.45}" rx="${bizepsRx * 0.45}" ry="${bizepsRy * 0.25}" fill="#fff" opacity=".18"/>
      <!-- Faust -->
      <circle cx="${faustX}" cy="${faustY}" r="${11 + k * 0.4}" fill="${fellDunkel}"/>
      <path d="M ${faustX - 6} ${faustY - 3} h 12 M ${faustX - 6} ${faustY + 2} h 12" stroke="#3b2414" stroke-width="1.4" opacity=".5"/>`;
  };

  // ---------- Muskeln am Körper ----------
  const def = Math.min(1, m / 8);                   // wie deutlich die Muskeln sind
  const brustMuskeln = m >= 2 ? `
    <g opacity="${0.35 + def * 0.6}">
      <path d="M ${cx - 2} 120 C ${cx - W * 0.45} 112, ${cx - W + 8} 116, ${cx - W + 10} 134 C ${cx - W * 0.6} 146, ${cx - 14} 146, ${cx - 2} 140 Z" fill="url(#${id}brust)"/>
      <path d="M ${cx + 2} 120 C ${cx + W * 0.45} 112, ${cx + W - 8} 116, ${cx + W - 10} 134 C ${cx + W * 0.6} 146, ${cx + 14} 146, ${cx + 2} 140 Z" fill="url(#${id}brust)"/>
      <path d="M ${cx - W + 12} 138 C ${cx - W * 0.6} 148, ${cx - 14} 148, ${cx - 2} 141 M ${cx + W - 12} 138 C ${cx + W * 0.6} 148, ${cx + 14} 148, ${cx + 2} 141" stroke="${fellDunkel}" stroke-width="2" fill="none" opacity=".45"/>
    </g>` : "";
  const sixpack = m >= 5 ? `
    <g opacity="${0.25 + (m - 5) * 0.14}">
      ${[0, 1, 2].map((r) => [-1, 1].map((s) => `<rect x="${cx + (s < 0 ? -15 : 2)}" y="${152 + r * 13}" width="13" height="11" rx="5" fill="${bauchDunkel}"/>
        <rect x="${cx + (s < 0 ? -13 : 4)}" y="${153 + r * 13}" width="8" height="4" rx="2" fill="#fff" opacity=".35"/>`).join("")).join("")}
    </g>` : "";

  // ---------- Gesicht ----------
  const augen = {
    fit: `${[-1, 1].map((s) => `
        <ellipse cx="${cx + s * 15}" cy="64" rx="6" ry="6.5" fill="#fff"/>
        <circle cx="${cx + s * 15}" cy="65" r="4.3" fill="#2a1a0e"/>
        <circle cx="${cx + s * 15 + 1.5}" cy="63" r="1.6" fill="#fff"/>
        <path d="M ${cx + s * 8} 54 Q ${cx + s * 15} 50, ${cx + s * 22} 54" stroke="${fellDunkel}" stroke-width="3" stroke-linecap="round" fill="none"/>`).join("")}`,
    muede: `${[-1, 1].map((s) => `
        <path d="M ${cx + s * 9} 65 Q ${cx + s * 15} 69, ${cx + s * 21} 65" stroke="#2a1a0e" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M ${cx + s * 10} 71 Q ${cx + s * 15} 74, ${cx + s * 20} 71" stroke="${fellDunkel}" stroke-width="2" fill="none" opacity=".6"/>`).join("")}`,
    zerzaust: `${[-1, 1].map((s) => `
        <ellipse cx="${cx + s * 15}" cy="65" rx="5" ry="5.5" fill="#fff"/>
        <circle cx="${cx + s * 15}" cy="66" r="3.5" fill="#2a1a0e"/>
        <path d="M ${cx + s * 8} 55 L ${cx + s * 21} 58" stroke="${fellDunkel}" stroke-width="3" stroke-linecap="round"/>`).join("")}`,
    krank: `${[-1, 1].map((s) => `
        <path d="M ${cx + s * 15 - 5} 60 l 10 10 M ${cx + s * 15 + 5} 60 l -10 10" stroke="#2a1a0e" stroke-width="2.8" stroke-linecap="round"/>`).join("")}`,
  }[stimmung];

  const mund = {
    fit: `<path d="M ${cx - 9} 89 Q ${cx} 97, ${cx + 9} 89" stroke="#2a1a0e" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,
    muede: `<ellipse cx="${cx}" cy="92" rx="5" ry="3.5" fill="#2a1a0e"/>`,
    zerzaust: `<path d="M ${cx - 9} 94 Q ${cx} 88, ${cx + 9} 94" stroke="#2a1a0e" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,
    krank: `<path d="M ${cx - 9} 94 Q ${cx} 88, ${cx + 9} 94" stroke="#2a1a0e" stroke-width="2.6" stroke-linecap="round" fill="none"/>`,
  }[stimmung];

  const zotteln = zerzaust ? `
    <g stroke="${fell}" stroke-width="6" stroke-linecap="round" fill="none">
      <path d="M ${cx - 20} 34 l -6 -12"/><path d="M ${cx} 30 l 2 -14"/><path d="M ${cx + 20} 33 l 8 -11"/>
      <path d="M ${cx - 40} 78 l -11 4"/><path d="M ${cx + 40} 78 l 11 4"/>
      <path d="M ${cx - W + 2} 150 l -9 4"/><path d="M ${cx + W - 2} 150 l 9 4"/>
    </g>` : "";

  const extras = {
    fit: m >= 7 ? `<text x="196" y="40" font-size="20">✨</text>` : "",
    muede: `<text x="180" y="38" font-size="16" fill="#999" font-weight="700">z</text><text x="192" y="24" font-size="22" fill="#999" font-weight="700">Z</text>`,
    zerzaust: `<text x="184" y="40" font-size="20">💢</text>`,
    krank: `<text x="182" y="36" font-size="24">🤒</text><text x="36" y="40" font-size="16">🪰</text><text x="196" y="80" font-size="14">🪰</text>`,
  }[stimmung];

  const sonnenbrille = brille ? `
    <g>
      <path d="M ${cx - 31} 57 H ${cx - 3} L ${cx - 5} 68 Q ${cx - 17} 78, ${cx - 28} 69 Z" fill="url(#${id}glas)" stroke="#d4a017" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M ${cx + 31} 57 H ${cx + 3} L ${cx + 5} 68 Q ${cx + 17} 78, ${cx + 28} 69 Z" fill="url(#${id}glas)" stroke="#d4a017" stroke-width="2.6" stroke-linejoin="round"/>
      <path d="M ${cx - 4} 59 Q ${cx} 56, ${cx + 4} 59" stroke="#d4a017" stroke-width="2.6" fill="none"/>
      <path d="M ${cx - 31} 58 L ${cx - 40} 55 M ${cx + 31} 58 L ${cx + 40} 55" stroke="#d4a017" stroke-width="2.6" stroke-linecap="round"/>
      <path d="M ${cx - 25} 60 l 7 -1 M ${cx + 9} 60 l 7 -1" stroke="#fff" stroke-width="1.6" opacity=".55" stroke-linecap="round"/>
    </g>` : "";

  const goldkette = kette ? `
    <g>
      <path d="M ${cx - 24} 104 Q ${cx} 134, ${cx + 24} 104" stroke="#b8860b" stroke-width="5" fill="none"/>
      <path d="M ${cx - 24} 104 Q ${cx} 134, ${cx + 24} 104" stroke="#f2c230" stroke-width="3" fill="none" stroke-dasharray="4 2"/>
      <circle cx="${cx}" cy="124" r="9" fill="url(#${id}gold)" stroke="#a87808" stroke-width="1.6"/>
      <text x="${cx}" y="127.5" font-size="9" text-anchor="middle" font-weight="800" fill="#6b4c00" font-family="Arial, sans-serif">PB</text>
    </g>` : "";

  // Fell-Struktur (kurze Striche)
  const fellStriche = `
    <g stroke="${fellDunkel}" stroke-width="1.4" stroke-linecap="round" opacity=".25">
      <path d="M ${cx - 30} 46 l -3 -4 M ${cx - 24} 42 l -2 -4 M ${cx + 26} 44 l 3 -4 M ${cx + 32} 48 l 3 -3"/>
      <path d="M ${cx - W + 6} 132 l -3 3 M ${cx + W - 6} 132 l 3 3 M ${cx - w - 2} 180 l -3 2 M ${cx + w + 2} 180 l 3 2"/>
    </g>`;

  return `
  <svg viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="PaukBär, Stimmung ${stimmung}, Muskeln ${m} von 10">
    <defs>
      <radialGradient id="${id}fell" cx="40%" cy="35%" r="75%">
        <stop offset="0%" stop-color="${fellHell}"/><stop offset="65%" stop-color="${fell}"/><stop offset="100%" stop-color="${fellDunkel}"/>
      </radialGradient>
      <radialGradient id="${id}muskel" cx="40%" cy="30%" r="70%">
        <stop offset="0%" stop-color="${fellHell}"/><stop offset="70%" stop-color="${fell}"/><stop offset="100%" stop-color="${fellDunkel}"/>
      </radialGradient>
      <radialGradient id="${id}brust" cx="50%" cy="30%" r="80%">
        <stop offset="0%" stop-color="${fellHell}"/><stop offset="100%" stop-color="${fellDunkel}" stop-opacity=".8"/>
      </radialGradient>
      <radialGradient id="${id}bauch" cx="50%" cy="35%" r="70%">
        <stop offset="0%" stop-color="${krank ? "#e2e0b8" : "#f3dcbd"}"/><stop offset="100%" stop-color="${bauch}"/>
      </radialGradient>
      <linearGradient id="${id}glas" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#3a3a3a"/><stop offset="100%" stop-color="#0d0d0d"/>
      </linearGradient>
      <radialGradient id="${id}gold" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stop-color="#fff2a8"/><stop offset="60%" stop-color="#f2c230"/><stop offset="100%" stop-color="#b8860b"/>
      </radialGradient>
    </defs>

    <ellipse cx="${cx}" cy="228" rx="${62 + m * 3}" ry="7" fill="#000" opacity=".12"/>
    <!-- Beine -->
    <ellipse cx="${cx - 22}" cy="214" rx="${17 + m * 0.4}" ry="13" fill="url(#${id}fell)"/>
    <ellipse cx="${cx + 22}" cy="214" rx="${17 + m * 0.4}" ry="13" fill="url(#${id}fell)"/>
    <ellipse cx="${cx - 22}" cy="219" rx="10" ry="6" fill="${bauch}" opacity=".7"/>
    <ellipse cx="${cx + 22}" cy="219" rx="10" ry="6" fill="${bauch}" opacity=".7"/>

    ${flex ? "" : arm(-1) + arm(1)}
    <!-- Körper -->
    <path d="${torso}" fill="url(#${id}fell)"/>
    <ellipse cx="${cx}" cy="168" rx="${w - 6}" ry="27" fill="url(#${id}bauch)"/>
    ${brustMuskeln}${sixpack}${fellStriche}
    ${flex ? arm(-1) + arm(1) : ""}

    <!-- Kopf -->
    <circle cx="${cx - 33}" cy="38" r="15" fill="url(#${id}fell)"/><circle cx="${cx - 33}" cy="39" r="8" fill="${bauch}"/>
    <circle cx="${cx + 33}" cy="38" r="15" fill="url(#${id}fell)"/><circle cx="${cx + 33}" cy="39" r="8" fill="${bauch}"/>
    <ellipse cx="${cx}" cy="70" rx="44" ry="40" fill="url(#${id}fell)"/>
    ${zotteln}
    <ellipse cx="${cx}" cy="86" rx="20" ry="15" fill="url(#${id}bauch)"/>
    <path d="M ${cx - 8} 77 Q ${cx} 72, ${cx + 8} 77 Q ${cx + 7} 84, ${cx} 85 Q ${cx - 7} 84, ${cx - 8} 77 Z" fill="#2a1a0e"/>
    <ellipse cx="${cx - 2}" cy="76" rx="3" ry="1.5" fill="#fff" opacity=".5"/>
    <path d="M ${cx} 85 v 3" stroke="#2a1a0e" stroke-width="2"/>
    ${augen}${mund}${sonnenbrille}${goldkette}${extras}
  </svg>`;
}
