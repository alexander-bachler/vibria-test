<?php
declare(strict_types=1);

namespace Vibria\Models;

use PDO;

class EmailLog
{
    public const TYPE_RESERVATION_CONFIRMATION = 'reservation_confirmation';
    public const TYPE_RESERVATION_ADMIN = 'reservation_admin';
    public const TYPE_CONTACT_ADMIN = 'contact_admin';

    public function __construct(private readonly PDO $db) {}

    public function create(array $data): int
    {
        $stmt = $this->db->prepare(
            'INSERT INTO email_logs (recipient, subject, type, status, error_message, html_body, related_id)
             VALUES (:recipient, :subject, :type, :status, :error_message, :html_body, :related_id)'
        );
        $stmt->execute([
            'recipient'      => $data['recipient'],
            'subject'        => $data['subject'],
            'type'           => $data['type'],
            'status'         => $data['status'],
            'error_message'  => $data['error_message'] ?? null,
            'html_body'      => $data['html_body'] ?? null,
            'related_id'     => $data['related_id'] ?? null,
        ]);
        return (int)$this->db->lastInsertId();
    }

    /**
     * @param array{type?: string, status?: string} $filters
     * @return list<array<string, mixed>>
     */
    public function findAll(array $filters = []): array
    {
        $sql = 'SELECT id, recipient, subject, type, status, error_message, related_id, created_at
                FROM email_logs WHERE 1=1';
        $params = [];
        if (!empty($filters['type'])) {
            $sql .= ' AND type = :type';
            $params['type'] = $filters['type'];
        }
        if (!empty($filters['status'])) {
            $sql .= ' AND status = :status';
            $params['status'] = $filters['status'];
        }
        $sql .= ' ORDER BY created_at DESC LIMIT 500';
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM email_logs WHERE id = ? LIMIT 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    public function countFailedLast24h(): int
    {
        $stmt = $this->db->query(
            "SELECT COUNT(*) FROM email_logs WHERE status = 'failed'
             AND created_at >= (NOW() - INTERVAL 24 HOUR)"
        );
        return (int)$stmt->fetchColumn();
    }
}
