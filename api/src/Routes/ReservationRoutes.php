<?php
declare(strict_types=1);

namespace Vibria\Routes;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Vibria\Middleware\AuthMiddleware;
use Vibria\Models\Reservation;
use Vibria\Models\Event;
use Vibria\Models\EmailLog;
use Vibria\Services\Database;
use Vibria\Services\EmailTemplate;
use Vibria\Services\Mailer;

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
        'rest-plaetze'  => 'Restplätze (Zusatz)',
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

            $result = $resModel->create($data);
            $id = $result['id'];
            $checkinToken = $result['checkin_token'];

            self::sendReservationEmails($settings, $db, $event, $data, $reservationDate, $id, $checkinToken, true);

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

        // Admin: resend guest confirmation email (fresh HTML + QR)
        $app->post('/api/admin/reservations/{id}/resend-confirmation', function (Request $request, Response $response, array $args) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $resModel = new Reservation($db);
            $row = $resModel->findById((int)$args['id']);
            if (!$row) {
                $response->getBody()->write(json_encode(['error' => 'Reservation not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            if (($row['status'] ?? '') === 'cancelled') {
                $response->getBody()->write(json_encode(['error' => 'Cannot resend email for a cancelled reservation']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }
            $eventModel = new Event($db);
            $event = $eventModel->findById((int)$row['event_id']);
            if (!$event) {
                $response->getBody()->write(json_encode(['error' => 'Event not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }

            $guestData = [
                'name'           => $row['name'],
                'email'          => $row['email'],
                'phone'          => $row['phone'],
                'seats'          => (int)$row['seats'],
                'seating_zone'   => $row['seating_zone'],
            ];
            $reservationDate = (string)$row['reservation_date'];
            $checkinToken = (string)($row['checkin_token'] ?? '');

            self::sendReservationEmails(
                $settings,
                $db,
                $event,
                $guestData,
                $reservationDate,
                (int)$row['id'],
                $checkinToken,
                false
            );

            $response->getBody()->write(json_encode(['message' => 'Confirmation email sent']));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);

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

        // Admin: toggle check-in
        $app->patch('/api/admin/reservations/{id}/checkin', function (Request $request, Response $response, array $args) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $model = new Reservation($db);
            $checkedInAt = $model->toggleCheckIn((int)$args['id']);
            $response->getBody()->write(json_encode(['checked_in_at' => $checkedInAt]));
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

        // Admin: delete reservation permanently
        $app->delete('/api/admin/reservations/{id}', function (Request $request, Response $response, array $args) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $model = new Reservation($db);
            $id = (int)$args['id'];
            if ($model->findById($id) === null) {
                $response->getBody()->write(json_encode(['error' => 'Reservation not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            $model->delete($id);
            $response->getBody()->write(json_encode(['message' => 'Deleted']));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);

        // Admin: get reservation by check-in token
        $app->get('/api/admin/reservations/token/{token}', function (Request $request, Response $response, array $args) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $model = new Reservation($db);
            $reservation = $model->findByToken($args['token']);
            if (!$reservation) {
                $response->getBody()->write(json_encode(['error' => 'Reservation not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            $reservation['zone_label'] = self::ZONE_LABELS[$reservation['seating_zone'] ?? '']
                ?? ($reservation['seating_zone'] ?? null);
            $response->getBody()->write(json_encode($reservation));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);

        // Admin: check-in by token
        $app->patch('/api/admin/reservations/token/{token}/checkin', function (Request $request, Response $response, array $args) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $model = new Reservation($db);
            $reservation = $model->findByToken($args['token']);
            if (!$reservation) {
                $response->getBody()->write(json_encode(['error' => 'Reservation not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            $checkedInAt = $model->toggleCheckIn((int)$reservation['id']);
            $response->getBody()->write(json_encode(['checked_in_at' => $checkedInAt]));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);
    }

    /**
     * @param array $guestData keys: name, email, phone, seats, seating_zone
     * @param array $event     Event row from Event::findById
     */
    private static function sendReservationEmails(
        array $settings,
        \PDO $db,
        array $event,
        array $guestData,
        string $reservationDate,
        int $reservationId,
        string $checkinToken,
        bool $sendAdminNotification = true
    ): void {
        $zoneLabel = self::ZONE_LABELS[$guestData['seating_zone'] ?? '']
            ?? ($guestData['seating_zone'] ?? 'Kein Bereich angegeben');
        $dateFormatted = date('d.m.Y', strtotime($reservationDate));
        $emailTpl = new EmailTemplate($settings);
        $mailer = new Mailer($settings['smtp'] ?? []);

        $adminEmail = $settings['admin_email'] ?? 'office@vibria.art';

        $guestEmbedded = [];
        if ($checkinToken !== '') {
            $checkinUrl = rtrim($settings['site_url'] ?? 'https://vibria.art', '/') . '/admin/checkin/' . $checkinToken;
            $guestEmbedded[] = [
                'cid'      => EmailTemplate::CHECKIN_QR_CID,
                'data'     => $emailTpl->checkinQrPngBytes($checkinUrl),
                'filename' => 'checkin-qr.png',
                'mime'     => 'image/png',
            ];
        }

        $guestHtml = $emailTpl->reservationConfirmation($event, $guestData, $zoneLabel, $dateFormatted, $checkinToken);

        $mailer->send(
            $guestData['email'],
            'Reservierungsbestätigung – ' . $event['title'],
            $guestHtml,
            'office@vibria.art',
            $guestEmbedded,
            [
                'pdo'         => $db,
                'type'        => EmailLog::TYPE_RESERVATION_CONFIRMATION,
                'related_id'  => $reservationId,
            ]
        );

        if ($sendAdminNotification) {
            $mailer->send(
                $adminEmail,
                '[VIBRIA] Neue Reservierung – ' . $event['title'],
                $emailTpl->reservationAdminNotification($event, $guestData, $zoneLabel, $dateFormatted),
                $guestData['email'],
                [],
                [
                    'pdo'         => $db,
                    'type'        => EmailLog::TYPE_RESERVATION_ADMIN,
                    'related_id'  => $reservationId,
                ]
            );
        }
    }
}
