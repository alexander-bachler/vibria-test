<?php
declare(strict_types=1);

namespace Vibria\Routes;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Vibria\Middleware\AuthMiddleware;
use Vibria\Models\Event;
use Vibria\Models\Reservation;
use Vibria\Services\Database;

class EventRoutes
{
    public static function register(App $app, array $settings): void
    {
        // Public: list all published events
        $app->get('/api/events', function (Request $request, Response $response) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $model = new Event($db);
            $events = $model->findAll();
            // Add reserved seat count per event
            $resModel = new Reservation($db);
            foreach ($events as &$event) {
                $event['reserved_seats'] = $resModel->countByEvent((int)$event['id']);
            }
            $response->getBody()->write(json_encode($events));
            return $response->withHeader('Content-Type', 'application/json');
        });

        // Public: single event
        $app->get('/api/events/{id}', function (Request $request, Response $response, array $args) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $model = new Event($db);
            $event = $model->findById((int)$args['id']);
            if (!$event) {
                $response->getBody()->write(json_encode(['error' => 'Not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            $response->getBody()->write(json_encode($event));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $auth = new AuthMiddleware($settings['jwt_secret']);

        // Admin: list all events
        $app->get('/api/admin/events', function (Request $request, Response $response) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $model = new Event($db);
            $events = $model->findAllAdmin();
            $resModel = new Reservation($db);
            foreach ($events as &$event) {
                $event['reserved_seats'] = $resModel->countByEvent((int)$event['id']);
            }
            $response->getBody()->write(json_encode($events));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);

        // Admin: create event
        $app->post('/api/admin/events', function (Request $request, Response $response) use ($settings) {
            $data = (array)$request->getParsedBody();
            $db = Database::getInstance($settings['db']);
            $model = new Event($db);
            $id = $model->create($data);
            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Created']));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        })->add($auth);

        // Admin: update event
        $app->put('/api/admin/events/{id}', function (Request $request, Response $response, array $args) use ($settings) {
            $data = (array)$request->getParsedBody();
            $db = Database::getInstance($settings['db']);
            $model = new Event($db);
            $model->update((int)$args['id'], $data);
            $response->getBody()->write(json_encode(['message' => 'Updated']));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);

        // Admin: delete event
        $app->delete('/api/admin/events/{id}', function (Request $request, Response $response, array $args) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $model = new Event($db);
            $model->delete((int)$args['id']);
            $response->getBody()->write(json_encode(['message' => 'Deleted']));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);
    }
}
