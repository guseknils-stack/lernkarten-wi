# Änderungsprotokoll

Neueste Änderungen stehen oben.

## 2026-11-04 – Tipp-Modus und keine Symbole als Hinweis
- `app.js`: Bei den Karteikarten kann man die Antwort jetzt eintippen und auf „Prüfen“ tippen. Die App bewertet selbst (neue Funktion `bewerten`: erlaubt kleine Tippfehler und vergleicht Schlüsselwörter). Mit „Ich lag doch richtig/falsch“ kann man das Urteil korrigieren. Wer nicht tippen will, tippt wie bisher auf „Umdrehen“ und bewertet sich selbst.
- `app.js`: Die Symbole (z. B. 🧺) erscheinen erst bei der Lösung, nicht mehr auf der Vorderseite, in der Quizfrage oder in der Paketliste.
- `style.css`: Stil für das Eingabefeld und das Urteil.
- `sw.js`: Cache-Version auf v4.
- Warum: Symbole gaben bei Abkürzungen Hinweise auf die Lösung. Das Eintippen trainiert aktives Erinnern, was beim Lernen mehr bringt als nur Wiedererkennen.

## 2026-11-04 – Regeln für nachvollziehbaren Code
- `CLAUDE.md` mit Code-Regeln angelegt (deutsche Kommentare, Datei-Kopfkommentare, Änderungsprotokoll).
- Jede Datei hat jetzt einen Kopfkommentar, der erklärt, wofür sie da ist.
- Warum: Nils und andere sollen den Code auch später nachvollziehen können.

## 2026-11-04 – Bär neu gezeichnet
- `bear.js`: weichere Formen, Schattierung (Farbverläufe), Brustmuskeln, Sixpack, Bizeps-Pose ab 4 Muskeln.
- Kranker Bär: Thermometer entfernt (sah wie eine Zigarette aus), stattdessen 🤒.
- `sw.js`: Cache-Version auf v2, damit das Update auf dem Handy ankommt.

## 2026-11-04 – Version 1
- Startseite mit PaukBär (Muskeln, Sonnenbrille, Goldkette, Stimmungen), Tages-Serie und Fächer-Buttons.
- Logistik: 92 Begriffe in 9 Paketen, Karteikarten (gemischt), Quiz mit Erklärung, Ampel pro Paket, Probetest (20 Fragen, 20 Min).
- Offline-Funktion und Home-Bildschirm-Symbol.
