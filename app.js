import { baerSVG } from "./bear.js";

// ---------- Einstellungen ----------
const TAGESZIEL = 10;        // so viele Antworten pro Tag zählen als "gelernt"
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
function baerZustand(daten) {
  const t = heute();
  const gelernt = Object.keys(S.tage).filter((d) => S.tage[d] >= TAGESZIEL).sort();
  // Muskeln: +1 pro Lerntag, ab dem 2. verpassten Tag in Folge -1 pro Tag
  let muskeln = 0, verpasst = 0;
  if (gelernt.length) {
    for (let d = gelernt[0]; d <= t; d = plusTage(d, 1)) {
      if (S.tage[d] >= TAGESZIEL) { muskeln = Math.min(10, muskeln + 1); verpasst = 0; }
      else if (d !== t) { verpasst++; if (verpasst >= 2) muskeln = Math.max(0, muskeln - 1); }
    }
  }
  const letzter = gelernt[gelernt.length - 1];
  const pause = letzter ? tageZwischen(letzter, t) : 0; // 0 = heute gelernt, 1 = gestern
  const stimmung = !letzter ? "fit" : pause <= 1 ? "fit" : pause === 2 ? "muede" : pause === 3 ? "zerzaust" : "krank";
  // Serie: zusammenhängende Lerntage bis heute oder gestern
  let serie = 0;
  if (letzter && pause <= 1) { for (let d = letzter; S.tage[d] >= TAGESZIEL; d = plusTage(d, -1)) serie++; }
  const gruen = daten ? daten.pakete.filter((p) => ampel(daten, p) === "gruen").length : 0;
  const n = daten ? daten.pakete.length : 1;
  return { muskeln, stimmung, serie, pause, brille: gruen >= Math.ceil(n / 2), kette: gruen === n, gruen, n, heuteAntworten: S.tage[t] || 0 };
}
function baerText(z) {
  if (z.stimmung === "krank") return "Dein Bär ist krank vor Faulheit. Lern heute, dann wird er wieder fit! 🤒";
  if (z.stimmung === "zerzaust") return "Drei Tage ohne Training … er sieht ziemlich zerzaust aus.";
  if (z.stimmung === "muede") return "Er wird müde. Gestern wurde nicht trainiert.";
  if (z.kette) return "Voll ausgestattet: Muskeln, Ray-Ban und Goldkette. 💪😎";
  if (z.brille) return "Halbzeit geschafft: Die goldene Ray-Ban sitzt! 😎";
  if (z.heuteAntworten >= TAGESZIEL) return "Heute trainiert! Morgen gibt's mehr Muskeln.";
  if (z.muskeln === 0) return "Hi, ich bin dein PaukBär. Trainier mit mir!";
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
        <div><b>💪 ${z.muskeln}/10</b><span class="leise">Muskeln</span></div>
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
      ${ks.map((k) => `<div class="paket" style="padding:6px 0"><span class="ampel ${stufe(id, k.nr) >= 2 ? "gruen" : gesehen(id, k.nr) ? "gelb" : "rot"}"></span><span class="info">${k.symbol} ${esc(k.begriff)}</span></div>`).join("")}
    </section>
    <p class="leise">Grün wird eine Karte, wenn du sie zweimal mehr richtig als falsch hattest. Die Reihenfolge wird bei jeder Runde neu gemischt.</p>
  `);
}

// Karteikarten: mischen, raten, umdrehen, selbst bewerten. Nicht gewusste kommen am Ende nochmal.
function karteikarten(id, nr) {
  fachLaden(id).then((d) => {
    const p = d.pakete.find((x) => x.nr === +nr);
    let stapel = mischen(paketKarten(d, p));
    const nochmal = new Set();
    let pos = 0, richtig = 0, gesamt = 0;
    const karte = (umgedreht) => {
      const k = stapel[pos];
      zeige(`
        ${kopf(`Paket ${p.nr} · Karteikarten`, `paket/${id}/${nr}`)}
        <div class="fortschritt">Karte ${pos + 1} von ${stapel.length}</div>
        <section class="feld karteikarte">
          <div class="gross">${k.symbol}</div>
          <div class="begriff">${esc(k.begriff)}</div>
          ${umgedreht ? `<div class="antwort">
              <div class="kurz">${esc(k.antwort)}</div>
              <div>${esc(k.erklaerung)}</div>
              ${k.in_folien !== "ja" ? `<span class="badge">${k.in_folien === "nein" ? "⚠️ nicht in den Folien" : "🔶 in den Folien nur erwähnt"}</span>` : ""}
              <div class="quelle">Quelle: ${mitLinks(k.quelle)}</div>
            </div>` : `<p class="leise">Erst überlegen, dann umdrehen.</p>`}
        </section>
        ${umgedreht
          ? `<div class="reihe"><button class="knopf rot" id="nein">Nicht gewusst</button><button class="knopf gruen" id="ja">Gewusst</button></div>`
          : `<button class="knopf" id="drehen">Umdrehen</button>`}
      `);
      if (!umgedreht) return (document.getElementById("drehen").onclick = () => karte(true));
      const weiter = (gewusst) => {
        verbuchen(id, k.nr, gewusst); gesamt++;
        if (gewusst) richtig++; else if (!nochmal.has(k.nr)) { nochmal.add(k.nr); stapel.push(k); }
        pos++;
        pos < stapel.length ? karte(false) : ende();
      };
      document.getElementById("ja").onclick = () => weiter(true);
      document.getElementById("nein").onclick = () => weiter(false);
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
    karte(false);
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
        <section class="feld"><div class="leise">Was bedeutet …</div><h2>${f.karte.symbol} ${esc(f.karte.begriff)}?</h2></section>
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
