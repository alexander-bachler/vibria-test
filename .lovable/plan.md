

## YouTube-Videos von VIBRIA einbinden

### Was wird gemacht
Eine neue Sektion "Videos" wird zwischen dem Programm-Bereich und dem Footer eingefuegt, die den YouTube-Kanal von VIBRIA praesentiert.

### Umsetzung

**Neue Sektion in `src/pages/Index.tsx`:**

- Neue "Videos"-Sektion mit dem Titel "VIBRIA auf YouTube" im gleichen Design-Stil (uppercase Heading, Barlow Condensed)
- Einbettung des YouTube-Kanals ueber einen eingebetteten iframe, der die neuesten Videos des Kanals zeigt (`https://www.youtube.com/embed?listType=user_uploads&list=vibria-kunst-und-kulturverein`)
- Alternativ: Da YouTube-Kanal-Embeds eingeschraenkt sind, wird stattdessen ein prominenter Link-Block zum YouTube-Kanal erstellt mit:
  - YouTube-Icon (aus Lucide: kein natives YT-Icon, daher ein Play-Button oder ein einfaches SVG)
  - Kanal-Name und kurze Beschreibung
  - CTA-Button "Videos ansehen" der zum Kanal verlinkt
  - Platzhalter fuer bis zu 2-3 Video-Embeds (mit Standard YouTube iframe-Embeds), die der Admin spaeter mit konkreten Video-IDs befuellen kann

- Link zum YouTube-Kanal wird auch im Footer hinzugefuegt (neben Instagram, Facebook, Website)

### Technische Details

1. **`src/pages/Index.tsx`** - Aenderungen:
   - Neue `VideoSection`-Komponente mit responsivem Grid (1 Spalte mobil, 2-3 Spalten Desktop)
   - YouTube-Embeds als `<iframe>` mit `aspect-ratio: 16/9`, `allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"`
   - Sektion wird nur in der Besucher-Ansicht angezeigt (nicht im Admin-Bereich)
   - YouTube-Link im Footer ergaenzen

