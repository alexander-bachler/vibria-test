<?php
declare(strict_types=1);

namespace Vibria\Routes;

use Psr\Http\Message\ResponseInterface as Response;
use Psr\Http\Message\ServerRequestInterface as Request;
use Slim\App;
use Vibria\Middleware\AuthMiddleware;
use Vibria\Services\ImageService;

class UploadRoutes
{
    public static function register(App $app, array $settings): void
    {
        $auth = new AuthMiddleware($settings['jwt_secret']);

        $app->post('/api/admin/upload', function (Request $request, Response $response) use ($settings) {
            $uploadedFiles = $request->getUploadedFiles();
            $body = $request->getParsedBody();
            $folder = trim($body['folder'] ?? 'misc', '/');

            if (!isset($uploadedFiles['file'])) {
                $response->getBody()->write(json_encode(['error' => 'No file uploaded']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $uploadedFile = $uploadedFiles['file'];

            if ($uploadedFile->getError() !== UPLOAD_ERR_OK) {
                $response->getBody()->write(json_encode(['error' => 'Upload error: ' . $uploadedFile->getError()]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $size = $uploadedFile->getSize();
            $maxSize = $settings['max_upload_size'] ?? 10 * 1024 * 1024;
            if ($size > $maxSize) {
                $response->getBody()->write(json_encode(['error' => 'File too large']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $mediaType = $uploadedFile->getClientMediaType();
            $allowedTypes = $settings['allowed_mime_types'] ?? ['image/jpeg', 'image/png', 'image/webp'];
            if (!in_array($mediaType, $allowedTypes, true)) {
                $response->getBody()->write(json_encode(['error' => 'Invalid file type: ' . $mediaType]));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $ext = match ($mediaType) {
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
                'image/gif' => 'gif',
                default => 'jpg',
            };

            $filename = uniqid('', true) . '.' . $ext;
            $uploadPath = rtrim($settings['upload_path'], '/') . '/' . $folder;

            if (!is_dir($uploadPath) && !mkdir($uploadPath, 0755, true)) {
                $response->getBody()->write(json_encode(['error' => 'Cannot create upload directory']));
                return $response->withStatus(500)->withHeader('Content-Type', 'application/json');
            }

            $uploadedFile->moveTo($uploadPath . '/' . $filename);
            $relativePath = $folder . '/' . $filename;

            $response->getBody()->write(json_encode([
                'path' => $relativePath,
                'url' => ($settings['upload_url'] ?? '/uploads') . '/' . $relativePath,
            ]));
            return $response->withStatus(201)->withHeader('Content-Type', 'application/json');
        })->add($auth);

        $app->delete('/api/admin/upload', function (Request $request, Response $response) use ($settings) {
            $data = (array)$request->getParsedBody();
            $relativePath = $data['path'] ?? '';

            if (!$relativePath) {
                $response->getBody()->write(json_encode(['error' => 'Path required']));
                return $response->withStatus(400)->withHeader('Content-Type', 'application/json');
            }

            $uploadBase = realpath($settings['upload_path']);
            $fullPath = realpath($uploadBase . '/' . ltrim($relativePath, '/'));

            if ($fullPath && str_starts_with($fullPath, $uploadBase) && file_exists($fullPath)) {
                unlink($fullPath);
            }

            $response->getBody()->write(json_encode(['message' => 'Deleted']));
            return $response->withHeader('Content-Type', 'application/json');
        })->add($auth);
    }
}
