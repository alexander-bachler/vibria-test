<?php
declare(strict_types=1);

namespace Vibria\Models;

use PDO;

class GalleryImage
{
    public function __construct(private readonly PDO $db) {}

    public function findByCategory(string $category): array
    {
        $stmt = $this->db->prepare('SELECT * FROM gallery_images WHERE category = ? ORDER BY sort_order ASC, id ASC');
        $stmt->execute([$category]);
        return $stmt->fetchAll();
    }

    public function findAll(): array
    {
        return $this->db->query('SELECT * FROM gallery_images ORDER BY category ASC, sort_order ASC')->fetchAll();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->db->prepare('SELECT * FROM gallery_images WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO gallery_images (title, description, image_path, category, sort_order) VALUES (:title, :description, :image_path, :category, :sort_order)'
        );
        $stmt->execute([
            'title' => $data['title'] ?? null,
            'description' => $data['description'] ?? null,
            'image_path' => $data['image_path'],
            'category' => $data['category'] ?? 'raeumlichkeiten',
            'sort_order' => $data['sort_order'] ?? 0,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE gallery_images SET title=:title, description=:description, image_path=:image_path, category=:category, sort_order=:sort_order WHERE id=:id'
        );
        return $stmt->execute([
            'title' => $data['title'] ?? null,
            'description' => $data['description'] ?? null,
            'image_path' => $data['image_path'],
            'category' => $data['category'] ?? 'raeumlichkeiten',
            'sort_order' => $data['sort_order'] ?? 0,
            'id' => $id,
        ]);
    }

    public function delete(int $id): bool
    {
        return $this->db->prepare('DELETE FROM gallery_images WHERE id = ?')->execute([$id]);
    }
}
