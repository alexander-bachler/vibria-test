<?php
declare(strict_types=1);

namespace Vibria\Models;

use PDO;

class BoardMember
{
    public function __construct(private readonly PDO $db) {}

    public function findAll(): array
    {
        return $this->db->query('SELECT * FROM board_members ORDER BY sort_order ASC')->fetchAll();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->db->prepare('SELECT * FROM board_members WHERE id = ?');
        $stmt->execute([$id]);
        return $stmt->fetch();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO board_members (name, nickname, bio, image_path, sort_order) VALUES (:name, :nickname, :bio, :image_path, :sort_order)'
        );
        $stmt->execute([
            'name' => $data['name'],
            'nickname' => $data['nickname'] ?? null,
            'bio' => $data['bio'] ?? '',
            'image_path' => $data['image_path'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE board_members SET name=:name, nickname=:nickname, bio=:bio, image_path=:image_path, sort_order=:sort_order WHERE id=:id'
        );
        return $stmt->execute([
            'name' => $data['name'],
            'nickname' => $data['nickname'] ?? null,
            'bio' => $data['bio'] ?? '',
            'image_path' => $data['image_path'] ?? null,
            'sort_order' => $data['sort_order'] ?? 0,
            'id' => $id,
        ]);
    }

    public function delete(int $id): bool
    {
        return $this->db->prepare('DELETE FROM board_members WHERE id = ?')->execute([$id]);
    }
}
