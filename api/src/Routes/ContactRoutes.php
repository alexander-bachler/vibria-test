<?php
declare(strict_types=1);

namespace Vibria\Routes;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Vibria\Middleware\AuthMiddleware;
use Vibria\Models\ContactMessage;
use Vibria\Services\Database;
use Vibria\Services\EmailTemplate;

class ContactRoutes
{
    public static function register(App $app, array $settings): void
    {
        $app->post('/api/contact', function (Request $request, Response $response) use ($settings) {
            $data = (array)$request->getParsedBody();

            // Honeypot check
            if (!empty($data['website'])) {
                $response->getBody()->write(json_encode(['message' => 'OK']));
                return $response->withHeader('Content-Type', 'application/json');
            }

            foreach (['name', 'email', 'message'] as $field) {
                if (empty($data[$field])) {
                    $response->getBody()->write(json_encode(['error' => "Field '$field' is required"]));
                    return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
                }
            }

            if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
                $response->getBody()->write(json_encode(['error' => 'Invalid email address']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $db = Database::getInstance($settings['db']);
            $id = (new ContactMessage($db))->create($data);

            $adminEmail = $settings['admin_email'] ?? 'office@vibria.art';
            $emailTpl = new EmailTemplate($settings);

            @mail(
                $adminEmail,
                '[VIBRIA Kontakt] ' . ($data['subject'] ?? 'Neue Nachricht'),
                $emailTpl->contactAdminNotification($data),
                $emailTpl->getHtmlHeaders('noreply@vibria.art', $data['email'])
            );

            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Message sent']));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        });

        $auth = new AuthMiddleware($settings['jwt_secret']);

        $app->get('/api/admin/messages', function (Request $request, Response $response) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $response->getBody()->write(json_encode((new ContactMessage($db))->findAll()));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);

        $app->patch('/api/admin/messages/{id}', function (Request $request, Response $response, array $args) use ($settings) {
            $db = Database::getInstance($settings['db']);
            (new ContactMessage($db))->markRead((int)$args['id']);
            $response->getBody()->write(json_encode(['message' => 'Marked as read']));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);

        // Admin dashboard stats
        $app->get('/api/admin/stats', function (Request $request, Response $response) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $events = $db->query("SELECT COUNT(*) FROM events WHERE is_published=1 AND date >= CURDATE()")->fetchColumn();
            $reservations = $db->query("SELECT COUNT(*) FROM reservations WHERE status != 'cancelled'")->fetchColumn();
            $unread = $db->query("SELECT COUNT(*) FROM contact_messages WHERE is_read = 0")->fetchColumn();
            $response->getBody()->write(json_encode([
                'upcoming_events' => (int)$events,
                'total_reservations' => (int)$reservations,
                'unread_messages' => (int)$unread,
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);
    }
}
