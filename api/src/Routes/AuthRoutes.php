<?php
declare(strict_types=1);

namespace Vibria\Routes;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Firebase\JWT\JWT;
use Vibria\Models\User;
use Vibria\Services\Database;

class AuthRoutes
{
    public static function register(App $app, array $settings): void
    {
        $app->post('/api/auth/login', function (Request $request, Response $response) use ($settings) {
            $data = (array)$request->getParsedBody();
            $email = trim($data['email'] ?? '');
            $password = $data['password'] ?? '';

            if (!$email || !$password) {
                $response->getBody()->write(json_encode(['error' => 'Email and password required']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $db = Database::getInstance($settings['db']);
            $userModel = new User($db);
            $user = $userModel->findByEmail($email);

            if (!$user || !password_verify($password, $user['password'])) {
                $response->getBody()->write(json_encode(['error' => 'Invalid credentials']));
                return $response->withStatus(401)->withHeader('Content-Type', 'application/json');
            }

            $payload = [
                'sub' => $user['id'],
                'email' => $user['email'],
                'name' => $user['name'],
                'iat' => time(),
                'exp' => time() + ($settings['jwt_expiry'] ?? 86400 * 7),
            ];

            $token = JWT::encode($payload, $settings['jwt_secret'], 'HS256');
            $response->getBody()->write(json_encode([
                'token' => $token,
                'user' => ['id' => $user['id'], 'email' => $user['email'], 'name' => $user['name']],
            ]));
            return $response->withHeader('Content-Type', 'application/json');
        });
    }
}
