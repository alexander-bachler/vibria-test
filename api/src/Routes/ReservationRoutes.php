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
    // Human-readable zone labels for confirmation emails
    private const ZONE_LABELS = [
        'vorne-links'   => 'Vorne Links',
        'vorne-mitte'   => 'Vorne Mitte',
        'vorne-rechts'  => 'Vorne Rechts',
        'mitte-links'   => 'Mitte Links',
        'mitte-mitte'   => 'Mitte Mitte',
        'mitte-rechts'  => 'Mitte Rechts',
        'hinten-links'  => 'Hinten Links',
        'hinten-mitte'  => 'Hinten Mitte',
        'hinten-rechts' => 'Hinten Rechts',
    ];

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

            if ((int)$data['seats'] > $available) {
                $response->getBody()->write(json_encode(['error' => 'Not enough seats available']));
                return $response->withStatus(409)->withHeader('Content-Type', 'application/json');
            }

            $id = $resModel->create($data);

            // Confirmation email
            $zoneLabel = self::ZONE_LABELS[$data['seating_zone'] ?? ''] ?? ($data['seating_zone'] ?? 'Kein Bereich angegeben');
            $dateFormatted = date('d.m.Y', strtotime($event['date']));
            $to = $data['email'];
            $subject = 'Reservierungsbestätigung – ' . $event['title'];
            $body = "Liebe/r " . $data['name'] . ",\n\n"
                . "Ihre Reservierung für \"" . $event['title'] . "\" wurde entgegengenommen.\n\n"
                . "Datum: " . $dateFormatted . ", " . $event['time'] . " Uhr\n"
                . "Anzahl der Plätze: " . $data['seats'] . "\n"
                . "Sitzbereich: " . $zoneLabel . "\n\n"
                . "Bitte nehmen Sie Ihren Platz spätestens 15 Minuten vor Beginn ein.\n"
                . "Nicht abgeholte Reservierungen werden danach freigegeben.\n\n"
                . "Mit freundlichen Grüßen\n"
                . "VIBRIA | Kunst- und Kulturverein\n"
                . "office@vibria.art";
            $headers = "From: " . ($settings['admin_email'] ?? 'office@vibria.art') . "\r\nReply-To: office@vibria.art\r\n";
            @mail($to, $subject, $body, $headers);

            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Reservation created']));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        });

        // Public: get seat counts per zone for an event
        $app->get('/api/events/{id}/zones', function (Request $request, Response $response, array $args) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $resModel = new Reservation($db);
            $zones = $resModel->countByZone((int)$args['id']);

            // Also fetch total_seats so the client can compute availability per zone
            $eventModel = new Event($db);
            $event = $eventModel->findById((int)$args['id']);
            $totalSeats = $event ? (int)$event['total_seats'] : 40;

            // Each zone gets an equal share of the total seats (40 seats / 9 zones ≈ 4-5 per zone)
            $seatsPerZone = (int)ceil($totalSeats / 9);

            $result = [];
            $allZones = array_keys(self::ZONE_LABELS);
            foreach ($allZones as $zone) {
                $reserved = $zones[$zone] ?? 0;
                $result[$zone] = [
                    'reserved'   => $reserved,
                    'capacity'   => $seatsPerZone,
                    'available'  => max(0, $seatsPerZone - $reserved),
                    'label'      => self::ZONE_LABELS[$zone],
                ];
            }

            $response->getBody()->write(json_encode($result));
            return $response->withHeader('Content-Type', 'application/json');
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
