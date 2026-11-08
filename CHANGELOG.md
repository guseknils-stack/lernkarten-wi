# Änderungsprotokoll

Neueste Änderungen stehen oben.

## 2026-11-08 – Falsche Begriffe öfter, Schwerpunkte, Fehler-Test
- `app.js` Karteikarten: Begriffe, die schon einmal falsch waren und noch nicht grün sind, stecken zweimal im Stapel (zweites Mal in der zweiten Hälfte). Eine in der Runde falsch beantwortete Karte kommt nach 3 anderen Karten wieder (`NOCHMAL_ABSTAND`) und am Ende der Runde noch einmal.
- `app.js`: Neue Seite „Schwerpunkte“ (`#schwerpunkte/<fach>`): pro Paket alle Begriffe, die schon einmal falsch waren, mit Fehlerzahl, rot/grün und aufklappbarer Lösung.
- `app.js`: Neuer „Fehler-Test“ (`#probetest/<fach>/fehler`): wie der Probetest (Zeitlimit, gemischte Fragearten), aber nur mit den Begriffen mit der höchsten Fehlerquote (max. `FEHLERTEST_MAX` = 30).
- `app.js`: Fachseite mit Knöpfen zu Schwerpunkten und Fehler-Test und einem Lerntipp (jedes Paket einmal, dann weiter, später von vorne). Bei Bilderfragen steht in der Fehlerliste jetzt „Bild: Begriff“ statt einer leeren Zeile.
- `style.css`: Stil für die Schwerpunkte-Liste. `sw.js`: Cache-Version auf v13.
- Warum: Nils will Fehler gezielt wiederholen. Lernmethode: Spacing und Interleaving statt eine Gruppe dreimal direkt hintereinander.

## 2026-11-08 – Eigenschaftsfragen, Probetest mit 30 Fragen, Dunkelmodus
- `data/logistik.json`: Neues Feld `eigenschaften` bei 11 wichtigen Gegenständen (KLT, GiBo, Euro-Palette, Industriepalette, CHEP, 20'/40'-Container, Big Bag, IBC, EAN), insgesamt 18 Fragen zu Material, Maßen, Farbe, Aufbau oder Volumen. Die richtige Antwort steht an erster Stelle.
- `app.js`: Neuer Fragetyp `eigenschaft`. Im Quiz bekommen diese Gegenstände eine dritte Frage, im Probetest kommt sie per Zufall (Gewicht in `QUIZ_GEWICHTE`).
- `app.js`: `PROBETEST_FRAGEN` von 20 auf 30 (die Zeit bleibt 20 Minuten wie im echten Kurztest).
- `style.css`, `index.html`, `manifest.webmanifest`: Die App ist jetzt immer dunkel, egal wie das iPhone eingestellt ist. Knopftext dunkel auf hellgrün, damit er gut lesbar ist.
- `sw.js`: Cache-Version auf v11, dann v12 (Eigenschaften ohne Folienbeleg in der Erklärung markiert).
- Warum: Nils' Wünsche nach dem Vergleich mit der App eines Kommilitonen.

## 2026-11-08 – Gezeichnete Bilder und Bilderfrage
- Neue Datei `bilder.js`: 31 einfache, selbst gezeichnete SVG-Bilder für greifbare Begriffe (z. B. KLT, GLT, GiBo, Ameise, Container, Curtainsider, Cross-Docking, Milkrun). Jedes Bild zeigt nur die Merkmale, an denen man den Gegenstand erkennt, mit kurzer Beschriftung.
- `data/logistik.json`: Feld `bild` bei 31 Karten (Name aus `BILDER` in `bilder.js`). Abstrakte Begriffe (z. B. SLA, Forecast) haben bewusst kein Bild, weil ein Bild dort nichts erklären würde.
- `app.js`: Das Bild erscheint in der Lösung der Karteikarte und in der Erklärung nach jeder Quizfrage. Neuer Fragetyp „Was zeigt das Bild?“: Bild ohne Beschriftung (sonst stünde die Lösung drin), gesucht ist der Begriff.
- `style.css`: Stil `.bild`, und `.ohne-text .bt` blendet Beschriftungen aus.
- `sw.js`: `bilder.js` wird offline gespeichert, Cache-Version auf v10.
- Warum: Nils möchte Bilder, auf denen die wichtigsten Merkmale eindeutig zu erkennen sind, damit das Lernen leichter fällt.

