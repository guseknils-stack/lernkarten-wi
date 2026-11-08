// PaukBär – einfache, selbst gezeichnete Bilder (SVG) zu den Logistik-Begriffen.
// Jedes Bild zeigt nur die wichtigsten Merkmale, an denen man den Gegenstand erkennt
// (z. B. Gitterwände bei der GiBo, Schiebeplane beim Curtainsider). Keine Fotos: keine Bildrechte-Probleme
// und sehr wenig Rechenleistung. In den Kartendaten steht im Feld "bild" der Name aus BILDER.

// ---------- Farben und Bausteine ----------
const LINIE = "#2b2a28";
const HOLZ = "#d9a86c", HOLZ_DUNKEL = "#a8783f";
const BLAU = "#3d7cc9", GRAU = "#9aa3ad", HELLGRAU = "#e7eaee", GELB = "#f2c230", ROT = "#d64545", GRUEN = "#2f9e5b", ORANGE = "#e8833a";

// Beschriftung im Bild (klein, damit sie nicht vom Bild ablenkt). Klasse "bt": Bei Bilderfragen wird die
// Beschriftung ausgeblendet, weil sie sonst die Lösung verraten würde.
const text = (x, y, t, groesse = 10, farbe = LINIE, extra = "") =>
  `<text class="bt" x="${x}" y="${y}" font-size="${groesse}" font-family="-apple-system,Segoe UI,Roboto,sans-serif" text-anchor="middle" fill="${farbe}" ${extra}>${t}</text>`;
// Pfeil von (x1,y1) nach (x2,y2)
const pfeil = (x1, y1, x2, y2, farbe = ROT) => {
  const w = Math.atan2(y2 - y1, x2 - x1), l = 7;
  const a = (d) => `${x2 - l * Math.cos(w + d)},${y2 - l * Math.sin(w + d)}`;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${farbe}" stroke-width="2.5"/><polygon points="${x2},${y2} ${a(0.45)} ${a(-0.45)}" fill="${farbe}"/>`;
};
// Palette von der Seite: Deckbretter oben, drei Klötze, Bodenbretter unten
const paletteSeite = (x, y, b = 120, farbe = HOLZ, rand = HOLZ_DUNKEL) => {
  const k = 16;
  return `<rect x="${x}" y="${y}" width="${b}" height="6" fill="${farbe}" stroke="${rand}"/>
    ${[0, (b - k) / 2, b - k].map((dx) => `<rect x="${x + dx}" y="${y + 6}" width="${k}" height="9" fill="${farbe}" stroke="${rand}"/>`).join("")}
    <rect x="${x}" y="${y + 15}" width="${b}" height="5" fill="${farbe}" stroke="${rand}"/>`;
};
// Rad
const rad = (x, y, r = 7) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${LINIE}"/><circle cx="${x}" cy="${y}" r="${r / 2.6}" fill="${GRAU}"/>`;
// LKW-Zugmaschine (Fahrerhaus nach rechts)
const fahrerhaus = (x, y) => `<path d="M${x} ${y + 40} V${y + 8} Q${x} ${y} ${x + 8} ${y} H${x + 24} L${x + 34} ${y + 18} V${y + 40} Z" fill="${ROT}" stroke="${LINIE}" stroke-width="1.5"/>
  <path d="M${x + 22} ${y + 5} L${x + 30} ${y + 18} H${x + 22} Z" fill="#cfe6f7" stroke="${LINIE}"/>`;
// Behälter (KLT) von vorne, mit Griffmulde
const kltVorne = (x, y, b = 40, h = 22, farbe = BLAU) => `<rect x="${x}" y="${y}" width="${b}" height="${h}" rx="2" fill="${farbe}" stroke="${LINIE}"/>
  <rect x="${x + b / 2 - 7}" y="${y + 4}" width="14" height="4" rx="2" fill="#1d4f8c"/>`;

