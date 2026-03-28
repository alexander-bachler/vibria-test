# VIBRIA Website – Deployment-Anleitung für World 4 You

**Betreiber:** VIBRIA | Kunst- und Kulturverein  
**Hosting:** World 4 You (world4you.com)

---

## Was wird benötigt?

- Zugang zum **World 4 You Control Panel** (my.world4you.com)
- **FTP-Zugangsdaten** aus dem Control Panel
- **FTP-Programm**: z. B. FileZilla (kostenlos: filezilla-project.org)
- Das **Git-Repository** als ZIP heruntergeladen oder geklont

Das Repository enthält bereits den fertigen Build (`dist/`) und alle PHP-Bibliotheken (`api/vendor/`) – es muss lokal nichts installiert oder kompiliert werden.

---

## Schritt 1 – Datenbank anlegen

1. Unter **my.world4you.com** einloggen → Hosting-Paket auswählen
2. Menü: **„Datenbanken"** → **„MySQL"** → **„Neue Datenbank erstellen"**
3. Name eingeben (z. B. `vibria`), Datenbankbenutzer anlegen, Passwort vergeben
4. Benutzer der Datenbank zuweisen

> World 4 You stellt automatisch deine Kunden-ID als Präfix voran,  
> z. B. wird `vibria` zu `w00123456_vibria`.  
> Notiere dir: **Datenbankname**, **Benutzername** und **Passwort**.

---

## Schritt 2 – Konfigurationsdatei ausfüllen

Datei im Repository: **`api/config/settings.local.php`**

Öffne sie in einem Texteditor und trage die **vier Werte** ein:

```php
return [
    'db' => [
        'name' => 'w00123456_vibria',     // Datenbankname aus Schritt 1
        'user' => 'w00123456_vibria',     // Benutzername aus Schritt 1
        'pass' => 'DEIN_DB_PASSWORT',     // Passwort aus Schritt 1
    ],
    'jwt_secret' => 'LANGER_ZUFAELLIGER_STRING',  // beliebige Zeichenkette, mind. 32 Zeichen
];
```

Für `jwt_secret` einfach irgendeinen langen zufälligen Text eingeben, z. B.:  
`xK9mP2vQ8rL5nT3wA7jB4dF6hC1eN0sUgY2pX`

> Der Datenbankhost (`localhost`) und der Upload-Pfad werden automatisch erkannt – nichts weiteres nötig.

---

## Schritt 3 – Datenbank befüllen (phpMyAdmin)

Das Script **`_deploy/vibria_setup.sql`** legt alle Tabellen an und spielt die Ausgangsdaten ein (Veranstaltungen, Vorstand, Künstler, Galerie, Admin-Benutzer).

1. Im Control Panel: **„Datenbanken"** → **„phpMyAdmin"** öffnen
2. Links die Datenbank anklicken (z. B. `w00123456_vibria`)
3. Tab **„Importieren"** klicken
4. **„Durchsuchen"** → Datei `_deploy/vibria_setup.sql` auswählen
5. **„OK"** klicken → warten bis „Import wurde erfolgreich beendet" erscheint

---

## Schritt 4 – Dateien per FTP hochladen

### Verbindung herstellen (FileZilla)

FTP-Zugangsdaten aus dem W4Y Control Panel unter „FTP" entnehmen:
- **Host**, **Benutzername**, **Passwort**, **Port:** `21`

### Versteckte Dateien anzeigen

Die Datei `.htaccess` ist versteckt – sie muss unbedingt mitübertragen werden.  
In FileZilla: Menü **„Server"** → **„Versteckte Dateien anzeigen"** aktivieren.

### Was wird wohin hochgeladen?

| Lokale Quelle | Ziel auf dem Server |
|---|---|
| `dist/` – **Inhalt** (nicht den Ordner selbst) | direkt in den Webroot `/html/` |
| `api/` – ganzer Ordner | `/html/api/` |
| `uploads/` – ganzer Ordner | `/html/uploads/` |

> **Achtung bei `dist/`:** Den **Inhalt** des Ordners hochladen, nicht den Ordner selbst.  
> Richtig: `dist/index.html` → `/html/index.html`  
> Falsch: `/html/dist/index.html`

