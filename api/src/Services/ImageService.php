<?php
declare(strict_types=1);

namespace Vibria\Services;

use RuntimeException;
use InvalidArgumentException;

class ImageService
{
    public function __construct(
        private readonly string $uploadPath,
        private readonly array $allowedMimeTypes,
        private readonly int $maxSize
    ) {}

    public function upload(array $file, string $folder): string
    {
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new RuntimeException('Upload error code: ' . $file['error']);
        }
        if ($file['size'] > $this->maxSize) {
            throw new InvalidArgumentException('File too large. Max size: ' . ($this->maxSize / 1024 / 1024) . ' MB');
        }

        $mimeType = mime_content_type($file['tmp_name']);
        if (!in_array($mimeType, $this->allowedMimeTypes, true)) {
            throw new InvalidArgumentException('Invalid file type: ' . $mimeType);
        }

        $ext = $this->extensionFromMime($mimeType);
        $filename = uniqid('', true) . '.' . $ext;
        $targetDir = rtrim($this->uploadPath, '/') . '/' . trim($folder, '/');

        if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true)) {
            throw new RuntimeException('Cannot create upload directory: ' . $targetDir);
        }

        $targetPath = $targetDir . '/' . $filename;
        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            throw new RuntimeException('Failed to save uploaded file');
        }

        return trim($folder, '/') . '/' . $filename;
    }

    public function delete(string $relativePath): void
    {
        $fullPath = rtrim($this->uploadPath, '/') . '/' . ltrim($relativePath, '/');
        $fullPath = realpath($fullPath);

        // Security: ensure path is within upload directory
        $uploadReal = realpath($this->uploadPath);
        if ($fullPath === false || !str_starts_with($fullPath, $uploadReal)) {
            throw new InvalidArgumentException('Invalid file path');
        }

        if (file_exists($fullPath)) {
            unlink($fullPath);
        }
    }

    private function extensionFromMime(string $mimeType): string
    {
        return match ($mimeType) {
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp',
            'image/gif' => 'gif',
            default => 'jpg',
        };
    }
}
