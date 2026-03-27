<?php
declare(strict_types=1);

namespace Vibria\Models;

use PDO;

class Reservation
{
    public function __construct(private readonly PDO $db) {}

    public function findByEvent(int $eventId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM reservations WHERE event_id = ? ORDER BY created_at DESC');
        $stmt->execute([$eventId]);
        return $stmt->fetchAll();
    }

    public function findAll(): array
    {
        return $this->db->query(
            'SELECT r.*, e.title AS event_title, e.date AS event_date FROM reservations r
             JOIN events e ON r.event_id = e.id ORDER BY r.created_at DESC'
        )->fetchAll();
    }

    public function countByEvent(int $eventId): int
    {
        $stmt = $this->db->prepare("SELECT COALESCE(SUM(seats),0) FROM reservations WHERE event_id = ? AND status != 'cancelled'");
        $stmt->execute([$eventId]);
        return (int)$stmt->fetchColumn();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO reservations (event_id, name, email, seats, status) VALUES (:event_id, :name, :email, :seats, :status)'
        );
        $stmt->execute([
            'event_id' => $data['event_id'],
            'name' => $data['name'],
            'email' => $data['email'],
            'seats' => $data['seats'] ?? 1,
            'status' => 'pending',
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function updateStatus(int $id, string $status): bool
    {
        $stmt = $this->db->prepare('UPDATE reservations SET status = ? WHERE id = ?');
        return $stmt->execute([$status, $id]);
    }
}
