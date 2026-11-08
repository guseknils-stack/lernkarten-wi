# Regeln für dieses Projekt (PaukBär)

Nils ist Programmier-Einsteiger. Der Code muss für ihn und für andere nachvollziehbar sein.

## Code-Stil
- **Sprache:** Kommentare, Variablen- und Funktionsnamen auf **Deutsch** (z. B. `verbuchen`, `paketKarten`). JavaScript-Befehle selbst bleiben englisch, das geht nicht anders.
- **Jede Datei** beginnt mit einem Kommentar: Wofür ist die Datei da?
- **Abschnitte** werden mit `// ---------- Name ----------` getrennt.
- **Jede Funktion** bekommt einen Kommentar darüber, der in einem Satz sagt, was sie tut. Nicht kommentieren, was offensichtlich ist, sondern *warum* etwas so gemacht ist.
- Einstellungen, die man ändern möchte (z. B. Tagesziel), stehen als Konstanten ganz oben in `app.js`.
- Kein Framework, keine Build-Schritte: reines HTML, CSS und JavaScript, damit GitHub Pages es direkt ausliefert.

## Änderungen dokumentieren
- Jede Änderung bekommt einen Eintrag in `CHANGELOG.md` (neueste oben): Datum, was, warum.
- Commit-Nachrichten auf Deutsch, erste Zeile sagt kurz, was sich geändert hat.
- Bei Änderungen an Dateien, die offline gecacht werden, die Version `CACHE` in `sw.js` hochzählen, damit das iPhone das Update lädt.

## Aufbau
- `index.html`: Grundgerüst der Seite
- `app.js`: gesamte Logik (Speicher, Bär-Zustand, Ansichten, Navigation)
- `bear.js`: zeichnet den Bären als SVG
- `bilder.js`: gezeichnete Bilder zu den Begriffen (SVG)
- `style.css`: Design
- `sw.js`: Offline-Funktion (Service Worker)
- `data/faecher.json`: Liste der Fächer; `data/<fach>.json`: Karten eines Fachs
