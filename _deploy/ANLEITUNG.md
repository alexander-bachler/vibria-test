# VIBRIA Website – Deployment-Anleitung für World 4 You

**Erstellt:** März 2026  
**Betreiber:** VIBRIA | Kunst- und Kulturverein  
**Hosting:** World 4 You (world4you.com)

---

## Inhalt dieses Ordners (`_deploy/`)

| Datei | Beschreibung |
|---|---|
| `ANLEITUNG.md` | Diese Anleitung |
| `vibria_setup.sql` | MySQL-Script: legt alle Tabellen an und befüllt sie mit Ausgangsdaten |

---

## Voraussetzungen

- World 4 You Hosting-Paket mit **PHP 8.1 oder höher** und **MySQL**
- Zugang zum **World 4 You Control Panel** (my.world4you.com)
- **FTP-Zugangsdaten** (Host, Benutzer, Passwort) aus dem Control Panel
- **FTP-Programm** auf dem eigenen Computer installiert, z. B. **FileZilla** (kostenlos: filezilla-project.org)

---

## Übersicht: Was muss gemacht werden?

1. Datenbank im Control Panel anlegen
2. Konfigurationsdatei mit DB-Zugangsdaten ausfüllen
3. MySQL-Script in phpMyAdmin ausführen
4. Dateien via FTP hochladen
5. Berechtigungen prüfen
6. Website testen und Admin-Passwort ändern

---

## Schritt 1 – Datenbank anlegen (World 4 You Control Panel)

1. Unter **my.world4you.com** einloggen
2. Das gewünschte Hosting-Paket auswählen
3. Im Menü auf **„Datenbanken"** → **„MySQL"** klicken
4. **„Neue Datenbank erstellen"** klicken
5. Einen Namen eingeben, z. B. `vibria`
6. Einen **Datenbankbenutzer** anlegen und ein sicheres Passwort vergeben
7. Den Benutzer der Datenbank zuweisen

> **Hinweis zu Präfixen:** World 4 You stellt automatisch die Kunden-ID als Präfix voran.  
> Aus `vibria` wird z. B. `w00123456_vibria` – der vollständige Name wird nach der Erstellung angezeigt.  
> Notiere dir: **vollständiger Datenbankname**, **vollständiger Benutzername** und **Passwort**.

---

## Schritt 2 – Konfigurationsdatei ausfüllen

> **Diese Datei muss VOR dem FTP-Upload ausgefüllt werden!**

Die Datei befindet sich im Projekt unter:

```
api/config/settings.local.php
```

Öffne sie in einem Texteditor (z. B. Notepad++, VS Code) und ersetze die Platzhalter:

```php
'db' => [
    'host' => 'localhost',                      // bei W4Y immer: localhost
    'name' => 'w00123456_vibria',               // ← vollständiger Datenbankname (aus Schritt 1)
    'user' => 'w00123456_vibria',               // ← vollständiger Benutzername (aus Schritt 1)
    'pass' => 'DEIN_DB_PASSWORT',               // ← gewähltes Datenbankpasswort
],
'jwt_secret' => 'LANGER_ZUFAELLIGER_STRING',    // ← mind. 32 beliebige Zeichen (kein Leerzeichen)
'upload_path' => '/www/htdocs/w00123456/html/uploads',  // ← absoluter Pfad (siehe unten)
```

### Webroot-Pfad herausfinden

Den absoluten Pfad zum Webroot findest du im World 4 You Control Panel unter  
**„FTP"** → **„FTP-Zugangsdaten"** oder im **Dateimanager**.

Bei World 4 You ist der Webroot typischerweise:

```
/www/htdocs/w00123456/html/
```

Ersetze `w00123456` durch deine eigene Kunden-ID. Der `upload_path` ist dann:

```
/www/htdocs/w00123456/html/uploads
```

### JWT-Secret generieren

Trage hier einen langen, zufälligen String ein. Beispiel (einfach abändern):

```
xK9mP2vQ8rL5nT3wA7jB4dF6hC1eN0sUgY2pX
```

---

## Schritt 3 – MySQL-Datenbank einrichten (phpMyAdmin)

Das Script `_deploy/vibria_setup.sql` legt alle notwendigen Tabellen an und befüllt sie mit den Ausgangsdaten (Veranstaltungen, Vorstand, Künstler, Galerie) sowie dem ersten Admin-Benutzer.

1. Im World 4 You Control Panel → **„Datenbanken"** → **„phpMyAdmin"** öffnen
2. Auf der linken Seite die neu angelegte Datenbank anklicken (z. B. `w00123456_vibria`)
3. Im oberen Menü auf den Tab **„Importieren"** klicken
4. Unter **„Datei importieren"** → **„Durchsuchen"** klicken
5. Die Datei **`_deploy/vibria_setup.sql`** aus dem Projektordner auswählen
6. Ganz unten auf **„OK"** (oder „Ausführen") klicken
7. Nach erfolgreichem Import erscheint die Meldung: *„Import wurde erfolgreich beendet"*