### Vollständige Dateiliste

```
Lokal                          → Server (/html/)
──────────────────────────────────────────────────────
dist/.htaccess                 → /html/.htaccess        ← versteckte Datei, unbedingt!
dist/index.html                → /html/index.html
dist/assets/                   → /html/assets/
dist/images/                   → /html/images/
dist/favicon.ico               → /html/favicon.ico
dist/robots.txt                → /html/robots.txt
dist/placeholder.svg           → /html/placeholder.svg

api/                           → /html/api/             ← inkl. vendor/ und config/!
  api/config/settings.local.php  ← ausgefüllte Datei aus Schritt 2

uploads/                       → /html/uploads/
  uploads/board/               → Vorstandsfotos
  uploads/gallery/             → Galeriebilder
  uploads/home/                → Startseiten-Bilder
  uploads/story/               → Geschichte-Bilder
  uploads/events/              → Eventfotos
  uploads/artists/             → Künstlerfotos (anfangs leer)
```

---

## Schritt 5 – Berechtigungen setzen

Der Ordner `uploads/` muss vom Server beschreibbar sein.

In FileZilla: Rechtsklick auf `uploads/` (Serverseite) → **„Dateiberechtigungen..."**  
→ Wert `755` eingeben → **„Rekursiv in Unterverzeichnisse anwenden"** anhaken → **OK**

---

## Schritt 6 – Testen und Admin-Passwort ändern

1. Website im Browser aufrufen (z. B. `https://vibria.art`)
2. Startseite, Veranstaltungen und Galerie prüfen

### Admin-Bereich

**URL:** `https://vibria.art/admin`

| | |
|---|---|
| **E-Mail** | `office@vibria.art` |
| **Passwort** | `vibria2024!` |

> **Passwort sofort nach dem ersten Login ändern!**  
> Im Admin: oben rechts auf das Benutzer-Symbol → **„Passwort ändern"**

### Was kann im Admin verwaltet werden?

| Bereich | Funktion |
|---|---|
| **Veranstaltungen** | Events anlegen/bearbeiten, Fotos hochladen, veröffentlichen |
| **Reservierungen** | Eingegangene Platzreservierungen einsehen |
| **Künstler** | Profile, Fotos und Beschreibungen pflegen |
| **Vorstand** | Mitglieder, Fotos und Biografien aktualisieren |
| **Galerie** | Bilder hochladen und verwalten |
| **Nachrichten** | Kontaktformular-Nachrichten lesen |

---

## Häufige Probleme

| Problem | Lösung |
|---|---|
| **500 Internal Server Error** | `api/config/settings.local.php` fehlt oder Platzhalter noch drin; PHP-Version unter 8.1 (im Control Panel ändern) |
| **Inhalte laden nicht** | DB-Zugangsdaten in `settings.local.php` prüfen; in phpMyAdmin kontrollieren ob Tabellen vorhanden sind |
| **Bilder fehlen** | `uploads/` vollständig hochgeladen? Berechtigungen auf `755` gesetzt? |
| **404 bei direktem URL-Aufruf** | `.htaccess` im Webroot vorhanden? (Versteckte Dateien in FileZilla eingeschaltet?) |
| **Login schlägt fehl** | In phpMyAdmin Tabelle `users` prüfen – muss einen Eintrag enthalten |

---

## Serverstruktur nach dem Upload

```
/html/                         ← Webroot
├── .htaccess                  ← URL-Routing
├── index.html                 ← React-App
├── assets/                    ← JS, CSS, SVG
├── images/                    ← statische Bilder
├── api/
│   ├── config/
│   │   ├── settings.php       ← Defaults (nicht ändern)
│   │   └── settings.local.php ← Deine Zugangsdaten
│   ├── public/index.php       ← API-Einstiegspunkt
│   ├── src/                   ← PHP-Quellcode
│   └── vendor/                ← PHP-Bibliotheken
└── uploads/                   ← Bilder (beschreibbar, 755)
    ├── board/
    ├── gallery/
    ├── home/
    ├── story/
    ├── events/
    └── artists/
```

---

**Support:** World 4 You unter [world4you.com/support](https://www.world4you.com/support)
