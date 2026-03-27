<?php
declare(strict_types=1);

namespace Vibria\Models;

use PDO;

class ContactMessage
{
    public function __construct(private readonly PDO $db) {}

    public function findAll(): array
    {
        return $this->db->query('SELECT * FROM contact_messages ORDER BY created_at DESC')->fetchAll();
    }

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO contact_messages (name, email, subject, message) VALUES (:name, :email, :subject, :message)'
        );
        $stmt->execute([
            'name' => $data['name'],
            'email' => $data['email'],
            'subject' => $data['subject'] ?? null,
            'message' => $data['message'],
        ]);
        return (int)$this->db->lastInsertId();
    }

    public function markRead(int $id): bool
    {
        return $this->db->prepare('UPDATE contact_messages SET is_read = 1 WHERE id = ?')->execute([$id]);
    }

    public function countUnread(): int
    {
        return (int)$this->db->query('SELECT COUNT(*) FROM contact_messages WHERE is_read = 0')->fetchColumn();
    }
}