## 2026-11-08 – Neue Fragetypen in Quiz und Probetest
- `data/logistik.json`: Jede Karte hat jetzt ein Feld `bereich` (ein oder mehrere Themenbereiche, z. B. „Ladungsträger & Verpackung“). Die Liste aller 10 Bereiche steht oben in `bereiche`.
- `app.js`: Drei neue Fragetypen: „Welcher Begriff passt?“ (Beschreibung gegeben, Begriff gesucht), „Themenbereich“ und „Kategorie in der Begriffsliste“ (Intralogistik / Logistik / SCM). Die umgekehrte Frage wird bei Brutto/Netto/Tara, HALB/INT und EAN weggelassen, weil die Antwort den Begriff verrät.
- `app.js`: `FRAGETYPEN` und `zufallsTyp()` wählen pro Karte zufällig eine Frageart. Wie oft welche Art kommt, steht oben in `QUIZ_GEWICHTE`. Quiz: pro Karte die Wissensfrage + eine zufällige andere Art. Probetest: eine zufällige Art pro Karte.
- `sw.js`: Cache-Version auf v9.
- Warum: Nils will verschiedene Fragestellungen wie im echten Test (Idee aus der App eines Kommilitonen).

## 2026-11-04 – Ameise-Frage korrigiert
- `data/logistik.json`, Karte 7: Die Wissensfrage fragte, was die Ameise „kann“. Das ist unsauber, weil man im Alltag auch den elektrischen Niederhubwagen (ohne Stapeln) „Ameise“ nennt. Neue Frage: Wie ordnet VL 7 die Ameise ein? (Stapelgerät, VL 7, S. 22 wörtlich). Hinweis auf den Alltagsgebrauch in Erklärung ergänzt.
- `sw.js`: Cache-Version auf v8.
- Warum: Nils hat die alte Frage zu Recht angezweifelt.

## 2026-11-04 – Wissensfragen, Trainingsziel mit richtigen Antworten, Trainingskalender
- `data/logistik.json`: 85 von 92 Karten haben jetzt eine schwere Multiple-Choice-Frage (Feld `mc`), gebaut aus den Folien und dem Skript (z. B. „Wie wird ein GLT bewegt?“, Rechenaufgaben zu TEU, Lademeter, OTIF). Bei 7 Begriffen (RM, FP, Senke, SC, Lead Time, Shelf life, End-to-End) gab es keine sinnvolle schwere Frage, sie bleiben ohne. Die richtige Antwort steht in der Datei an erster Stelle und wird in der App gemischt. Ich habe außerdem darauf geachtet, dass die richtige Antwort nicht fast immer die längste ist.
- `data/logistik.json`: Kitting (Nr. 11) steht doch ausführlich in den Folien (VL 8, S. 39). Quelle und Markierung korrigiert.
- `app.js` Karteikarten: Nach dem Tippen oder Umdrehen kommt als Teil 2 die Wissensfrage. Die Karte zählt nur als richtig, wenn beide Teile stimmen.
- `app.js` Quiz: pro Karte die Bedeutungsfrage und danach die Wissensfrage. Probetest: pro Karte zufällig eine der beiden Fragearten.
- `app.js`: Ein Trainingstag zählt jetzt erst ab 10 RICHTIG beantworteten Karten (neuer Speicher `richtigTage`). Auf der Startseite steht „Tägliches Trainingsziel: x von 10 Karten richtig“. Achtung: Richtige Antworten von vor diesem Update wurden nicht extra gespeichert, sie zählen deshalb nicht.
- `app.js` + `style.css`: Neue Seite „Trainingskalender“ (Knopf auf der Startseite): Monatskalender mit ✓ trainiert / ✗ verpasst, Stand x/22, wie viele Trainingstage bis zur Bestform fehlen, und eine Liste der letzten 14 Tage mit +1/−3/−1.
- `app.js`: Die Berechnung des Trainingsfortschritts steckt jetzt in `trainingsVerlauf()`, damit Bär und Kalender dieselbe Rechnung benutzen.
- `sw.js`: Cache-Version auf v7.
- Warum: Nils will schwierigere Fragen auf Test-Niveau, ein Trainingsziel, das nur mit richtigen Antworten zählt, und einen Überblick über seine Trainingstage.

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
