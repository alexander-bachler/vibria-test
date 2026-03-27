<?php
declare(strict_types=1);

namespace Vibria\Routes;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Vibria\Middleware\AuthMiddleware;
use Vibria\Models\GalleryImage;
use Vibria\Services\Database;

class GalleryRoutes
{
    public static function register(App $app, array $settings): void
    {
        $app->get('/api/gallery', function (Request $request, Response $response) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $model = new GalleryImage($db);
            $params = $request->getQueryParams();
            $images = isset($params['category'])
                ? $model->findByCategory($params['category'])
                : $model->findAll();
            $response->getBody()->write(json_encode($images));
            return $response->withHeader('Content-Type', 'application/json');
        });

        $auth = new AuthMiddleware($settings['jwt_secret']);

        $app->post('/api/admin/gallery', function (Request $request, Response $response) use ($settings) {
            $data = (array)$request->getParsedBody();
            $db = Database::getInstance($settings['db']);
            $id = (new GalleryImage($db))->create($data);
            $response->getBody()->write(json_encode(['id' => $id, 'message' => 'Created']));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        })->add($auth);

        $app->put('/api/admin/gallery/{id}', function (Request $request, Response $response, array $args) use ($settings) {
            $data = (array)$request->getParsedBody();
            $db = Database::getInstance($settings['db']);
            (new GalleryImage($db))->update((int)$args['id'], $data);
            $response->getBody()->write(json_encode(['message' => 'Updated']));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);

        $app->delete('/api/admin/gallery/{id}', function (Request $request, Response $response, array $args) use ($settings) {
            $db = Database::getInstance($settings['db']);
            $model = new GalleryImage($db);
            $image = $model->findById((int)$args['id']);
            if ($image) {
                $model->delete((int)$args['id']);
            }
            $response->getBody()->write(json_encode(['message' => 'Deleted']));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);
    }
}
