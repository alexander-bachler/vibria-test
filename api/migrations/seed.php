<?php
declare(strict_types=1);

/**
 * VIBRIA Seed Script
 * 
 * Usage:
 *   php seed.php [--password=yourAdminPassword]
 * 
 * This script:
 *   1. Creates all DB tables
 *   2. Seeds events, artists, board members, gallery images
 *   3. Creates the initial admin user
 *   4. Copies images from content/ to uploads/
 */

$settingsFile = __DIR__ . '/../config/settings.local.php';
if (!file_exists($settingsFile)) {
    $settingsFile = __DIR__ . '/../config/settings.php';
}
$settings = require $settingsFile;

// Parse CLI password argument
$adminPassword = 'changeme123';
foreach ($argv ?? [] as $arg) {
    if (str_starts_with($arg, '--password=')) {
        $adminPassword = substr($arg, 11);
    }
}

try {
    $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $settings['db']['host'], $settings['db']['port'] ?? 3306, $settings['db']['name']);
    $pdo = new PDO($dsn, $settings['db']['user'], $settings['db']['pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "Connected to database.\n";
} catch (PDOException $e) {
    die("DB connection failed: " . $e->getMessage() . "\n");
}

// Run schema
$schema = file_get_contents(__DIR__ . '/001_initial_schema.sql');
foreach (explode(';', $schema) as $statement) {
    $stmt = trim($statement);
    if ($stmt && !str_starts_with($stmt, '--') && !str_starts_with($stmt, 'SET')) {
        try { $pdo->exec($stmt); } catch (PDOException $e) { /* ignore already exists */ }
    }
}
echo "Schema applied.\n";

// ─── Admin User ──────────────────────────────────────────────────────────────
$existing = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
if (!$existing) {
    $pdo->prepare("INSERT INTO users (email, password, name) VALUES (?, ?, ?)")
        ->execute(['office@vibria.art', password_hash($adminPassword, PASSWORD_BCRYPT), 'VIBRIA Admin']);
    echo "Admin user created: office@vibria.art / $adminPassword\n";
}

// ─── Board Members ────────────────────────────────────────────────────────────
$boardCount = $pdo->query("SELECT COUNT(*) FROM board_members")->fetchColumn();
if (!$boardCount) {
    $board = [
        [1, 'Ester Font Bardolet', 'Die lyrische Sopranistin', 'board/ester.jpg',
         'Geboren am 23. August in Vic (Region Barcelona), Spanien. Nach Erlangen der Diplome für Klavier und Gesang am Konservatorium der Stadt Barcelona, kam sie nach Wien um das Diplom für IGP-Gesang (mit Schwerpunkt Klavier) an der Universität für Musik und darstellende Kunst Wien zu erlangen. Als Musik- und Gesangspädagogin ist sie stets bemüht, jung und Alt die Schönheit von Musik nahezubringen. Dem VIBRIA-Publikum bekannt als Initiatorin der Reihe „Junge Stimmen am Werk" und „Junge Talente am Werk", sowie als Moderatorin der Veranstaltungen.'],
        [2, 'Thomas Parb', 'Das Technik-Schatzi', 'board/tom.jpg',
         'Geboren am 3. April 1977 in Linz, Österreich. Abschluss der HTL für Automatisierungstechnik und autodidakter Medienmensch mit dem Fokus auf Kamera, Fotografie, VFX, Licht, Projektion und Ton. Am liebsten alles auf einmal und mit solider Technik unter Kontrolle gebracht. Dem VIBRIA-Publikum zeigt er sich meist nur hinter dem Techniktisch, wo er aber auch nach den Künstlerauftritten zum Plaudern hervorkommt.'],
        [3, 'Carlos Manuel Delgado Betancourt', 'Die kleine Puppe', 'board/carlos.jpg',
         'Geboren am 22. August 1964 in Colón, Kuba. Abschluss des Studiums an der Nationalen Schule für Kunstlehrer in Havanna. Seit 1995 lebt er in Wien. Sein künstlerisches Leben lässt sich als Schauspieler-Tänzer, Puppenspieler, Kunsthandwerker, Regisseur, Maler und Restaurator zusammenfassen. Dem VIBRIA-Publikum ist er für seine Inszenierungen und Puppenspiele bekannt.'],
        [4, 'Ilietis Batista', 'Die Lockenfee', 'board/ily.jpg',
         'Geboren am 13. November 1987 in Bayamo (Region Granma), Kuba. Abgeschlossenes Studium an der Universität der darstellenden Kunst, Havanna. Ihre berufliche Laufbahn umfasst ein breites Spektrum verschiedener künstlerischer Disziplinen: Tänzerin, Sängerin, Bühnen- und Filmschauspielerin sowie Tanz- und Schauspiellehrerin. Zur Zeit als Tanzlehrerin und Übungsleiterin beim Verein Kids in Motion in Wien beschäftigt. Dem VIBRIA-Publikum bekannt als Darstellerin und Tänzerin in vielen Eigenproduktionen.'],
        [5, 'Adria Just Font', 'Der Junior', 'board/adria.jpg',
         'Geboren am 1. Mai 2003 in Wien, Österreich. Abschluss der Schauspielausbildung an der Filmacademy Wien, seither als Schauspieler in mehreren Produktionen im Theater Akzent im Rahmen des Kinder- und Jugendabos tätig.'],
    ];
    $stmt = $pdo->prepare("INSERT INTO board_members (sort_order, name, nickname, image_path, bio) VALUES (?, ?, ?, ?, ?)");
    foreach ($board as $m) {
        $stmt->execute($m);
    }
    echo "Board members seeded.\n";
}

// ─── Artists ─────────────────────────────────────────────────────────────────
$artistCount = $pdo->query("SELECT COUNT(*) FROM artists")->fetchColumn();
if (!$artistCount) {
    $artists = [
        'AlmaLux Frauenchor', 'Angela Schausberger', 'Anika Wick', 'Carlos Delgado Betancourt',
        'Ensemble Mirtilli suonanti', 'Ernesto Susana', 'Ester Font Bardolet', 'Evgenia Stavropoulou',
        'Guillermo Horta', 'Hanna Zlattinger', 'Ily Batista Tellez', 'Javier Medina Bernal',
        'Jo Damian Proksch', 'Katharina Burko', 'László Szabó', 'Lena Marie Parb',
        'Luisa Fernández-Flurschütz', 'Manuela Hämmerle', 'Mark Culbard Peters', 'Miriam Kickinger',
        'Natalie Schadenhofer', 'Nina Labner', 'Noah Fida', 'Paula Traxler',
        'Romana Hostnig', 'Salome Vladar', 'Sissi Delgado', 'Thomas Franz-Riegler',
        'Wolf und Licht', 'Adria Just Font',
    ];
    $stmt = $pdo->prepare("INSERT INTO artists (name, sort_order) VALUES (?, ?)");
    foreach ($artists as $i => $name) {
        $stmt->execute([$name, $i]);
    }
    echo "Artists seeded.\n";
}

// ─── Events ──────────────────────────────────────────────────────────────────
$eventCount = $pdo->query("SELECT COUNT(*) FROM events")->fetchColumn();
if (!$eventCount) {
    $events = [
        // Upcoming events
        ['Küss mich nicht am Hals', 'Theaterstück / Koproduktion', '2026-04-16', '2026-04-19', '19:30', 'Theater',
         'Mehrere Aufführungen: 16., 17., 18. und 19. April 2026, jeweils um 19:30 Uhr. Eine Koproduktion.', 'Freiwillige Spenden', null],
        ['Wolfgang Millendorfer – Schlafwandler', 'Lesung mit Musik', '2026-05-02', null, '19:30', 'Lesung',
         'Wolfgang Millendorfer liest mit musikalischer Begleitung.', 'Freiwillige Spenden', null],
        ['Please Mrs. Henry', 'Tribute zum 85. Geburtstag von Bob Dylan – Konzert', '2026-05-21', null, '19:30', 'Konzert',
         'Ein Tribute-Konzert zum 85. Geburtstag von Bob Dylan.', 'Freiwillige Spenden', null],
        ['Die Gesellschaft der Leichtgläubigen', 'Theaterstück / Eigenproduktion', '2026-05-30', null, '19:30', 'Theater',
         'Eine packende Theaterperformance aus unserer Eigenproduktion.', 'Freiwillige Spenden', null],
        ['Wolf und Licht – Überdosis Wien', 'Liederabend', '2026-06-13', null, '19:30', 'Konzert',
         'Wolf Ratz & Stefan Lichtenegger – Ein Liederabend über Wien.', 'Freiwillige Spenden', null],
        // Past events (archive)
        ['Ensemble Mirtilli suonanti', 'Komponistinnen aus alter Zeit und ihre Kollegen – Konzert', '2026-03-14', null, '19:30', 'Konzert',
         'Maria Posch (Traversflöten), Maria Brüssing (Viola da gamba), Romina Mayer (Traversflöten). Renaissance und Barock mit historischen Originalinstrumenten.', 'Freiwillige Spenden', 'events/mirtilli.jpg'],
        ['Wer ist Thomas Franz Riegler?', 'Kabarett', '2026-03-05', null, '19:30', 'Kabarett', null, 'Freiwillige Spenden', null],
        ['Die Gesellschaft der Leichtgläubigen', 'Theaterstück / Eigenproduktion', '2026-02-18', null, '19:30', 'Theater', null, 'Freiwillige Spenden', null],
        ['Junge Talente am Werk', 'Konzert', '2026-02-14', null, '18:00', 'Konzert',
         'Junge, talentierte Musiker:innen: Salome Vladar, Hanna Zlattinger, Lena Marie Parb, Luisa Fernández-Flurschütz, Miriam Kickinger.', 'Freiwillige Spenden', null],
        ['Javier Medina Bernal', 'Konzert', '2026-01-24', null, '19:30', 'Konzert', null, 'Freiwillige Spenden', null],
        ['VIBRIA Weihnachtsmarkt', 'Handwerkskunst & Heißgetränke', '2025-12-20', '2025-12-21', '12:00', 'Sonstiges', null, 'Freiwillige Spenden', null],
        ['Wer ist Thomas Franz Riegler?', 'Kabarett', '2025-11-27', null, '19:30', 'Kabarett', null, 'Freiwillige Spenden', null],
        ['Noche de baile', 'Tanzabend', '2025-11-22', null, '19:30', 'Tanz', null, 'Freiwillige Spenden', null],
        ['Wolf und Licht – Überdosis Wien', 'Liederabend', '2025-10-15', null, '19:30', 'Konzert', null, 'Freiwillige Spenden', null],
        ['Junge Stimmen am Werk / AlmaLux Frauenchor', 'Konzert', '2025-09-27', null, '19:30', 'Konzert', null, 'Freiwillige Spenden', null],
        ['Wer ist Thomas Franz Riegler?', 'Kabarett', '2025-09-18', null, '19:30', 'Kabarett', null, 'Freiwillige Spenden', null],
        ['VIBRIA Sommerfest', '', '2025-06-21', null, '15:00', 'Sonstiges', null, 'Freiwillige Spenden', null],
        ['Ernesto Susana – Der Hauch des Lebens', 'Drama-Lesung', '2025-05-17', null, '19:30', 'Lesung', null, 'Freiwillige Spenden', null],
        ['Mokis Bunte Traumschachtel', 'Kindertheater / Eigenproduktion', '2025-05-10', '2025-05-11', '16:00', 'Theater', null, 'Freiwillige Spenden', null],
        ['Evgenia Stavropoulou – Performing Persephone', 'Theater-Performance', '2025-03-22', null, '19:30', 'Theater', null, 'Freiwillige Spenden', null],
        ['Noah Fida & Otmar Binder – Tarot', 'Konzert', '2025-03-15', null, '19:30', 'Konzert', null, 'Freiwillige Spenden', null],
        ['Jo Demian & NiLa – Ursprungsgeschichten', 'Malerei trifft Puppenspiel', '2025-01-25', null, '19:30', 'Theater', null, 'Freiwillige Spenden', null],
        ['VIBRIA Weihnachtsmarkt', 'Handwerkskunst & Heißgetränke', '2024-12-21', '2024-12-22', '12:00', 'Sonstiges', null, 'Freiwillige Spenden', null],
        ['Guillermo Horta Betancourt – The Trilogy Of Life', 'Theaterperformance', '2024-10-05', null, '19:30', 'Theater', null, 'Freiwillige Spenden', null],
        ['Romana Hostnig & Carlos Delgado – VIBRIA Abend', 'Lesung und Performance', '2024-09-14', null, '19:30', 'Sonstiges', null, 'Freiwillige Spenden', null],
        ['Wienerlieder und Melodien aus alten Zeiten', 'Lesung und Konzert / Eigenproduktion', '2024-06-29', null, '19:30', 'Konzert', null, 'Freiwillige Spenden', null],
        ['In Balance / equilibrio', 'Theater, Performance, Film', '2024-06-04', null, '19:30', 'Theater', null, 'Freiwillige Spenden', null],
        ['Guillermo Horta & Mark Culbard Peters', 'Performance-Konzert', '2024-05-04', null, '19:30', 'Konzert', null, 'Freiwillige Spenden', null],
        ['Eröffnung VIBRIA', '', '2024-04-20', null, '18:00', 'Sonstiges', 'Eröffnungsfeier des VIBRIA | Kunst- und Kulturvereins in der Reichsapfelgasse 1.', 'Freiwillige Spenden', null],
    ];

    $stmt = $pdo->prepare(
        "INSERT INTO events (title, subtitle, date, end_date, time, type, description, admission, image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    );
    foreach ($events as $e) {
        $stmt->execute($e);
    }
    echo "Events seeded (" . count($events) . " events).\n";
}

// ─── Gallery Images ───────────────────────────────────────────────────────────
$galleryCount = $pdo->query("SELECT COUNT(*) FROM gallery_images")->fetchColumn();
if (!$galleryCount) {
    $galleryImages = [];
    for ($i = 1; $i <= 14; $i++) {
        $galleryImages[] = [null, null, 'gallery/raum-' . str_pad((string)$i, 3, '0', STR_PAD_LEFT) . '.jpg', 'raeumlichkeiten', $i];
    }
    $galleryImages[] = [null, 'Eingang', 'gallery/eingang-001.jpg', 'raeumlichkeiten', 15];
    $galleryImages[] = [null, 'Eingang', 'gallery/eingang-002.jpg', 'raeumlichkeiten', 16];
    $galleryImages[] = ['Die Vibria', null, 'story/vibria-drac.jpg', 'story', 1];
    $galleryImages[] = ['Startseite', null, 'home/Samen-3er-logo.jpg', 'home', 1];
    $galleryImages[] = ['Startseite', null, 'home/Samen-3er-only.jpg', 'home', 2];

    $stmt = $pdo->prepare("INSERT INTO gallery_images (title, description, image_path, category, sort_order) VALUES (?, ?, ?, ?, ?)");
    foreach ($galleryImages as $img) {
        $stmt->execute($img);
    }
    echo "Gallery images seeded.\n";
}

// ─── Copy images from content/ to uploads/ ───────────────────────────────────
$contentBase = realpath(__DIR__ . '/../../content/images');
$uploadBase = $settings['upload_path'] ?? realpath(__DIR__ . '/../../') . '/uploads';

$copies = [
    'gallery' => [
        $contentBase . '/Die Räumlichkeiten' => ['raum-001.jpg', 'raum-002.jpg', 'raum-003.jpg', 'raum-004.jpg',
            'raum-005.jpg', 'raum-006.jpg', 'raum-007.jpg', 'raum-008.jpg', 'raum-009.jpg', 'raum-010.jpg',
            'raum-011.jpg', 'raum-012.jpg', 'raum-013.jpg', 'raum-014.jpg', 'eingang-001.jpg', 'eingang-002.jpg'],
    ],
    'board' => [
        $contentBase . '/der vorstand' => ['adria.jpg', 'carlos.jpg', 'ester.jpg', 'ily.jpg', 'tom.jpg'],
    ],
    'story' => [
        $contentBase . '/Die Geschichte der VIBRIA' => ['vibria-drac.jpg'],
    ],
    'home' => [
        $contentBase . '/startseite' => ['Samen-3er-logo.jpg', 'Samen-3er-only.jpg'],
    ],
];

foreach ($copies as $targetFolder => $sources) {
    $targetDir = $uploadBase . '/' . $targetFolder;
    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }
    foreach ($sources as $srcDir => $files) {
        foreach ($files as $file) {
            $src = $srcDir . '/' . $file;
            $dst = $targetDir . '/' . $file;
            if (file_exists($src) && !file_exists($dst)) {
                copy($src, $dst);
                echo "Copied: $file -> $targetFolder/\n";
            }
        }
    }
}

echo "\nSeed completed successfully!\n";
echo "Admin login: office@vibria.art / $adminPassword\n";
