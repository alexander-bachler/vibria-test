<?php
declare(strict_types=1);

namespace Vibria\Models;

use PDO;

class Artist
{
    public function __construct(private readonly PDO $db) {}

    public function findAll(): array
    {
        return $this->db->query('SELECT * FROM artists ORDER BY sort_order ASC, name ASC')->fetchAll();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->db->prepare('SELECT * FROM artists WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO artists (name, description, image_path, sort_order) VALUES (:name, :description, :image_path, :sort_order)'
        );
        $stmt->execute([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'image_path' => $data['image_path'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE artists SET name=:name, description=:description, image_path=:image_path, sort_order=:sort_order WHERE id=:id'
        );
        return $stmt->execute([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'image_path' => $data['image_path'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'id' => $id,
        ]);
    }

    public function delete(int $id): bool
    {
        return $this->db->prepare('DELETE FROM artists WHERE id = ?')->execute([$id]);
    }
}
