# Baukasten 3D

Modelle aus Klemmbausteinen direkt im Browser bauen. Ein Projekt von [mosaik](https://apps.mosaik-design.at/).

## Funktionen

- 205 Teile in 15 Kategorien, Suche und „Zuletzt verwendet"
- Ritter-Erweiterung: Burgmauern, Türme, Burgtor mit Fallgitter, Zugbrücke, Wehrgang, Fachwerk, Palisade, Katapult, Thron; Dorf & Markt (Brunnen, Marktstand, Zelt, Karren, Fässer …); Ritter, König, Burgfräulein, Bogenschütze, Zauberer, Wache, Bauer, Pferde, Ritter zu Pferd, Drachen, Tiere; Landschaft (Hänge, Felsen, Pflaster, Wasser, Schilf, Eiche …)
- Grundplatte von 16 × 16 bis 128 × 128 für ganze Landschaften, Größe beim Anlegen wählbar
- 34 Farben (Standard, Transparent, Metall, Leuchtend) plus eigene Farben
- Teile rasten ein, stapeln sich automatisch und überlappen nie
- Werkzeuge: Bauen, Auswählen (verschieben, drehen, duplizieren, löschen), Pipette, Färben, Entfernen
- Drehen in 90°- und 45°-Schritten, Kopieren und Einfügen ganzer Gruppen
- Rückgängig / Wiederholen (300 Schritte)
- Mehrere Modelle mit Vorschaubild, automatisch im Browser gespeichert
- Elf Vorlagen, darunter vier fertige Burgen (Ritterburg mit Dorf auf 64 × 64, Wasserburg, Märchenschloss, Palisadenfort), Bauanleitung Schritt für Schritt, Stückliste (Ansicht, CSV, Druck)
- Export als Datei (JSON) und Bild (PNG); Import auch von Dateien der Vorgängerversion
- Ebenen-Regler zum Ausblenden oberer Lagen
- Touch-Bedienung mit Bottom-Sheets am Smartphone
- Offline nutzbar (Service Worker), als App installierbar

## Datenschutz

Keine externen Anfragen: Grafikbibliothek (three.js, MIT-Lizenz) und Schrift (DM Sans, OFL) liegen im Projekt.
Modelle bleiben im `localStorage` des Browsers. Keine Cookies, kein Tracking.

## Aufbau

```
index.html               Grundgerüst
assets/style.css         Gestaltung
assets/js/app.js         Steuerung, Oberfläche, Dialoge
assets/js/scene.js       3D-Szene, Instanz-Rendering, Treffererkennung
assets/js/model.js       Datenmodell, Kollision, Verlauf, Gruppen
assets/js/catalog.js     Teile, Farben, Geometrie je Teil
assets/js/parts-extra.js Ritter-Erweiterung, Landschaft, weitere Standardteile
assets/js/geom.js        Geometrie-Helfer
assets/js/storage.js     Speichern, Dateiformat, Übernahme alter Modelle
assets/js/templates.js   Vorlagen
assets/js/thumbs.js      Vorschaubilder
vendor/                  three.js r170 (unverändert, nur Importpfade angepasst)
sw.js                    Offline-Cache
_headers                 Sicherheits-Header für Cloudflare Pages
docs/                    Titelbild, Screenshots, Grafik-Prompts
```

Kein Build-Schritt nötig. Lokal testen: `python -m http.server` im Projektordner, dann `http://localhost:8000`.

## Neues Teil hinzufügen

In `catalog.js` eine Bau-Funktion schreiben und mit `def(id, name, kategorie, [breite, tiefe, höhe_in_platten], funktion)` registrieren.
Breite = X, Tiefe = Z, Ursprung unten in der Mitte. Eine Platte ist 0,4 Einheiten hoch, ein Stein drei Platten.

## Lizenzen

- three.js © three.js authors, MIT-Lizenz
- DM Sans © The DM Sans Project Authors, SIL Open Font License 1.1
