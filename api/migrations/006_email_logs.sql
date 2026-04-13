-- Outbound email audit log (transactional mail from the API)

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS email_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    type ENUM('reservation_confirmation','reservation_admin','contact_admin') NOT NULL,
    status ENUM('sent','failed') NOT NULL,
    error_message TEXT DEFAULT NULL,
    html_body MEDIUMTEXT DEFAULT NULL,
    related_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
