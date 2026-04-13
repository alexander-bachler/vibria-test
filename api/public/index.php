<?php
declare(strict_types=1);

use Slim\Factory\AppFactory;
use Vibria\Middleware\CorsMiddleware;
use Vibria\Routes\AuthRoutes;
use Vibria\Routes\EventRoutes;
use Vibria\Routes\ArtistRoutes;
use Vibria\Routes\BoardRoutes;
use Vibria\Routes\GalleryRoutes;
use Vibria\Routes\ReservationRoutes;
use Vibria\Routes\ContactRoutes;
use Vibria\Routes\EmailLogRoutes;
use Vibria\Routes\UploadRoutes;

require __DIR__ . '/../vendor/autoload.php';

$settings = require __DIR__ . '/../config/settings.php';

$app = AppFactory::create();

$app->addBodyParsingMiddleware();
$app->addRoutingMiddleware();
$app->addErrorMiddleware(
    (bool)($settings['display_error_details'] ?? false),
    true,
    true
);

$app->add(new CorsMiddleware());

AuthRoutes::register($app, $settings);
EventRoutes::register($app, $settings);
ArtistRoutes::register($app, $settings);
BoardRoutes::register($app, $settings);
GalleryRoutes::register($app, $settings);
ReservationRoutes::register($app, $settings);
ContactRoutes::register($app, $settings);
EmailLogRoutes::register($app, $settings);
UploadRoutes::register($app, $settings);

$app->run();
