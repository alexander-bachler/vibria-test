-- ============================================================
-- VIBRIA | Kunst- und Kulturverein
-- Datenbank-Setup-Script
--
-- Ausführen via phpMyAdmin oder mysql CLI:
--   mysql -u DATENBANKBENUTZER -p DATENBANKNAME < vibria_setup.sql
--
-- Admin-Login nach Import:
--   E-Mail:   office@vibria.art
--   Passwort: vibria2024!
--   (Passwort nach dem ersten Login im Admin-Bereich ändern!)
-- ============================================================

SET NAMES utf8mb4;
SET foreign_key_checks = 0;

-- ─── Tabellen anlegen ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255) DEFAULT NULL,
    date DATE NOT NULL,
    end_date DATE DEFAULT NULL,
    time VARCHAR(10) NOT NULL DEFAULT '19:30',
    type VARCHAR(100) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    admission VARCHAR(100) DEFAULT 'Freiwillige Spenden',
    total_seats INT NOT NULL DEFAULT 40,
    image_path VARCHAR(500) DEFAULT NULL,
    is_published TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_date (date),
    INDEX idx_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS artists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT DEFAULT NULL,
    image_path VARCHAR(500) DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS board_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    nickname VARCHAR(255) DEFAULT NULL,
    bio TEXT NOT NULL,
    image_path VARCHAR(500) DEFAULT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS gallery_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    image_path VARCHAR(500) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'raeumlichkeiten',
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    seats INT NOT NULL DEFAULT 1,
    phone VARCHAR(50) DEFAULT NULL,
    seating_zone VARCHAR(30) DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    INDEX idx_event (event_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) DEFAULT NULL,
    message TEXT NOT NULL,
    is_read TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Admin-Benutzer ───────────────────────────────────────────────────────────
-- Passwort: vibria2024!

INSERT IGNORE INTO users (email, password, name)
VALUES (
    'office@vibria.art',
    '$2y$12$Il24uEiFOSGUt6BJlgoHQuvyJSHmFK5YDFYVZUeSqK/iSXDYemHPi',
    'VIBRIA Admin'
);

-- ─── Vorstandsmitglieder ──────────────────────────────────────────────────────

INSERT IGNORE INTO board_members (sort_order, name, nickname, image_path, bio) VALUES
(1, 'Ester Font Bardolet', 'Die lyrische Sopranistin', 'board/ester.jpg',
 'Geboren am 23. August in Vic (Region Barcelona), Spanien. Nach Erlangen der Diplome für Klavier und Gesang am Konservatorium der Stadt Barcelona, kam sie nach Wien um das Diplom für IGP-Gesang (mit Schwerpunkt Klavier) an der Universität für Musik und darstellende Kunst Wien zu erlangen. Als Musik- und Gesangspädagogin ist sie stets bemüht, jung und Alt die Schönheit von Musik nahezubringen. Dem VIBRIA-Publikum bekannt als Initiatorin der Reihe „Junge Stimmen am Werk" und „Junge Talente am Werk", sowie als Moderatorin der Veranstaltungen.'),
(2, 'Thomas Parb', 'Das Technik-Schatzi', 'board/tom.jpg',
 'Geboren am 3. April 1977 in Linz, Österreich. Abschluss der HTL für Automatisierungstechnik und autodidakter Medienmensch mit dem Fokus auf Kamera, Fotografie, VFX, Licht, Projektion und Ton. Am liebsten alles auf einmal und mit solider Technik unter Kontrolle gebracht. Dem VIBRIA-Publikum zeigt er sich meist nur hinter dem Techniktisch, wo er aber auch nach den Künstlerauftritten zum Plaudern hervorkommt.'),
