<?php
declare(strict_types=1);

// Copy this file to settings.local.php and fill in your values.
// settings.local.php is NOT committed to version control.

return [
    'display_error_details' => true, // Set to false in production
    'db' => [
        'host' => '127.0.0.1',
        'name' => 'vibria',
        'user' => 'root',
        'pass' => '',
    ],
    'jwt_secret' => 'generate-a-secure-random-string-here',
    'upload_path' => realpath(__DIR__ . '/../../') . '/uploads',
];
