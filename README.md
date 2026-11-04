# PaukBär – Lernkarten Master WI

Kostenlose Karteikarten-Web-App (PWA) fürs Studium. Läuft offline und lässt sich auf dem iPhone über Safari → Teilen → „Zum Home-Bildschirm“ installieren.

- **Fächer** stehen in `data/faecher.json`, die Karten pro Fach in `data/<fach>.json`.
- **Lernfortschritt** wird nur lokal im Browser gespeichert (localStorage).
- **PaukBär:** Sein Trainingsfortschritt steigt pro Lerntag (Tagesziel: 10 Karten) um 1, bis er nach 22 Tagen voll entwickelt ist. Ein verpasster Tag kostet 3 (nicht unter 0), danach 1 pro Tag bis -10 (dann ist er krank). Dazu gibt es eine goldene Sonnenbrille bei der Hälfte grüner Pakete und eine Goldkette, wenn alle Pakete grün sind. 

Ein neues Fach anlegen: eine neue JSON-Datei nach dem Muster von `data/logistik.json` anlegen und in `data/faecher.json` eintragen.
