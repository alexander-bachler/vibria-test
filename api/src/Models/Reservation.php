<?php
declare(strict_types=1);

namespace Vibria\Models;

use PDO;

class Reservation
{
    public function __construct(private readonly PDO $db) {}

    public function findByEvent(int $eventId): array
    {
        $stmt = $this->db->prepare('SELECT * FROM reservations WHERE event_id = ? ORDER BY reservation_date ASC, created_at DESC');
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

    public function countByEventAndDate(int $eventId, string $date): int
    {
        $stmt = $this->db->prepare(
            "SELECT COALESCE(SUM(seats),0) FROM reservations WHERE event_id = ? AND reservation_date = ? AND status != 'cancelled'"
        );
        $stmt->execute([$eventId, $date]);
        return (int)$stmt->fetchColumn();
    }

    public function countByEvent(int $eventId): int
    {
        $stmt = $this->db->prepare("SELECT COALESCE(SUM(seats),0) FROM reservations WHERE event_id = ? AND status != 'cancelled'");
        $stmt->execute([$eventId]);
        return (int)$stmt->fetchColumn();
    }

    /** Returns reserved seat count grouped by reservation_date for a given event. */
    public function countByEventGroupedByDate(int $eventId): array
    {
        $stmt = $this->db->prepare(
            "SELECT reservation_date, COALESCE(SUM(seats),0) AS reserved
             FROM reservations
             WHERE event_id = ? AND status != 'cancelled'
             GROUP BY reservation_date
             ORDER BY reservation_date ASC"
        );
        $stmt->execute([$eventId]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $result = [];
        foreach ($rows as $row) {
            $result[$row['reservation_date']] = (int)$row['reserved'];
        }
        return $result;
    }

    /** @return array{id: int, checkin_token: string} */
    public function create(array $data): array
    {
        $token = bin2hex(random_bytes(32));
        $stmt = $this->db->prepare(
            'INSERT INTO reservations (event_id, reservation_date, name, email, phone, seating_zone, seats, status, checkin_token)
             VALUES (:event_id, :reservation_date, :name, :email, :phone, :seating_zone, :seats, :status, :checkin_token)'
        );
        $phone = isset($data['phone']) ? trim((string)$data['phone']) : '';
        $stmt->execute([
            'event_id'         => $data['event_id'],
            'reservation_date' => $data['reservation_date'],
            'name'             => $data['name'],
            'email'            => $data['email'],
            'phone'            => $phone === '' ? null : $phone,
            'seating_zone'     => $data['seating_zone'] ?? null,
            'seats'            => $data['seats'] ?? 1,
            'status'           => 'pending',
            'checkin_token'    => $token,
        ]);
        return [
            'id'             => (int)$this->db->lastInsertId(),
            'checkin_token'  => $token,
        ];
    }

    public function findByToken(string $token): ?array
    {
        $stmt = $this->db->prepare(
            'SELECT r.*, e.title AS event_title, e.date AS event_date, e.end_date AS event_end_date, e.time AS event_time
             FROM reservations r
             JOIN events e ON r.event_id = e.id
             WHERE r.checkin_token = ?
             LIMIT 1'
        );
        $stmt->execute([$token]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /** Returns seat count grouped by seating_zone for a given event and date. */
    public function countByZone(int $eventId, string $date): array
    {
        $stmt = $this->db->prepare(
            "SELECT seating_zone, SUM(seats) AS reserved
             FROM reservations
             WHERE event_id = ? AND reservation_date = ? AND status != 'cancelled' AND seating_zone IS NOT NULL
             GROUP BY seating_zone"
        );
        $stmt->execute([$eventId, $date]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $result = [];
        foreach ($rows as $row) {
            $result[$row['seating_zone']] = (int)$row['reserved'];
        }
        return $result;
    }

    public function updateStatus(int $id, string $status): bool
    {
        $stmt = $this->db->prepare('UPDATE reservations SET status = ? WHERE id = ?');
        return $stmt->execute([$status, $id]);
    }

    public function toggleCheckIn(int $id): ?string
    {
        $stmt = $this->db->prepare('SELECT checked_in_at FROM reservations WHERE id = ?');
        $stmt->execute([$id]);
        $current = $stmt->fetchColumn();

        if ($current) {
            $this->db->prepare('UPDATE reservations SET checked_in_at = NULL WHERE id = ?')->execute([$id]);
            return null;
        }

        $now = date('Y-m-d H:i:s');
        $this->db->prepare('UPDATE reservations SET checked_in_at = ? WHERE id = ?')->execute([$now, $id]);
        return $now;
    }
}