// ---------- Die Bilder ----------
export const BILDER = {
  // KLT: kleiner, stapelbarer Kunststoffbehälter, Grundfläche max. 600 x 400, max. 20 kg (von Hand tragbar)
  klt: () => `${kltVorne(55, 62, 90, 40)}${kltVorne(55, 22, 90, 40)}
    ${text(100, 114, "max. 600 × 400 mm · max. 20 kg befüllt", 9)}
    <g transform="translate(150 30)"><circle cx="12" cy="8" r="6" fill="${LINIE}"/><path d="M12 14 V44 M12 22 L0 34 M12 22 L-6 30 M12 44 L4 62 M12 44 L20 62" stroke="${LINIE}" stroke-width="3" fill="none"/></g>
    ${text(100, 14, "stapelbar · Kunststoff · von Hand", 9)}`,

  // Schäferkiste: Sichtlagerkasten, vorne ist die Wand ausgeschnitten -> Teile sichtbar und greifbar, auch gestapelt
  schaeferkiste: () => [[40, 58], [40, 14], [112, 58]].map(([x, y]) => `<g transform="translate(${x} ${y})">
      <rect x="0" y="0" width="60" height="40" rx="2" fill="${BLAU}" stroke="${LINIE}"/>
      <path d="M8 0 V14 Q8 22 16 22 H44 Q52 22 52 14 V0 Z" fill="#20354a"/>
      <circle cx="20" cy="17" r="3.5" fill="${GRAU}"/><circle cx="30" cy="18" r="3.5" fill="${GRAU}"/><circle cx="40" cy="16" r="3.5" fill="${GRAU}"/>
      <rect x="18" y="28" width="24" height="7" fill="#fff" stroke="${LINIE}" stroke-width=".6"/></g>`).join("")
    + pfeil(150, 30, 136, 70, GRUEN) + text(100, 112, "vorne offen: Teile sichtbar und greifbar", 9),

  // GLT: großer Behälter auf Füßen, unterfahrbar, nur mit Flurförderzeug (Gabeln) bewegbar
  glt: () => `<rect x="40" y="18" width="110" height="62" fill="${GRAU}" stroke="${LINIE}"/>
    <rect x="40" y="80" width="14" height="16" fill="${GRAU}" stroke="${LINIE}"/><rect x="88" y="80" width="14" height="16" fill="${GRAU}" stroke="${LINIE}"/><rect x="136" y="80" width="14" height="16" fill="${GRAU}" stroke="${LINIE}"/>
    <rect x="6" y="84" width="80" height="5" fill="${LINIE}"/><rect x="6" y="56" width="6" height="40" fill="${LINIE}"/>
    ${pfeil(14, 74, 46, 74)}
    ${text(95, 52, "groß & schwer", 11, "#fff")}${text(100, 112, "unterfahrbar: nur mit Stapler/Hubwagen", 9)}`,

  // GiBo: Palette mit Wänden aus Gitter, vorne Klappe
  gibo: () => {
    let gitter = "";
    for (let x = 44; x <= 156; x += 10) gitter += `<line x1="${x}" y1="22" x2="${x}" y2="82" stroke="${GRAU}" stroke-width="1.4"/>`;
    for (let y = 22; y <= 82; y += 10) gitter += `<line x1="40" y1="${y}" x2="160" y2="${y}" stroke="${GRAU}" stroke-width="1.4"/>`;
    return `${gitter}<rect x="40" y="18" width="120" height="66" fill="none" stroke="${LINIE}" stroke-width="3"/>
      <rect x="78" y="22" width="44" height="28" fill="none" stroke="${ORANGE}" stroke-width="2" stroke-dasharray="4 3"/>
      ${paletteSeite(40, 84, 120, "#8d949c", LINIE)}
      ${text(100, 116, "Gitterwände auf Palette · Klappe vorne", 9)}`;
  },

  // Ameise (laut VL 7): elektrischer Hochhubwagen, Mast + Gabel hebt Palette hoch -> stapeln
  ameise: () => `<rect x="120" y="14" width="8" height="86" fill="${LINIE}"/><rect x="130" y="14" width="4" height="86" fill="${GRAU}"/>
    <rect x="136" y="56" width="34" height="44" rx="4" fill="${ORANGE}" stroke="${LINIE}"/><path d="M170 60 L190 40" stroke="${LINIE}" stroke-width="3"/>
    ${rad(150, 104, 6)}<rect x="40" y="100" width="80" height="4" fill="${LINIE}"/>
    <rect x="44" y="42" width="76" height="4" fill="${LINIE}"/>${paletteSeite(44, 22, 74)}
    <rect x="50" y="2" width="62" height="20" fill="#c9a26b" stroke="${LINIE}"/>
    ${pfeil(28, 96, 28, 34, GRUEN)}${text(28, 112, "hoch", 9)}${text(150, 50, "Akku", 8)}`,

  // FTS/AGV: fährt fahrerlos auf fester Spur (Magnetband) und stoppt vor Hindernissen
  fts: () => `<rect x="0" y="92" width="200" height="6" fill="${GELB}"/>
    <rect x="30" y="58" width="70" height="30" rx="5" fill="${GRUEN}" stroke="${LINIE}"/>${paletteSeite(36, 38, 58)}
    ${rad(44, 90, 5)}${rad(86, 90, 5)}<path d="M104 64 q8 9 0 18" stroke="${ROT}" stroke-width="2" fill="none"/>
    <rect x="140" y="56" width="26" height="36" fill="${GRAU}" stroke="${LINIE}"/><polygon points="120,48 132,48 126,38" fill="${ROT}"/>${text(126, 30, "STOPP", 9, ROT)}
    ${text(100, 114, "fahrerlos · feste Spur · stoppt", 9)}`,

  // AMR: autonomer Roboter mit Laserscanner, umfährt Hindernis auf eigener Route
  amr: () => `<circle cx="40" cy="70" r="30" fill="none" stroke="${BLAU}" stroke-dasharray="3 3"/>
    <rect x="22" y="58" width="36" height="24" rx="8" fill="${BLAU}" stroke="${LINIE}"/><circle cx="40" cy="54" r="5" fill="${LINIE}"/>
    <rect x="96" y="54" width="24" height="34" fill="${GRAU}" stroke="${LINIE}"/>
    <path d="M62 70 C90 30, 130 30, 160 66" stroke="${GRUEN}" stroke-width="3" fill="none" stroke-dasharray="6 4"/>${pfeil(150, 54, 162, 70, GRUEN)}
    ${text(100, 112, "keine feste Spur · umfährt Hindernis", 9)}`,

  // RBG: fest installiertes Gerät, fährt im Gang des Hochregals auf Schiene, Mast mit Hubwagen
  rbg: () => {
    let regal = "";
    for (const x of [10, 140]) for (let y = 10; y < 100; y += 18) regal += `<rect x="${x}" y="${y}" width="50" height="18" fill="${HELLGRAU}" stroke="${LINIE}"/><rect x="${x + 6}" y="${y + 4}" width="38" height="12" fill="#c9a26b"/>`;
    return `${regal}<rect x="60" y="100" width="80" height="4" fill="${LINIE}"/><rect x="60" y="6" width="80" height="3" fill="${LINIE}"/>
      <rect x="94" y="8" width="8" height="92" fill="${ORANGE}" stroke="${LINIE}"/><rect x="80" y="54" width="36" height="10" fill="${GELB}" stroke="${LINIE}"/>
      ${pfeil(122, 40, 122, 20, LINIE)}${pfeil(122, 76, 122, 94, LINIE)}${text(100, 116, "fest auf Schiene im Regalgang", 9)}`;
  },

  // AKL: Behälterregal, automatisch bedient (Shuttle bringt Behälter zum Arbeitsplatz)
  akl: () => {
    let regal = "";
    for (let y = 10; y < 90; y += 16) for (let x = 10; x < 130; x += 30) regal += `<rect x="${x}" y="${y}" width="28" height="14" fill="${HELLGRAU}" stroke="${LINIE}" stroke-width=".8"/><rect x="${x + 3}" y="${y + 3}" width="22" height="10" fill="${BLAU}"/>`;
    return `${regal}<rect x="40" y="58" width="30" height="8" fill="${GELB}" stroke="${LINIE}"/>${pfeil(72, 62, 150, 62, GRUEN)}
      <rect x="150" y="66" width="44" height="6" fill="${LINIE}"/>${kltVorne(156, 52, 32, 14)}
      ${text(100, 112, "Behälter statt Paletten · automatisch bedient", 9)}`;
  },

  // AS/RS: automatisches Hochregallager, bringt die ganze Lagereinheit zum Übergabepunkt und lagert wieder ein
  asrs: () => {
    let regal = "";
    for (let y = 6; y < 90; y += 14) regal += `<rect x="10" y="${y}" width="60" height="14" fill="${HELLGRAU}" stroke="${LINIE}" stroke-width=".8"/><rect x="16" y="${y + 3}" width="48" height="10" fill="#c9a26b"/>`;
    return `${regal}<rect x="76" y="6" width="6" height="94" fill="${ORANGE}"/><rect x="70" y="72" width="20" height="8" fill="${GELB}" stroke="${LINIE}"/>
      ${pfeil(92, 78, 140, 78, GRUEN)}${pfeil(140, 92, 92, 92, GRAU)}
      <rect x="140" y="70" width="50" height="26" fill="#c9a26b" stroke="${LINIE}"/>${text(165, 62, "Übergabe", 9)}
      <circle cx="170" cy="40" r="5" fill="${LINIE}"/><path d="M170 45 V60" stroke="${LINIE}" stroke-width="3"/>
      ${text(100, 114, "automatisch: aus- und wieder einlagern", 9)}`;
  },

  // Pick-by-Light: Lampe mit Mengenanzeige am Fach, quittieren per Taste
  pbl: () => {
    let regal = "";
    for (let y = 14; y < 96; y += 28) for (let x = 20; x < 180; x += 40) regal += `<rect x="${x}" y="${y}" width="38" height="26" fill="${HELLGRAU}" stroke="${LINIE}"/>`;
    return `${regal}<rect x="64" y="66" width="30" height="12" rx="2" fill="${LINIE}"/><text x="72" y="76" font-size="10" fill="${GELB}" font-family="monospace">3</text><circle cx="86" cy="72" r="4" fill="${GELB}"/>
      <path d="M79 64 l-6 -10 M86 63 l0 -11 M93 64 l6 -10" stroke="${GELB}" stroke-width="2"/>
      ${text(100, 112, "Licht am Fach zeigt Platz + Menge", 9)}`;
  },

  // Euro-Palette: 1200 x 800 mm, Draufsicht
  europalette: () => `<rect x="30" y="20" width="140" height="80" fill="${HOLZ}" stroke="${HOLZ_DUNKEL}" stroke-width="2"/>
    ${[24, 44, 60, 76, 92].map((y) => `<line x1="30" y1="${y}" x2="170" y2="${y}" stroke="${HOLZ_DUNKEL}"/>`).join("")}
    <rect x="34" y="88" width="20" height="8" fill="${HOLZ_DUNKEL}"/>${text(100, 14, "1.200 mm", 11)}${text(186, 64, "800", 11)}${text(186, 76, "mm", 9)}
    ${text(100, 114, "Euro-Palette (EPAL) · Draufsicht", 9)}`,

  // Industriepalette: 1200 x 1000 mm, breiter als die Euro-Palette
  industriepalette: () => `<rect x="30" y="10" width="140" height="94" fill="${HOLZ}" stroke="${HOLZ_DUNKEL}" stroke-width="2"/>
    ${[26, 46, 66, 86].map((y) => `<line x1="30" y1="${y}" x2="170" y2="${y}" stroke="${HOLZ_DUNKEL}"/>`).join("")}
    <rect x="30" y="20" width="140" height="80" fill="none" stroke="${ROT}" stroke-dasharray="4 3"/>${text(100, 62, "Euro 800", 9, ROT)}
    ${text(186, 56, "1.000", 10)}${text(186, 68, "mm", 9)}${text(100, 116, "1.200 × 1.000 mm (20 cm breiter als Euro)", 9)}`,

  // CHEP-Palette: blau angemalte Mietpalette
  chep: () => `${paletteSeite(30, 50, 140, BLAU, "#1d4f8c")}${text(100, 64, "CHEP", 9, "#fff", 'font-weight="700"')}
    ${text(100, 30, "blau = gemietet (Pool)", 11)}${text(100, 98, "wird vom Anbieter gewartet, nicht getauscht", 9)}`,

  // Container 20 Fuß = 1 TEU
  container20: () => `<rect x="60" y="30" width="80" height="54" fill="${ORANGE}" stroke="${LINIE}" stroke-width="2"/>
    ${[70, 80, 90, 100, 110, 120, 130].map((x) => `<line x1="${x}" y1="32" x2="${x}" y2="82" stroke="#b85f22"/>`).join("")}
    <line x1="60" y1="92" x2="140" y2="92" stroke="${LINIE}"/>${text(100, 104, "20 Fuß ≈ 6 m", 10)}${text(100, 20, "= 1 TEU", 13, LINIE, 'font-weight="700"')}`,

  // Container 40 Fuß = 2 TEU
  container40: () => `<rect x="20" y="30" width="160" height="54" fill="${BLAU}" stroke="${LINIE}" stroke-width="2"/>
    ${Array.from({ length: 15 }, (_, i) => `<line x1="${30 + i * 10}" y1="32" x2="${30 + i * 10}" y2="82" stroke="#1d4f8c"/>`).join("")}
    <line x1="100" y1="26" x2="100" y2="88" stroke="#fff" stroke-dasharray="4 3"/>
    <line x1="20" y1="92" x2="180" y2="92" stroke="${LINIE}"/>${text(100, 104, "40 Fuß ≈ 12 m", 10)}${text(100, 20, "= 2 TEU", 13, LINIE, 'font-weight="700"')}`,

  // Big Bag: großer, flexibler Sack mit 4 Schlaufen, für Schüttgut
  bigbag: () => `<path d="M50 34 Q48 96 60 100 H140 Q152 96 150 34 Z" fill="#f1ede4" stroke="${LINIE}" stroke-width="2"/>
    ${[56, 82, 118, 144].map((x) => `<path d="M${x - 6} 36 Q${x} 10 ${x + 6} 36" fill="none" stroke="${BLAU}" stroke-width="4"/>`).join("")}
    <path d="M100 4 V18" stroke="${LINIE}" stroke-width="2"/><path d="M92 18 H108" stroke="${LINIE}" stroke-width="3"/>
    ${[[80, 70], [100, 80], [120, 66], [92, 58], [110, 90]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${GRAU}"/>`).join("")}
    ${text(100, 116, "Gewebesack · 4 Schlaufen · Schüttgut", 9)}`,

  // IBC: Kunststofftank in einem Gitterkäfig auf Palette, Hahn unten, für Flüssigkeiten
  ibc: () => {
    let gitter = "";
    for (let x = 50; x <= 150; x += 14) gitter += `<line x1="${x}" y1="16" x2="${x}" y2="84" stroke="${LINIE}" stroke-width="1.6"/>`;
    for (let y = 16; y <= 84; y += 17) gitter += `<line x1="46" y1="${y}" x2="154" y2="${y}" stroke="${LINIE}" stroke-width="1.6"/>`;
    return `<rect x="48" y="16" width="104" height="68" rx="6" fill="#f4f6f8"/><rect x="50" y="44" width="100" height="40" fill="#bfe0f5"/>${gitter}
      <rect x="92" y="8" width="16" height="8" fill="${GRAU}" stroke="${LINIE}"/><rect x="96" y="80" width="10" height="8" fill="${GRAU}" stroke="${LINIE}"/><path d="M101 88 v6" stroke="${BLAU}" stroke-width="3"/>
      ${paletteSeite(44, 88, 112, "#8d949c", LINIE)}${text(100, 118, "Tank im Gitter auf Palette · Flüssigkeit", 9)}`;
  },

  // Stückgut: einzelne Einheiten (Kisten, Palette), behalten ihre Form
  stueckgut: () => `${paletteSeite(30, 80, 140)}${[[34, 52], [76, 52], [118, 52], [55, 24], [97, 24]].map(([x, y]) => `<rect x="${x}" y="${y}" width="40" height="28" fill="#c9a26b" stroke="${LINIE}"/><path d="M${x} ${y + 9} H${x + 40}" stroke="#a8783f"/>`).join("")}
    ${text(100, 114, "einzeln zählbar · Form bleibt gleich", 9)}`,

  // Schüttgut: körnig, wird geschüttet und nimmt die Form des Behälters an
  schuettgut: () => {
    let koerner = "";
    for (let i = 0; i < 70; i++) { const x = 40 + ((i * 37) % 120), y = 98 - ((i * 13) % 40) * (1 - Math.abs(x - 100) / 70); koerner += `<circle cx="${x}" cy="${Math.min(98, y)}" r="2.6" fill="${HOLZ_DUNKEL}"/>`; }
    return `<path d="M30 100 Q100 40 170 100 Z" fill="${HOLZ}"/>${koerner}<path d="M100 4 V40" stroke="${HOLZ_DUNKEL}" stroke-width="5" stroke-dasharray="2 4"/>
      ${text(100, 116, "körnig/staubförmig · wird geschüttet", 9)}`;
  },

  // Lademeter: 1 m Ladefläche über die ganze Breite (ca. 2,4 m) = Platz für 2,5 Euro-Paletten
  lademeter: () => `<rect x="10" y="20" width="180" height="74" fill="${HELLGRAU}" stroke="${LINIE}" stroke-width="2"/>
    <rect x="10" y="20" width="60" height="74" fill="rgba(47,158,91,.2)" stroke="${GRUEN}" stroke-width="2"/>
    <rect x="14" y="24" width="52" height="34" fill="${HOLZ}" stroke="${HOLZ_DUNKEL}"/><rect x="14" y="60" width="26" height="30" fill="${HOLZ}" stroke="${HOLZ_DUNKEL}"/>
    ${text(40, 14, "1 m Länge", 10, GRUEN)}${text(130, 60, "LKW-Ladefläche von oben", 9)}${text(100, 112, "1 ldm × 2,4 m Breite ≈ 2,5 Euro-Paletten", 9)}`,

  // Curtainsider: Schiebeplane an der Seite -> Beladung von der Seite und von hinten
  curtainsider: () => `${fahrerhaus(160, 44)}<rect x="10" y="30" width="146" height="54" fill="#d6e3f0" stroke="${LINIE}" stroke-width="2"/>
    ${[22, 30, 38, 46, 54].map((x) => `<path d="M${x} 32 q3 26 0 50" stroke="${GRAU}" fill="none" stroke-width="2"/>`).join("")}
    ${paletteSeite(70, 60, 60)}<rect x="74" y="40" width="52" height="20" fill="#c9a26b"/>
    ${rad(30, 88)}${rad(130, 88)}${rad(180, 88)}${pfeil(100, 112, 100, 86, GRUEN)}${text(60, 22, "Plane seitlich offen", 9)}`,

  // Kofferfahrzeug: fester, geschlossener Kasten, Türen nur hinten, auch gekühlt möglich
  koffer: () => `${fahrerhaus(160, 44)}<rect x="10" y="26" width="146" height="58" fill="#f4f6f8" stroke="${LINIE}" stroke-width="2"/>
    <line x1="10" y1="26" x2="10" y2="84" stroke="${LINIE}" stroke-width="4"/>${text(84, 62, "❄︎", 22, BLAU)}
    ${rad(30, 88)}${rad(130, 88)}${rad(180, 88)}${pfeil(-2, 56, 8, 56, GRUEN)}${text(84, 106, "fester Kasten · Türen nur hinten", 9)}`,

  // Pritsche mit Plane und Spriegeln: Bügel (Spriegel) und Latten tragen die Plane
  pritsche: () => `${fahrerhaus(160, 44)}<rect x="10" y="70" width="146" height="14" fill="${GRAU}" stroke="${LINIE}"/>
    ${[22, 58, 94, 130].map((x) => `<path d="M${x} 70 V34 Q${x + 2} 28 ${x + 8} 28" stroke="${HOLZ_DUNKEL}" stroke-width="3" fill="none"/>`).join("")}
    <path d="M10 70 V30 Q10 24 18 24 H156 V70" fill="rgba(47,111,79,.15)" stroke="${LINIE}" stroke-dasharray="5 3"/>
    ${[44, 58].map((y) => `<line x1="12" y1="${y}" x2="154" y2="${y}" stroke="${HOLZ_DUNKEL}" stroke-width="3"/>`).join("")}
    ${rad(30, 88)}${rad(130, 88)}${rad(180, 88)}${text(90, 108, "Spriegel + Bretter tragen die Plane", 9)}`,

  // Cross-Docking: Ware geht vom ankommenden LKW direkt (über Kreuz) in die abgehenden LKW, ohne Lager
  crossdocking: () => `<rect x="60" y="18" width="80" height="74" fill="${HELLGRAU}" stroke="${LINIE}"/>${text(100, 12, "kein Lager: direkt umschlagen", 9)}
    ${[24, 64].map((y) => `<rect x="10" y="${y}" width="44" height="22" fill="${BLAU}" stroke="${LINIE}"/>`).join("")}
    ${[24, 64].map((y) => `<rect x="146" y="${y}" width="44" height="22" fill="${GRUEN}" stroke="${LINIE}"/>`).join("")}
    ${pfeil(56, 35, 144, 75, ORANGE)}${pfeil(56, 75, 144, 35, ORANGE)}${text(32, 104, "Lieferanten", 9)}${text(168, 104, "Kunden", 9)}`,

  // Milkrun: Routenzug fährt im Takt eine feste Runde mit festen Haltestellen
  milkrun: () => `<rect x="20" y="16" width="160" height="80" rx="30" fill="none" stroke="${GRAU}" stroke-width="3" stroke-dasharray="8 5"/>
    ${[[20, 56], [100, 16], [180, 56], [100, 96]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="9" fill="${GELB}" stroke="${LINIE}"/>${text(x, y + 4, i + 1, 10)}`).join("")}
    <rect x="150" y="89" width="20" height="14" rx="3" fill="${ORANGE}" stroke="${LINIE}"/><rect x="134" y="91" width="14" height="10" fill="${BLAU}"/><rect x="118" y="91" width="14" height="10" fill="${BLAU}"/>
    ${pfeil(140, 22, 160, 30, LINIE)}${text(100, 60, "feste Route · feste Stopps · Takt", 9)}`,

  // Dock-Door: LKW dockt rückwärts an ein Tor mit Torabdichtung an (Wetterschutz)
  dockdoor: () => `<rect x="110" y="6" width="84" height="94" fill="${HELLGRAU}" stroke="${LINIE}"/><rect x="104" y="26" width="8" height="64" fill="${LINIE}"/>
    <rect x="116" y="30" width="60" height="60" fill="#fff" stroke="${LINIE}"/>${text(152, 20, "Halle", 9)}
    <rect x="10" y="30" width="92" height="52" fill="#f4f6f8" stroke="${LINIE}"/>${rad(30, 88)}${rad(80, 88)}
    ${pfeil(60, 104, 100, 104, GRUEN)}${text(56, 22, "rückwärts andocken", 9)}${text(152, 112, "geschützt vor Wetter", 9)}`,

  // Supermarkt: Durchlaufregal mit schrägen Kanälen, sortenreine KLT, Entnahme vorne (FIFO)
  supermarkt: () => {
    let s = "";
    for (let i = 0; i < 3; i++) {
      const y = 20 + i * 30;
      s += `<line x1="20" y1="${y + 18}" x2="160" y2="${y + 28}" stroke="${LINIE}" stroke-width="2"/>`;
      for (let j = 0; j < 4; j++) s += `<rect x="${32 + j * 32}" y="${y + 2 + j * 2.3}" width="28" height="16" fill="${[BLAU, GRUEN, ORANGE][i]}" stroke="${LINIE}" transform="rotate(4 ${46 + j * 32} ${y + 10})"/>`;
    }
    return `${s}${pfeil(24, 8, 150, 16, GRAU)}${text(70, 6, "Nachfüllen hinten", 8)}<circle cx="182" cy="48" r="5" fill="${LINIE}"/><path d="M182 53 V80 M182 60 L170 66" stroke="${LINIE}" stroke-width="3"/>
      ${text(100, 116, "sortenrein · schräg · vorne entnehmen (FIFO)", 9)}`;
  },

  // JIS: Teile kommen genau in der Reihenfolge der Montage an ("Perlenkette")
  jis: () => {
    const farben = [ROT, BLAU, BLAU, GELB, ROT, GRUEN];
    return `<line x1="10" y1="56" x2="190" y2="56" stroke="${GRAU}" stroke-width="3"/>
      ${farben.map((f, i) => `<circle cx="${24 + i * 30}" cy="56" r="11" fill="${f}" stroke="${LINIE}"/>${text(24 + i * 30, 60, i + 1, 10, "#fff")}`).join("")}
      ${farben.map((f, i) => `<rect x="${16 + i * 30}" y="78" width="16" height="12" fill="${f}" stroke="${LINIE}"/>`).join("")}
      ${pfeil(100, 30, 100, 44, LINIE)}${text(100, 22, "Montagereihenfolge", 9)}${text(100, 112, "passende Teile in genau dieser Reihenfolge", 9)}`;
  },

  // EAN: 1D-Strichcode mit 13 Ziffern
  ean: () => {
    let striche = "", x = 40;
    const muster = [1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 1, 3, 1, 1, 2, 1, 1, 1, 2, 3, 1, 1, 2, 1, 1, 2, 3, 1, 1, 1, 2, 1, 1, 2, 1, 3];
    muster.forEach((b, i) => { if (i % 2 === 0) striche += `<rect x="${x}" y="16" width="${b * 1.8}" height="${[0, 2, 18, 34].includes(i) ? 70 : 62}" fill="${LINIE}"/>`; x += b * 1.8 + 0.6; });
    return `<rect x="30" y="8" width="140" height="92" fill="#fff" stroke="${GRAU}"/>${striche}<text x="100" y="94" font-size="11" text-anchor="middle" font-family="monospace" fill="${LINIE}">4 006381 333931</text>
      ${text(100, 114, "1D-Strichcode · 13 Ziffern", 9)}`;
  },

  // RFID: Funk-Etikett mit Antennen-Spule, Lesegerät liest ohne Sichtkontakt (auch durch den Karton)
  rfid: () => `<rect x="20" y="30" width="80" height="60" fill="#c9a26b" stroke="${LINIE}"/>
    <rect x="34" y="42" width="52" height="34" rx="3" fill="#fff" stroke="${LINIE}" stroke-dasharray="3 2"/>
    ${[0, 5, 10].map((d) => `<rect x="${40 + d}" y="${47 + d}" width="${40 - 2 * d}" height="${24 - 2 * d}" fill="none" stroke="${ORANGE}" stroke-width="1.5"/>`).join("")}
    ${[14, 24, 34].map((r) => `<path d="M${140 - r} ${60 - r} A${r} ${r} 0 0 0 ${140 - r} ${60 + r}" fill="none" stroke="${BLAU}" stroke-width="2"/>`).join("")}
    <rect x="140" y="44" width="40" height="32" rx="5" fill="${LINIE}"/>${text(160, 64, "Leser", 9, "#fff")}
    ${text(100, 114, "Funk-Chip · kein Sichtkontakt nötig", 9)}`,
};

// Zeichnet ein Bild mit hellem Hintergrund (so ist es auch im Dunkelmodus gut zu erkennen)
// ohneText = true blendet die Beschriftung aus (für die Frage „Was zeigt das Bild?“)
export function bildSVG(name, titel = "", ohneText = false) {
  const zeichnen = BILDER[name];
  if (!zeichnen) return "";
  return `<svg class="bild${ohneText ? " ohne-text" : ""}" viewBox="0 0 200 120" role="img" aria-label="${titel}" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="120" rx="10" fill="#fbfaf7"/>${zeichnen()}</svg>`;
}
