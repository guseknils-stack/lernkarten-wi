// Zeichnet den PaukBär als SVG.
// muskeln: 0–10, stimmung: "fit" | "muede" | "zerzaust" | "krank", brille / kette: true/false
export function baerSVG({ muskeln = 0, stimmung = "fit", brille = false, kette = false }) {
  const m = Math.max(0, Math.min(10, muskeln));
  const krank = stimmung === "krank";
  const fell = krank ? "#9a9a6a" : stimmung === "zerzaust" ? "#8a6241" : "#9b6b43";
  const bauch = krank ? "#c9c79a" : "#d9b48a";
  const dunkel = "#5b3a22";
  const oberarm = 15 + m * 1.6;      // Armdicke wächst mit den Muskeln
  const bizeps = 7 + m * 1.5;        // Bizeps-Beule
  const schulter = 50 - m * 1.2;     // Arme rücken nach außen
  const brust = 44 + m * 1.4;        // breiterer Oberkörper

  const arm = (seite) => {
    const s = seite === "l" ? -1 : 1;
    const x = 100 + s * schulter;
    return `
      <g>
        <ellipse cx="${x + s * 10}" cy="128" rx="${oberarm * 0.55}" ry="30" fill="${fell}" transform="rotate(${-s * 20} ${x + s * 10} 128)"/>
        <circle cx="${x + s * 11}" cy="${116 - m * 0.4}" r="${bizeps}" fill="${fell}"/>
        ${m >= 3 ? `<path d="M ${x + s * (5 - bizeps * 0.5)} ${116 - m * 0.4} q ${s * bizeps * 0.6} ${-bizeps * 0.9} ${s * bizeps * 1.2} 0" stroke="${dunkel}" stroke-width="1.6" fill="none" opacity=".55"/>` : ""}
        <circle cx="${x + s * 20}" cy="156" r="10" fill="${dunkel}"/>
      </g>`;
  };

  const augen = {
    fit: `<circle cx="86" cy="62" r="5" fill="#222"/><circle cx="114" cy="62" r="5" fill="#222"/>
          <circle cx="88" cy="60" r="1.6" fill="#fff"/><circle cx="116" cy="60" r="1.6" fill="#fff"/>`,
    muede: `<path d="M80 63 q6 4 12 0" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M108 63 q6 4 12 0" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>
            <path d="M81 69 q5 3 10 0 M109 69 q5 3 10 0" stroke="#6b4a33" stroke-width="2" fill="none" opacity=".7"/>`,
    zerzaust: `<circle cx="86" cy="63" r="4" fill="#222"/><circle cx="114" cy="63" r="4" fill="#222"/>
               <path d="M79 55 l12 4 M121 55 l-12 4" stroke="#222" stroke-width="2.5" stroke-linecap="round"/>`,
    krank: `<path d="M81 58 l10 10 M91 58 l-10 10 M109 58 l10 10 M119 58 l-10 10" stroke="#222" stroke-width="2.6" stroke-linecap="round"/>`,
  }[stimmung];

  const mund = {
    fit: `<path d="M90 84 q10 10 20 0" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    muede: `<path d="M92 87 h16" stroke="#222" stroke-width="3" stroke-linecap="round"/>`,
    zerzaust: `<path d="M90 90 q10 -8 20 0" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    krank: `<path d="M90 90 q10 -8 20 0" stroke="#222" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="111" cy="94" rx="3" ry="4" fill="#8fd16a"/>`,
  }[stimmung];

  const zotteln = (stimmung === "zerzaust" || krank) ? `
      <path d="M70 34 l-6 -10 l10 4 M92 24 l2 -12 l6 10 M118 26 l8 -10 l0 12 M60 70 l-10 2 l8 6 M140 70 l10 2 l-8 6" stroke="${fell}" stroke-width="5" stroke-linecap="round" fill="none"/>` : "";

  const extras = {
    fit: m >= 6 ? `<text x="160" y="40" font-size="18">✨</text>` : "",
    muede: `<text x="150" y="38" font-size="16" fill="#888">z</text><text x="162" y="26" font-size="20" fill="#888">Z</text>`,
    zerzaust: `<text x="150" y="40" font-size="18">💢</text>`,
    krank: `<text x="146" y="44" font-size="20">🤒</text><text x="30" y="40" font-size="14">🪰</text>`,
  }[stimmung];

  const sonnenbrille = brille ? `
      <g>
        <path d="M74 54 h26 l-3 14 q-10 6 -20 0 z" fill="#1d1d1d" stroke="#d4a017" stroke-width="2.5"/>
        <path d="M100 54 h26 l-3 14 q-10 6 -20 0 z" fill="#1d1d1d" stroke="#d4a017" stroke-width="2.5"/>
        <path d="M97 57 h6" stroke="#d4a017" stroke-width="2.5"/>
        <path d="M74 56 l-8 -3 M126 56 l8 -3" stroke="#d4a017" stroke-width="2.5" stroke-linecap="round"/>
        <path d="M80 58 l6 -2" stroke="#fff" stroke-width="1.5" opacity=".6"/>
      </g>` : "";

  const goldkette = kette ? `
      <g>
        <path d="M74 106 q26 26 52 0" stroke="#d4a017" stroke-width="4" fill="none" stroke-dasharray="5 2"/>
        <circle cx="100" cy="122" r="8" fill="#f2c230" stroke="#b8860b" stroke-width="2"/>
        <text x="100" y="126" font-size="9" text-anchor="middle" font-weight="700" fill="#7a5a00">PB</text>
      </g>` : "";

  const sixpack = m >= 7 ? `
      <g stroke="${dunkel}" stroke-width="1.6" opacity=".45" fill="none">
        <path d="M100 140 v34"/><path d="M90 148 h20 M90 158 h20 M91 168 h18"/>
      </g>` : "";
  const brustLinien = m >= 4 ? `
      <path d="M78 122 q11 9 22 0 q11 9 22 0" stroke="${dunkel}" stroke-width="1.8" fill="none" opacity=".45"/>` : "";

  return `
  <svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="PaukBär, Stimmung ${stimmung}, Muskeln ${m} von 10">
    <ellipse cx="100" cy="210" rx="${60 + m * 2}" ry="7" fill="#000" opacity=".12"/>
    <!-- Beine -->
    <ellipse cx="78" cy="196" rx="15" ry="11" fill="${fell}"/><ellipse cx="122" cy="196" rx="15" ry="11" fill="${fell}"/>
    ${arm("l")}${arm("r")}
    <!-- Körper -->
    <path d="M${100 - brust} 120 q0 -18 ${brust} -18 q${brust} 0 ${brust} 18 l-10 62 q-${brust - 10} 18 -${(brust - 10) * 2} 0 z" fill="${fell}"/>
    <ellipse cx="100" cy="155" rx="${24 + m * 0.6}" ry="30" fill="${bauch}"/>
    ${brustLinien}${sixpack}
    <!-- Kopf -->
    <circle cx="66" cy="34" r="15" fill="${fell}"/><circle cx="66" cy="34" r="7" fill="${bauch}"/>
    <circle cx="134" cy="34" r="15" fill="${fell}"/><circle cx="134" cy="34" r="7" fill="${bauch}"/>
    <circle cx="100" cy="66" r="42" fill="${fell}"/>
    ${zotteln}
    <ellipse cx="100" cy="82" rx="18" ry="13" fill="${bauch}"/>
    <ellipse cx="100" cy="76" rx="7" ry="5" fill="#2b1a10"/>
    ${augen}${mund}${sonnenbrille}${goldkette}${extras}
  </svg>`;
}
