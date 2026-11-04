# Änderungsprotokoll

Neueste Änderungen stehen oben.

## 2026-11-04 – Abkürzungen ohne Langform auf der Karte
- `data/logistik.json`: Neues Feld `frage` = das, was auf der Vorderseite steht. Gesetzt bei 5 Karten, deren Begriff in Seifermanns Liste die Langform schon enthält: GiBo (6), lm / Ldm (34), HU (36), Safety Stock (80), OOS (83). Die Langform steht jetzt am Anfang der Antwort, damit man sie eintippen kann.
- `app.js`: Neue Hilfsfunktion `vorne(k)` nimmt `frage`, wenn vorhanden, sonst `begriff`. Sie wird überall genutzt, wo ein Begriff angezeigt wird (Paketliste, Karteikarte, Quiz, Probetest, Fehlerliste).
- `sw.js`: Cache-Version auf v6.
- Warum: Nils fiel bei „GiBo / Gitterbox“ auf, dass die Lösung schon auf der Karte steht.

## 2026-11-04 – Trainingsfortschritt statt Muskeln
- `app.js`: Anzeige heißt jetzt „Training“ mit Skala -10 bis 22 (vorher „Muskeln“ 0–10). +1 pro Lerntag, voll entwickelt nach 22 Lerntagen. Verpasster Tag: -3, solange der Wert über 0 ist (nicht unter 0), danach -1 pro Tag bis -10.
- `app.js`: Die Stimmung hängt jetzt am Fortschritt: -1 bis -3 müde, -4 bis -6 zerzaust, -7 bis -10 krank.
- Neue Einstellungen oben in `app.js`: `FORTSCHRITT_MAX`, `FORTSCHRITT_MIN`, `MINUS_POSITIV`, `MINUS_NEGATIV`.
- `bear.js`: Die Zeichnung bleibt bei 10 Stufen. app.js rechnet 0–22 darauf um, dadurch wächst der Bär in kleineren Schritten.
- `sw.js`: Cache-Version auf v5.
- Warum: Nils wollte kleinere Schritte über etwa einen Monat und eine spürbare, aber nicht zu harte Strafe (-3 als Mittelweg).

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
