<?php
declare(strict_types=1);

namespace Vibria\Services;

use PDO;
use PHPMailer\PHPMailer\PHPMailer;
use Vibria\Models\EmailLog;

class Mailer
{
    private array $config;

    public function __construct(array $smtpConfig)
    {
        $this->config = $smtpConfig;
    }

    /**
     * Optional audit log (email_logs). When set, every attempt is persisted with HTML body.
     *
     * @param list<array{cid: string, data: string, filename?: string, mime?: string}> $embeddedImages
     * @param array{pdo: PDO, type: string, related_id?: int|null}|null $logContext
     */
    public function send(
        string $to,
        string $subject,
        string $htmlBody,
        string $replyTo = '',
        array $embeddedImages = [],
        ?array $logContext = null
    ): bool {
        $success = false;
        $lastError = null;
        $tempFiles = [];
        try {
            if (!class_exists(PHPMailer::class)) {
                $lastError = 'PHPMailer not installed — run composer update';
                error_log('[VIBRIA Mailer] ' . $lastError);
                return false;
            }

            $mail = new PHPMailer(true);

            $mail->isSMTP();
            $mail->Host       = $this->config['host'] ?? '';
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->config['username'] ?? '';
            $mail->Password   = $this->config['password'] ?? '';
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = (int)($this->config['port'] ?? 587);
            $mail->CharSet    = 'UTF-8';

            $mail->setFrom(
                $this->config['from_email'] ?? 'noreply@vibria.art',
                $this->config['from_name'] ?? 'VIBRIA'
            );
            $mail->addAddress($to);

            if ($replyTo !== '') {
                $mail->addReplyTo($replyTo);
            }

            foreach ($embeddedImages as $emb) {
                $tmp = tempnam(sys_get_temp_dir(), 'vibria_emb_');
                if ($tmp === false) {
                    continue;
                }
                file_put_contents($tmp, $emb['data']);
                $tempFiles[] = $tmp;
                $mail->addEmbeddedImage(
                    $tmp,
                    $emb['cid'],
                    $emb['filename'] ?? 'image.png',
                    PHPMailer::ENCODING_BASE64,
                    $emb['mime'] ?? 'image/png'
                );
            }

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $htmlBody));

            $mail->send();
            $success = true;
            return true;
        } catch (\Throwable $e) {
            $lastError = $e->getMessage();
            error_log('[VIBRIA Mailer] Failed to send to ' . $to . ': ' . $lastError);
            return false;
        } finally {
            if ($logContext !== null && isset($logContext['pdo'], $logContext['type'])) {
                try {
                    (new EmailLog($logContext['pdo']))->create([
                        'recipient'     => $to,
                        'subject'       => $subject,
                        'type'          => $logContext['type'],
                        'status'        => $success ? 'sent' : 'failed',
                        'error_message' => $success ? null : $lastError,
                        'html_body'     => $htmlBody,
                        'related_id'    => $logContext['related_id'] ?? null,
                    ]);
                } catch (\Throwable $e) {
                    error_log('[VIBRIA Mailer] Email log insert failed: ' . $e->getMessage());
                }
            }
            foreach ($tempFiles as $f) {
                @unlink($f);
            }
        }
    }
}
