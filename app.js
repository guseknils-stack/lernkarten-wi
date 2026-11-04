// PaukBär – Hauptlogik der App.
// Enthält: Speicher (Lernfortschritt auf dem Gerät), Bär-Zustand, alle Ansichten
// (Startseite, Fach, Paket, Karteikarten, Quiz, Probetest) und die Navigation.

import { baerSVG } from "./bear.js";

// ---------- Einstellungen ----------
const TAGESZIEL = 10;        // so viele Antworten pro Tag zählen als "gelernt"
const FORTSCHRITT_MAX = 22;  // so viele Lerntage, bis der Bär voll entwickelt ist
const FORTSCHRITT_MIN = -10; // tiefster Stand: Bär ist richtig krank
const MINUS_POSITIV = 3;     // verpasster Tag, solange der Fortschritt über 0 ist
const MINUS_NEGATIV = 1;     // verpasster Tag, wenn der Fortschritt schon bei 0 oder darunter ist
const PROBETEST_FRAGEN = 20;
const PROBETEST_MINUTEN = 20;
const SPEICHER = "paukbaer-v1";

// ---------- Speicher (nur auf diesem Gerät) ----------
function laden() {
  try { return JSON.parse(localStorage.getItem(SPEICHER)) || {}; } catch { return {}; }
}
let S = Object.assign({ karten: {}, tage: {}, tests: [] }, laden());
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
  speichern();
}

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
// Berechnet den Zustand des Bären aus allen Lerntagen: Trainingsfortschritt, Stimmung, Serie, Ausstattung
function baerZustand(daten) {
  const t = heute();
  const gelernt = Object.keys(S.tage).filter((d) => S.tage[d] >= TAGESZIEL).sort();
  // Trainingsfortschritt: +1 pro Lerntag (bis 22). Verpasster Tag: -3, solange er über 0 ist
  // (aber nicht unter 0), danach -1 pro Tag bis -10. Der heutige Tag zählt erst als verpasst, wenn er vorbei ist.
  let fortschritt = 0;
  if (gelernt.length) {
    for (let d = gelernt[0]; d <= t; d = plusTage(d, 1)) {
      if (S.tage[d] >= TAGESZIEL) fortschritt = Math.min(FORTSCHRITT_MAX, fortschritt + 1);
      else if (d !== t) fortschritt = fortschritt > 0 ? Math.max(0, fortschritt - MINUS_POSITIV) : Math.max(FORTSCHRITT_MIN, fortschritt - MINUS_NEGATIV);
    }
  }
  const letzter = gelernt[gelernt.length - 1];
  const pause = letzter ? tageZwischen(letzter, t) : 0; // 0 = heute gelernt, 1 = gestern
  // Stimmung: unter 0 wird er Schritt für Schritt kränker. Über 0 wird er nur müde, wenn gestern nicht gelernt wurde.
  const stimmung = fortschritt <= -7 ? "krank" : fortschritt <= -4 ? "zerzaust" : fortschritt <= -1 ? "muede"
    : (letzter && pause >= 2) ? "muede" : "fit";
  // Serie: zusammenhängende Lerntage bis heute oder gestern
  let serie = 0;
  if (letzter && pause <= 1) { for (let d = letzter; S.tage[d] >= TAGESZIEL; d = plusTage(d, -1)) serie++; }
  const gruen = daten ? daten.pakete.filter((p) => ampel(daten, p) === "gruen").length : 0;
  const n = daten ? daten.pakete.length : 1;
  // Für die Zeichnung: Fortschritt 0–22 auf Muskelstufe 0–10 umrechnen
  const muskeln = Math.max(0, fortschritt) * 10 / FORTSCHRITT_MAX;
  return { fortschritt, muskeln, stimmung, serie, pause, brille: gruen >= Math.ceil(n / 2), kette: gruen === n, gruen, n, heuteAntworten: S.tage[t] || 0 };
}