(3, 'Carlos Manuel Delgado Betancourt', 'Die kleine Puppe', 'board/carlos.jpg',
 'Geboren am 22. August 1964 in Colón, Kuba. Abschluss des Studiums an der Nationalen Schule für Kunstlehrer in Havanna. Seit 1995 lebt er in Wien. Sein künstlerisches Leben lässt sich als Schauspieler-Tänzer, Puppenspieler, Kunsthandwerker, Regisseur, Maler und Restaurator zusammenfassen. Dem VIBRIA-Publikum ist er für seine Inszenierungen und Puppenspiele bekannt.'),
(4, 'Ilietis Batista', 'Die Lockenfee', 'board/ily.jpg',
 'Geboren am 13. November 1987 in Bayamo (Region Granma), Kuba. Abgeschlossenes Studium an der Universität der darstellenden Kunst, Havanna. Ihre berufliche Laufbahn umfasst ein breites Spektrum verschiedener künstlerischer Disziplinen: Tänzerin, Sängerin, Bühnen- und Filmschauspielerin sowie Tanz- und Schauspiellehrerin. Zur Zeit als Tanzlehrerin und Übungsleiterin beim Verein Kids in Motion in Wien beschäftigt. Dem VIBRIA-Publikum bekannt als Darstellerin und Tänzerin in vielen Eigenproduktionen.'),
(5, 'Adria Just Font', 'Der Junior', 'board/adria.jpg',
 'Geboren am 1. Mai 2003 in Wien, Österreich. Abschluss der Schauspielausbildung an der Filmacademy Wien, seither als Schauspieler in mehreren Produktionen im Theater Akzent im Rahmen des Kinder- und Jugendabos tätig.');

-- ─── Künstler ─────────────────────────────────────────────────────────────────

INSERT IGNORE INTO artists (name, sort_order) VALUES
('AlmaLux Frauenchor', 0),
('Angela Schausberger', 1),
('Anika Wick', 2),
('Carlos Delgado Betancourt', 3),
('Ensemble Mirtilli suonanti', 4),
('Ernesto Susana', 5),
('Ester Font Bardolet', 6),
('Evgenia Stavropoulou', 7),
('Guillermo Horta', 8),
('Hanna Zlattinger', 9),
('Ily Batista Tellez', 10),
('Javier Medina Bernal', 11),
('Jo Damian Proksch', 12),
('Katharina Burko', 13),
('László Szabó', 14),
('Lena Marie Parb', 15),
('Luisa Fernández-Flurschütz', 16),
('Manuela Hämmerle', 17),
('Mark Culbard Peters', 18),
('Miriam Kickinger', 19),
('Natalie Schadenhofer', 20),
('Nina Labner', 21),
('Noah Fida', 22),
('Paula Traxler', 23),
('Romana Hostnig', 24),
('Salome Vladar', 25),
('Sissi Delgado', 26),
('Thomas Franz-Riegler', 27),
('Wolf und Licht', 28),
('Adria Just Font', 29);

-- ─── Veranstaltungen ──────────────────────────────────────────────────────────

INSERT IGNORE INTO events (title, subtitle, date, end_date, time, type, description, admission, image_path) VALUES
('Küss mich nicht am Hals', 'Theaterstück / Koproduktion', '2026-04-16', '2026-04-19', '19:30', 'Theater',
 'Mehrere Aufführungen: 16., 17., 18. und 19. April 2026, jeweils um 19:30 Uhr. Eine Koproduktion.', 'Freiwillige Spenden', NULL),
('Wolfgang Millendorfer – Schlafwandler', 'Lesung mit Musik', '2026-05-02', NULL, '19:30', 'Lesung',
 'Wolfgang Millendorfer liest mit musikalischer Begleitung.', 'Freiwillige Spenden', NULL),
('Please Mrs. Henry', 'Tribute zum 85. Geburtstag von Bob Dylan – Konzert', '2026-05-21', NULL, '19:30', 'Konzert',
 'Ein Tribute-Konzert zum 85. Geburtstag von Bob Dylan.', 'Freiwillige Spenden', NULL),
('Die Gesellschaft der Leichtgläubigen', 'Theaterstück / Eigenproduktion', '2026-05-30', NULL, '19:30', 'Theater',
 'Eine packende Theaterperformance aus unserer Eigenproduktion.', 'Freiwillige Spenden', NULL),
