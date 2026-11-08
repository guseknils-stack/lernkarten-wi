# PaukBär – Lernkarten Master WI

Kostenlose Karteikarten-Web-App (PWA) fürs Studium. Läuft offline und lässt sich auf dem iPhone über Safari → Teilen → „Zum Home-Bildschirm“ installieren.

- **Fächer** stehen in `data/faecher.json`, die Karten pro Fach in `data/<fach>.json`.
- **Lernfortschritt** wird nur lokal im Browser gespeichert (localStorage).
- **PaukBär:** Sein Trainingsfortschritt steigt pro Trainingstag (Tagesziel: 10 richtig beantwortete Karten) um 1, bis er nach 22 Tagen voll entwickelt ist. Ein verpasster Tag kostet 3 (nicht unter 0), danach 1 pro Tag bis -10 (dann ist er krank). Dazu gibt es eine goldene Sonnenbrille bei der Hälfte grüner Pakete und eine Goldkette, wenn alle Pakete grün sind. Der **Trainingskalender** zeigt trainierte und verpasste Tage.
- **Schwerpunkte und Fehler-Test:** Falsche Begriffe kommen in den Karteikarten öfter dran, die Seite „Schwerpunkte“ listet sie pro Paket, der Fehler-Test fragt nur sie ab.
- **Bilder** sind in `bilder.js` als SVG gezeichnet. Eine Karte zeigt ein Bild, wenn sie das Feld `bild` hat.
- **Karten** haben optional ein Feld `frage` (was vorne steht, z. B. nur die Abkürzung) und `mc` (schwere Wissensfrage: `frage`, `optionen` mit der richtigen Antwort an erster Stelle, `erklaerung`).

Ein neues Fach anlegen: eine neue JSON-Datei nach dem Muster von `data/logistik.json` anlegen und in `data/faecher.json` eintragen.