// Der Satz unter dem Bären, passend zu seinem Zustand
function baerText(z) {
  if (z.stimmung === "krank") return "Dein Bär ist krank vor Faulheit. Lern heute, dann wird er wieder fit! 🤒";
  if (z.stimmung === "zerzaust") return "Zu lange kein Training … er sieht ziemlich zerzaust aus.";
  if (z.stimmung === "muede") return z.fortschritt < 0 ? "Er wird schlapp. Trainier heute, damit er wieder fit wird." : "Er wird müde. Gestern wurde nicht trainiert.";
  if (z.kette) return "Voll ausgestattet: Muskeln, Ray-Ban und Goldkette. 💪😎";
  if (z.brille) return "Halbzeit geschafft: Die goldene Ray-Ban sitzt! 😎";
  if (z.fortschritt >= FORTSCHRITT_MAX) return "Voll entwickelt! 22 Tage Training haben sich gelohnt. 🏆";
  if (z.heuteAntworten >= TAGESZIEL) return "Heute trainiert! Der Trainingsfortschritt steigt.";
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
  const ziel = Math.min(100, Math.round((z.heuteAntworten / TAGESZIEL) * 100));
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
      <div class="leise">Tagesziel: ${Math.min(z.heuteAntworten, TAGESZIEL)} von ${TAGESZIEL} Karten</div>
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
  const letzte = S.tests.filter((t) => t.fach === id).slice(-1)[0];
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
      ${ks.map((k) => `<div class="paket" style="padding:6px 0"><span class="ampel ${stufe(id, k.nr) >= 2 ? "gruen" : gesehen(id, k.nr) ? "gelb" : "rot"}"></span><span class="info">${esc(k.begriff)}</span></div>`).join("")}
    </section>
    <p class="leise">Grün wird eine Karte, wenn du sie zweimal mehr richtig als falsch hattest. Die Reihenfolge wird bei jeder Runde neu gemischt.</p>
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
// Nicht gewusste Karten kommen am Ende der Runde nochmal. Das Symbol erscheint erst bei der Lösung,
// weil es sonst bei Abkürzungen einen Hinweis geben würde.
function karteikarten(id, nr) {
  fachLaden(id).then((d) => {
    const p = d.pakete.find((x) => x.nr === +nr);
    let stapel = mischen(paketKarten(d, p));
    const nochmal = new Set();
    let pos = 0, richtig = 0, gesamt = 0;

    // Lösungsteil der Karte (wird nach dem Umdrehen oder Prüfen gezeigt)
    const loesung = (k) => `<div class="antwort">
        <div class="gross" style="text-align:center">${k.symbol}</div>
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
        <div class="fortschritt">Karte ${pos + 1} von ${stapel.length}</div>
        <section class="feld karteikarte">
          <div class="begriff">${esc(k.begriff)}</div>
          ${zustand === "geprueft" ? `<div class="urteil ${urteil ? "ok" : "nok"}">${urteil ? "✅ Richtig!" : "❌ Nicht ganz."}<br><span class="leise">Deine Antwort: ${esc(eingabe)}</span></div>` : ""}
          ${zustand === "frage" ? `<p class="leise">Erst überlegen, dann eintippen oder umdrehen.</p>` : loesung(k)}
        </section>
        ${unten}
      `);

      // Antwort verbuchen und zur nächsten Karte
      const weiter = (gewusst) => {
        verbuchen(id, k.nr, gewusst); gesamt++;
        if (gewusst) richtig++; else if (!nochmal.has(k.nr)) { nochmal.add(k.nr); stapel.push(k); }
        pos++;
        pos < stapel.length ? karte() : ende();
      };

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

    const ende = () => zeige(`
      ${kopf("Runde geschafft! 🎉", `paket/${id}/${nr}`)}
      <section class="feld" style="text-align:center">
        <div class="ergebnis">${richtig}/${gesamt}</div>
        <p>Antworten gewusst. Ampel jetzt: ${{ rot: "🔴", gelb: "🟡", gruen: "🟢" }[ampel(d, p)]}</p>
      </section>
      <button class="knopf" data-los="karten/${id}/${nr}">Neue Runde (neu gemischt)</button>
      <div class="abstand"></div>
      <button class="knopf zweit" data-los="quiz/${id}/${nr}">Jetzt das Quiz</button>
      <div class="abstand"></div>
      <button class="knopf zweit" data-los="start">Zum Bären</button>
    `);
    karte();
  });
}

// Multiple-Choice-Frage bauen: richtige Antwort + 3 falsche aus derselben Kategorie
function frageBauen(d, k) {
  const andere = mischen(d.karten.filter((x) => x.nr !== k.nr && x.kategorie === k.kategorie && x.antwort !== k.antwort)).slice(0, 3);
  return { karte: k, optionen: mischen([k, ...andere]) };
}

