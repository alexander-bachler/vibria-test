<?php
declare(strict_types=1);

namespace Vibria\Routes;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Vibria\Middleware\AuthMiddleware;
use Vibria\Models\BoardMember;
use Vibria\Services\Database;

class BoardRoutes
{
    public static function register(App $app, array $settings): void
    {
        $app->get('/api/board', function (Request $request, Response $response) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $response->getBody()->write(json_encode((new BoardMember($db))->findAll()));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $auth = new AuthMiddleware($settings['jwt_secret']);

        $app->post('/api/admin/board', function (Request $request, Response $response) use ($settings) {
            $data = (array)$request->getParsedBody();
            $db = Database::getInstance($settings['db']);
            $id = (new BoardMember($db))->create($data);
            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Created']));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        })->add($auth);

        $app->put('/api/admin/board/{id}', function (Request $request, Response $response, array $args) use ($settings) {
            $data = (array)$request->getParsedBody();
            $db = Database::getInstance($settings['db']);
            (new BoardMember($db))->update((int)$args['id'], $data);
            $response->getBody()->write(json_encode(['message' => 'Updated']));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);

        $app->delete('/api/admin/board/{id}', function (Request $request, Response $response, array $args) use ($settings) {
            $db = Database::getInstance($settings['db']);
            (new BoardMember($db))->delete((int)$args['id']);
            $response->getBody()->write(json_encode(['message' => 'Deleted']));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);
    }
}
