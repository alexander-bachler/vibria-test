<?php
declare(strict_types=1);

namespace Vibria\Routes;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Vibria\Middleware\AuthMiddleware;
use Vibria\Models\Reservation;
use Vibria\Models\Event;
use Vibria\Services\Database;

class ReservationRoutes
{
    public static function register(App $app, array $settings): void
    {
        // Public: create reservation
        $app->post('/api/reservations', function (Request $request, Response $response) use ($settings) {
            $data = (array)$request->getParsedBody();

            // Honeypot check
            if (!empty($data['website'])) {
                $response->getBody()->write(json_encode(['message' => 'OK']));
                return $response->withHeader('Content-Type', 'application/json');
            }

            $required = ['event_id', 'name', 'email', 'seats'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    $response->getBody()->write(json_encode(['error' => "Field '$field' is required"]));
                    return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
                }
            }

            $db = Database::getInstance($settings['db']);
            $eventModel = new Event($db);
            $event = $eventModel->findById((int)$data['event_id']);

            if (!$event) {
                $response->getBody()->write(json_encode(['error' => 'Event not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $resModel = new Reservation($db);
            $reserved = $resModel->countByEvent((int)$data['event_id']);
            $available = $event['total_seats'] - $reserved;

            if ($data['seats'] > $available) {
                $response->getBody()->write(json_encode(['error' => 'Not enough seats available']));
                return $response->withStatus(409)->withHeader('Content-Type', 'application/json');
            }

            $id = $resModel->create($data);

            // Send confirmation email
            $to = $data['email'];
            $subject = 'Reservierungsbestätigung – ' . $event['title'];
            $body = "Liebe/r " . $data['name'] . ",\n\n" .
                "Ihre Reservierung für \"" . $event['title'] . "\" am " . $event['date'] . " um " . $event['time'] . " Uhr wurde entgegengenommen.\n\n" .
                "Anzahl der Plätze: " . $data['seats'] . "\n\n" .
                "Bitte nehmen Sie Ihren Platz spätestens 15 Minuten vor Beginn ein.\n\n" .
                "Mit freundlichen Grüßen\nVIBRIA | Kunst- und Kulturverein\noffice@vibria.art";
            $headers = "From: " . ($settings['admin_email'] ?? 'office@vibria.art') . "\r\nReply-To: office@vibria.art\r\n";
            @mail($to, $subject, $body, $headers);

            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Reservation created']));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        });

        $auth = new AuthMiddleware($settings['jwt_secret']);

        // Admin: list all reservations
        $app->get('/api/admin/reservations', function (Request $request, Response $response) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $params = $request->getQueryParams();
            $model = new Reservation($db);
            if (!empty($params['event_id'])) {
                $data = $model->findByEvent((int)$params['event_id']);
            } else {
                $data = $model->findAll();
            }
            $response->getBody()->write(json_encode($data));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);

        // Admin: update status
        $app->patch('/api/admin/reservations/{id}', function (Request $request, Response $response, array $args) use ($settings) {
            $data = (array)$request->getParsedBody();
            $db = Database::getInstance($settings['db']);
            (new Reservation($db))->updateStatus((int)$args['id'], $data['status'] ?? 'pending');
            $response->getBody()->write(json_encode(['message' => 'Updated']));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);
    }
}
