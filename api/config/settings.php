<?php
declare(strict_types=1);

$local = __DIR__ . '/settings.local.php';
$localSettings = file_exists($local) ? require $local : [];

$defaults = [
    'display_error_details' => false,
    'db' => [
        'host' => 'localhost',
        'name' => 'vibria',
        'user' => 'vibria',
        'pass' => '',
        'charset' => 'utf8mb4',
    ],
    'jwt_secret' => 'change-me-in-settings-local',
    'jwt_expiry' => 86400 * 7, // 7 days
    'upload_path' => realpath(__DIR__ . '/../../') . '/uploads',
    'upload_url' => '/uploads',
    'allowed_mime_types' => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    'max_upload_size' => 10 * 1024 * 1024, // 10 MB
    'admin_email' => 'office@vibria.art',
    'site_name' => 'VIBRIA | Kunst- und Kulturverein',
    'smtp' => [
        'host'       => 'smtp.world4you.com',
        'port'       => 587,
        'encryption' => 'tls',
        'username'   => 'noreply@vibria.art',
        'password'   => 'H%CiysxVq$J_eJ%nu3xtdUQgft=VXQ+%',
        'from_email' => 'noreply@vibria.art',
        'from_name'  => 'VIBRIA',
    ],
];

return array_replace_recursive($defaults, $localSettings);
