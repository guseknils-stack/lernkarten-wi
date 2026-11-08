// PaukBär – Hauptlogik der App.
// Enthält: Speicher (Lernfortschritt auf dem Gerät), Bär-Zustand, alle Ansichten
// (Startseite, Fach, Paket, Karteikarten, Quiz, Probetest) und die Navigation.

import { baerSVG } from "./bear.js";
import { bildSVG } from "./bilder.js";

// ---------- Einstellungen ----------
const TAGESZIEL = 10;        // so viele RICHTIG beantwortete Karten pro Tag ergeben einen Trainingstag
const FORTSCHRITT_MAX = 22;  // so viele Lerntage, bis der Bär voll entwickelt ist
const FORTSCHRITT_MIN = -10; // tiefster Stand: Bär ist richtig krank
const MINUS_POSITIV = 3;     // verpasster Tag, solange der Fortschritt über 0 ist
const MINUS_NEGATIV = 1;     // verpasster Tag, wenn der Fortschritt schon bei 0 oder darunter ist
const PROBETEST_FRAGEN = 30;
const PROBETEST_MINUTEN = 20;
const FEHLERTEST_MAX = 30;   // höchstens so viele Begriffe im Fehler-Test
const NOCHMAL_ABSTAND = 3;   // falsche Karte kommt nach so vielen anderen Karten noch einmal
// Wie oft welche Frageart in Quiz und Probetest kommt (höhere Zahl = öfter)
const QUIZ_GEWICHTE = { wissen: 3, eigenschaft: 3, bedeutung: 2, begriff: 2, bild: 2, bereich: 1, kategorie: 1 };
const SPEICHER = "paukbaer-v1";

// ---------- Speicher (nur auf diesem Gerät) ----------
function laden() {
  try { return JSON.parse(localStorage.getItem(SPEICHER)) || {}; } catch { return {}; }
}
// tage = alle Antworten pro Tag, richtigTage = nur die richtigen (die zählen fürs Training)
let S = Object.assign({ karten: {}, tage: {}, richtigTage: {}, tests: [] }, laden());
function speichern() {
  try { localStorage.setItem(SPEICHER, JSON.stringify(S)); } catch { /* z. B. privater Modus */ }
}

