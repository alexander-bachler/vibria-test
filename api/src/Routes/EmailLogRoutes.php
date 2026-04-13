<?php
declare(strict_types=1);

namespace Vibria\Routes;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Vibria\Middleware\AuthMiddleware;
use Vibria\Models\ContactMessage;
use Vibria\Models\EmailLog;
use Vibria\Models\Reservation;
use Vibria\Services\Database;
use Vibria\Services\Mailer;

class EmailLogRoutes
{
    public static function register(App $app, array $settings): void
    {
        $auth = new AuthMiddleware($settings['jwt_secret']);

        $app->get('/api/admin/email-logs', function (Request $request, Response $response) use ($settings) {
            $params = $request->getQueryParams();
            $filters = [];
            if (!empty($params['type'])) {
                $filters['type'] = $params['type'];
            }
            if (!empty($params['status'])) {
                $filters['status'] = $params['status'];
            }
            $db = Database::getInstance($settings['db']);
            $rows = (new EmailLog($db))->findAll($filters);
            $response->getBody()->write(json_encode($rows));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);

        $app->get('/api/admin/email-logs/{id}', function (Request $request, Response $response, array $args) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $row = (new EmailLog($db))->findById((int)$args['id']);
            if (!$row) {
                $response->getBody()->write(json_encode(['error' => 'Email log not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            $response->getBody()->write(json_encode($row));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);

        $app->post('/api/admin/email-logs/{id}/resend', function (Request $request, Response $response, array $args) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $logModel = new EmailLog($db);
            $log = $logModel->findById((int)$args['id']);
            if (!$log) {
                $response->getBody()->write(json_encode(['error' => 'Email log not found']));
                return $response->withStatus(404)->withHeader('Content-Type', 'application/json');
            }
            $html = $log['html_body'] ?? '';
            if ($html === '') {
                $response->getBody()->write(json_encode(['error' => 'No stored HTML body for this log entry']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $replyTo = self::resolveReplyToForResend($log, $db);

            $mailer = new Mailer($settings['smtp'] ?? []);
            $ok = $mailer->send(
                $log['recipient'],
                $log['subject'],
                $html,
                $replyTo,
                [],
                [
                    'pdo'        => $db,
                    'type'       => $log['type'],
                    'related_id' => isset($log['related_id']) ? (int)$log['related_id'] : null,
                ]
            );

            if (!$ok) {
                $response->getBody()->write(json_encode(['error' => 'Failed to send email', 'success' => false]));
                return $response->withStatus(502)->withHeader('Content-Type', 'application/json');
            }

            $response->getBody()->write(json_encode(['success' => true, 'message' => 'Email resent']));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);
    }

    /**
     * @param array<string, mixed> $log
     */
    private static function resolveReplyToForResend(array $log, \PDO $db): string
    {
        $type = (string)$log['type'];
        $relatedId = isset($log['related_id']) ? (int)$log['related_id'] : 0;

        if ($type === EmailLog::TYPE_RESERVATION_CONFIRMATION) {
            return 'office@vibria.art';
        }

        if ($type === EmailLog::TYPE_RESERVATION_ADMIN && $relatedId > 0) {
            $r = (new Reservation($db))->findById($relatedId);
            if ($r && !empty($r['email'])) {
                return (string)$r['email'];
            }
        }

        if ($type === EmailLog::TYPE_CONTACT_ADMIN && $relatedId > 0) {
            $c = (new ContactMessage($db))->findById($relatedId);
            if ($c && !empty($c['email'])) {
                return (string)$c['email'];
            }
        }

        return '';
    }
}