function quiz(id, nr) {
  fachLaden(id).then((d) => {
    const p = d.pakete.find((x) => x.nr === +nr);
    const fragen = mischen(paketKarten(d, p)).map((k) => frageBauen(d, k));
    let pos = 0, richtig = 0;
    const frage = (gewaehlt) => {
      const f = fragen[pos], beantwortet = gewaehlt !== undefined;
      zeige(`
        ${kopf(`Paket ${p.nr} · Quiz`, `paket/${id}/${nr}`)}
        <div class="fortschritt">Frage ${pos + 1} von ${fragen.length} · ${richtig} richtig</div>
        <section class="feld"><div class="leise">Was bedeutet …</div><h2>${beantwortet ? f.karte.symbol + " " : ""}${esc(f.karte.begriff)}?</h2></section>
        ${f.optionen.map((o, i) => {
          let kl = "";
          if (beantwortet) kl = o.nr === f.karte.nr ? "richtig" : i === gewaehlt ? "falsch" : "";
          return `<button class="option ${kl}" data-i="${i}" ${beantwortet ? "disabled" : ""}>${"ABCD"[i]}) ${esc(o.antwort)}</button>`;
        }).join("")}
        ${beantwortet ? `<section class="feld">
            <b>${f.optionen[gewaehlt].nr === f.karte.nr ? "✅ Richtig!" : "❌ Leider falsch."}</b>
            <p>${esc(f.karte.erklaerung)}</p>
            <div class="quelle">Quelle: ${mitLinks(f.karte.quelle)}</div>
          </section>
          <button class="knopf" id="weiter">${pos + 1 < fragen.length ? "Weiter" : "Auswertung"}</button>` : ""}
      `);
      if (!beantwortet) {
        document.querySelectorAll(".option").forEach((b) => (b.onclick = () => {
          const i = +b.dataset.i, ok = f.optionen[i].nr === f.karte.nr;
          verbuchen(id, f.karte.nr, ok); if (ok) richtig++;
          frage(i);
        }));
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

// Probetest: zufällige Fragen aus allen Paketen, mit Zeitlimit, Auswertung erst am Ende
function probetest(id) {
  fachLaden(id).then((d) => {
    const fragen = mischen(d.karten).slice(0, PROBETEST_FRAGEN).map((k) => frageBauen(d, k));
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
        ${kopf("Probetest", `fach/${id}`)}
        <div class="fortschritt">Frage ${pos + 1} von ${fragen.length} · ⏱️ <span class="timer" id="uhr"></span></div>
        <section class="feld"><div class="leise">Was bedeutet …</div><h2>${esc(f.karte.begriff)}?</h2></section>
        ${f.optionen.map((o, i) => `<button class="option" data-i="${i}">${"ABCD"[i]}) ${esc(o.antwort)}</button>`).join("")}
      `);
      uhr(); aktiveUhr = setInterval(uhr, 1000);
      document.querySelectorAll(".option").forEach((b) => (b.onclick = () => {
        antworten[pos] = +b.dataset.i; pos++;
        pos < fragen.length ? frage() : ende(false);
      }));
    };
    const ende = (zeitUm) => {
      const fehler = [];
      let richtig = 0;
      fragen.forEach((f, i) => {
        if (antworten[i] === undefined) { fehler.push({ f, gewaehlt: null }); return; }
        const ok = f.optionen[antworten[i]].nr === f.karte.nr;
        verbuchen(id, f.karte.nr, ok);
        ok ? richtig++ : fehler.push({ f, gewaehlt: f.optionen[antworten[i]] });
      });
      S.tests.push({ fach: id, datum: Date.now(), richtig, gesamt: fragen.length }); speichern();
      const quote = Math.round((richtig / fragen.length) * 100);
      zeige(`
        ${kopf("Probetest – Ergebnis", `fach/${id}`)}
        <section class="feld" style="text-align:center">
          ${zeitUm ? `<p><b>⏰ Die Zeit ist abgelaufen.</b></p>` : ""}
          <div class="ergebnis">${quote}%</div>
          <p>${richtig} von ${fragen.length} richtig. ${quote >= 90 ? "Stark, du bist bereit! 🏆" : quote >= 70 ? "Gut! Die Fehler unten noch einmal ansehen." : "Da geht noch was. Lern die Pakete mit gelber Ampel weiter."}</p>
        </section>
        ${fehler.length ? `<section class="feld"><h3>Das solltest du wiederholen</h3><ul class="fehler">
          ${fehler.map(({ f, gewaehlt }) => `<li><b>${esc(f.karte.begriff)}</b>: ${esc(f.karte.antwort)}${gewaehlt ? `<br><span class="leise">Deine Antwort: ${esc(gewaehlt.antwort)}</span>` : `<br><span class="leise">nicht beantwortet</span>`}</li>`).join("")}
        </ul></section>` : ""}
        <button class="knopf" data-los="probetest/${id}">Neuer Probetest</button>
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
     quiz: () => quiz(a, b), probetest: () => probetest(a) }[seite] || startseite)();
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