> **Was macht das Script?** Es legt die Tabellen `events`, `artists`, `board_members`, `gallery_images`, `reservations`, `contact_messages` und `users` an. Anschließend werden alle Ausgangsdaten eingespielt: 29 Veranstaltungen (Archiv + kommende), 5 Vorstandsmitglieder, 30 Künstler, Galeriebilder und ein Admin-Benutzer.

---

## Schritt 4 – Dateien via FTP hochladen

### FTP-Verbindung herstellen (FileZilla)

1. FileZilla öffnen
2. Im oberen Bereich eintragen:
   - **Host:** FTP-Hostname aus dem W4Y Control Panel (z. B. `ftp.world4you.com` oder ein serverspezifischer Name)
   - **Benutzername:** FTP-Benutzername aus dem Control Panel
   - **Passwort:** FTP-Passwort
   - **Port:** `21`
3. Auf **„Verbinden"** klicken

### Versteckte Dateien anzeigen (wichtig!)

Die Datei `.htaccess` ist eine versteckte Datei. Sie muss unbedingt hochgeladen werden.  
In FileZilla: Menü **„Server"** → **„Versteckte Dateien anzeigen"** aktivieren.

### Was wird wohin hochgeladen?

Navigiere auf der rechten Seite (Server) in den Webroot (`/html/`).

| Lokale Quelle (auf deinem Computer) | Ziel auf dem Server |
|---|---|
| `dist/` – **Inhalt** (nicht den Ordner selbst!) | direkt in `/html/` |
| `api/` – ganzer Ordner | `/html/api/` |
| `uploads/` – ganzer Ordner | `/html/uploads/` |

> **Achtung bei `dist/`:** Den **Inhalt** des Ordners hochladen, nicht den Ordner `dist` selbst.  
> Richtig: `dist/index.html` landet als `/html/index.html`  
> Falsch wäre: `/html/dist/index.html`

### Vollständige Dateiliste

```
Lokal                              → Server (/html/)
──────────────────────────────────────────────────────
dist/.htaccess                     → /html/.htaccess          ← WICHTIG: versteckte Datei!
dist/index.html                    → /html/index.html
dist/assets/                       → /html/assets/
dist/images/                       → /html/images/
dist/favicon.ico                   → /html/favicon.ico
dist/robots.txt                    → /html/robots.txt
dist/placeholder.svg               → /html/placeholder.svg

api/                               → /html/api/
  api/config/settings.local.php    → /html/api/config/settings.local.php  ← AUSGEFÜLLT!
  api/config/settings.php          → /html/api/config/settings.php
  api/public/index.php             → /html/api/public/index.php
  api/public/.htaccess             → /html/api/public/.htaccess
  api/src/                         → /html/api/src/
  api/vendor/                      → /html/api/vendor/         ← PHP-Abhängigkeiten, komplett!
  api/composer.json                → /html/api/composer.json

uploads/                           → /html/uploads/
  uploads/board/                   → /html/uploads/board/      ← Vorstandsfotos
  uploads/gallery/                 → /html/uploads/gallery/    ← Galeriebilder
  uploads/home/                    → /html/uploads/home/       ← Startseiten-Bilder
  uploads/story/                   → /html/uploads/story/      ← Geschichte-Bilder
  uploads/events/                  → /html/uploads/events/     ← Eventfotos
  uploads/artists/                 → /html/uploads/artists/    ← Künstlerfotos
```

> **Hinweis zu `api/vendor/`:** Dieser Ordner enthält alle PHP-Bibliotheken und ist groß (~500 Dateien). Der Upload dauert einige Minuten. Nicht abbrechen!

---

## Schritt 5 – Verzeichnisberechtigungen setzen

Das `uploads/`-Verzeichnis muss vom Server beschreibbar sein, damit Bilder hochgeladen werden können.

In FileZilla:
1. Auf dem Server Rechtsklick auf den Ordner `uploads/`
2. **„Dateiberechtigungen..."** wählen
3. Wert `755` eingeben (oder Häkchen entsprechend setzen)
4. Häkchen setzen bei **„Rekursiv in Unterverzeichnisse anwenden"**
5. **„OK"** klicken

---

## Schritt 6 – Website testen

1. Website im Browser aufrufen (z. B. `https://vibria.art`)
2. Prüfen ob die Startseite korrekt lädt
3. Prüfen ob die Veranstaltungsseite Daten anzeigt
4. Prüfen ob Bilder (Galerie, Vorstand) sichtbar sind

---

## Admin-Oberfläche

### Zugang

Die Admin-Oberfläche ist erreichbar unter:

```
https://vibria.art/admin
```

### Erste Anmeldung

Nach dem Datenbankimport sind folgende Zugangsdaten gültig:

| Feld | Wert |
|---|---|
| **E-Mail** | `office@vibria.art` |
| **Passwort** | `vibria2024!` |

> **WICHTIG:** Das Passwort sofort nach dem ersten Login ändern!

### Passwort ändern

