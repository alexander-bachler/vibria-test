<?php
declare(strict_types=1);

namespace Vibria\Models;

use PDO;

class User
{
    public function __construct(private readonly PDO $db) {}

    public function findByEmail(string $email): array|false
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        return $stmt->fetch();
    }

    public function create(string $email, string $password, string $name): int
    {
        $stmt = $this->db->prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)');
        $stmt->execute([$email, password_hash($password, PASSWORD_BCRYPT), $name]);
        return (int)$this->db->lastInsertId();
    }
}
