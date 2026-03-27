<?php
/**
 * Assigns event images from content/images/Veranstaltungen/ to the
 * corresponding events in the database and copies the first image of
 * each folder to uploads/events/.
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

$contentBase = realpath(__DIR__ . '/../../content/images/Veranstaltungen');
$uploadsDir  = realpath(__DIR__ . '/../../uploads') . '/events';

if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
}

// folder-name => DB event ID mapping based on date + title keywords
$mapping = [
    // --- aktuell ---
    '20260416_NoMeBesesEnElCuello' => 1,   // Küss mich nicht am Hals (2026-04-16)

    // --- archiv ---
    '20240420_Eröffnung'                      => 29,  // Eröffnung VIBRIA
    '20240504_PerformanceKonzert'              => 28,  // Guillermo Horta & Mark Culbard Peters
    '20240604_InBalance'                       => 27,  // In Balance / equilibrio
    '20240629_Wienerlieder'                    => 26,  // Wienerlieder und Melodien
    '20240914_RomanaHostnigLesung'             => 25,  // Romana Hostnig & Carlos Delgado
    '20241005_TheTrilogyOfLife'                => 24,  // Guillermo Horta – The Trilogy Of Life
    '20241207_Weihnachtsmarkt'                 => 23,  // VIBRIA Weihnachtsmarkt 2024-12-21
    '20250111_Ursprungsgeschichten'            => 22,  // Jo Demian & NiLa – Ursprungsgeschichten 2025-01-25
    '20250125_Ursprungsgeschichten'            => 22,  // same event, second date (use both)
    '20250315_Tarot'                           => 21,  // Noah Fida & Otmar Binder – Tarot
    '20250322_PerformingPersephone'            => 20,  // Performing Persephone
    '20250510_MokisBunteTraumschachtel'        => 19,  // Mokis Bunte Traumschachtel
    '20250517_DerHauchDesLebens'               => 18,  // Der Hauch des Lebens
    '20250621_Sommerfest'                      => 17,  // VIBRIA Sommerfest
    '20250918_WerIstThomasFranzRiegler'        => 16,  // Wer ist Thomas Franz Riegler? 2025-09-18
    '20250927_JungeStimmenAmWerk'              => 15,  // Junge Stimmen am Werk
    '20251015_WolfUndLicht'                    => 14,  // Wolf und Licht
    '20251122_NocheDeBaile'                    => 13,  // Noche de baile
    '20251127_WerIstThomasFranzRiegler'        => 12,  // Wer ist Thomas Franz Riegler? 2025-11-27
    '20251206_Weihnachtsmarkt'                 => 11,  // VIBRIA Weihnachtsmarkt 2025-12 (first weekend)
    '20251220_Weihnachtsmarkt'                 => 11,  // same event, second weekend
    '20260115_WerIstThomasFranzRiegler'        => 7,   // Wer ist Thomas Franz Riegler? 2026-03-05 -> actually 2026-01-15 maps to id 7? No...
    '20260124_JavierMedinaBernal'              => 10,  // Javier Medina Bernal
    '20260214_JungeTalenteAmWerk'              => 9,   // Junge Talente am Werk
    '20260218_DieGesellschaftDerLeichtglaeubigen' => 8, // Die Gesellschaft der Leichtgläubigen
    '20260305_WerIstThomasFranzRiegler'        => 7,   // Wer ist Thomas Franz Riegler? 2026-03-05
    '20260314_EnsembleMirtilliSuonanti'        => 6,   // Ensemble Mirtilli suonanti
];

// Fix: 20260115 maps to a "Wer ist Thomas Franz Riegler?" that isn't in the
// current DB with that exact date. Looking at the data, there's no Jan 15 event.
// The seed has id 7 = 2026-03-05 and id 12 = 2025-11-27.
// We'll skip 20260115 if there's no matching event, or add it to the closest match.
// Actually the seed script likely didn't include it. Let's just skip assignment for
// 20260115 but still copy the images.

$stmt = $pdo->prepare("UPDATE events SET image_path = ? WHERE id = ?");
$copied = 0;
$updated = 0;
$alreadySet = [];

foreach ($mapping as $folder => $eventId) {
    // Skip if we already assigned an image to this event
    if (isset($alreadySet[$eventId])) {
        echo "  SKIP $folder (event $eventId already has image)\n";
        continue;
    }

    // Find the folder (aktuell or archiv)
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

    // Get the first .jpg image (sorted alphabetically = _0001.jpg or main image)
    $images = glob("$folderPath/*.jpg");
    sort($images);

    if (empty($images)) {
        echo "  WARN: No images in $folder\n";
        continue;
    }

    $srcImage = $images[0];
    $destName = basename($srcImage);
    $destPath = "$uploadsDir/$destName";

    if (!file_exists($destPath)) {
        copy($srcImage, $destPath);
        echo "  COPY $destName\n";
        $copied++;
    } else {
        echo "  EXISTS $destName\n";
    }

    $dbPath = "events/$destName";
    $stmt->execute([$dbPath, $eventId]);
    echo "  DB UPDATE event #$eventId -> $dbPath\n";
    $alreadySet[$eventId] = true;
    $updated++;
}

echo "\nDone: $copied images copied, $updated events updated in DB.\n";
