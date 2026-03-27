<?php
/**
 * Creates event_images table and populates it with ALL images
 * from content/images/Veranstaltungen/ (not just the first one).
 */

require __DIR__ . '/../vendor/autoload.php';

$settings = require __DIR__ . '/../config/settings.php';
if (file_exists(__DIR__ . '/../config/settings.local.php')) {
    $settings = array_replace_recursive($settings, require __DIR__ . '/../config/settings.local.php');
}

$db = $settings['db'];
$port = isset($db['port']) ? ";port={$db['port']}" : '';
$dsn = "mysql:host={$db['host']}{$port};dbname={$db['name']};charset=utf8mb4";
$pdo = new PDO($dsn, $db['user'], $db['pass'], [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
]);

// Create table
$pdo->exec("
    CREATE TABLE IF NOT EXISTS event_images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        image_path VARCHAR(500) NOT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        INDEX idx_event (event_id),
        INDEX idx_sort (event_id, sort_order)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
");
echo "Table event_images created/verified.\n";

$contentBase = realpath(__DIR__ . '/../../content/images/Veranstaltungen');
$uploadsDir  = realpath(__DIR__ . '/../../uploads') . '/events';

if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

// folder => event_id (same mapping as assign_event_images.php)
$mapping = [
    '20260416_NoMeBesesEnElCuello'                => 1,
    '20240420_Eröffnung'                          => 29,
    '20240504_PerformanceKonzert'                 => 28,
    '20240604_InBalance'                          => 27,
    '20240629_Wienerlieder'                       => 26,
    '20240914_RomanaHostnigLesung'                => 25,
    '20241005_TheTrilogyOfLife'                    => 24,
    '20241207_Weihnachtsmarkt'                    => 23,
    '20250111_Ursprungsgeschichten'               => 22,
    '20250125_Ursprungsgeschichten'               => 22,
    '20250315_Tarot'                              => 21,
    '20250322_PerformingPersephone'               => 20,
    '20250510_MokisBunteTraumschachtel'           => 19,
    '20250517_DerHauchDesLebens'                  => 18,
    '20250621_Sommerfest'                         => 17,
    '20250918_WerIstThomasFranzRiegler'           => 16,
    '20250927_JungeStimmenAmWerk'                 => 15,
    '20251015_WolfUndLicht'                       => 14,
    '20251122_NocheDeBaile'                       => 13,
    '20251127_WerIstThomasFranzRiegler'           => 12,
    '20251206_Weihnachtsmarkt'                    => 11,
    '20251220_Weihnachtsmarkt'                    => 11,
    '20260115_WerIstThomasFranzRiegler'           => 7,
    '20260124_JavierMedinaBernal'                 => 10,
    '20260214_JungeTalenteAmWerk'                 => 9,
    '20260218_DieGesellschaftDerLeichtglaeubigen' => 8,
    '20260305_WerIstThomasFranzRiegler'           => 7,
    '20260314_EnsembleMirtilliSuonanti'           => 6,
];

// Clear existing data
$pdo->exec("TRUNCATE TABLE event_images");

$insert = $pdo->prepare(
    "INSERT INTO event_images (event_id, image_path, sort_order) VALUES (?, ?, ?)"
);

$copied = 0;
$inserted = 0;

// Track sort_order per event (multiple folders can map to the same event)
$sortCounters = [];

foreach ($mapping as $folder => $eventId) {
    $folderPath = null;
    foreach (['aktuell', 'archiv'] as $sub) {
        $candidate = "$contentBase/$sub/$folder";
        if (is_dir($candidate)) {
            $folderPath = $candidate;
            break;
        }
    }

    if (!$folderPath) {
        echo "  WARN: Folder not found: $folder\n";
        continue;
    }

    $images = glob("$folderPath/*.{jpg,jpeg,png,webp}", GLOB_BRACE);
    sort($images);

    if (empty($images)) {
        echo "  WARN: No images in $folder\n";
        continue;
    }

    if (!isset($sortCounters[$eventId])) {
        $sortCounters[$eventId] = 0;
    }

    foreach ($images as $srcImage) {
        $destName = basename($srcImage);
        $destPath = "$uploadsDir/$destName";

        if (!file_exists($destPath)) {
            copy($srcImage, $destPath);
            $copied++;
        }

        $dbPath = "events/$destName";
        $sortCounters[$eventId]++;
        $insert->execute([$eventId, $dbPath, $sortCounters[$eventId]]);
        $inserted++;
    }

    echo "  $folder -> event #$eventId: " . count($images) . " images\n";
}

echo "\nDone: $copied new images copied, $inserted gallery entries inserted.\n";

// Show summary per event
$stmt = $pdo->query("SELECT event_id, COUNT(*) AS cnt FROM event_images GROUP BY event_id ORDER BY event_id");
echo "\nImages per event:\n";
foreach ($stmt as $row) {
    echo "  Event #{$row['event_id']}: {$row['cnt']} images\n";
}