('Wolf und Licht – Überdosis Wien', 'Liederabend', '2026-06-13', NULL, '19:30', 'Konzert',
 'Wolf Ratz & Stefan Lichtenegger – Ein Liederabend über Wien.', 'Freiwillige Spenden', NULL),
('Ensemble Mirtilli suonanti', 'Komponistinnen aus alter Zeit und ihre Kollegen – Konzert', '2026-03-14', NULL, '19:30', 'Konzert',
 'Maria Posch (Traversflöten), Maria Brüssing (Viola da gamba), Romina Mayer (Traversflöten). Renaissance und Barock mit historischen Originalinstrumenten.', 'Freiwillige Spenden', 'events/mirtilli.jpg'),
('Wer ist Thomas Franz Riegler?', 'Kabarett', '2026-03-05', NULL, '19:30', 'Kabarett', NULL, 'Freiwillige Spenden', NULL),
('Die Gesellschaft der Leichtgläubigen', 'Theaterstück / Eigenproduktion', '2026-02-18', NULL, '19:30', 'Theater', NULL, 'Freiwillige Spenden', NULL),
('Junge Talente am Werk', 'Konzert', '2026-02-14', NULL, '18:00', 'Konzert',
 'Junge, talentierte Musiker:innen: Salome Vladar, Hanna Zlattinger, Lena Marie Parb, Luisa Fernández-Flurschütz, Miriam Kickinger.', 'Freiwillige Spenden', NULL),
('Javier Medina Bernal', 'Konzert', '2026-01-24', NULL, '19:30', 'Konzert', NULL, 'Freiwillige Spenden', NULL),
('VIBRIA Weihnachtsmarkt', 'Handwerkskunst & Heißgetränke', '2025-12-20', '2025-12-21', '12:00', 'Sonstiges', NULL, 'Freiwillige Spenden', NULL),
('Wer ist Thomas Franz Riegler?', 'Kabarett', '2025-11-27', NULL, '19:30', 'Kabarett', NULL, 'Freiwillige Spenden', NULL),
('Noche de baile', 'Tanzabend', '2025-11-22', NULL, '19:30', 'Tanz', NULL, 'Freiwillige Spenden', NULL),
('Wolf und Licht – Überdosis Wien', 'Liederabend', '2025-10-15', NULL, '19:30', 'Konzert', NULL, 'Freiwillige Spenden', NULL),
('Junge Stimmen am Werk / AlmaLux Frauenchor', 'Konzert', '2025-09-27', NULL, '19:30', 'Konzert', NULL, 'Freiwillige Spenden', NULL),
('Wer ist Thomas Franz Riegler?', 'Kabarett', '2025-09-18', NULL, '19:30', 'Kabarett', NULL, 'Freiwillige Spenden', NULL),
('VIBRIA Sommerfest', '', '2025-06-21', NULL, '15:00', 'Sonstiges', NULL, 'Freiwillige Spenden', NULL),
('Ernesto Susana – Der Hauch des Lebens', 'Drama-Lesung', '2025-05-17', NULL, '19:30', 'Lesung', NULL, 'Freiwillige Spenden', NULL),
('Mokis Bunte Traumschachtel', 'Kindertheater / Eigenproduktion', '2025-05-10', '2025-05-11', '16:00', 'Theater', NULL, 'Freiwillige Spenden', NULL),
('Evgenia Stavropoulou – Performing Persephone', 'Theater-Performance', '2025-03-22', NULL, '19:30', 'Theater', NULL, 'Freiwillige Spenden', NULL),
('Noah Fida & Otmar Binder – Tarot', 'Konzert', '2025-03-15', NULL, '19:30', 'Konzert', NULL, 'Freiwillige Spenden', NULL),
('Jo Demian & NiLa – Ursprungsgeschichten', 'Malerei trifft Puppenspiel', '2025-01-25', NULL, '19:30', 'Theater', NULL, 'Freiwillige Spenden', NULL),
('VIBRIA Weihnachtsmarkt', 'Handwerkskunst & Heißgetränke', '2024-12-21', '2024-12-22', '12:00', 'Sonstiges', NULL, 'Freiwillige Spenden', NULL),
('Guillermo Horta Betancourt – The Trilogy Of Life', 'Theaterperformance', '2024-10-05', NULL, '19:30', 'Theater', NULL, 'Freiwillige Spenden', NULL),
('Romana Hostnig & Carlos Delgado – VIBRIA Abend', 'Lesung und Performance', '2024-09-14', NULL, '19:30', 'Sonstiges', NULL, 'Freiwillige Spenden', NULL),
('Wienerlieder und Melodien aus alten Zeiten', 'Lesung und Konzert / Eigenproduktion', '2024-06-29', NULL, '19:30', 'Konzert', NULL, 'Freiwillige Spenden', NULL),
('In Balance / equilibrio', 'Theater, Performance, Film', '2024-06-04', NULL, '19:30', 'Theater', NULL, 'Freiwillige Spenden', NULL),
('Guillermo Horta & Mark Culbard Peters', 'Performance-Konzert', '2024-05-04', NULL, '19:30', 'Konzert', NULL, 'Freiwillige Spenden', NULL),
('Eröffnung VIBRIA', '', '2024-04-20', NULL, '18:00', 'Sonstiges',
 'Eröffnungsfeier des VIBRIA | Kunst- und Kulturvereins in der Reichsapfelgasse 1.', 'Freiwillige Spenden', NULL);