Nach dem Login:
1. Oben rechts auf **„Einstellungen"** oder das Benutzer-Symbol klicken
2. Neues, sicheres Passwort vergeben (mind. 12 Zeichen, Groß-/Kleinbuchstaben, Zahl, Sonderzeichen)
3. Speichern

### Was kann im Admin-Bereich gemacht werden?

| Bereich | Funktion |
|---|---|
| **Veranstaltungen** | Neue Events anlegen, bestehende bearbeiten, Eventfotos hochladen, Events veröffentlichen/verstecken |
| **Reservierungen** | Eingehende Sitzplatzreservierungen einsehen und verwalten |
| **Künstler** | Künstlerprofile anlegen, Fotos und Beschreibungen pflegen |
| **Vorstand** | Vorstandsmitglieder verwalten, Fotos und Biografien aktualisieren |
| **Galerie** | Galeriebilder hochladen und verwalten |
| **Nachrichten** | Über das Kontaktformular eingegangene Nachrichten lesen |

---

## Häufige Probleme

### „500 Internal Server Error" nach dem Upload
- Prüfen ob `api/config/settings.local.php` vorhanden **und vollständig ausgefüllt** ist (keine Platzhalter mehr)
- Prüfen ob PHP 8.1+ im Control Panel aktiviert ist (Menü „PHP-Version")
- Prüfen ob `api/public/.htaccess` hochgeladen wurde

### Veranstaltungen / Inhalte laden nicht (weiße Seite, leere Listen)
- Prüfen ob der Ordner `api/vendor/` **vollständig** hochgeladen wurde (nicht nur der leere Ordner)
- In phpMyAdmin prüfen ob die Tabellen im korrekten Datenbankschema vorhanden sind
- Datenbankname, Benutzer und Passwort in `settings.local.php` nochmals prüfen

### Bilder werden nicht angezeigt (kaputte Bild-Icons)
- Prüfen ob `uploads/` mit allen Unterordnern hochgeladen wurde
- Prüfen ob der `upload_path` in `settings.local.php` den **absoluten** Serverpfad enthält (nicht `/html/uploads` sondern `/www/htdocs/w00123456/html/uploads`)

### Seiten-Routing funktioniert nicht (404 bei direktem URL-Aufruf)
- Prüfen ob `.htaccess` im Webroot vorhanden ist (ist eine versteckte Datei – in FileZilla sichtbar machen!)
- Im W4Y Control Panel prüfen ob `mod_rewrite` aktiviert ist (unter „Apache Module")

### Login im Admin-Bereich funktioniert nicht
- Prüfen ob das SQL-Script korrekt ausgeführt wurde (in phpMyAdmin die Tabelle `users` aufrufen – dort muss ein Eintrag vorhanden sein)
- Prüfen ob die Uhrzeit auf dem Server korrekt eingestellt ist (betrifft JWT-Token-Gültigkeit)

---

## Serverstruktur nach dem Upload (Übersicht)

```
/www/htdocs/w00123456/html/        ← Webroot
│
├── .htaccess                      ← URL-Routing: leitet /api/* weiter, SPA-Fallback
├── index.html                     ← Einstiegspunkt der React-App
├── assets/                        ← Kompiliertes CSS und JavaScript
├── images/                        ← Statische Bilder (Logo etc.)
├── favicon.ico
├── robots.txt
│
├── api/                           ← PHP-Backend (REST-API mit Slim Framework 4)
│   ├── config/
│   │   ├── settings.php           ← Standard-Konfiguration (nicht ändern)
│   │   └── settings.local.php     ← Serverspezifische Werte ← HIER ZUGANGSDATEN!
│   ├── public/
│   │   ├── index.php              ← API-Einstiegspunkt (wird von .htaccess aufgerufen)
│   │   └── .htaccess              ← Slim-Routing intern
│   ├── src/                       ← PHP-Quellcode (Routes, Models, Middleware)
│   ├── vendor/                    ← PHP-Bibliotheken (Slim, JWT, Image-Verarbeitung)
│   └── migrations/                ← SQL-Referenzdateien (nicht nochmals ausführen!)
│
└── uploads/                       ← Alle hochgeladenen Dateien (muss beschreibbar sein!)
    ├── events/                    ← Eventfotos (werden im Admin hochgeladen)
    ├── artists/                   ← Künstlerfotos
    ├── board/                     ← Vorstandsfotos (adria.jpg, carlos.jpg, ester.jpg, ily.jpg, tom.jpg)
    ├── gallery/                   ← Galeriebilder (raum-001.jpg … raum-014.jpg, eingang-*.jpg)
    ├── home/                      ← Startseiten-Bilder (Samen-3er-logo.jpg, Samen-3er-only.jpg)
    └── story/                     ← Bild der VIBRIA-Geschichte (vibria-drac.jpg)
```

---

## Kontakt / Support

Bei Fragen zur Website-Konfiguration: Technischer Ansprechpartner des VIBRIA-Vereins.  
Bei Fragen zum Hosting: World 4 You Support unter [world4you.com/support](https://www.world4you.com/support)