// ---------- Hilfsfunktionen ----------
const $app = document.getElementById("app");
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// Markdown-Links [Text](URL) aus den Quellen als echte Links anzeigen
const mitLinks = (t) => esc(t).replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
const mischen = (a) => { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const heute = () => datumText(new Date());
function datumText(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function tageZwischen(a, b) { return Math.round((new Date(b + "T12:00") - new Date(a + "T12:00")) / 86400000); }
function plusTage(t, n) { const d = new Date(t + "T12:00"); d.setDate(d.getDate() + n); return datumText(d); }
// Was auf der Vorderseite steht: "frage", falls vorhanden, sonst der Begriff aus der Liste.
// Grund: Manche Begriffe stehen in der Liste mit Langform (z. B. "GiBo / Gitterbox"),
// dann würde die Lösung schon auf der Karte stehen.
const vorne = (k) => k.frage || k.begriff;

// ---------- Daten ----------
let FAECHER = [];
const FACHDATEN = {};
async function fachLaden(id) {
  if (FACHDATEN[id]) return FACHDATEN[id];
  const f = FAECHER.find((x) => x.id === id);
  const daten = await (await fetch(f.datei)).json();
  FACHDATEN[id] = daten;
  return daten;
}
const kartenSchluessel = (fach, nr) => `${fach}:${nr}`;
const stufe = (fach, nr) => (S.karten[kartenSchluessel(fach, nr)]?.stufe ?? 0);
const gesehen = (fach, nr) => !!S.karten[kartenSchluessel(fach, nr)];

// Antwort verbuchen: richtig = eine Stufe höher (max. 3), falsch = eine Stufe runter
function verbuchen(fach, nr, richtig) {
  const k = S.karten[kartenSchluessel(fach, nr)] || { stufe: 0, richtig: 0, falsch: 0 };
  if (richtig) { k.stufe = Math.min(3, k.stufe + 1); k.richtig++; }
  else { k.stufe = Math.max(0, k.stufe - 1); k.falsch++; }
  S.karten[kartenSchluessel(fach, nr)] = k;
  S.tage[heute()] = (S.tage[heute()] || 0) + 1;
  if (richtig) S.richtigTage[heute()] = (S.richtigTage[heute()] || 0) + 1;
  speichern();
}

// Wie oft eine Karte falsch war (aus dem Speicher). Grundlage für Schwerpunkte und Fehler-Test.
const fehlerZahl = (fach, nr) => S.karten[kartenSchluessel(fach, nr)]?.falsch ?? 0;
// "Schwer" = schon mindestens einmal falsch und noch nicht sicher (Stufe unter 2 = Ampel nicht grün)
const istSchwer = (fach, nr) => fehlerZahl(fach, nr) > 0 && stufe(fach, nr) < 2;

function paketKarten(daten, p) { return daten.karten.filter((k) => k.nr >= p.von && k.nr <= p.bis); }
// Ampel: grün = alle Karten mindestens 2x netto richtig, gelb = angefangen, rot = neu
function ampel(daten, p) {
  const ks = paketKarten(daten, p);
  if (ks.every((k) => stufe(daten.id, k.nr) >= 2)) return "gruen";
  if (ks.some((k) => gesehen(daten.id, k.nr))) return "gelb";
  return "rot";
}
function paketQuote(daten, p) {
  const ks = paketKarten(daten, p);
  return ks.reduce((s, k) => s + Math.min(2, stufe(daten.id, k.nr)), 0) / (ks.length * 2);
}

// ---------- Der Bär ----------
const heuteRichtig = () => S.richtigTage[heute()] || 0;
// Ein Trainingstag ist ein Tag mit mindestens TAGESZIEL richtig beantworteten Karten
const trainiert = (d) => (S.richtigTage[d] || 0) >= TAGESZIEL;

// Geht alle Tage vom ersten Trainingstag bis heute durch und rechnet den Trainingsfortschritt aus.
// Liefert pro Tag: Datum, ob trainiert/verpasst, die Änderung und den Stand danach (für Bär und Kalender).
// Regeln: +1 pro Trainingstag (bis 22). Verpasster Tag: -3, solange der Stand über 0 ist (aber nicht unter 0),
// danach -1 pro Tag bis -10. Heute zählt erst als verpasst, wenn der Tag vorbei ist.
function trainingsVerlauf() {
  const t = heute();
  const erster = Object.keys(S.richtigTage).filter(trainiert).sort()[0];
  const verlauf = [];
  let stand = 0;
  if (!erster) return verlauf;
  for (let d = erster; d <= t; d = plusTage(d, 1)) {
    const vorher = stand;
    let art = "offen"; // offen = heute, noch nicht geschafft
    if (trainiert(d)) { art = "trainiert"; stand = Math.min(FORTSCHRITT_MAX, stand + 1); }
    else if (d !== t) {
      art = "verpasst";
      stand = stand > 0 ? Math.max(0, stand - MINUS_POSITIV) : Math.max(FORTSCHRITT_MIN, stand - MINUS_NEGATIV);
    }
    verlauf.push({ datum: d, art, aenderung: stand - vorher, stand, richtig: S.richtigTage[d] || 0 });
  }
  return verlauf;
}

// Berechnet den Zustand des Bären aus dem Trainingsverlauf: Fortschritt, Stimmung, Serie, Ausstattung
function baerZustand(daten) {
  const t = heute();
  const verlauf = trainingsVerlauf();
  const fortschritt = verlauf.length ? verlauf[verlauf.length - 1].stand : 0;
  const gelernt = verlauf.filter((v) => v.art === "trainiert").map((v) => v.datum);
  const letzter = gelernt[gelernt.length - 1];
  const pause = letzter ? tageZwischen(letzter, t) : 0; // 0 = heute trainiert, 1 = gestern
  // Stimmung: unter 0 wird er Schritt für Schritt kränker. Über 0 wird er nur müde, wenn gestern nicht trainiert wurde.
  const stimmung = fortschritt <= -7 ? "krank" : fortschritt <= -4 ? "zerzaust" : fortschritt <= -1 ? "muede"
    : (letzter && pause >= 2) ? "muede" : "fit";
  // Serie: zusammenhängende Trainingstage bis heute oder gestern
  let serie = 0;
  if (letzter && pause <= 1) { for (let d = letzter; trainiert(d); d = plusTage(d, -1)) serie++; }
  const gruen = daten ? daten.pakete.filter((p) => ampel(daten, p) === "gruen").length : 0;
  const n = daten ? daten.pakete.length : 1;
  // Für die Zeichnung: Fortschritt 0–22 auf Muskelstufe 0–10 umrechnen
  const muskeln = Math.max(0, fortschritt) * 10 / FORTSCHRITT_MAX;
  return { fortschritt, muskeln, stimmung, serie, pause, brille: gruen >= Math.ceil(n / 2), kette: gruen === n, gruen, n, heuteRichtig: heuteRichtig() };
}

// Der Satz unter dem Bären, passend zu seinem Zustand
function baerText(z) {
  if (z.stimmung === "krank") return "Dein Bär ist krank vor Faulheit. Lern heute, dann wird er wieder fit! 🤒";
  if (z.stimmung === "zerzaust") return "Zu lange kein Training … er sieht ziemlich zerzaust aus.";
  if (z.stimmung === "muede") return z.fortschritt < 0 ? "Er wird schlapp. Trainier heute, damit er wieder fit wird." : "Er wird müde. Gestern wurde nicht trainiert.";
  if (z.kette) return "Voll ausgestattet: Muskeln, Ray-Ban und Goldkette. 💪😎";
  if (z.brille) return "Halbzeit geschafft: Die goldene Ray-Ban sitzt! 😎";
  if (z.fortschritt >= FORTSCHRITT_MAX) return "Voll entwickelt! 22 Tage Training haben sich gelohnt. 🏆";
  if (z.heuteRichtig >= TAGESZIEL) return "Heute trainiert! Der Trainingsfortschritt steigt.";
  if (z.fortschritt === 0) return "Hi, ich bin dein PaukBär. Trainier mit mir!";
  return "Bereit fürs Training?";
}

// ---------- Ansichten ----------
let aktiveUhr = null;
function zeige(html) { clearInterval(aktiveUhr); $app.innerHTML = html; window.scrollTo(0, 0); }
function kopf(titel, zurueck) {
  return `<div class="kopf">${zurueck ? `<button class="zurueck" data-los="${zurueck}" aria-label="Zurück">‹</button>` : ""}<h2>${esc(titel)}</h2></div>`;
}
function countdownText(datum) {
  const n = tageZwischen(heute(), datum);
  return n > 1 ? `noch ${n} Tage` : n === 1 ? "morgen!" : n === 0 ? "heute!" : "vorbei";
}

async function startseite() {
  const daten = await fachLaden("logistik");
  const z = baerZustand(daten);
  const ziel = Math.min(100, Math.round((z.heuteRichtig / TAGESZIEL) * 100));
  zeige(`
    <div class="kopf"><h1>PaukBär</h1></div>
    <section class="feld baer-feld">
      ${baerSVG(z)}
      <div class="baer-status">${esc(baerText(z))}</div>
      <div class="serie">
        <div><b>🔥 ${z.serie}</b><span class="leise">Tage Serie</span></div>
        <div><b>🏋️ ${z.fortschritt}/${FORTSCHRITT_MAX}</b><span class="leise">Training</span></div>
        <div><b>🟢 ${z.gruen}/${z.n}</b><span class="leise">Pakete grün</span></div>
      </div>
      <div class="tagesziel"><span style="width:${ziel}%"></span></div>
      <div class="leise">Tägliches Trainingsziel: ${Math.min(z.heuteRichtig, TAGESZIEL)} von ${TAGESZIEL} Karten richtig${z.heuteRichtig >= TAGESZIEL ? " ✅" : ""}</div>
      <div class="abstand"></div>
      <button class="knopf zweit" data-los="kalender">📅 Trainingskalender</button>
    </section>
    ${FAECHER.map((f) => `
      <button class="feld fach ${f.bald ? "bald" : ""}" ${f.bald ? "disabled" : `data-los="fach/${f.id}"`}>
        <span class="symbol">${f.symbol}</span>
        <span class="info"><span class="titel">${esc(f.titel)}</span><br>
          <span class="leise">${f.bald ? esc(f.hinweis) : `Test am ${new Date(f.testdatum + "T12:00").toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "long" })}`}</span></span>
        ${f.testdatum ? `<span class="countdown">${countdownText(f.testdatum)}</span>` : ""}
      </button>`).join("")}
    ${iosHinweis()}
  `);
}

function iosHinweis() {
  const standalone = window.navigator.standalone || matchMedia("(display-mode: standalone)").matches;
  if (standalone) return "";
  return `<p class="leise hinweis-ios">📲 Tipp: In Safari auf <b>Teilen</b> → <b>„Zum Home-Bildschirm“</b> tippen, dann hast du PaukBär als App.</p>`;
}

async function fachSeite(id) {
  const d = await fachLaden(id);
  const alleGruen = d.pakete.every((p) => ampel(d, p) === "gruen");
  const letzte = S.tests.filter((t) => t.fach === id && t.art !== "fehler").slice(-1)[0];
  const anzahlFehler = d.karten.filter((k) => fehlerZahl(id, k.nr) > 0).length;
  zeige(`
    ${kopf(d.titel, "start")}
    <p class="leise" style="margin-top:-6px">${esc(d.testinfo)} · ${countdownText(d.testdatum)}</p>
    ${d.pakete.map((p) => {
      const a = ampel(d, p), q = Math.round(paketQuote(d, p) * 100);
      return `<button class="feld fach paket" data-los="paket/${id}/${p.nr}">
        <span class="ampel ${a}"></span>
        <span class="info"><span class="titel">Paket ${p.nr}</span> <span class="leise">· Begriffe ${p.von}–${p.bis}</span>
          <div class="balken"><span style="width:${q}%"></span></div></span>
        <span class="leise">${q}%</span>
      </button>`;
    }).join("")}
    <section class="feld">
      <h3>🏁 Probetest</h3>
      <p class="leise">${PROBETEST_FRAGEN} Fragen, ${PROBETEST_MINUTEN} Minuten, Multiple Choice wie im echten Kurztest. ${alleGruen ? "Alle Pakete sind grün, du bist bereit!" : "Wird freigeschaltet, wenn alle Ampeln grün sind."}</p>
      ${letzte ? `<p class="leise">Letzter Versuch: ${letzte.richtig}/${letzte.gesamt} richtig (${new Date(letzte.datum).toLocaleDateString("de-DE")})</p>` : ""}
      <button class="knopf" data-los="probetest/${id}" ${alleGruen ? "" : "disabled"}>Probetest starten</button>
      ${alleGruen ? "" : `<div class="abstand"></div><button class="knopf zweit" data-los="probetest/${id}">Trotzdem schon üben</button>`}
    </section>
    <section class="feld">
      <h3>🎯 Schwerpunkte und Fehler-Test</h3>
      <p class="leise">${anzahlFehler ? `${anzahlFehler} Begriffe hattest du schon mindestens einmal falsch.` : "Noch keine Fehler gespeichert. Lern erst ein paar Pakete."}</p>
      <button class="knopf zweit" data-los="schwerpunkte/${id}">Schwerpunkte ansehen</button>
      <div class="abstand"></div>
      <button class="knopf" data-los="probetest/${id}/fehler" ${anzahlFehler ? "" : "disabled"}>Fehler-Test starten</button>
    </section>
    <p class="leise">So lernst du am besten: jedes Paket einmal, dann das nächste, und später wieder von vorne. Falsche Begriffe kommen von selbst öfter dran.</p>
  `);
}

async function paketSeite(id, nr) {
  const d = await fachLaden(id);
  const p = d.pakete.find((x) => x.nr === +nr);
  const ks = paketKarten(d, p);
  zeige(`
    ${kopf(`Paket ${p.nr}`, `fach/${id}`)}
    <p class="leise" style="margin-top:-6px">Begriffe ${p.von}–${p.bis} · Ampel: ${{ rot: "🔴 neu", gelb: "🟡 angefangen", gruen: "🟢 sitzt" }[ampel(d, p)]}</p>
    <button class="knopf" data-los="karten/${id}/${p.nr}">🃏 Karteikarten lernen</button>
    <div class="abstand"></div>
    <button class="knopf zweit" data-los="quiz/${id}/${p.nr}">❓ Quiz mit Erklärungen</button>
    <div class="abstand"></div>
    <section class="feld">
      ${ks.map((k) => `<div class="paket" style="padding:6px 0"><span class="ampel ${stufe(id, k.nr) >= 2 ? "gruen" : gesehen(id, k.nr) ? "gelb" : "rot"}"></span><span class="info">${esc(vorne(k))}</span></div>`).join("")}
    </section>
    <p class="leise">Grün wird eine Karte, wenn du sie zweimal mehr richtig als falsch hattest. Die Reihenfolge wird bei jeder Runde neu gemischt.</p>
  `);
}

// ---------- Trainingskalender ----------
// Zeigt, an welchen Tagen trainiert oder verpasst wurde, und wie weit es noch bis zur Bestform ist
function kalender() {
  const t = heute();
  const verlauf = trainingsVerlauf();
  const proTag = Object.fromEntries(verlauf.map((v) => [v.datum, v]));
  const stand = verlauf.length ? verlauf[verlauf.length - 1].stand : 0;
  const anzahl = (art) => verlauf.filter((v) => v.art === art).length;
  // Wie viele Trainingstage fehlen noch bis 22? Unter 0 muss man erst zurück auf 0.
  const fehlen = FORTSCHRITT_MAX - stand;
  const bestform = stand >= FORTSCHRITT_MAX ? "🏆 Bestform erreicht!"
    : `Noch <b>${fehlen}</b> Trainingstag${fehlen === 1 ? "" : "e"} ohne Pause bis zur Bestform.`;

  // Ein Monat als Raster Mo–So
  const monat = (jahr, m) => {
    const erster = new Date(jahr, m, 1);
    const leer = (erster.getDay() + 6) % 7; // Montag = 0
    const tage = new Date(jahr, m + 1, 0).getDate();
    let zellen = "";
    for (let i = 0; i < leer; i++) zellen += `<div></div>`;
    for (let tag = 1; tag <= tage; tag++) {
      const d = datumText(new Date(jahr, m, tag));
      const v = proTag[d];
      const art = v ? v.art : d > t ? "zukunft" : "";
      const zeichen = art === "trainiert" ? "✓" : art === "verpasst" ? "✗" : (S.richtigTage[d] ? S.richtigTage[d] : "");
      zellen += `<div class="tag ${art} ${d === t ? "heute" : ""}"><span>${tag}</span><small>${zeichen}</small></div>`;
    }
    const name = erster.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    return `<section class="feld"><h3>${name}</h3>
      <div class="kalender">${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((w) => `<div class="wtag">${w}</div>`).join("")}${zellen}</div></section>`;
  };
  // Monate vom ersten Trainingstag bis heute, der aktuelle zuerst
  const jetzt = new Date();
  const start = verlauf.length ? new Date(verlauf[0].datum + "T12:00") : jetzt;
  const monate = [];
  let j = jetzt.getFullYear(), m = jetzt.getMonth();
  while (j * 12 + m >= start.getFullYear() * 12 + start.getMonth()) {
    monate.push(monat(j, m));
    m--; if (m < 0) { m = 11; j--; }
  }
  const zeile = (v) => `<li><b>${new Date(v.datum + "T12:00").toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}</b>:
    ${v.art === "trainiert" ? "✓ trainiert" : v.art === "verpasst" ? "✗ verpasst" : "heute noch offen"} (${v.richtig} richtig)
    <span class="leise">· ${v.aenderung > 0 ? "+" : ""}${v.aenderung} → Stand ${v.stand}</span></li>`;

  zeige(`
    ${kopf("Trainingskalender", "start")}
    <section class="feld">
      <div class="serie">
        <div><b>🏋️ ${stand}/${FORTSCHRITT_MAX}</b><span class="leise">Stand</span></div>
        <div><b>✓ ${anzahl("trainiert")}</b><span class="leise">trainiert</span></div>
        <div><b>✗ ${anzahl("verpasst")}</b><span class="leise">verpasst</span></div>
      </div>
      <div class="tagesziel"><span style="width:${Math.max(0, stand) * 100 / FORTSCHRITT_MAX}%"></span></div>
      <p style="margin:6px 0 0">${bestform}</p>
      <p class="leise">Ein Trainingstag zählt ab ${TAGESZIEL} richtigen Karten. +1 pro Trainingstag, −${MINUS_POSITIV} pro verpasstem Tag (nicht unter 0), ab 0 dann −${MINUS_NEGATIV} pro Tag bis ${FORTSCHRITT_MIN}.</p>
    </section>
    ${monate.join("")}
    <p class="leise">✓ = trainiert · ✗ = verpasst · Zahl = so viele richtige Karten, Ziel noch nicht erreicht</p>
    ${verlauf.length ? `<section class="feld"><h3>Verlauf</h3><ul class="fehler">${verlauf.slice(-14).reverse().map(zeile).join("")}</ul></section>` : `<p class="leise">Noch kein Trainingstag. Schaff heute ${TAGESZIEL} richtige Karten, dann geht es los!</p>`}
  `);
}

// ---------- Schwerpunkte ----------
// Zeigt pro Paket die Begriffe, die schon einmal falsch waren, mit Fehlerzahl und Lösung zum Nachlesen.
// Begriffe, die inzwischen sitzen (grün), bleiben sichtbar, aber mit Haken, damit man den Fortschritt sieht.
async function schwerpunkte(id) {
  const d = await fachLaden(id);
  const gruppen = d.pakete.map((p) => ({
    p, ks: paketKarten(d, p).filter((k) => fehlerZahl(id, k.nr) > 0).sort((a, b) => fehlerZahl(id, b.nr) - fehlerZahl(id, a.nr)),
  })).filter((g) => g.ks.length);
  const eintrag = (k) => `<details class="schwer">
      <summary><span class="ampel ${istSchwer(id, k.nr) ? "rot" : "gruen"}"></span><b>${esc(vorne(k))}</b>
        <span class="leise">${fehlerZahl(id, k.nr)}× falsch${istSchwer(id, k.nr) ? "" : " · sitzt jetzt ✅"}</span></summary>
      ${k.bild ? bildSVG(k.bild, vorne(k)) : ""}
      <div class="kurz">${esc(k.antwort)}</div>
      <p class="leise">${esc(k.erklaerung)}</p>
    </details>`;
  zeige(`
    ${kopf("🎯 Schwerpunkte", `fach/${id}`)}
    <p class="leise" style="margin-top:-6px">Alle Begriffe, die du schon mindestens einmal falsch hattest. Tippen zeigt die Lösung. Rot = noch unsicher, grün = sitzt inzwischen.</p>
    ${gruppen.length ? gruppen.map((g) => `<section class="feld"><h3>Paket ${g.p.nr} <span class="leise">· ${g.ks.length} Begriff${g.ks.length === 1 ? "" : "e"}</span></h3>${g.ks.map(eintrag).join("")}</section>`).join("")
      : `<section class="feld"><p>Noch keine Fehler gespeichert. 👍</p></section>`}
    ${gruppen.length ? `<button class="knopf" data-los="probetest/${id}/fehler">Fehler-Test starten</button>` : ""}
  `);
}

// ---------- Antwort-Bewertung (Tipp-Modus) ----------
// Wörter, die beim Vergleich keine Rolle spielen
const FUELLWOERTER = new Set(["also", "eine", "einer", "eines", "einem", "einen", "der", "die", "das", "den", "dem", "des", "und", "oder", "für", "mit", "von", "vom", "bei", "beim", "nicht", "nach", "auf", "aus", "ein", "ist", "sind", "wird", "werden", "noch", "auch", "nur", "wie", "was", "dass", "z.b", "englisch", "bzw", "etc"]);

// Text vereinheitlichen: klein, Umlaute ausschreiben, Satzzeichen weg
function normal(t) {
  return t.toLowerCase().replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

// Levenshtein-Abstand: wie viele Buchstaben man ändern muss, damit zwei Wörter gleich sind (für Tippfehler)
function abstand(a, b) {
  const z = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) z[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      z[i][j] = Math.min(z[i - 1][j] + 1, z[i][j - 1] + 1, z[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return z[a.length][b.length];
}

// Zwei Wörter gelten als gleich bei kleinen Tippfehlern oder wenn eins im anderen steckt (z. B. "Güterstrom" in "Güterstroms")
function wortPasst(a, b) {
  if (a === b) return true;
  if (a.length >= 5 && b.length >= 5 && (a.includes(b) || b.includes(a))) return true;
  const erlaubt = Math.max(a.length, b.length) <= 6 ? 1 : 2;
  return abstand(a, b) <= erlaubt;
}

// Bewertet eine getippte Antwort. Richtig, wenn sie einer Teil-Antwort fast gleicht
// oder genug Schlüsselwörter der Lösung enthält. Das ist nicht perfekt, deshalb gibt es den "Doch richtig"-Knopf.
function bewerten(eingabe, karte) {
  const ein = normal(eingabe);
  if (ein.length < 2) return false;
  const einWoerter = ein.split(" ");
  // Teil-Antworten: die Lösung an ":", "/", "(" und " = " aufteilen (nicht am Komma, sonst würde bei
  // "Transport, Umschlag, Lagerung" schon "Transport" allein reichen)
  const teile = karte.antwort.split(/[:/()]| = /).map(normal).filter((t) => t.length >= 2);
  for (const t of teile) {
    if (abstand(ein, t) <= Math.max(1, Math.floor(t.length * 0.2))) return true;
  }
  // Schlüsselwörter der Lösung, die in der Eingabe vorkommen
  const schluessel = [...new Set(normal(karte.antwort).split(" ").filter((w) => w.length >= 4 && !FUELLWOERTER.has(w)))];
  if (!schluessel.length) return false;
  const treffer = schluessel.filter((s) => einWoerter.some((w) => w.length >= 3 && wortPasst(w, s))).length;
  // Mindestens die Hälfte der Schlüsselwörter oder drei Treffer
  return treffer / schluessel.length >= 0.5 || treffer >= 3;
}

// ---------- Karteikarten ----------
// Karteikarten: mischen, dann entweder Antwort eintippen (App bewertet) oder umdrehen (selbst bewerten).
// Hat die Karte eine Wissensfrage (mc), kommt sie danach als zweiter Teil. Die Karte zählt nur als
// richtig, wenn beide Teile stimmen. Das Symbol erscheint erst bei der Lösung, weil es sonst bei Abkürzungen
// einen Hinweis geben würde.
// Schwere Begriffe kommen öfter dran: Wer schon falsch war und noch nicht grün ist, steckt zweimal im Stapel
// (einmal in der ersten, einmal in der zweiten Hälfte). Eine in dieser Runde falsch beantwortete Karte kommt
// nach NOCHMAL_ABSTAND anderen Karten wieder und am Ende der Runde noch einmal. Der Abstand ist Absicht:
// Sofort wiederholen bringt wenig, weil die Antwort dann noch im Kurzzeitgedächtnis ist.
function karteikarten(id, nr) {
  fachLaden(id).then((d) => {
    const p = d.pakete.find((x) => x.nr === +nr);
    const karten = mischen(paketKarten(d, p));
    const schwere = karten.filter((k) => istSchwer(id, k.nr));
    // zweites Exemplar der schweren Karten zufällig in die zweite Hälfte einsortieren
    let stapel = [...karten];
    schwere.forEach((k) => {
      const ab = Math.ceil(stapel.length / 2);
      stapel.splice(ab + Math.floor(Math.random() * (stapel.length - ab + 1)), 0, k);
    });
    const nochmal = new Set();
    let pos = 0, richtig = 0, gesamt = 0;

    // Lösungsteil der Karte (wird nach dem Umdrehen oder Prüfen gezeigt)
    const loesung = (k) => `<div class="antwort">
        ${k.bild ? bildSVG(k.bild, vorne(k)) : `<div class="gross" style="text-align:center">${k.symbol}</div>`}
        <div class="kurz">${esc(k.antwort)}</div>
        <div>${esc(k.erklaerung)}</div>
        ${k.in_folien !== "ja" ? `<span class="badge">${k.in_folien === "nein" ? "⚠️ nicht in den Folien" : "🔶 in den Folien nur erwähnt"}</span>` : ""}
        <div class="quelle">Quelle: ${mitLinks(k.quelle)}</div>
      </div>`;

    // zustand: "frage" | "umgedreht" | "geprueft"
    const karte = (zustand = "frage", eingabe = "", urteil = null) => {
      const k = stapel[pos];
      let unten = "";
      if (zustand === "frage") {
        unten = `
          <form id="tippen" autocomplete="off">
            <input id="eingabe" class="eingabe" type="text" placeholder="Antwort eintippen (optional)" autocapitalize="off" spellcheck="false">
            <div class="abstand"></div>
            <div class="reihe"><button type="button" class="knopf zweit" id="drehen">Umdrehen</button><button type="submit" class="knopf">Prüfen</button></div>
          </form>`;
      } else if (zustand === "umgedreht") {
        unten = `<div class="reihe"><button class="knopf rot" id="nein">Nicht gewusst</button><button class="knopf gruen" id="ja">Gewusst</button></div>`;
      } else {
        unten = `
          <button class="knopf" id="weiter">Weiter</button>
          <div class="abstand"></div>
          <button class="knopf zweit" id="korrigieren">${urteil ? "Ich lag doch falsch" : "Ich lag doch richtig"}</button>`;
      }
      zeige(`
        ${kopf(`Paket ${p.nr} · Karteikarten`, `paket/${id}/${nr}`)}
        <div class="fortschritt">Karte ${pos + 1} von ${stapel.length}${k.mc ? " · Teil 1 von 2" : ""}</div>
        <section class="feld karteikarte">
          <div class="begriff">${esc(vorne(k))}</div>
          ${zustand === "geprueft" ? `<div class="urteil ${urteil ? "ok" : "nok"}">${urteil ? "✅ Richtig!" : "❌ Nicht ganz."}<br><span class="leise">Deine Antwort: ${esc(eingabe)}</span></div>` : ""}
          ${zustand === "frage" ? `<p class="leise">Erst überlegen, dann eintippen oder umdrehen.</p>` : loesung(k)}
        </section>
        ${unten}
      `);

      // Nach Teil 1: Wissensfrage stellen, falls vorhanden, sonst die Karte gleich abschließen
      const weiter = (gewusst) => (k.mc ? teil2(k, gewusst) : abschliessen(k, gewusst));

      if (zustand === "frage") {
        document.getElementById("drehen").onclick = () => karte("umgedreht");
        document.getElementById("tippen").onsubmit = (e) => {
          e.preventDefault();
          const text = document.getElementById("eingabe").value.trim();
          if (!text) return karte("umgedreht");          // leer = einfach umdrehen
          karte("geprueft", text, bewerten(text, k));
        };
      } else if (zustand === "umgedreht") {
        document.getElementById("ja").onclick = () => weiter(true);
        document.getElementById("nein").onclick = () => weiter(false);
      } else {
        document.getElementById("weiter").onclick = () => weiter(urteil);
        document.getElementById("korrigieren").onclick = () => weiter(!urteil);
      }
    };

    // Teil 2: die schwere Multiple-Choice-Frage zur Karte
    // f wird beim ersten Aufruf gebaut und danach weitergereicht, damit die Antworten nach dem Tippen nicht neu gemischt werden
    const teil2 = (k, teil1Ok, f = wissensFrage(k), gewaehlt) => {
      const beantwortet = gewaehlt !== undefined;
      zeige(`
        ${kopf(`Paket ${p.nr} · Karteikarten`, `paket/${id}/${nr}`)}
        <div class="fortschritt">Karte ${pos + 1} von ${stapel.length} · Teil 2 von 2 · Teil 1 ${teil1Ok ? "✅" : "❌"}</div>
        ${mcHtml(f, gewaehlt)}
        ${beantwortet ? `<button class="knopf" id="weiter">Weiter</button>` : ""}
      `);
      if (!beantwortet) mcKlicks(f, (i) => teil2(k, teil1Ok, f, i));
      else document.getElementById("weiter").onclick = () => abschliessen(k, teil1Ok && f.optionen[gewaehlt].richtig);
    };

    // Karte verbuchen und zur nächsten
    const abschliessen = (k, gewusst) => {
      verbuchen(id, k.nr, gewusst); gesamt++;
      if (gewusst) richtig++;
      else if (!nochmal.has(k.nr)) {
        // bald wiederholen (mit kleinem Abstand) und am Ende der Runde noch einmal
        nochmal.add(k.nr);
        stapel.splice(Math.min(stapel.length, pos + 1 + NOCHMAL_ABSTAND), 0, k);
        stapel.push(k);
      }
      pos++;
      pos < stapel.length ? karte() : ende();
    };

    const ende = () => zeige(`
      ${kopf("Runde geschafft! 🎉", `paket/${id}/${nr}`)}
      <section class="feld" style="text-align:center">
        <div class="ergebnis">${richtig}/${gesamt}</div>
        <p>Karten komplett richtig. Ampel jetzt: ${{ rot: "🔴", gelb: "🟡", gruen: "🟢" }[ampel(d, p)]}</p>
      </section>
      <button class="knopf" data-los="karten/${id}/${nr}">Neue Runde (neu gemischt)</button>
      <div class="abstand"></div>
      <button class="knopf zweit" data-los="quiz/${id}/${nr}">Jetzt das Quiz</button>
      <div class="abstand"></div>
      <button class="knopf zweit" data-los="schwerpunkte/${id}">🎯 Meine Schwerpunkte</button>
      <div class="abstand"></div>
      <button class="knopf zweit" data-los="start">Zum Bären</button>
      <p class="leise">Tipp: Mach jetzt mit dem nächsten Paket weiter und wiederhol dieses später. Mit Abstand bleibt mehr hängen als dreimal direkt hintereinander.</p>
    `);
    karte();
  });
}

// ---------- Multiple Choice (Quiz und Probetest) ----------
// Bedeutungsfrage: "Was bedeutet X?" mit der richtigen Antwort und 3 falschen aus derselben Kategorie
function bedeutungsFrage(d, k) {
  const andere = mischen(d.karten.filter((x) => x.nr !== k.nr && x.kategorie === k.kategorie && x.antwort !== k.antwort)).slice(0, 3);
  return {
    karte: k, ueber: "Was bedeutet …", frage: `${vorne(k)}?`, erklaerung: k.erklaerung,
    optionen: mischen([k, ...andere]).map((o) => ({ text: o.antwort, richtig: o.nr === k.nr })),
  };
}
// Wissensfrage: die schwere Frage aus den Kartendaten (mc). In der Datei steht die richtige Antwort immer
// an erster Stelle, deshalb wird hier gemischt.
function wissensFrage(k) {
  return {
    karte: k, ueber: `Wissensfrage zu ${vorne(k)}`, frage: k.mc.frage, erklaerung: k.mc.erklaerung,
    optionen: mischen(k.mc.optionen.map((text, i) => ({ text, richtig: i === 0 }))),
  };
}
// Zeichnet eine Frage mit Antwortknöpfen. Ist schon gewählt, werden richtig/falsch markiert und die Erklärung gezeigt.
function mcHtml(f, gewaehlt, mitAuswertung = true) {
  const beantwortet = gewaehlt !== undefined && mitAuswertung;
  return `
    <section class="feld"><div class="leise">${esc(f.ueber)}</div>${f.bild || ""}${f.frage ? `<h2>${esc(f.frage)}</h2>` : ""}</section>
    ${f.optionen.map((o, i) => {
      const kl = beantwortet ? (o.richtig ? "richtig" : i === gewaehlt ? "falsch" : "") : "";
      return `<button class="option ${kl}" data-i="${i}" ${beantwortet ? "disabled" : ""}>${"ABCD"[i]}) ${esc(o.text)}</button>`;
    }).join("")}
    ${beantwortet ? `<section class="feld">
        <b>${f.optionen[gewaehlt].richtig ? "✅ Richtig!" : "❌ Leider falsch."}</b>
        ${f.karte.bild ? bildSVG(f.karte.bild, vorne(f.karte)) : ""}
        <p>${f.karte.symbol} ${esc(f.erklaerung)}</p>
        <div class="quelle">Quelle Karte: ${mitLinks(f.karte.quelle)}</div>
      </section>` : ""}`;
}
// Teile eines Begriffs, z. B. "GiBo / Gitterbox" -> ["gibo", "gitterbox"]
const begriffTeile = (k) => vorne(k).toLowerCase().split(/[\/()]/).map((t) => t.trim()).filter((t) => t.length >= 3);
// Die umgekehrte Frage geht nur, wenn die Antwort den Begriff nicht selbst verrät (z. B. "Brutto = Gesamtgewicht …")
const umkehrbar = (k) => !begriffTeile(k).some((t) => k.antwort.toLowerCase().includes(t));

// Umgekehrte Frage: Die Beschreibung ist gegeben, gesucht ist der Begriff (falsche Antworten aus derselben Kategorie)
function begriffsFrage(d, k) {
  const andere = mischen(d.karten.filter((x) => x.nr !== k.nr && x.kategorie === k.kategorie)).slice(0, 3);
  return {
    karte: k, ueber: "Welcher Begriff passt?", frage: `„${k.antwort}“`, erklaerung: `${vorne(k)}: ${k.erklaerung}`,
    optionen: mischen([k, ...andere]).map((o) => ({ text: vorne(o), richtig: o.nr === k.nr })),
  };
}
// Kategorie-Frage: unter welcher Überschrift steht der Begriff in Seifermanns Liste?
function kategorieFrage(d, k) {
  const alle = [...new Set(d.karten.map((x) => x.kategorie))];
  return {
    karte: k, ueber: "Kategorie in der Begriffsliste", frage: `Unter welcher Kategorie steht „${vorne(k)}“?`,
    erklaerung: `${vorne(k)} ist Nr. ${k.nr} der Liste und steht unter „${k.kategorie}“.`,
    optionen: mischen(alle).map((text) => ({ text, richtig: text === k.kategorie })),
  };
}
// Bereichs-Frage: zu welchem Themenbereich gehört der Begriff? Eine Karte kann zu mehreren Bereichen gehören,
// deshalb kommen als falsche Antworten nur Bereiche infrage, die bei der Karte gar nicht stehen.
function bereichsFrage(d, k) {
  const richtig = mischen(k.bereich)[0];
  const falsch = mischen(d.bereiche.filter((b) => !k.bereich.includes(b))).slice(0, 3);
  return {
    karte: k, ueber: "Themenbereich", frage: `Zu welchem Bereich gehört „${vorne(k)}“?`,
    erklaerung: `${vorne(k)} gehört zu: ${k.bereich.join(", ")}. ${k.antwort}`,
    optionen: mischen([richtig, ...falsch]).map((text) => ({ text, richtig: text === richtig })),
  };
}

// Bilderfrage: Zeichnung ohne Beschriftung, gesucht ist der Begriff (falsche Antworten bevorzugt aus anderen Bildern)
function bildFrage(d, k) {
  const mitBild = mischen(d.karten.filter((x) => x.bild && x.nr !== k.nr));
  const andere = [...mitBild, ...mischen(d.karten.filter((x) => !x.bild && x.kategorie === k.kategorie))].slice(0, 3);
  return {
    karte: k, ueber: "Was zeigt das Bild?", frage: "", bild: bildSVG(k.bild, "Bild zur Frage", true), erklaerung: `${vorne(k)}: ${k.erklaerung}`,
    optionen: mischen([k, ...andere]).map((o) => ({ text: vorne(o), richtig: o.nr === k.nr })),
  };
}

// Eigenschafts-Frage: bei wichtigen Gegenständen (z. B. Euro-Palette) Material, Maße, Farbe usw.
// Eine Karte kann mehrere haben, es wird zufällig eine gezogen.
function eigenschaftsFrage(d, k) {
  const e = mischen(k.eigenschaften)[0];
  return {
    karte: k, ueber: `Eigenschaft: ${vorne(k)}`, frage: e.frage, erklaerung: e.erklaerung,
    optionen: mischen(e.optionen.map((text, i) => ({ text, richtig: i === 0 }))),
  };
}

// Alle Fragetypen mit Prüfung, ob sie für eine Karte möglich sind
const FRAGETYPEN = {
  wissen: { bauen: (d, k) => wissensFrage(k), moeglich: (k) => !!k.mc },
  bedeutung: { bauen: bedeutungsFrage, moeglich: () => true },
  begriff: { bauen: begriffsFrage, moeglich: umkehrbar },
  bereich: { bauen: bereichsFrage, moeglich: (k) => !!k.bereich },
  kategorie: { bauen: kategorieFrage, moeglich: () => true },
  bild: { bauen: bildFrage, moeglich: (k) => !!k.bild },
  eigenschaft: { bauen: eigenschaftsFrage, moeglich: (k) => !!k.eigenschaften?.length },
};
// Zieht zufällig einen Fragetyp für die Karte. gewichte z. B. { bedeutung: 2, kategorie: 1 }: höhere Zahl = kommt öfter.
// "ohne" schließt Typen aus, die bei dieser Karte schon dran waren.
function zufallsTyp(k, gewichte, ohne = []) {
  const topf = Object.entries(gewichte).filter(([typ]) => FRAGETYPEN[typ].moeglich(k) && !ohne.includes(typ))
    .flatMap(([typ, n]) => Array(n).fill(typ));
  return topf[Math.floor(Math.random() * topf.length)];
}

// Hängt an die Antwortknöpfe die Funktion, die mit der Nummer der gewählten Antwort aufgerufen wird
function mcKlicks(f, beiWahl) {
  document.querySelectorAll(".option").forEach((b) => (b.onclick = () => beiWahl(+b.dataset.i)));
}

// Quiz: pro Karte zwei Fragen: die Wissensfrage (falls vorhanden) und eine zufällige andere Frageart
// (Bedeutung, Begriff zur Beschreibung, Bild, Bereich, Kategorie). Ohne Wissensfrage: zwei verschiedene andere.
// Wichtige Gegenstände (z. B. Euro-Palette) bekommen zusätzlich eine Eigenschaftsfrage.
// Verbucht wird pro Karte: richtig nur, wenn alle Fragen zu dieser Karte stimmen.
function quiz(id, nr) {
  fachLaden(id).then((d) => {
    const p = d.pakete.find((x) => x.nr === +nr);
    // Wissens- und Eigenschaftsfrage kommen extra, deshalb hier nur die übrigen Fragearten zum Losen
    const { wissen, eigenschaft, ...gewichte } = QUIZ_GEWICHTE;
    const fragen = mischen(paketKarten(d, p)).flatMap((k) => {
      const erster = zufallsTyp(k, gewichte);
      const typen = [erster, k.mc ? "wissen" : zufallsTyp(k, gewichte, [erster])];
      if (k.eigenschaften?.length) typen.push("eigenschaft");
      return typen.map((typ) => FRAGETYPEN[typ].bauen(d, k));
    });
    const kartenOk = {};
    let pos = 0, richtig = 0;
    const frage = (gewaehlt) => {
      const f = fragen[pos], beantwortet = gewaehlt !== undefined;
      zeige(`
        ${kopf(`Paket ${p.nr} · Quiz`, `paket/${id}/${nr}`)}
        <div class="fortschritt">Frage ${pos + 1} von ${fragen.length} · ${richtig} richtig</div>
        ${mcHtml(f, gewaehlt)}
        ${beantwortet ? `<button class="knopf" id="weiter">${pos + 1 < fragen.length ? "Weiter" : "Auswertung"}</button>` : ""}
      `);
      if (!beantwortet) {
        mcKlicks(f, (i) => {
          const ok = f.optionen[i].richtig, nrK = f.karte.nr;
          if (ok) richtig++;
          kartenOk[nrK] = (kartenOk[nrK] ?? true) && ok;
          // letzte Frage zu dieser Karte? Dann die Karte verbuchen
          if (fragen[pos + 1]?.karte.nr !== nrK) verbuchen(id, nrK, kartenOk[nrK]);
          frage(i);
        });
      } else {
        document.getElementById("weiter").onclick = () => { pos++; pos < fragen.length ? frage() : ende(); };
      }
    };
    const ende = () => zeige(`
      ${kopf("Quiz beendet", `paket/${id}/${nr}`)}
      <section class="feld" style="text-align:center"><div class="ergebnis">${richtig}/${fragen.length}</div>
        <p>Ampel jetzt: ${{ rot: "🔴", gelb: "🟡", gruen: "🟢" }[ampel(d, p)]}</p></section>
      <button class="knopf" data-los="quiz/${id}/${nr}">Nochmal (neu gemischt)</button>
      <div class="abstand"></div>
      <button class="knopf zweit" data-los="fach/${id}">Zur Paketübersicht</button>
    `);
    frage();
  });
}

// Probetest: zufällige Karten aus allen Paketen, mit Zeitlimit, Auswertung erst am Ende.
// art = "fehler": Fehler-Test nur mit den Begriffen, die am häufigsten falsch waren (höchste Fehlerquote zuerst).
// Pro Karte eine Frage mit zufälligem Fragetyp (Gewichte oben in den Einstellungen).
// Welche Fragearten im echten Kurztest kommen, wissen wir nicht. Deshalb eine Mischung.
function probetest(id, art) {
  fachLaden(id).then((d) => {
    const fehlerTest = art === "fehler";
    const quote = (k) => { const e = S.karten[kartenSchluessel(id, k.nr)]; return e ? e.falsch / (e.falsch + e.richtig) : 0; };
    const auswahl = fehlerTest
      ? d.karten.filter((k) => fehlerZahl(id, k.nr) > 0)
        .sort((a, b) => quote(b) - quote(a) || fehlerZahl(id, b.nr) - fehlerZahl(id, a.nr)).slice(0, FEHLERTEST_MAX)
      : d.karten;
    if (!auswahl.length) { zeige(`${kopf("Fehler-Test", `fach/${id}`)}<section class="feld"><p>Noch keine Fehler gespeichert. 👍</p></section>`); return; }
    const titel = fehlerTest ? "Fehler-Test" : "Probetest";
    const fragen = mischen(auswahl).slice(0, PROBETEST_FRAGEN)
      .map((k) => FRAGETYPEN[zufallsTyp(k, QUIZ_GEWICHTE)].bauen(d, k));
    const antworten = [];
    const ablauf = Date.now() + PROBETEST_MINUTEN * 60000;
    let pos = 0;
    const uhr = () => {
      const rest = Math.max(0, ablauf - Date.now());
      const el = document.getElementById("uhr");
      if (el) el.textContent = `${Math.floor(rest / 60000)}:${String(Math.floor(rest / 1000) % 60).padStart(2, "0")}`;
      if (rest <= 0) ende(true);
    };
    const frage = () => {
      const f = fragen[pos];
      zeige(`
        ${kopf(titel, `fach/${id}`)}
        <div class="fortschritt">Frage ${pos + 1} von ${fragen.length} · ⏱️ <span class="timer" id="uhr"></span></div>
        ${mcHtml(f, undefined, false)}
      `);
      uhr(); aktiveUhr = setInterval(uhr, 1000);
      mcKlicks(f, (i) => {
        antworten[pos] = i; pos++;
        pos < fragen.length ? frage() : ende(false);
      });
    };
    const ende = (zeitUm) => {
      const fehler = [];
      let richtig = 0;
      fragen.forEach((f, i) => {
        if (antworten[i] === undefined) { fehler.push({ f, gewaehlt: null }); return; }
        const ok = f.optionen[antworten[i]].richtig;
        verbuchen(id, f.karte.nr, ok);
        ok ? richtig++ : fehler.push({ f, gewaehlt: f.optionen[antworten[i]] });
      });
      S.tests.push({ fach: id, art: fehlerTest ? "fehler" : "probe", datum: Date.now(), richtig, gesamt: fragen.length }); speichern();
      const quote = Math.round((richtig / fragen.length) * 100);
      const loesung = (f) => f.optionen.find((o) => o.richtig).text;
      zeige(`
        ${kopf(`${titel} – Ergebnis`, `fach/${id}`)}
        <section class="feld" style="text-align:center">
          ${zeitUm ? `<p><b>⏰ Die Zeit ist abgelaufen.</b></p>` : ""}
          <div class="ergebnis">${quote}%</div>
          <p>${richtig} von ${fragen.length} richtig. ${quote >= 90 ? "Stark, du bist bereit! 🏆" : quote >= 70 ? "Gut! Die Fehler unten noch einmal ansehen." : "Da geht noch was. Lern die Pakete mit gelber Ampel weiter."}</p>
        </section>
        ${fehler.length ? `<section class="feld"><h3>Das solltest du wiederholen</h3><ul class="fehler">
          ${fehler.map(({ f, gewaehlt }) => `<li><b>${esc(f.frage || `Bild: ${vorne(f.karte)}`)}</b><br>✅ ${esc(loesung(f))}${gewaehlt ? `<br><span class="leise">Deine Antwort: ${esc(gewaehlt.text)}</span>` : `<br><span class="leise">nicht beantwortet</span>`}<br><span class="leise">${esc(f.erklaerung)}</span></li>`).join("")}
        </ul></section>` : ""}
        <button class="knopf" data-los="probetest/${id}${fehlerTest ? "/fehler" : ""}">Neuer ${titel}</button>
        <div class="abstand"></div>
        <button class="knopf zweit" data-los="schwerpunkte/${id}">🎯 Schwerpunkte ansehen</button>
        <div class="abstand"></div>
        <button class="knopf zweit" data-los="start">Zum Bären</button>
      `);
    };
    frage();
  });
}

// ---------- Navigation ----------
function route() {
  const [seite, a, b] = (location.hash.slice(1) || "start").split("/");
  ({ start: startseite, fach: () => fachSeite(a), paket: () => paketSeite(a, b), karten: () => karteikarten(a, b),
     quiz: () => quiz(a, b), probetest: () => probetest(a, b), schwerpunkte: () => schwerpunkte(a), kalender }[seite] || startseite)();
}
$app.addEventListener("click", (e) => {
  const z = e.target.closest("[data-los]");
  if (!z || z.disabled) return;
  const ziel = "#" + z.dataset.los;
  if (location.hash === ziel) route(); else location.hash = ziel;
});
window.addEventListener("hashchange", route);

(async () => {
  try {
    FAECHER = await (await fetch("data/faecher.json")).json();
    route();
  } catch (err) {
    $app.innerHTML = `<p>Die Lerndaten konnten nicht geladen werden. Bitte einmal mit Internet öffnen.</p>`;
  }
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
