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
use Vibria\Services\EmailTemplate;

class ReservationRoutes
{
    private const MAX_SEATS_PER_RESERVATION = 4;
    private const SEATS_PER_ZONE = 4;

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

            $required = ['event_id', 'name', 'email', 'seats', 'reservation_date'];
            foreach ($required as $field) {
                if (empty($data[$field])) {
                    $response->getBody()->write(json_encode(['error' => "Field '$field' is required"]));
                    return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
                }
            }

            $seatCount = (int)$data['seats'];
            if ($seatCount < 1 || $seatCount > self::MAX_SEATS_PER_RESERVATION) {
                $response->getBody()->write(json_encode([
                    'error' => 'Between 1 and ' . self::MAX_SEATS_PER_RESERVATION . ' seats per reservation allowed',
                ]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            $data['seats'] = $seatCount;

            $db = Database::getInstance($settings['db']);
            $eventModel = new Event($db);
            $event = $eventModel->findById((int)$data['event_id']);

            if (!$event) {
                $response->getBody()->write(json_encode(['error' => 'Event not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            // Validate reservation_date falls within event range
            $reservationDate = $data['reservation_date'];
            $startDate = $event['date'];
            $endDate = $event['end_date'] ?? $event['date'];
            if ($reservationDate < $startDate || $reservationDate > $endDate) {
                $response->getBody()->write(json_encode(['error' => 'Reservation date is outside the event date range']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $resModel = new Reservation($db);
            $reserved = $resModel->countByEventAndDate((int)$data['event_id'], $reservationDate);
            $available = $event['total_seats'] - $reserved;

            if ($seatCount > $available) {
                $response->getBody()->write(json_encode(['error' => 'Not enough seats available']));
                return $response->withStatus(409)->withHeader('Content-Type', 'application/json');
            }

            $zone = $data['seating_zone'] ?? null;
            if ($zone && isset(self::ZONE_LABELS[$zone])) {
                $zoneCounts = $resModel->countByZone((int)$data['event_id'], $reservationDate);
                $zoneReserved = $zoneCounts[$zone] ?? 0;
                $zoneAvailable = self::SEATS_PER_ZONE - $zoneReserved;
                if ($seatCount > $zoneAvailable) {
                    $response->getBody()->write(json_encode([
                        'error' => 'Nicht genügend Plätze in diesem Bereich verfügbar (noch ' . $zoneAvailable . ' frei)',
                    ]));
                    return $response->withStatus(409)->withHeader('Content-Type', 'application/json');
                }
            }

            $id = $resModel->create($data);

            $zoneLabel = self::ZONE_LABELS[$data['seating_zone'] ?? ''] ?? ($data['seating_zone'] ?? 'Kein Bereich angegeben');
            $dateFormatted = date('d.m.Y', strtotime($reservationDate));
            $emailTpl = new EmailTemplate($settings);

            $adminEmail = $settings['admin_email'] ?? 'office@vibria.art';

            @mail(
                $data['email'],
                'Reservierungsbestätigung – ' . $event['title'],
                $emailTpl->reservationConfirmation($event, $data, $zoneLabel, $dateFormatted),
                $emailTpl->getHtmlHeaders($adminEmail, 'office@vibria.art')
            );

            @mail(
                $adminEmail,
                '[VIBRIA] Neue Reservierung – ' . $event['title'],
                $emailTpl->reservationAdminNotification($event, $data, $zoneLabel, $dateFormatted),
                $emailTpl->getHtmlHeaders('noreply@vibria.art', $data['email'])
            );

            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Reservation created']));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        });

        // Public: get seat counts per zone for an event (optionally filtered by date)
        $app->get('/api/events/{id}/zones', function (Request $request, Response $response, array $args) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $eventModel = new Event($db);
            $event = $eventModel->findById((int)$args['id']);
            $totalSeats = $event ? (int)$event['total_seats'] : 40;

            $params = $request->getQueryParams();
            $date = $params['date'] ?? ($event ? $event['date'] : date('Y-m-d'));

            $resModel = new Reservation($db);
            $zones = $resModel->countByZone((int)$args['id'], $date);

            $seatsPerZone = self::SEATS_PER_ZONE;

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