-- ─── Galerie-Bilder ───────────────────────────────────────────────────────────

INSERT IGNORE INTO gallery_images (title, description, image_path, category, sort_order) VALUES
(NULL, NULL, 'gallery/raum-001.jpg', 'raeumlichkeiten', 1),
(NULL, NULL, 'gallery/raum-002.jpg', 'raeumlichkeiten', 2),
(NULL, NULL, 'gallery/raum-003.jpg', 'raeumlichkeiten', 3),
(NULL, NULL, 'gallery/raum-004.jpg', 'raeumlichkeiten', 4),
(NULL, NULL, 'gallery/raum-005.jpg', 'raeumlichkeiten', 5),
(NULL, NULL, 'gallery/raum-006.jpg', 'raeumlichkeiten', 6),
(NULL, NULL, 'gallery/raum-007.jpg', 'raeumlichkeiten', 7),
(NULL, NULL, 'gallery/raum-008.jpg', 'raeumlichkeiten', 8),
(NULL, NULL, 'gallery/raum-009.jpg', 'raeumlichkeiten', 9),
(NULL, NULL, 'gallery/raum-010.jpg', 'raeumlichkeiten', 10),
(NULL, NULL, 'gallery/raum-011.jpg', 'raeumlichkeiten', 11),
(NULL, NULL, 'gallery/raum-012.jpg', 'raeumlichkeiten', 12),
(NULL, NULL, 'gallery/raum-013.jpg', 'raeumlichkeiten', 13),
(NULL, NULL, 'gallery/raum-014.jpg', 'raeumlichkeiten', 14),
(NULL, 'Eingang', 'gallery/eingang-001.jpg', 'raeumlichkeiten', 15),
(NULL, 'Eingang', 'gallery/eingang-002.jpg', 'raeumlichkeiten', 16),
('Die Vibria', NULL, 'story/vibria-drac.jpg', 'story', 1),
('Startseite', NULL, 'home/Samen-3er-logo.jpg', 'home', 1),
('Startseite', NULL, 'home/Samen-3er-only.jpg', 'home', 2);

SET foreign_key_checks = 1;

-- ============================================================
-- Setup abgeschlossen.
-- Admin-Login: office@vibria.art / vibria2024!
-- WICHTIG: Passwort nach dem ersten Login ändern!
-- ============================================================
