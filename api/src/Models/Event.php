<?php
declare(strict_types=1);

namespace Vibria\Models;

use PDO;

class Event
{
    public function __construct(private readonly PDO $db) {}

    public function findAll(bool $includePast = true): array
    {
        $sql = 'SELECT * FROM events WHERE is_published = 1';
        if (!$includePast) {
            $sql .= ' AND date >= CURDATE()';
        }
        $sql .= ' ORDER BY date ASC';
        return $this->db->query($sql)->fetchAll();
    }

    public function findById(int $id): array|false
    {
        $stmt = $this->db->prepare(
            'SELECT e.*, (SELECT COUNT(*) FROM reservations r WHERE r.event_id = e.id AND r.status != ?) AS reserved_seats
             FROM events e WHERE e.id = ?'
        );
        $stmt->execute(['cancelled', $id]);
        return $stmt->fetch();
    }

    public function findAllAdmin(): array
    {
        return $this->db->query('SELECT * FROM events ORDER BY date DESC')->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO events (title, subtitle, date, end_date, time, type, description, admission, total_seats, image_path, is_published)
             VALUES (:title, :subtitle, :date, :end_date, :time, :type, :description, :admission, :total_seats, :image_path, :is_published)'
        );
        $stmt->execute([
            'title' => $data['title'],
            'subtitle' => $data['subtitle'] ?? null,
            'date' => $data['date'],
            'end_date' => $data['end_date'] ?? null,
            'time' => $data['time'],
            'type' => $data['type'] ?? null,
            'description' => $data['description'] ?? null,
            'admission' => $data['admission'] ?? 'Freiwillige Spenden',
            'total_seats' => $data['total_seats'] ?? 40,
            'image_path' => $data['image_path'] ?? null,
            'is_published' => $data['is_published'] ?? 1,
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): bool
    {
        $stmt = $this->db->prepare(
            'UPDATE events SET title=:title, subtitle=:subtitle, date=:date, end_date=:end_date, time=:time,
             type=:type, description=:description, admission=:admission, total_seats=:total_seats,
             image_path=:image_path, is_published=:is_published WHERE id=:id'
        );
        return $stmt->execute([
            'title' => $data['title'],
            'subtitle' => $data['subtitle'] ?? null,
            'date' => $data['date'],
            'end_date' => $data['end_date'] ?? null,
            'time' => $data['time'],
            'type' => $data['type'] ?? null,
            'description' => $data['description'] ?? null,
            'admission' => $data['admission'] ?? 'Freiwillige Spenden',
            'total_seats' => $data['total_seats'] ?? 40,
            'image_path' => $data['image_path'] ?? null,
            'is_published' => $data['is_published'] ?? 1,
            'id' => $id,
        ]);
    }

    public function delete(int $id): bool
    {
        return $this->db->prepare('DELETE FROM events WHERE id = ?')->execute([$id]);
    }
}
